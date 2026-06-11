from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.datasets.wifi_dataset import WiFiCoverageDataset
from ml.utils.visualization import save_sample_visualization


def default_index_path() -> Path:
    return (Path(__file__).resolve().parents[2] / "outputs" / "dataset_index.json").resolve()


def default_visualization_path() -> Path:
    return (Path(__file__).resolve().parents[2] / "outputs" / "sample_visualization.png").resolve()


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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect one indexed WiFi coverage sample.")
    parser.add_argument("--index-path", type=Path, default=default_index_path())
    parser.add_argument("--dataset-root", type=Path, default=None)
    parser.add_argument("--split", choices=["train", "val", "test", "unassigned"], default="train")
    parser.add_argument("--ap-counts", type=int, nargs="+", default=None)
    parser.add_argument("--sample-index", type=int, default=0)
    parser.add_argument("--scenario-id", type=int, default=None)
    parser.add_argument("--config-id", type=int, default=None)
    parser.add_argument("--ap-count", type=int, default=None)
    parser.add_argument("--invert-layout", action="store_true")
    parser.add_argument("--save-visualization", type=Path, default=default_visualization_path())
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ap_counts = args.ap_counts
    if args.ap_count is not None:
        ap_counts = [args.ap_count]

    dataset = WiFiCoverageDataset(
        index_path=args.index_path,
        split=args.split,
        ap_counts=ap_counts,
        dataset_root=args.dataset_root,
        invert_layout=args.invert_layout,
    )
    if len(dataset) == 0:
        raise RuntimeError("The selected dataset split/AP filters produced zero samples.")

    sample_index = find_sample_index(
        dataset=dataset,
        scenario_id=args.scenario_id,
        config_id=args.config_id,
        ap_count=args.ap_count,
        fallback_index=args.sample_index,
    )
    input_tensor, target_tensor, metadata = dataset[sample_index]
    save_sample_visualization(input_tensor, target_tensor, metadata, args.save_visualization)

    print(f"Dataset length: {len(dataset)}")
    print(f"Selected index: {sample_index}")
    print(f"Input shape: {tuple(input_tensor.shape)}")
    print(f"Target shape: {tuple(target_tensor.shape)}")
    print("Metadata:")
    print(json.dumps(metadata, indent=2))
    print(f"Saved visualization to: {args.save_visualization}")


if __name__ == "__main__":
    main()
