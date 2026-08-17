import pandas as pd


def numeric_profile(df: pd.DataFrame) -> dict:
    """Generate statistical profiles for numeric columns."""

    result = {}

    numeric_df = df.select_dtypes(include="number")

    for column in numeric_df.columns:
        series = numeric_df[column].dropna()

        if len(series) == 0:
            continue

        q1 = float(series.quantile(0.25))
        median = float(series.quantile(0.50))
        q3 = float(series.quantile(0.75))

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_count = int(
            ((series < lower_bound) | (series > upper_bound)).sum()
        )

        result[str(column)] = {
            "count": int(series.count()),
            "mean": float(series.mean()),
            "median": median,
            "min": float(series.min()),
            "max": float(series.max()),
            "std": float(series.std()) if len(series) > 1 else 0.0,
            "q1": q1,
            "q3": q3,
            "skewness": float(series.skew()) if len(series) > 2 else 0.0,
            "outliers": outlier_count,
        }

    return result


def categorical_profile(df: pd.DataFrame) -> dict:
    """Generate frequency profiles for categorical columns."""

    result = {}

    categorical_df = df.select_dtypes(
        include=["object", "category", "bool"]
    )

    for column in categorical_df.columns:
        series = categorical_df[column].dropna()

        if len(series) == 0:
            continue

        value_counts = series.value_counts()

        categories = []

        for value, count in value_counts.items():
            categories.append(
                {
                    "value": str(value),
                    "count": int(count),
                    "percentage": round(
                        float((count / len(series)) * 100),
                        2,
                    ),
                }
            )

        result[str(column)] = {
            "unique_values": int(series.nunique()),
            "most_common": (
                str(value_counts.index[0])
                if len(value_counts) > 0
                else None
            ),
            "categories": categories,
        }

    return result


def correlation_profile(df: pd.DataFrame) -> dict:
    """Find correlations between numeric columns."""

    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] < 2:
        return {
            "matrix": {},
            "strong_relationships": [],
        }

    correlation_matrix = numeric_df.corr()

    matrix = {}

    for column in correlation_matrix.columns:
        matrix[str(column)] = {}

        for other_column in correlation_matrix.columns:
            value = correlation_matrix.loc[column, other_column]

            matrix[str(column)][str(other_column)] = (
                round(float(value), 4)
                if pd.notna(value)
                else None
            )

    relationships = []

    columns = list(correlation_matrix.columns)

    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            column_a = columns[i]
            column_b = columns[j]

            value = correlation_matrix.loc[
                column_a,
                column_b,
            ]

            if pd.isna(value):
                continue

            correlation = float(value)

            if abs(correlation) >= 0.70:
                relationships.append(
                    {
                        "column_a": str(column_a),
                        "column_b": str(column_b),
                        "correlation": round(
                            correlation,
                            4,
                        ),
                        "strength": (
                            "strong"
                            if abs(correlation) >= 0.85
                            else "moderate"
                        ),
                    }
                )

    relationships.sort(
        key=lambda item: abs(item["correlation"]),
        reverse=True,
    )

    return {
        "matrix": matrix,
        "strong_relationships": relationships,
    }


def build_insights(
    numeric_stats: dict,
    categorical_stats: dict,
    correlations: dict,
) -> list[dict]:
    """Generate simple human-readable statistical insights."""

    insights = []

    # Strong correlations
    for relationship in correlations["strong_relationships"]:
        correlation = relationship["correlation"]

        direction = (
            "positive"
            if correlation > 0
            else "negative"
        )

        insights.append(
            {
                "type": "correlation",
                "severity": "info",
                "message": (
                    f"{relationship['column_a']} and "
                    f"{relationship['column_b']} show a "
                    f"{relationship['strength']} "
                    f"{direction} relationship "
                    f"(r = {correlation})."
                ),
            }
        )

    # Outliers
    for column, stats in numeric_stats.items():
        if stats["outliers"] > 0:
            insights.append(
                {
                    "type": "outlier",
                    "severity": "warning",
                    "message": (
                        f"{column} contains "
                        f"{stats['outliers']} potential "
                        f"outlier(s) based on the IQR method."
                    ),
                }
            )

    # Skewness
    for column, stats in numeric_stats.items():
        skewness = stats["skewness"]

        if abs(skewness) >= 1:
            direction = (
                "right-skewed"
                if skewness > 0
                else "left-skewed"
            )

            insights.append(
                {
                    "type": "distribution",
                    "severity": "info",
                    "message": (
                        f"{column} appears strongly "
                        f"{direction} "
                        f"(skewness = {round(skewness, 2)})."
                    ),
                }
            )

    # Categorical concentration
    for column, stats in categorical_stats.items():
        categories = stats["categories"]

        if categories:
            top_percentage = categories[0]["percentage"]

            if top_percentage >= 70:
                insights.append(
                    {
                        "type": "categorical",
                        "severity": "info",
                        "message": (
                            f"{column} is highly concentrated: "
                            f"'{categories[0]['value']}' represents "
                            f"{top_percentage}% of non-missing values."
                        ),
                    }
                )

    return insights


def profile_dataset(df: pd.DataFrame) -> dict:
    """Generate the complete statistical profile."""

    numeric_stats = numeric_profile(df)

    categorical_stats = categorical_profile(df)

    correlations = correlation_profile(df)

    insights = build_insights(
        numeric_stats,
        categorical_stats,
        correlations,
    )

    return {
        "numeric_statistics": numeric_stats,
        "categorical_statistics": categorical_stats,
        "correlations": correlations,
        "insights": insights,
    }