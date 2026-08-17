import json
import uuid
from datetime import datetime, timezone
from pathlib import Path


PREDICTION_HISTORY_FILE = (
    Path(__file__).resolve().parent.parent
    / "prediction_history.json"
)


def _load_predictions():
    if not PREDICTION_HISTORY_FILE.exists():
        return []

    try:
        with open(
            PREDICTION_HISTORY_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except (json.JSONDecodeError, OSError):
        return []


def _save_predictions(predictions):
    with open(
        PREDICTION_HISTORY_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            predictions,
            file,
            indent=2,
        )


def create_prediction(
    experiment_id,
    model,
    features,
    prediction,
):
    predictions = _load_predictions()

    prediction_record = {
        "prediction_id": (
            f"PRED-{uuid.uuid4().hex[:8].upper()}"
        ),
        "experiment_id": experiment_id,
        "model": model,
        "features": features,
        "prediction": prediction,
        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    predictions.append(prediction_record)

    _save_predictions(predictions)

    return prediction_record


def get_predictions():
    return _load_predictions()


def get_predictions_for_experiment(
    experiment_id,
):
    predictions = _load_predictions()

    return [
        prediction
        for prediction in predictions
        if prediction.get("experiment_id")
        == experiment_id
    ]