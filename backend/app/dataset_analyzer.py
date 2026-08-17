import pandas as pd

from app.statistical_profiler import profile_dataset
from app.target_detector import detect_targets


def calculate_health_score(
    df: pd.DataFrame,
    missing_values: int,
    duplicate_rows: int,
) -> int:
    """Calculate a dataset quality score from 0 to 100."""

    total_cells = max(int(df.shape[0] * df.shape[1]), 1)

    missing_rate = missing_values / total_cells
    duplicate_rate = duplicate_rows / max(int(len(df)), 1)

    score = 100

    # Missing data penalty
    score -= min(int(missing_rate * 100), 30)

    # Duplicate penalty
    score -= min(int(duplicate_rate * 100), 20)

    # Empty columns penalty
    empty_columns = sum(
        bool(df[column].isna().all())
        for column in df.columns
    )

    score -= min(int(empty_columns) * 5, 20)

    return int(max(0, min(score, 100)))


def detect_id_columns(df: pd.DataFrame) -> list[str]:
    """Find columns that look like identifiers."""

    id_columns = []

    for column in df.columns:
        name = str(column).lower()

        unique_count = int(
            df[column].nunique(dropna=True)
        )

        unique_ratio = unique_count / max(int(len(df)), 1)

        name_looks_like_id = (
            name == "id"
            or name.endswith("_id")
            or name.endswith("id")
            or "identifier" in name
        )

        high_uniqueness = unique_ratio >= 0.95

        if name_looks_like_id or high_uniqueness:
            id_columns.append(str(column))

    return id_columns


def detect_constant_columns(df: pd.DataFrame) -> list[str]:
    """Find columns containing only one distinct value."""

    constant_columns = []

    for column in df.columns:
        unique_count = int(
            df[column].nunique(dropna=False)
        )

        if unique_count <= 1:
            constant_columns.append(str(column))

    return constant_columns


def detect_high_cardinality_columns(
    df: pd.DataFrame,
) -> list[str]:
    """Find categorical columns with unusually high cardinality."""

    columns = []

    for column in df.select_dtypes(
        include=["object", "category"]
    ).columns:

        unique_count = int(
            df[column].nunique(dropna=True)
        )

        row_count = int(len(df))

        if row_count > 0 and unique_count / row_count >= 0.5:
            columns.append(str(column))

    return columns


