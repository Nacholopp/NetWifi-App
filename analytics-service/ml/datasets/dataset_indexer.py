from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class DatasetSample:
    # Defino la estructura de cada muestra indexada en el dataset
    sample_id: str
    scenario_id: int
    config_id: int
    ap_count: int
    split: str
    layout_path: str
    tx_paths: list[str]
    target_path: str


def get_split(scenario_id: int) -> str:
    # Decide si un scenario va a ir a train validation o test
    if 1 <= scenario_id <= 50:
        return "train"
    if 51 <= scenario_id <= 60:
        return "val"
    if 61 <= scenario_id <= 80:
        return "test"
    return "unassigned"


def parse_target_filename(filename: str) -> tuple[int, int] | None:
    # Lee el nombre del mapa objetivo al que tiene que llegar y devuelve el scenario_id y config_id
    if not filename.lower().endswith(".png"):
        return None

    parts = filename[:-4].split("_")
    if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit():
        return None

    return int(parts[0]), int(parts[1])


def get_expected_tx_paths(dataset_root: Path, ap_count: int, scenario_id: int, config_id: int) -> list[Path]:
    # Construye las rutas para un escenario y configuración dada la cantidad de APs
    "Si le das el path, con el numero de aps que quieres, el id y la config, te devuelve la lista de paths necesaria para construir la imagen final con todos los APs"
    tx_folder = dataset_root / "Txs" / f"{ap_count}AP" 

    if ap_count == 1:
        return [tx_folder / f"{scenario_id}_{config_id}.png"]
    "Si hay mas de un AP, devuelve la lista de paths para cada AP"
    return [
        tx_folder / f"{scenario_id}_{config_id}_{ap_index}.png"
        for ap_index in range(1, ap_count + 1)
    ]


def relative_to_dataset(path: Path, dataset_root: Path) -> str:
    # Convierte una ruta absoluta a una ruta relativa al dataset para que el json sea portable y tarde menos
    return path.resolve().relative_to(dataset_root.resolve()).as_posix()


def build_summary(samples: list[DatasetSample], skipped: dict[str, int]) -> dict:
    # hace el resumen final para comprobar que se ha añadido todo bien al json
    by_split: dict[str, int] = {}
    by_ap_count: dict[str, int] = {}

    for sample in samples:
        by_split[sample.split] = by_split.get(sample.split, 0) + 1

        ap_name = f"{sample.ap_count}AP"
        by_ap_count[ap_name] = by_ap_count.get(ap_name, 0) + 1

    return {
        "total_samples": len(samples),
        "by_split": dict(sorted(by_split.items())),
        "by_ap_count": dict(sorted(by_ap_count.items())),
        "skipped": {key: value for key, value in sorted(skipped.items()) if value > 0},
    }

    # aqui es donde se crea el json final que despues utilizara wifi_dataset.py
def build_dataset_index(
    dataset_root: Path,
    output_path: Path,
    ap_counts: list[int],
    layout_variant: str,
) -> None:
    
    dataset_root = dataset_root.resolve()
    layout_variant = layout_variant.upper()
    layout_folder = dataset_root / "Scennarios init" / f"Scennarios {layout_variant}"

    if not layout_folder.exists():
        raise FileNotFoundError(f"Missing layout folder: {layout_folder}")

    samples: list[DatasetSample] = []
    skipped = {
        "invalid_target_name": 0,
        "missing_maps_folder": 0,
        "missing_tx_folder": 0,
        "missing_layout": 0,
        "missing_tx": 0,
    }

    layout_names = {path.name for path in layout_folder.iterdir() if path.is_file()}

    for ap_count in ap_counts:
        maps_folder = dataset_root / "Maps and cells" / f"{ap_count}AP" / "Maps"
        tx_folder = dataset_root / "Txs" / f"{ap_count}AP"

        if not maps_folder.exists():
            skipped["missing_maps_folder"] += 1
            continue

        if not tx_folder.exists():
            skipped["missing_tx_folder"] += 1
            continue

        tx_names = {
            path.name
            for path in tx_folder.iterdir()
            if path.is_file() and path.suffix.lower() == ".png"
        }

        target_files = sorted(maps_folder.glob("*.png"), key=lambda path: parse_target_filename(path.name) or (10**9, 10**9))

        for target_path in target_files:
            parsed = parse_target_filename(target_path.name) #Pilla el mapa objetivo
            if parsed is None:
                skipped["invalid_target_name"] += 1
                continue

            scenario_id, config_id = parsed #Extrae el scenario_id y config_id del nombre del mapa objetivo
            layout_path = layout_folder / f"{scenario_id}.png"
            tx_paths = get_expected_tx_paths(dataset_root, ap_count, scenario_id, config_id) #Con ese scenario_id, config_id y numero de aps, construye las rutas de los mapas de cada AP

            if layout_path.name not in layout_names:
                skipped["missing_layout"] += 1
                continue

            if any(tx_path.name not in tx_names for tx_path in tx_paths):
                skipped["missing_tx"] += 1
                continue

            samples.append(
                DatasetSample(
                    sample_id=f"{ap_count}AP_{scenario_id}_{config_id}",
                    scenario_id=scenario_id,
                    config_id=config_id,
                    ap_count=ap_count,
                    split=get_split(scenario_id),
                    layout_path=relative_to_dataset(layout_path, dataset_root),
                    tx_paths=[relative_to_dataset(path, dataset_root) for path in tx_paths],
                    target_path=relative_to_dataset(target_path, dataset_root),
                )
            )

    samples.sort(key=lambda sample: (sample.ap_count, sample.scenario_id, sample.config_id))
    summary = build_summary(samples, skipped)

    index = { #Aqui se construye el diccionario final que se va a guardar en el json
        "dataset_root": str(dataset_root),
        "layout_variant": layout_variant,
        "image_size": 256,
        "ap_counts": ap_counts,
        "summary": summary,
        "samples": [asdict(sample) for sample in samples],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(index, indent=2), encoding="utf-8")

    print(f"Dataset index saved to: {output_path}")
    print(json.dumps(summary, indent=2))

# Valores por defecto del script, primero voy a utilizar hasta 3 aps
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a JSON index for DeepFIRP RME samples.")
    parser.add_argument("--dataset-root", type=Path, default=Path("DataSet5GHz"))
    parser.add_argument("--output", type=Path, default=Path("analytics-service/outputs/dataset_index.json"))
    parser.add_argument("--ap-counts", nargs="+", type=int, default=[1, 2, 3])
    parser.add_argument("--layout-variant", choices=["B", "W", "b", "w"], default="B")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_dataset_index(
        dataset_root=args.dataset_root,
        output_path=args.output,
        ap_counts=args.ap_counts,
        layout_variant=args.layout_variant,
    )


if __name__ == "__main__":
    main()
