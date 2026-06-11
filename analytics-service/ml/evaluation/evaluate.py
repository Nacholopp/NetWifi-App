from __future__ import annotations

import argparse
import json
import sys
from itertools import islice
from pathlib import Path
from typing import Any

import torch
import yaml
from torch.utils.data import DataLoader
from tqdm import tqdm


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.datasets.wifi_dataset import WiFiCoverageDataset
from ml.models.unet import UNet


def resolve_path(path: str | Path, service_root: Path) -> Path:
    path = Path(path)
    if path.is_absolute():
        return path
    if path.parts and path.parts[0] == service_root.name:
        return (service_root.parent / path).resolve()
    return (service_root / path).resolve()


def choose_device(device_name: str) -> torch.device:
    if device_name == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(device_name)


def collate_wifi_batch(
    batch: list[tuple[torch.Tensor, torch.Tensor, dict[str, Any]]],
) -> tuple[torch.Tensor, torch.Tensor, list[dict[str, Any]]]:
    inputs = torch.stack([item[0] for item in batch], dim=0)
    targets = torch.stack([item[1] for item in batch], dim=0)
    metadata = [item[2] for item in batch]
    return inputs, targets, metadata


def empty_stats() -> dict[str, float]:
    return {
        "absolute_error_sum": 0.0,
        "squared_error_sum": 0.0,
        "pixel_count": 0.0,
    }


def update_stats(stats: dict[str, float], predictions: torch.Tensor, targets: torch.Tensor) -> None:
    error = predictions - targets
    stats["absolute_error_sum"] += torch.sum(torch.abs(error)).item()
    stats["squared_error_sum"] += torch.sum(error ** 2).item()
    stats["pixel_count"] += float(error.numel())


def finish_stats(stats: dict[str, float]) -> dict[str, float]:
    return {
        "mae": stats["absolute_error_sum"] / stats["pixel_count"],
        "rmse": (stats["squared_error_sum"] / stats["pixel_count"]) ** 0.5,
    }


def load_model(config: dict[str, Any], checkpoint_path: Path, device: torch.device) -> UNet:
    model_config = config["model"]
    model = UNet(
        in_channels=int(model_config["in_channels"]),
        out_channels=int(model_config["out_channels"]),
        base_channels=int(model_config["base_channels"]),
        use_sigmoid=bool(model_config.get("use_sigmoid", True)),
    ).to(device)

    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate a trained U-Net checkpoint.")
    parser.add_argument("--config", type=Path, default=Path("analytics-service/ml/configs/base_config.yaml"))
    parser.add_argument("--split", choices=["train", "val", "test"], default=None)
    parser.add_argument("--checkpoint", type=Path, default=None)
    parser.add_argument("--max-batches", type=int, default=None)
    args = parser.parse_args()

    with args.config.open("r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    service_root = args.config.resolve().parents[2]
    dataset_config = config["dataset"]
    training_config = config["training"]
    evaluation_config = config["evaluation"]

    split = args.split or evaluation_config["split"]
    max_batches = args.max_batches if args.max_batches is not None else evaluation_config.get("max_batches")
    checkpoint_path = resolve_path(args.checkpoint or evaluation_config["checkpoint_path"], service_root)
    summary_path = resolve_path(evaluation_config["summary_path"], service_root)

    device = choose_device(str(training_config["device"]))
    print(f"Using device: {device}")
    print(f"Evaluating split: {split}")
    print(f"Checkpoint: {checkpoint_path}")

    model = load_model(config, checkpoint_path, device)
    overall_stats = empty_stats()
    by_ap_count = {str(ap_count): empty_stats() for ap_count in dataset_config["ap_counts"]}

    with torch.no_grad():
        for ap_count in dataset_config["ap_counts"]:
            dataset = WiFiCoverageDataset(
                index_path=resolve_path(dataset_config["index_path"], service_root),
                split=split,
                ap_counts=[ap_count],
                dataset_root=resolve_path(dataset_config["root"], service_root),
                invert_layout=bool(dataset_config.get("invert_layout", False)),
                image_size=int(dataset_config["image_size"]),
            )

            dataloader = DataLoader(
                dataset,
                batch_size=int(evaluation_config["batch_size"]),
                shuffle=False,
                num_workers=int(training_config.get("num_workers", 0)),
                collate_fn=collate_wifi_batch,
            )

            total_batches = min(len(dataloader), max_batches) if max_batches is not None else len(dataloader)
            batches = islice(dataloader, max_batches) if max_batches is not None else dataloader
            description = f"evaluate {ap_count}AP"

            for inputs, targets, _metadata in tqdm(batches, total=total_batches, desc=description, unit="batch", file=sys.stdout):
                inputs = inputs.to(device)
                targets = targets.to(device)
                predictions = model(inputs)

                update_stats(overall_stats, predictions, targets)
                update_stats(by_ap_count[str(ap_count)], predictions, targets)

    summary = {
        "split": split,
        "checkpoint_path": str(checkpoint_path),
        "max_batches": max_batches,
        "overall": finish_stats(overall_stats),
        "by_ap_count": {
            f"{ap_count}AP": finish_stats(stats)
            for ap_count, stats in by_ap_count.items()
            if stats["pixel_count"] > 0
        },
    }

    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(json.dumps(summary, indent=2))
    print(f"Saved evaluation summary to: {summary_path}")


if __name__ == "__main__":
    main()
