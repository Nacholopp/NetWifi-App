from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import torch
import yaml
from PIL import Image

from ml.models.unet import UNet
from ml.utils.visualization import heatmap_panel


class PredictionService:
    def __init__(self) -> None:
        self.service_root = Path(__file__).resolve().parents[2]
        self.config = self._load_config()
        self.device = self._choose_device(str(self.config["training"]["device"]))
        self.model = self._load_model()

    def predict(self, layout_image_data: str, ap_mask_image_data: str) -> str:
        layout = self._image_data_to_array(layout_image_data, binarize=False)
        ap_mask = self._image_data_to_array(ap_mask_image_data, binarize=True)
        input_array = np.stack([layout, ap_mask], axis=0).astype(np.float32)
        input_tensor = torch.from_numpy(input_array).unsqueeze(0).to(self.device)

        with torch.no_grad():
            prediction = self.model(input_tensor)[0].cpu()

        return self._prediction_to_image_data(prediction)

    def _load_config(self) -> dict[str, Any]:
        config_path = self.service_root / "ml" / "configs" / "base_config.yaml"
        with config_path.open("r", encoding="utf-8") as file:
            return yaml.safe_load(file)

    def _choose_device(self, device_name: str) -> torch.device:
        if device_name == "auto" or (device_name == "cuda" and not torch.cuda.is_available()):
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return torch.device(device_name)

    def _load_model(self) -> UNet:
        model_config = self.config["model"]
        model = UNet(
            in_channels=int(model_config["in_channels"]),
            out_channels=int(model_config["out_channels"]),
            base_channels=int(model_config["base_channels"]),
            use_sigmoid=bool(model_config.get("use_sigmoid", True)),
        ).to(self.device)

        checkpoint_path = self.service_root / self.config["inference"]["checkpoint_path"]
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        return model

    def _image_data_to_array(self, image_data: str, binarize: bool) -> np.ndarray:
        image_bytes = self._decode_image_data(image_data)
        image_size = int(self.config["dataset"]["image_size"])

        with Image.open(BytesIO(image_bytes)) as image:
            image = image.convert("L")
            if image.size != (image_size, image_size):
                image = image.resize((image_size, image_size), Image.Resampling.NEAREST)
            array = np.asarray(image, dtype=np.float32) / 255.0

        if binarize:
            return (array > 0.5).astype(np.float32)
        return array.astype(np.float32)

    def _decode_image_data(self, image_data: str) -> bytes:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        return base64.b64decode(image_data)

    def _prediction_to_image_data(self, prediction: torch.Tensor) -> str:
        image = heatmap_panel(prediction[0].numpy())
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"
