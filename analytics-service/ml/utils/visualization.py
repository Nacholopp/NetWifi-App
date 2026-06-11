from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image, ImageDraw


def save_sample_visualization(
    input_tensor: torch.Tensor,
    target_tensor: torch.Tensor,
    metadata: dict[str, Any],
    output_path: str | Path,
) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    layout = input_tensor[0].detach().cpu().numpy()
    combined_ap_mask = input_tensor[1].detach().cpu().numpy()
    target = target_tensor[0].detach().cpu().numpy()

    panels = [
        ("layout", grayscale_panel(layout)),
        ("combined AP mask", grayscale_panel(combined_ap_mask)),
        ("target coverage", heatmap_panel(target)),
    ]

    panel_width, panel_height = panels[0][1].size
    title_height = 24
    header_height = 30
    padding = 12
    canvas_width = len(panels) * panel_width + (len(panels) + 1) * padding
    canvas_height = header_height + title_height + panel_height + 2 * padding
    canvas = Image.new("RGB", (canvas_width, canvas_height), color="white")
    draw = ImageDraw.Draw(canvas)

    header = f"{metadata['ap_count']}AP | scenario {metadata['scenario_id']} | config {metadata['config_id']}"
    draw.text((padding, padding), header, fill="black")

    y_title = header_height + padding
    y_image = y_title + title_height
    for idx, (title, panel_image) in enumerate(panels):
        x = padding + idx * (panel_width + padding)
        draw.text((x, y_title), title, fill="black")
        canvas.paste(panel_image, (x, y_image))

    canvas.save(output_path)


def save_prediction_visualization(
    input_tensor: torch.Tensor,
    target_tensor: torch.Tensor,
    prediction_tensor: torch.Tensor,
    metadata: dict[str, Any],
    output_path: str | Path,
) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    layout = input_tensor[0].detach().cpu().numpy()
    combined_ap_mask = input_tensor[1].detach().cpu().numpy()
    target = target_tensor[0].detach().cpu().numpy()
    prediction = prediction_tensor[0].detach().cpu().numpy()
    absolute_error = np.abs(prediction - target)

    panels = [
        ("layout", grayscale_panel(layout)),
        ("combined AP mask", grayscale_panel(combined_ap_mask)),
        ("target coverage", heatmap_panel(target)),
        ("prediction", heatmap_panel(prediction)),
        ("absolute error", heatmap_panel(absolute_error)),
    ]

    save_panel_grid(
        panels=panels,
        header=f"{metadata['ap_count']}AP | scenario {metadata['scenario_id']} | config {metadata['config_id']}",
        output_path=output_path,
    )


def save_prediction_map(prediction_tensor: torch.Tensor, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prediction = prediction_tensor[0].detach().cpu().numpy()
    heatmap_panel(prediction).save(output_path)


def save_panel_grid(
    panels: list[tuple[str, Image.Image]],
    header: str,
    output_path: str | Path,
) -> None:
    output_path = Path(output_path)
    panel_width, panel_height = panels[0][1].size
    title_height = 24
    header_height = 30
    padding = 12
    canvas_width = len(panels) * panel_width + (len(panels) + 1) * padding
    canvas_height = header_height + title_height + panel_height + 2 * padding
    canvas = Image.new("RGB", (canvas_width, canvas_height), color="white")
    draw = ImageDraw.Draw(canvas)

    draw.text((padding, padding), header, fill="black")

    y_title = header_height + padding
    y_image = y_title + title_height
    for idx, (title, panel_image) in enumerate(panels):
        x = padding + idx * (panel_width + padding)
        draw.text((x, y_title), title, fill="black")
        canvas.paste(panel_image, (x, y_image))

    canvas.save(output_path)


def grayscale_panel(array: np.ndarray) -> Image.Image:
    image = np.clip(array, 0.0, 1.0)
    image = (image * 255.0).astype(np.uint8)
    return Image.fromarray(image, mode="L").convert("RGB")


def heatmap_panel(array: np.ndarray) -> Image.Image:
    values = np.clip(array, 0.0, 1.0)
    anchors = np.array(
        [
            [68, 1, 84],
            [59, 82, 139],
            [33, 145, 140],
            [94, 201, 98],
            [253, 231, 37],
        ],
        dtype=np.float32,
    )
    scaled = values * (len(anchors) - 1)
    lower = np.floor(scaled).astype(np.int32)
    upper = np.clip(lower + 1, 0, len(anchors) - 1)
    weight = (scaled - lower)[..., np.newaxis]
    rgb = anchors[lower] * (1.0 - weight) + anchors[upper] * weight
    return Image.fromarray(rgb.astype(np.uint8), mode="RGB")
