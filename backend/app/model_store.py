from __future__ import annotations

from pathlib import Path

import joblib


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "stored_models"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


def get_model_path(experiment_id: str) -> Path:
    """
    Return the storage path for an experiment's model.
    """

    if not experiment_id:
        raise ValueError(
            "experiment_id is required."
        )

    safe_id = "".join(
        character
        for character in experiment_id
        if character.isalnum() or character in "-_"
    )

    if not safe_id:
        raise ValueError(
            "Invalid experiment_id."
        )

    return MODEL_DIR / f"{safe_id}.joblib"


def save_model(
    experiment_id: str,
    model,
) -> str:
    """
    Persist a fitted sklearn model/pipeline.
    """

    model_path = get_model_path(
        experiment_id
    )

    joblib.dump(
        model,
        model_path,
    )

    return str(model_path)


def load_model(
    experiment_id: str,
):
    """
    Load a previously stored model.
    """

    model_path = get_model_path(
        experiment_id
    )

    if not model_path.exists():
        raise FileNotFoundError(
            f"No stored model found for "
            f"{experiment_id}."
        )

    return joblib.load(
        model_path
    )


def model_exists(
    experiment_id: str,
) -> bool:
    """
    Check whether a stored model exists.
    """

    return get_model_path(
        experiment_id
    ).exists()