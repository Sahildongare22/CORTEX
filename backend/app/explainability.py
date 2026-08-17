from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class FeatureExplanation:
    feature: str
    importance: float
    direction: str
    explanation: str


def explain_linear_regression(
    feature_names: list[str],
    coefficients,
) -> list[dict]:
    """
    Explain a linear regression model using its coefficients.

    Larger absolute coefficients indicate stronger influence
    after the model's preprocessing/scaling.
    """

    coefficients = np.asarray(
        coefficients,
        dtype=float,
    ).ravel()

    if len(feature_names) != len(coefficients):
        raise ValueError(
            "Feature-name count does not match coefficient count."
        )

    absolute_values = np.abs(coefficients)

    total = float(
        absolute_values.sum()
    )

    if total == 0:
        normalized = np.zeros_like(
            absolute_values
        )
    else:
        normalized = (
            absolute_values / total
        )

    explanations = []

    for feature, coefficient, importance in zip(
        feature_names,
        coefficients,
        normalized,
    ):
        if coefficient > 0:
            direction = "positive"
            explanation = (
                f"{feature} has a positive influence "
                "on the predicted target."
            )
        elif coefficient < 0:
            direction = "negative"
            explanation = (
                f"{feature} has a negative influence "
                "on the predicted target."
            )
        else:
            direction = "neutral"
            explanation = (
                f"{feature} has little direct linear "
                "influence on the predicted target."
            )

        explanations.append(
            {
                "feature": str(feature),
                "importance": round(
                    float(importance),
                    4,
                ),
                "importance_percentage": round(
                    float(importance * 100),
                    2,
                ),
                "direction": direction,
                "coefficient": round(
                    float(coefficient),
                    6,
                ),
                "explanation": explanation,
            }
        )

    explanations.sort(
        key=lambda item: item["importance"],
        reverse=True,
    )

    return explanations


def explain_tree_model(
    feature_names: list[str],
    importances,
) -> list[dict]:
    """
    Explain a tree-based model using feature_importances_.
    """

    importances = np.asarray(
        importances,
        dtype=float,
    ).ravel()

    if len(feature_names) != len(importances):
        raise ValueError(
            "Feature-name count does not match importance count."
        )

    total = float(
        importances.sum()
    )

    if total == 0:
        normalized = np.zeros_like(
            importances
        )
    else:
        normalized = (
            importances / total
        )

    explanations = []

    for feature, importance in zip(
        feature_names,
        normalized,
    ):
        explanations.append(
            {
                "feature": str(feature),
                "importance": round(
                    float(importance),
                    4,
                ),
                "importance_percentage": round(
                    float(importance * 100),
                    2,
                ),
                "direction": "model-dependent",
                "explanation": (
                    f"{feature} contributes to the "
                    "model's predictive decisions."
                ),
            }
        )

    explanations.sort(
        key=lambda item: item["importance"],
        reverse=True,
    )

    return explanations


def get_feature_names_from_preprocessor(
    preprocessor,
) -> list[str]:
    """
    Extract transformed feature names from a fitted
    ColumnTransformer.
    """

    try:
        feature_names = (
            preprocessor.get_feature_names_out()
        )
    except Exception as exc:
        raise ValueError(
            "Could not extract transformed feature names "
            "from the fitted preprocessor."
        ) from exc

    cleaned_names = []

    for name in feature_names:
        value = str(name)

        # Remove ColumnTransformer prefixes such as:
        # numeric__bmi
        # categorical__sex_M
        if "__" in value:
            value = value.split(
                "__",
                1,
            )[1]

        cleaned_names.append(value)

    return cleaned_names


def explain_fitted_model(
    pipeline,
) -> dict:
    """
    Explain a fitted sklearn preprocessing + model pipeline.

    Supports:
    - LinearRegression
    - RandomForestRegressor
    - ExtraTreesRegressor
    - other tree models exposing feature_importances_
    """

    if not hasattr(
        pipeline,
        "named_steps",
    ):
        raise ValueError(
            "Expected a fitted sklearn Pipeline."
        )

    if "preprocessing" not in pipeline.named_steps:
        raise ValueError(
            "Pipeline does not contain a preprocessing step."
        )

    if "model" not in pipeline.named_steps:
        raise ValueError(
            "Pipeline does not contain a model step."
        )

    preprocessor = pipeline.named_steps[
        "preprocessing"
    ]

    model = pipeline.named_steps[
        "model"
    ]

    feature_names = (
        get_feature_names_from_preprocessor(
            preprocessor
        )
    )

    if hasattr(
        model,
        "coef_",
    ):
        explanations = explain_linear_regression(
            feature_names,
            model.coef_,
        )

        method = "Linear regression coefficients"

    elif hasattr(
        model,
        "feature_importances_",
    ):
        explanations = explain_tree_model(
            feature_names,
            model.feature_importances_,
        )

        method = "Tree-based feature importance"

    else:
        raise ValueError(
            f"Explainability is not yet supported "
            f"for model type: {type(model).__name__}"
        )

    return {
        "method": method,
        "model": type(model).__name__,
        "feature_count": len(
            explanations
        ),
        "features": explanations,
    }