from __future__ import annotations

import torch


def mae(predictions: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    return torch.mean(torch.abs(predictions - targets))


def rmse(predictions: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    return torch.sqrt(torch.mean((predictions - targets) ** 2))


def check_metrics() -> None:
    predictions = torch.tensor([0.0, 0.5, 1.0])
    targets = torch.tensor([0.0, 1.0, 1.0])

    print(f"MAE: {mae(predictions, targets).item():.6f}")
    print(f"RMSE: {rmse(predictions, targets).item():.6f}")


if __name__ == "__main__":
    check_metrics()
