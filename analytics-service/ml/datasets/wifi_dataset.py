from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset

#Con este codigo lo que consigo es pasar del dataset en json a un formato que pueda utilizar la U-NET

def load_grayscale(path: Path, image_size: int, resample: int) -> np.ndarray:
    # Lo que consigo es que todas las imagenes tengan el mismo formato y en escala de grises para entrenar al modelo
    with Image.open(path) as image:
        image = image.convert("L")
        if image.size != (image_size, image_size):
            image = image.resize((image_size, image_size), resample=resample)
        array = np.asarray(image, dtype=np.float32) / 255.0
    return array


def binarize_mask(mask: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    #Aqui interesa saber cual es la ubicacion de los APs, 0 no hay AP, 1 hay AP
    return (mask > threshold).astype(np.float32)


class WiFiCoverageDataset(Dataset):
    #Aqui defino el dataset que va a utilizar pythorch en la U-NET
    #Combino el mapa de layout con la mascara combinada de los APs para crear la imagen de entrada, y el mapa objetivo es la imagen de salida que quiero que prediga la U-NET   
    def __init__(
        self,
        index_path: str | Path,
        split: str | None = None,
        ap_counts: list[int] | tuple[int, ...] | None = None,
        dataset_root: str | Path | None = None,
        invert_layout: bool = False,
        image_size: int | None = None,
    ) -> None:
        self.index_path = Path(index_path).resolve()
        with self.index_path.open("r", encoding="utf-8") as file:
            self.index = json.load(file)

        self.dataset_root = Path(dataset_root or self.index["dataset_root"]).resolve()
        self.image_size = int(image_size or self.index.get("image_size", 256))
        self.invert_layout = invert_layout

        selected_ap_counts = set(ap_counts) if ap_counts is not None else None
        samples = self.index["samples"]
        if split is not None:
            samples = [sample for sample in samples if sample["split"] == split]
        if selected_ap_counts is not None:
            samples = [sample for sample in samples if int(sample["ap_count"]) in selected_ap_counts]

        self.samples: list[dict[str, Any]] = samples

    def __len__(self) -> int:
        return len(self.samples)

    def resolve_path(self, relative_path: str) -> Path:
        return (self.dataset_root / relative_path).resolve()

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, dict[str, Any]]:
        sample = self.samples[index]
        resampling = Image.Resampling if hasattr(Image, "Resampling") else Image

        layout_path = self.resolve_path(sample["layout_path"])
        target_path = self.resolve_path(sample["target_path"])
        tx_paths = [self.resolve_path(path) for path in sample["tx_paths"]]

        layout = load_grayscale(layout_path, self.image_size, resampling.BILINEAR)
        if self.invert_layout:
            layout = 1.0 - layout

        ap_masks = [
            binarize_mask(load_grayscale(tx_path, self.image_size, resampling.NEAREST))
            for tx_path in tx_paths
        ]
        #Como está binzarizada son matrices de todos 0 menos donde hay un AP que es un 1 entonces comparando las matrices
        #Pixel a pixel y se queda con el valor maximo por lo que consigo la máscara
        combined_ap_mask = np.maximum.reduce(ap_masks).astype(np.float32)

        target = load_grayscale(target_path, self.image_size, resampling.BILINEAR) #Carga el mapa objetivo que es la imagen de salida

        input_array = np.stack([layout, combined_ap_mask], axis=0).astype(np.float32) #input_array = (2, 256, 256) multicanal
        target_array = target[np.newaxis, :, :].astype(np.float32)

        metadata = {
            "sample_id": sample["sample_id"],
            "scenario_id": int(sample["scenario_id"]),
            "config_id": int(sample["config_id"]),
            "ap_count": int(sample["ap_count"]),
            "split": sample["split"],
            "layout_path": str(layout_path),
            "tx_paths": [str(path) for path in tx_paths],
            "target_path": str(target_path),
        }
        #Para la U-NET lo que quiero es que el input sea un tensor con dos canales, uno para el layout y otro para la mascara combinada de los APs, y el target es un tensor con un canal que es el mapa objetivo que quiero que prediga la U-NET
        return torch.from_numpy(input_array), torch.from_numpy(target_array), metadata

