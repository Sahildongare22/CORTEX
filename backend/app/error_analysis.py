from __future__ import annotations

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline

from app.model_engine import build_preprocessor


def build_regression_model(model_name: str):
    """
    Build the same regression models used by CORTEX AutoML.
    """

    models = {
        "Linear Regression": LinearRegression(),

        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            n_jobs=-1,
        ),

        "Gradient Boosting": GradientBoostingRegressor(
            random_state=42,
        ),

        "Extra Trees": ExtraTreesRegressor(
            n_estimators=300,
            random_state=42,
            n_jobs=-1,
        ),
    }

    if model_name not in models:
        raise ValueError(
            f"Unsupported regression model: {model_name}"
        )

    return models[model_name]


def analyze_regression_errors(
    X: pd.DataFrame,
    y: pd.Series,
    numeric_features: list[str],
    categorical_features: list[str],
    model_name: str,
    folds: int = 5,
    top_n: int = 10,
) -> dict:
    """
    Generate out-of-fold predictions and analyze
    prediction errors for a regression model.
    """

    if len(X) < folds:
        raise ValueError(
            "Number of samples must be at least equal to "
            "the number of cross-validation folds."
        )

    if folds < 2:
        raise ValueError(
            "folds must be at least 2."
        )

    if top_n < 1:
        raise ValueError(
            "top_n must be at least 1."
        )

    preprocessing = build_preprocessor(
        numeric_features,
        categorical_features,
    )

    model = build_regression_model(
        model_name
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessing",
                preprocessing,
            ),
            (
                "model",
                model,
            ),
        ]
    )

    cv = KFold(
        n_splits=folds,
        shuffle=True,
        random_state=42,
    )

    predictions = cross_val_predict(
        pipeline,
        X,
        y,
        cv=cv,
        method="predict",
    )

    actual = np.asarray(
        y,
        dtype=float,
    )

    predictions = np.asarray(
        predictions,
        dtype=float,
    )

    errors = predictions - actual
    absolute_errors = np.abs(errors)

    mae = float(
        mean_absolute_error(
            actual,
            predictions,
        )
    )

    rmse = float(
        np.sqrt(
            mean_squared_error(
                actual,
                predictions,
            )
        )
    )

    r2 = float(
        r2_score(
            actual,
            predictions,
        )
    )

    mean_error = float(
        np.mean(errors)
    )

    median_absolute_error = float(
        np.median(absolute_errors)
    )

    error_records = []

    for index, (
        actual_value,
        predicted_value,
        error_value,
        absolute_error,
    ) in enumerate(
        zip(
            actual,
            predictions,
            errors,
            absolute_errors,
        )
    ):
        error_records.append(
            {
                "index": int(index),
                "actual": round(
                    float(actual_value),
                    4,
                ),
                "predicted": round(
                    float(predicted_value),
                    4,
                ),
                "error": round(
                    float(error_value),
                    4,
                ),
                "absolute_error": round(
                    float(absolute_error),
                    4,
                ),
            }
        )

    largest_errors = sorted(
        error_records,
        key=lambda item: item["absolute_error"],
        reverse=True,
    )[:top_n]

    underpredicted = int(
        np.sum(errors < 0)
    )

    overpredicted = int(
        np.sum(errors > 0)
    )

    exact_predictions = int(
        np.sum(
            np.isclose(
                errors,
                0,
            )
        )
    )

    return {
        "model": model_name,
        "validation": {
            "method": "Out-of-Fold Cross Validation",
            "folds": folds,
        },
        "metrics": {
            "r2": round(r2, 4),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "mean_error": round(
                mean_error,
                4,
            ),
            "median_absolute_error": round(
                median_absolute_error,
                4,
            ),
        },
        "error_summary": {
            "samples": int(len(actual)),
            "underpredicted": underpredicted,
            "overpredicted": overpredicted,
            "exact_predictions": exact_predictions,
        },
        "largest_errors": largest_errors,
        "actual_vs_predicted": error_records,
    }