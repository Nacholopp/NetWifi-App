from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import torch
import yaml


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.datasets.wifi_dataset import WiFiCoverageDataset
from ml.models.unet import UNet, build_unet_from_config
from ml.utils.visualization import save_prediction_map, save_prediction_visualization


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


def find_sample_index(
    dataset: WiFiCoverageDataset,
    scenario_id: int | None,
    config_id: int | None,
    ap_count: int | None,
    fallback_index: int,
) -> int:
    if scenario_id is None and config_id is None and ap_count is None:
        return fallback_index

    for index, sample in enumerate(dataset.samples):
        if scenario_id is not None and int(sample["scenario_id"]) != scenario_id:
            continue
        if config_id is not None and int(sample["config_id"]) != config_id:
            continue
        if ap_count is not None and int(sample["ap_count"]) != ap_count:
            continue
        return index

    raise ValueError("No sample matches the requested scenario/config/AP filters.")


def load_model(config: dict[str, Any], checkpoint_path: Path, device: torch.device) -> UNet:
    model = build_unet_from_config(config).to(device)

    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Run prediction for one indexed WiFi sample.")
    parser.add_argument("--config", type=Path, default=Path("analytics-service/ml/configs/base_config.yaml"))
    parser.add_argument("--checkpoint", type=Path, default=None)
    parser.add_argument("--split", choices=["train", "val", "test"], default=None)
    parser.add_argument("--sample-index", type=int, default=0)
    parser.add_argument("--scenario-id", type=int, default=None)
    parser.add_argument("--config-id", type=int, default=None)
    parser.add_argument("--ap-count", type=int, default=None)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--prediction-map", type=Path, default=None)
    args = parser.parse_args()

    with args.config.open("r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    service_root = args.config.resolve().parents[2]
    dataset_config = config["dataset"]
    training_config = config["training"]
    inference_config = config["inference"]

    split = args.split or inference_config["split"]
    checkpoint_path = resolve_path(args.checkpoint or inference_config["checkpoint_path"], service_root)
    output_path = resolve_path(args.output or inference_config["output_path"], service_root)
    prediction_map_path = resolve_path(args.prediction_map or inference_config["prediction_map_path"], service_root)

    device = choose_device(str(training_config["device"]))
    model = load_model(config, checkpoint_path, device)

    ap_counts = [args.ap_count] if args.ap_count is not None else dataset_config["ap_counts"]
    dataset = WiFiCoverageDataset(
        index_path=resolve_path(dataset_config["index_path"], service_root),
        split=split,
        ap_counts=ap_counts,
        dataset_root=resolve_path(dataset_config["root"], service_root),
        invert_layout=bool(dataset_config.get("invert_layout", False)),
        image_size=int(dataset_config["image_size"]),
    )

    sample_index = find_sample_index(
        dataset=dataset,
        scenario_id=args.scenario_id,
        config_id=args.config_id,
        ap_count=args.ap_count,
        fallback_index=args.sample_index,
    )

    input_tensor, target_tensor, metadata = dataset[sample_index]

    with torch.no_grad():
        prediction_tensor = model(input_tensor.unsqueeze(0).to(device))[0].cpu()

    save_prediction_visualization(input_tensor, target_tensor, prediction_tensor, metadata, output_path)
    save_prediction_map(prediction_tensor, prediction_map_path)

    print("Prediction completed.")
    print(json.dumps(metadata, indent=2))
    print(f"Saved comparison figure to: {output_path}")
    print(f"Saved prediction map to: {prediction_map_path}")


if __name__ == "__main__":
    main()
