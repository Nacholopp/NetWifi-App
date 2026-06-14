from __future__ import annotations

from typing import Any

import torch
from torch import nn


class DoubleConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, dropout: float = 0.0) -> None:
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Dropout2d(dropout) if dropout > 0 else nn.Identity(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class DownBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int) -> None:
        super().__init__()
        self.block = nn.Sequential(
            nn.MaxPool2d(kernel_size=2),
            DoubleConv(in_channels, out_channels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class UpBlock(nn.Module):
    def __init__(self, in_channels: int, skip_channels: int, out_channels: int) -> None:
        super().__init__()
        self.up = nn.Sequential(
            nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False),
            nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False),
        )
        self.conv = DoubleConv(out_channels + skip_channels, out_channels)

    def forward(self, x: torch.Tensor, skip: torch.Tensor) -> torch.Tensor:
        x = self.up(x)
        x = torch.cat([skip, x], dim=1)
        return self.conv(x)


class UNet(nn.Module):
    """Classic U-Net for WiFi coverage map regression.

    Input:  (batch, 2, 256, 256)
    Output: (batch, 1, 256, 256)
    """

    def __init__(
        self,
        in_channels: int = 2,
        out_channels: int = 1,
        base_channels: int = 48,
        dropout: float = 0.05,
        use_sigmoid: bool = True,
    ) -> None:
        super().__init__()
        c1 = base_channels
        c2 = base_channels * 2
        c3 = base_channels * 4
        c4 = base_channels * 8
        c5 = base_channels * 16
        c6 = base_channels * 16

        self.input_block = DoubleConv(in_channels, c1)
        self.down1 = DownBlock(c1, c2)
        self.down2 = DownBlock(c2, c3)
        self.down3 = DownBlock(c3, c4)
        self.down4 = DownBlock(c4, c5)
        self.bottleneck = nn.Sequential(
            nn.MaxPool2d(kernel_size=2),
            DoubleConv(c5, c6, dropout=dropout),
        )

        self.up1 = UpBlock(c6, c5, c5)
        self.up2 = UpBlock(c5, c4, c4)
        self.up3 = UpBlock(c4, c3, c3)
        self.up4 = UpBlock(c3, c2, c2)
        self.up5 = UpBlock(c2, c1, c1)

        self.output_conv = nn.Conv2d(c1, out_channels, kernel_size=1)
        self.output_activation = nn.Sigmoid()
        self.use_sigmoid = use_sigmoid

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        skip1 = self.input_block(x)
        skip2 = self.down1(skip1)
        skip3 = self.down2(skip2)
        skip4 = self.down3(skip3)
        skip5 = self.down4(skip4)

        x = self.bottleneck(skip5)
        x = self.up1(x, skip5)
        x = self.up2(x, skip4)
        x = self.up3(x, skip3)
        x = self.up4(x, skip2)
        x = self.up5(x, skip1)
        x = self.output_conv(x)

        if self.use_sigmoid:
            x = self.output_activation(x)

        return x


def build_unet_from_config(config: dict[str, Any]) -> UNet:
    model_config = config["model"] if "model" in config else config
    return UNet(
        in_channels=int(model_config["in_channels"]),
        out_channels=int(model_config["out_channels"]),
        base_channels=int(model_config["base_channels"]),
        dropout=float(model_config.get("dropout", 0.05)),
        use_sigmoid=bool(model_config.get("use_sigmoid", True)),
    )


def count_parameters(model: nn.Module) -> int:
    return sum(parameter.numel() for parameter in model.parameters() if parameter.requires_grad)


def check_unet_shapes() -> None:
    model = UNet()
    input_tensor = torch.randn(1, 2, 256, 256)

    with torch.no_grad():
        output_tensor = model(input_tensor)

    print(f"Input shape: {tuple(input_tensor.shape)}")
    print(f"Output shape: {tuple(output_tensor.shape)}")
    print(f"Trainable parameters: {count_parameters(model):,}")
    assert output_tensor.shape == (1, 1, 256, 256)


if __name__ == "__main__":
    check_unet_shapes()
