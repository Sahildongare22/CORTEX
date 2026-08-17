import math

import numpy as np

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import KFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_preprocessor(
    numeric_features,
    categorical_features,
):
    """Create leakage-safe preprocessing."""

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                ),
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    transformers = []

    if numeric_features:
        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_features,
            )
        )

    if categorical_features:
        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            )
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )


def get_regression_models():
    """Return the regression model candidates."""

    return {
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


def run_regression_cross_validation(
    X,
    y,
    numeric_features,
    categorical_features,
    folds=5,
):
    """Evaluate regression models using leakage-safe K-fold CV."""

    if len(X) < folds:
        raise ValueError(
            f"Dataset contains {len(X)} rows, "
            f"but {folds}-fold cross-validation was requested."
        )

    cross_validator = KFold(
        n_splits=folds,
        shuffle=True,
        random_state=42,
    )

    models = get_regression_models()

    leaderboard = []

    for model_name, model in models.items():

        pipeline = Pipeline(
            steps=[
                (
                    "preprocessing",
                    build_preprocessor(
                        numeric_features,
                        categorical_features,
                    ),
                ),
                (
                    "model",
                    model,
                ),
            ]
        )

        scores = cross_validate(
            pipeline,
            X,
            y,
            cv=cross_validator,
            scoring={
                "r2": "r2",
                "mae": "neg_mean_absolute_error",
                "rmse": "neg_root_mean_squared_error",
            },
            n_jobs=-1,
            return_train_score=False,
        )

        r2_scores = np.asarray(
            scores["test_r2"],
            dtype=float,
        )

        mae_scores = -np.asarray(
            scores["test_mae"],
            dtype=float,
        )

        rmse_scores = -np.asarray(
            scores["test_rmse"],
            dtype=float,
        )

        mean_r2 = float(
            np.mean(r2_scores)
        )

        std_r2 = float(
            np.std(r2_scores)
        )

        mean_mae = float(
            np.mean(mae_scores)
        )

        mean_rmse = float(
            np.mean(rmse_scores)
        )

        leaderboard.append(
            {
                "model": model_name,
                "mean_r2": round(
                    mean_r2,
                    4,
                ),
                "std_r2": round(
                    std_r2,
                    4,
                ),
                "mean_mae": round(
                    mean_mae,
                    4,
                ),
                "mean_rmse": round(
                    mean_rmse,
                    4,
                ),
                "folds": folds,
            }
        )

    leaderboard.sort(
        key=lambda item: (
            item["mean_r2"]
            if math.isfinite(item["mean_r2"])
            else -math.inf
        ),
        reverse=True,
    )

    return leaderboard


def run_cross_validated_experiment(
    X,
    y,
    numeric_features,
    categorical_features,
    problem_type,
    target_column,
    folds=5,
):
    """Run a full cross-validated regression experiment."""

    if problem_type != "Regression":
        raise ValueError(
            "Cross-validated classification is "
            "not implemented yet."
        )

    leaderboard = run_regression_cross_validation(
        X=X,
        y=y,
        numeric_features=numeric_features,
        categorical_features=categorical_features,
        folds=folds,
    )

    best_model = (
        leaderboard[0]
        if leaderboard
        else None
    )

    return {
        "problem_type": problem_type,
        "target": target_column,
        "folds": folds,
        "leaderboard": leaderboard,
        "best_model": best_model,
    }