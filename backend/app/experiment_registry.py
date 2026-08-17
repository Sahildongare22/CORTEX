import json
from datetime import datetime, timezone
from pathlib import Path


REGISTRY_PATH = (
    Path(__file__).resolve().parent.parent
    / "experiments"
    / "registry.json"
)


def _ensure_registry():
    """Create the registry file if it does not exist."""

    REGISTRY_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not REGISTRY_PATH.exists():
        REGISTRY_PATH.write_text(
            "[]",
            encoding="utf-8",
        )


def _load_registry() -> list[dict]:
    """Load all experiment records."""

    _ensure_registry()

    try:
        data = json.loads(
            REGISTRY_PATH.read_text(
                encoding="utf-8"
            )
        )

        if not isinstance(data, list):
            return []

        return data

    except (json.JSONDecodeError, OSError):
        return []


def _save_registry(
    experiments: list[dict],
):
    """Persist experiment records."""

    _ensure_registry()

    REGISTRY_PATH.write_text(
        json.dumps(
            experiments,
            indent=2,
        ),
        encoding="utf-8",
    )


def _next_experiment_id(
    experiments: list[dict],
) -> str:
    """Generate the next sequential experiment ID."""

    number = len(experiments) + 1

    return f"EXP-{number:04d}"


def create_experiment(
    dataset_filename: str,
    target_column: str,
    problem_type: str,
    folds: int,
    leaderboard: list[dict],
    best_model: dict | None,
    explainability: dict | None = None,
    error_analysis: dict | None = None,
    model_reasoning: dict | None = None,
) -> dict:
    """Create and persist a new experiment."""

    experiments = _load_registry()

    experiment_id = _next_experiment_id(
        experiments
    )

    experiment = {
        "experiment_id": experiment_id,
        "dataset_filename": dataset_filename,
        "target_column": target_column,
        "problem_type": problem_type,
        "validation": {
            "method": "K-Fold Cross Validation",
            "folds": int(folds),
        },
        "models_tested": int(
            len(leaderboard)
        ),
        "leaderboard": leaderboard,
        "best_model": best_model,
        "explainability": explainability,
        "error_analysis": error_analysis,
        "model_reasoning": model_reasoning,
        "status": "completed",
        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    experiments.append(
        experiment
    )

    _save_registry(experiments)

    return experiment


def get_experiments() -> list[dict]:
    """Return all stored experiments."""

    return _load_registry()


def get_experiment(
    experiment_id: str,
) -> dict | None:
    """Return one experiment by ID."""

    experiments = _load_registry()

    for experiment in experiments:
        if (
            experiment.get("experiment_id")
            == experiment_id
        ):
            return experiment

    return None


def delete_experiment(
    experiment_id: str,
) -> bool:
    """Delete an experiment from the registry."""

    experiments = _load_registry()

    original_count = len(experiments)

    experiments = [
        experiment
        for experiment in experiments
        if experiment.get("experiment_id")
        != experiment_id
    ]

    if len(experiments) == original_count:
        return False

    _save_registry(experiments)

    return True