def detect_target_candidates(
    df: pd.DataFrame,
) -> list[dict]:
    """Generate simple heuristics for possible ML target columns."""

    candidates = []

    for column in df.columns:

        unique_count = int(
            df[column].nunique(dropna=True)
        )

        if unique_count <= 1:
            continue

        dtype = df[column].dtype

        if pd.api.types.is_numeric_dtype(dtype):

            candidates.append(
                {
                    "column": str(column),
                    "type": "numeric",
                    "reason": (
                        "Numeric column with multiple "
                        "distinct values."
                    ),
                }
            )

        elif pd.api.types.is_object_dtype(dtype):

            if 2 <= unique_count <= min(
                20,
                max(int(len(df)) // 2, 2),
            ):
                candidates.append(
                    {
                        "column": str(column),
                        "type": "categorical",
                        "reason": (
                            "Categorical column with a manageable "
                            "number of classes."
                        ),
                    }
                )

    return candidates


def detect_problem_type(
    df: pd.DataFrame,
    target_candidates: list[dict],
) -> str:
    """Provide a basic heuristic for ML problem type."""

    if not target_candidates:
        return "Unknown"

    numeric_targets = [
        target
        for target in target_candidates
        if target["type"] == "numeric"
    ]

    categorical_targets = [
        target
        for target in target_candidates
        if target["type"] == "categorical"
    ]

    if numeric_targets:
        return "Likely Regression"

    if categorical_targets:
        return "Likely Classification"

    return "Unknown"


def build_warnings(
    df: pd.DataFrame,
    missing_values: int,
    duplicate_rows: int,
    constant_columns: list[str],
    id_columns: list[str],
    high_cardinality_columns: list[str],
) -> list[dict]:
    """Create human-readable dataset warnings."""

    warnings = []

    if missing_values > 0:
        warnings.append(
            {
                "severity": "warning",
                "message": (
                    f"{missing_values} missing value(s) detected."
                ),
            }
        )

    if duplicate_rows > 0:
        warnings.append(
            {
                "severity": "warning",
                "message": (
                    f"{duplicate_rows} duplicate row(s) detected."
                ),
            }
        )

    if constant_columns:
        warnings.append(
            {
                "severity": "warning",
                "message": (
                    "Constant column(s) detected: "
                    f"{', '.join(constant_columns)}."
                ),
            }
        )

    if id_columns:
        warnings.append(
            {
                "severity": "info",
                "message": (
                    "Potential ID column(s): "
                    f"{', '.join(id_columns)}."
                ),
            }
        )

    if high_cardinality_columns:
        warnings.append(
            {
                "severity": "info",
                "message": (
                    "High-cardinality column(s) detected: "
                    f"{', '.join(high_cardinality_columns)}."
                ),
            }
        )

    return warnings


def analyze_dataset(file_path: str) -> dict:
    """Analyze a CSV dataset and return complete CORTEX intelligence."""

    # Read dataset
    df = pd.read_csv(file_path)

    # ---------------------------------------------------------
    # NEW: Statistical profiling
    # ---------------------------------------------------------
    statistical_profile = profile_dataset(df)
    target_detection = detect_targets(df)
    # ---------------------------------------------------------
    # Basic dataset information
    # ---------------------------------------------------------
    rows = int(df.shape[0])
    columns = int(df.shape[1])

    missing_values = int(
        df.isna().sum().sum()
    )

    duplicate_rows = int(
        df.duplicated().sum()
    )

    # ---------------------------------------------------------
    # Column types
    # ---------------------------------------------------------
    numeric_columns = [
        str(column)
        for column in df.select_dtypes(
            include="number"
        ).columns.tolist()
    ]

    categorical_columns = [
        str(column)
        for column in df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()
    ]

    # ---------------------------------------------------------
    # Dataset intelligence
    # ---------------------------------------------------------
    constant_columns = detect_constant_columns(df)

    id_columns = detect_id_columns(df)

    high_cardinality_columns = (
        detect_high_cardinality_columns(df)
    )

    target_candidates = detect_target_candidates(df)

    problem_type = detect_problem_type(
        df,
        target_candidates,
    )

    health_score = calculate_health_score(
        df,
        missing_values,
        duplicate_rows,
    )

    warnings = build_warnings(
        df,
        missing_values,
        duplicate_rows,
        constant_columns,
        id_columns,
        high_cardinality_columns,
    )

    # ---------------------------------------------------------
    # Column-level information
    # ---------------------------------------------------------
    column_info = []

    for column in df.columns:

        missing_count = int(
            df[column].isna().sum()
        )

        unique_count = int(
            df[column].nunique(dropna=True)
        )

        missing_percentage = round(
            float(
                df[column].isna().mean() * 100
            ),
            2,
        )

        column_info.append(
            {
                "name": str(column),
                "dtype": str(df[column].dtype),
                "missing": missing_count,
                "missing_percentage": missing_percentage,
                "unique": unique_count,
            }
        )

    # ---------------------------------------------------------
    # COMPLETE RESPONSE
    # ---------------------------------------------------------
    return {
        # Basic
        "rows": rows,
        "columns": columns,
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        
        # Dataset intelligence
        "health_score": health_score,
        "problem_type": problem_type,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "constant_columns": constant_columns,
        "id_columns": id_columns,
        "high_cardinality_columns": high_cardinality_columns,
        "target_candidates": target_candidates,
        "warnings": warnings,
        "column_info": column_info,

        # Statistical intelligence
        "numeric_statistics": statistical_profile[
            "numeric_statistics"
        ],
        "categorical_statistics": statistical_profile[
            "categorical_statistics"
        ],
        "correlations": statistical_profile[
            "correlations"
        ],
        "insights": statistical_profile[
            "insights"
        ],
        "target_detection": target_detection,
    }