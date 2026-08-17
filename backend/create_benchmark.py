from pathlib import Path

import pandas as pd
from sklearn.datasets import load_diabetes


def create_benchmark_dataset():
    dataset = load_diabetes(
        as_frame=True
    )

    df = dataset.frame.copy()

    output_path = (
        Path(__file__).resolve().parent.parent
        / "data"
        / "diabetes_benchmark.csv"
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    df.to_csv(
        output_path,
        index=False,
    )

    print("Benchmark dataset created.")
    print(f"Location: {output_path}")
    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print(f"Target: target")


if __name__ == "__main__":
    create_benchmark_dataset()