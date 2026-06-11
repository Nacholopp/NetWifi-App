from __future__ import annotations

import argparse
import json
import random
import sys
from itertools import islice
from pathlib import Path
from typing import Any

import numpy as np
import torch
import yaml
from torch import nn
from torch.utils.data import DataLoader
from tqdm import tqdm


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.datasets.wifi_dataset import WiFiCoverageDataset
from ml.models.unet import UNet


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


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


def run_loop(
    model: nn.Module,
    dataloader: DataLoader,
    loss_fn: nn.Module,
    device: torch.device,
    phase: str,
    optimizer: torch.optim.Optimizer | None = None,
    max_batches: int | None = None,
) -> float:
    is_training = optimizer is not None
    model.train() if is_training else model.eval()

    loss_sum = 0.0
    sample_count = 0
    total_batches = min(len(dataloader), max_batches) if max_batches is not None else len(dataloader)

    batches = islice(dataloader, max_batches) if max_batches is not None else dataloader
    progress_bar = tqdm(
        batches,
        total=total_batches,
        desc=phase,
        unit="batch",
        file=sys.stdout,
    )

    for inputs, targets, _metadata in progress_bar:
        inputs = inputs.to(device)
        targets = targets.to(device)

        if is_training:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(is_training):
            predictions = model(inputs)
            loss = loss_fn(predictions, targets)

            if is_training:
                loss.backward()
                optimizer.step()

        batch_size = inputs.size(0)
        loss_sum += loss.item() * batch_size
        sample_count += batch_size
        mean_loss = loss_sum / sample_count

        progress_bar.set_postfix(loss=f"{mean_loss:.6f}")

    return loss_sum / sample_count


def save_checkpoint(
    path: Path,
    model: nn.Module,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    train_loss: float,
    val_loss: float,
    config: dict[str, Any],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    checkpoint = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "train_loss": train_loss,
        "val_loss": val_loss,
        "config": config,
    }

    torch.save(checkpoint, path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a U-Net for WiFi coverage estimation.")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("analytics-service/ml/configs/base_config.yaml"),
    )
    args = parser.parse_args()

    with args.config.open("r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    service_root = args.config.resolve().parents[2]
    dataset_config = config["dataset"]
    model_config = config["model"]
    training_config = config["training"]
    paths_config = config["paths"]

    set_seed(int(training_config.get("seed", 42)))

    device = choose_device(str(training_config["device"]))
    print(f"Using device: {device}")

    index_path = resolve_path(dataset_config["index_path"], service_root)
    dataset_root = resolve_path(dataset_config["root"], service_root)
    checkpoint_dir = resolve_path(paths_config["checkpoint_dir"], service_root)
    output_dir = resolve_path(paths_config["output_dir"], service_root)

    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    train_dataset = WiFiCoverageDataset(
        index_path=index_path,
        split="train",
        ap_counts=dataset_config["ap_counts"],
        dataset_root=dataset_root,
        invert_layout=bool(dataset_config.get("invert_layout", False)),
        image_size=int(dataset_config["image_size"]),
    )

    val_dataset = WiFiCoverageDataset(
        index_path=index_path,
        split="val",
        ap_counts=dataset_config["ap_counts"],
        dataset_root=dataset_root,
        invert_layout=bool(dataset_config.get("invert_layout", False)),
        image_size=int(dataset_config["image_size"]),
    )

    print(f"Train samples: {len(train_dataset)}")
    print(f"Val samples: {len(val_dataset)}")

    train_loader = DataLoader(
        train_dataset,
        batch_size=int(training_config["batch_size"]),
        shuffle=True,
        num_workers=int(training_config.get("num_workers", 0)),
        collate_fn=collate_wifi_batch,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=int(training_config["batch_size"]),
        shuffle=False,
        num_workers=int(training_config.get("num_workers", 0)),
        collate_fn=collate_wifi_batch,
    )

    model = UNet(
        in_channels=int(model_config["in_channels"]),
        out_channels=int(model_config["out_channels"]),
        base_channels=int(model_config["base_channels"]),
        use_sigmoid=bool(model_config.get("use_sigmoid", True)),
    ).to(device)

    loss_fn = nn.L1Loss()
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=float(training_config["learning_rate"]),
    )

    epochs = int(training_config["epochs"])
    max_train_batches = training_config.get("max_train_batches")
    max_val_batches = training_config.get("max_val_batches")
    best_val_loss = float("inf")
    history = []

    for epoch in range(1, epochs + 1):
        print(f"\nEpoch {epoch}/{epochs}")

        train_loss = run_loop(
            model=model,
            dataloader=train_loader,
            loss_fn=loss_fn,
            device=device,
            phase="train",
            optimizer=optimizer,
            max_batches=max_train_batches,
        )

        val_loss = run_loop(
            model=model,
            dataloader=val_loader,
            loss_fn=loss_fn,
            device=device,
            phase="val",
            optimizer=None,
            max_batches=max_val_batches,
        )

        print(
            f"Epoch {epoch}/{epochs} finished | "
            f"train_loss={train_loss:.6f} | "
            f"val_loss={val_loss:.6f}"
        )

        history.append(
            {
                "epoch": epoch,
                "train_loss": train_loss,
                "val_loss": val_loss,
            }
        )

        save_checkpoint(
            checkpoint_dir / "last_model.pt",
            model,
            optimizer,
            epoch,
            train_loss,
            val_loss,
            config,
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_checkpoint(
                checkpoint_dir / "best_model.pt",
                model,
                optimizer,
                epoch,
                train_loss,
                val_loss,
                config,
            )
            print("New best model saved.")

    history_path = output_dir / "training_history.json"
    history_path.write_text(json.dumps(history, indent=2), encoding="utf-8")

    print("\nTraining finished.")
    print(f"Best val loss: {best_val_loss:.6f}")
    print(f"Last checkpoint: {checkpoint_dir / 'last_model.pt'}")
    print(f"Best checkpoint: {checkpoint_dir / 'best_model.pt'}")
    print(f"Training history: {history_path}")


if __name__ == "__main__":
    main()
