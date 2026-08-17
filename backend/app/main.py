from pathlib import Path

import pandas as pd
from fastapi import HTTPException
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.dataset_analyzer import analyze_dataset
from app.prediction_registry import (
    create_prediction,
    get_predictions,
    get_predictions_for_experiment,
)
from app.experiment_registry import (
    create_experiment,
    get_experiment,
    get_experiments,
)
from app.explainability import explain_fitted_model
from app.error_analysis import analyze_regression_errors
from app.model_reasoning import explain_model_selection
from app.model_store import save_model
from app.model_store import load_model
from app.model_engine import run_cross_validated_experiment
from app.target_detector import detect_targets

def build_best_regression_model(model_name: str):
    """Create a fresh instance of the selected regression model."""

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
            f"Unsupported model: {model_name}"
        )

    return models[model_name]

app = FastAPI(
    title="CORTEX API",
    description="Autonomous Machine Learning Research Platform",
    version="0.1.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Dataset storage
# ---------------------------------------------------------

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "online",
        "project": "CORTEX",
        "version": "0.1.0",
    }


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# Dataset analysis
# ---------------------------------------------------------

@app.post("/api/dataset/analyze")
async def analyze_uploaded_dataset(
    file: UploadFile = File(...),
):
    """
    Upload, validate, store, and analyze a CSV dataset.
    """

    # -------------------------------------------------
    # Validate filename
    # -------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported currently.",
        )

    # -------------------------------------------------
    # Read uploaded file
    # -------------------------------------------------

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded CSV file is empty.",
            )

        # -------------------------------------------------
        # Store uploaded file
        # -------------------------------------------------

        file_path = UPLOAD_DIR / file.filename

        file_path.write_bytes(contents)

        # -------------------------------------------------
        # Validate CSV structure
        # -------------------------------------------------

        try:
            df = pd.read_csv(file_path)

        except Exception:
            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded file could not be "
                    "read as a valid CSV dataset."
                ),
            )

        if df.shape[1] < 2:
            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "Dataset must contain at least "
                    "two columns."
                ),
            )

        if df.shape[0] < 2:
            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "Dataset must contain at least "
                    "two data rows."
                ),
            )

        # -------------------------------------------------
        # Analyze validated dataset
        # -------------------------------------------------

        analysis = analyze_dataset(
            str(file_path)
        )

        return {
            "filename": file.filename,
            "analysis": analysis,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Dataset analysis failed: "
                f"{str(exc)}"
            ),
        )


# ---------------------------------------------------------
# Dataset preview
# ---------------------------------------------------------

@app.get("/api/dataset/preview")
def preview_dataset(
    filename: str,
    page: int = 1,
    page_size: int = 25,
):
    """
    Return a paginated preview of an uploaded CSV.
    """

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1.",
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=400,
            detail="Page size must be between 1 and 100.",
        )

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                "Dataset not found. "
                "Analyze/upload it first."
            ),
        )

    try:
        df = pd.read_csv(file_path)

        total_rows = int(len(df))
        total_columns = int(len(df.columns))

        start = (page - 1) * page_size
        end = start + page_size

        preview = df.iloc[start:end].copy()

        preview = preview.astype(object).where(
            pd.notna(preview),
            None,
        )

        rows = preview.to_dict(
            orient="records"
        )

        total_pages = max(
            1,
            (total_rows + page_size - 1)
            // page_size,
        )

        return {
            "filename": filename,
            "page": page,
            "page_size": page_size,
            "total_rows": total_rows,
            "total_columns": total_columns,
            "total_pages": total_pages,
            "columns": [
                str(column)
                for column in df.columns
            ],
            "rows": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Dataset preview failed: {str(exc)}"
            ),
        )


# ---------------------------------------------------------
# AutoML experiment
# ---------------------------------------------------------

