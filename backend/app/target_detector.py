import re

import pandas as pd


TARGET_NAME_HINTS = {
    "target": 1.00,
    "label": 1.00,
    "y": 0.95,
    "output": 0.90,
    "prediction": 0.90,
    "predicted": 0.90,
    "class": 0.85,
    "response": 0.85,
    "outcome": 0.85,
    "price": 0.85,
    "salary": 0.85,
    "score": 0.70,
    "rating": 0.70,
    "demand": 0.65,
    "sales": 0.65,
    "revenue": 0.65,
}


def normalize_column_name(column: str) -> str:
    """Normalize a column name for keyword matching."""

    value = str(column).strip().lower()

    value = re.sub(
        r"[^a-z0-9]+",
        "_",
        value,
    )

    return value.strip("_")


def name_hint_score(column: str) -> float:
    """Score a column based on target-like naming."""

    normalized = normalize_column_name(column)

    if normalized in TARGET_NAME_HINTS:
        return TARGET_NAME_HINTS[normalized]

    tokens = normalized.split("_")

    token_scores = [
        TARGET_NAME_HINTS[token]
        for token in tokens
        if token in TARGET_NAME_HINTS
    ]

    if token_scores:
        return max(token_scores) * 0.85

    return 0.0


def uniqueness_score(series: pd.Series) -> float:
    """Estimate whether a column has a useful number of distinct values."""

    non_null = series.dropna()

    if len(non_null) == 0:
        return 0.0

    unique_count = int(non_null.nunique())
    row_count = int(len(non_null))

    if unique_count <= 1:
        return 0.0

    unique_ratio = unique_count / row_count

    # Very high cardinality often indicates an ID-like field.
    if unique_ratio >= 0.98:
        return 0.10

    # Binary / low-cardinality categorical targets.
    if unique_count <= 10:
        return 0.95

    # Reasonable numeric target.
    if unique_ratio <= 0.30:
        return 0.90

    return 0.70


def data_quality_score(series: pd.Series) -> float:
    """Score target suitability based on missing values."""

    if len(series) == 0:
        return 0.0

    missing_ratio = float(series.isna().mean())

    if missing_ratio == 0:
        return 1.0

    if missing_ratio <= 0.05:
        return 0.90

    if missing_ratio <= 0.15:
        return 0.70

    if missing_ratio <= 0.30:
        return 0.40

    return 0.10


def id_penalty(
    column: str,
    series: pd.Series,
) -> float:
    """Detect ID-like columns and return a penalty."""

    normalized = normalize_column_name(column)

    explicit_id = (
        normalized == "id"
        or normalized.endswith("_id")
        or normalized.endswith("id")
        or "identifier" in normalized
    )

    unique_ratio = (
        float(series.nunique(dropna=True))
        / max(int(series.notna().sum()), 1)
    )

    if explicit_id:
        return 1.0

    if unique_ratio >= 0.98:
        return 0.80

    return 0.0


def infer_problem_type(series: pd.Series) -> str:
    """Infer regression or classification from a candidate target."""

    if pd.api.types.is_bool_dtype(series):
        return "Classification"

    if pd.api.types.is_object_dtype(series):
        return "Classification"

    if isinstance(series.dtype, pd.CategoricalDtype):
        return "Classification"

    if pd.api.types.is_numeric_dtype(series):

        unique_count = int(
            series.nunique(dropna=True)
        )

        non_null_count = int(
            series.notna().sum()
        )

        if non_null_count == 0:
            return "Unknown"

        unique_ratio = unique_count / non_null_count

        # Binary numeric target.
        if unique_count <= 2:
            return "Classification"

        # Low-cardinality numeric values that repeat heavily
        # are more likely to represent classes.
        if (
            unique_count <= 10
            and unique_ratio < 0.50
        ):
            return "Classification"

        # Otherwise treat the numeric target as continuous.
        return "Regression"

    return "Unknown"


def score_target_candidate(
    df: pd.DataFrame,
    column: str,
) -> dict:
    """Calculate a target suitability score."""

    series = df[column]

    naming = name_hint_score(column)

    uniqueness = uniqueness_score(series)

    quality = data_quality_score(series)

    penalty = id_penalty(
        column,
        series,
    )

    score = 0.0

    score += naming * 0.45
    score += uniqueness * 0.25
    score += quality * 0.20
    score -= penalty * 0.60

    # Penalize free-text / high-cardinality categorical fields.
    if pd.api.types.is_object_dtype(series):

        unique_ratio = (
            series.nunique(dropna=True)
            / max(int(series.notna().sum()), 1)
        )

        if unique_ratio >= 0.50:
            score -= 0.25

    score = max(
        0.0,
        min(score, 1.0),
    )

    return {
        "column": str(column),
        "score": round(
            float(score),
            4,
        ),
        "confidence": round(
            float(score * 100),
            2,
        ),
        "problem_type": infer_problem_type(
            series
        ),
        "signals": {
            "name_hint": round(
                float(naming),
                4,
            ),
            "uniqueness": round(
                float(uniqueness),
                4,
            ),
            "data_quality": round(
                float(quality),
                4,
            ),
            "id_penalty": round(
                float(penalty),
                4,
            ),
        },
    }


def detect_targets(df: pd.DataFrame) -> dict:
    """
    Detect and rank possible target columns.

    Returns ranked candidates plus the recommended target.
    """

    candidates = []

    for column in df.columns:

        candidate = score_target_candidate(
            df,
            column,
        )

        if candidate["score"] >= 0.20:
            candidates.append(candidate)

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    recommended = (
        candidates[0]
        if candidates
        else None
    )

    return {
        "recommended_target": recommended,
        "candidates": candidates,
    }