@app.post("/api/experiment/run")
def run_automl_experiment(
    filename: str,
    folds: int = 5,
):
    """
    Run a cross-validated AutoML experiment
    on a stored CSV dataset.
    """

    if folds < 2 or folds > 10:
        raise HTTPException(
            status_code=400,
            detail="Folds must be between 2 and 10.",
        )

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                "Dataset not found. "
                "Analyze/upload it first."
            ),
        )

    try:
        # -------------------------------------------------
        # Load dataset
        # -------------------------------------------------

        df = pd.read_csv(file_path)

        # -------------------------------------------------
        # Target detection
        # -------------------------------------------------

        target_detection = detect_targets(
            df
        )

        recommended = target_detection.get(
            "recommended_target"
        )

        if not recommended:
            raise HTTPException(
                status_code=400,
                detail=(
                    "CORTEX could not identify "
                    "a target column."
                ),
            )

        target_column = recommended["column"]
        problem_type = recommended["problem_type"]

        # -------------------------------------------------
        # Separate features and target
        # -------------------------------------------------

        X = df.drop(
            columns=[target_column]
        )

        y = df[target_column]

        # -------------------------------------------------
        # Detect ID-like columns
        # -------------------------------------------------

        id_columns = []

        for column in X.columns:
            name = str(column).lower()

            unique_ratio = (
                X[column].nunique(dropna=True)
                / max(
                    int(X[column].notna().sum()),
                    1,
                )
            )

            looks_like_id = (
                name == "id"
                or name.endswith("_id")
                or name.endswith("id")
                or "identifier" in name
                or unique_ratio >= 0.98
            )

            if looks_like_id:
                id_columns.append(
                    str(column)
                )

        # -------------------------------------------------
        # Remove ID-like columns
        # -------------------------------------------------

        if id_columns:
            X = X.drop(
                columns=id_columns
            )

        # -------------------------------------------------
        # Detect feature types
        # -------------------------------------------------

        numeric_features = [
            str(column)
            for column in X.select_dtypes(
                include="number"
            ).columns.tolist()
        ]

        categorical_features = [
            str(column)
            for column in X.select_dtypes(
                include=[
                    "object",
                    "category",
                    "bool",
                ]
            ).columns.tolist()
        ]

        if X.shape[1] == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No feature columns remain "
                    "after removing ID-like columns."
                ),
            )

                # -------------------------------------------------
        # Run AutoML
        # -------------------------------------------------

        result = run_cross_validated_experiment(
            X=X,
            y=y,
            numeric_features=numeric_features,
            categorical_features=categorical_features,
            problem_type=problem_type,
            target_column=target_column,
            folds=folds,
        )

        if not result.get("leaderboard"):
            raise HTTPException(
                status_code=422,
                detail=(
                    "CORTEX could not train any valid models "
                    "for this dataset."
                ),
            )

        if not result.get("best_model"):
            raise HTTPException(
                status_code=422,
                detail=(
                    "CORTEX could not select a best model "
                    "for this dataset."
                ),
            )

        # -------------------------------------------------
        # Explain the winning model
        # -------------------------------------------------

        explainability = None

        if result["best_model"] is not None:
            best_model_name = result["best_model"]["model"]

            best_model = build_best_regression_model(
                best_model_name
            )

            from app.model_engine import build_preprocessor

            preprocessing = build_preprocessor(
                numeric_features,
                categorical_features,
            )

            fitted_pipeline = Pipeline(
                steps=[
                    (
                        "preprocessing",
                        preprocessing,
                    ),
                    (
                        "model",
                        best_model,
                    ),
                ]
            )

            fitted_pipeline.fit(
                X,
                y,
            )

            explainability = explain_fitted_model(
                fitted_pipeline
            )
            
        # -------------------------------------------------
        # Prediction error analysis
        # -------------------------------------------------

        error_analysis = None

        if result["best_model"] is not None:
            best_model_name = result["best_model"]["model"]

            error_analysis = analyze_regression_errors(
                X=X,
                y=y,
                numeric_features=numeric_features,
                categorical_features=categorical_features,
                model_name=best_model_name,
                folds=folds,
                top_n=10,
            )
         # -------------------------------------------------
        # Model selection reasoning
        # -------------------------------------------------

        model_reasoning = explain_model_selection(
            leaderboard=result["leaderboard"],
            best_model=result["best_model"],
            explainability=explainability,
            error_analysis=error_analysis,
        )

               # -------------------------------------------------
        # Persist experiment
        # -------------------------------------------------

        experiment = create_experiment(
            dataset_filename=filename,
            target_column=target_column,
            problem_type=problem_type,
            folds=folds,
            leaderboard=result["leaderboard"],
            best_model=result["best_model"],
            explainability=explainability,
            error_analysis=error_analysis,
            model_reasoning=model_reasoning,
        )

        # -------------------------------------------------
        # Persist fitted winning model
        # -------------------------------------------------

        stored_model_path = None

        if result["best_model"] is not None:
            stored_model_path = save_model(
                experiment_id=experiment["experiment_id"],
                model=fitted_pipeline,
            )

            experiment["model_path"] = stored_model_path

        return {
            "experiment": experiment,
            "target_detection": target_detection,
            "removed_columns": id_columns,
        }    

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"AutoML experiment failed: {str(exc)}"
            ),
        )
     # ---------------------------------------------------------
# Experiment history
# ---------------------------------------------------------

@app.get("/api/experiments")
def list_experiments():
    """
    Return all stored AutoML experiments.
    """

    experiments = get_experiments()

    return {
        "count": int(len(experiments)),
        "experiments": experiments,
    }


# ---------------------------------------------------------
# Single experiment
# ---------------------------------------------------------

@app.get("/api/experiments/{experiment_id}")
def read_experiment(
    experiment_id: str,
):
    """
    Return a single experiment by ID.
    """

    experiment = get_experiment(
        experiment_id
    )

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    return {
        "experiment": experiment,
    }


@app.post("/api/predict")
def predict(
    experiment_id: str,
    features: dict,
):
    """
    Generate a prediction using a saved experiment model.
    """

    if not experiment_id:
        raise HTTPException(
            status_code=400,
            detail="experiment_id is required.",
        )

    if not features:
        raise HTTPException(
            status_code=400,
            detail="features are required.",
        )

    try:
        # -------------------------------------------------
        # Load experiment metadata
        # -------------------------------------------------

        experiment = get_experiment(
            experiment_id
        )

        if experiment is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Experiment "
                    f"{experiment_id} not found."
                ),
            )

        # -------------------------------------------------
        # Load saved model
        # -------------------------------------------------

        model = load_model(
            experiment_id
        )

        # -------------------------------------------------
        # Determine expected features
        # -------------------------------------------------

        expected_features = [
            item["feature"]
            for item in (
                experiment.get(
                    "explainability",
                    {}
                ).get(
                    "features",
                    []
                )
            )
            if item.get("feature")
        ]

        if not expected_features:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No expected feature information "
                    "is available for this experiment."
                ),
            )

        # -------------------------------------------------
        # Validate missing features
        # -------------------------------------------------

        missing_features = [
            feature
            for feature in expected_features
            if feature not in features
        ]

        if missing_features:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing required features.",
                    "missing_features": missing_features,
                },
            )

        # -------------------------------------------------
        # Validate unexpected features
        # -------------------------------------------------

        unexpected_features = [
            feature
            for feature in features
            if feature not in expected_features
        ]

        if unexpected_features:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Unexpected features provided.",
                    "unexpected_features": unexpected_features,
                },
            )

        # -------------------------------------------------
        # Validate numeric values
        # -------------------------------------------------

        invalid_features = []

        for feature in expected_features:
            value = features[feature]

            try:
                numeric_value = float(value)

                if not pd.notna(
                    numeric_value
                ):
                    invalid_features.append(
                        feature
                    )

            except (
                TypeError,
                ValueError,
            ):
                invalid_features.append(
                    feature
                )

        if invalid_features:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Feature values must be numeric.",
                    "invalid_features": invalid_features,
                },
            )

        # -------------------------------------------------
        # Build model input
        # -------------------------------------------------

        validated_features = {
            feature: float(
                features[feature]
            )
            for feature in expected_features
        }

        input_data = pd.DataFrame(
            [validated_features],
            columns=expected_features,
        )

        # -------------------------------------------------
        # Generate prediction
        # -------------------------------------------------

        prediction = model.predict(
            input_data
        )

        prediction_value = float(
            prediction[0]
        )

        # -------------------------------------------------
        # Identify model
        # -------------------------------------------------

        model_name = type(
            model.named_steps["model"]
        ).__name__

        # -------------------------------------------------
        # Persist prediction
        # -------------------------------------------------

        prediction_record = create_prediction(
            experiment_id=experiment_id,
            model=model_name,
            features=validated_features,
            prediction=prediction_value,
        )

        # -------------------------------------------------
        # Return prediction
        # -------------------------------------------------

        return {
            "experiment_id": experiment_id,
            "model": model_name,
            "prediction": prediction_value,
            "prediction_id": prediction_record[
                "prediction_id"
            ],
            "created_at": prediction_record[
                "created_at"
            ],
        }

    except HTTPException:
        raise

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No saved model found for "
                f"{experiment_id}."
            ),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
@app.get("/api/predictions")
def read_predictions():
    """
    Return all prediction history.
    """

    predictions = get_predictions()

    return {
        "predictions": predictions,
        "count": len(predictions),
    }


@app.get("/api/predictions/{experiment_id}")
def read_predictions_for_experiment(
    experiment_id: str,
):
    """
    Return prediction history for one experiment.
    """

    if not experiment_id:
        raise HTTPException(
            status_code=400,
            detail="experiment_id is required.",
        )

    predictions = get_predictions_for_experiment(
        experiment_id
    )

    return {
        "experiment_id": experiment_id,
        "predictions": predictions,
        "count": len(predictions),
    }