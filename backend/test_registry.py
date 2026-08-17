from app.experiment_registry import (
    create_experiment,
    delete_experiment,
    get_experiment,
    get_experiments,
)


def build_test_leaderboard():
    return [
        {
            "model": "Linear Regression",
            "mean_r2": 0.4785,
            "std_r2": 0.0850,
            "mean_mae": 44.2697,
            "mean_rmse": 54.8489,
            "folds": 5,
        },
        {
            "model": "Extra Trees",
            "mean_r2": 0.4459,
            "std_r2": 0.0780,
            "mean_mae": 45.9231,
            "mean_rmse": 56.6672,
            "folds": 5,
        },
    ]


print("\nCORTEX EXPERIMENT REGISTRY TEST")
print("===============================")

leaderboard = build_test_leaderboard()

# -------------------------------------------------
# Create experiment
# -------------------------------------------------

experiment = create_experiment(
    dataset_filename="registry_test.csv",
    target_column="target",
    problem_type="Regression",
    folds=5,
    leaderboard=leaderboard,
    best_model=leaderboard[0],
)

experiment_id = experiment[
    "experiment_id"
]

print("\nCREATED")
print("-------")
print("Experiment ID:", experiment_id)
print("Status:", experiment.get("status"))

assert experiment_id.startswith(
    "EXP-"
)
assert experiment.get("status") == "completed"

# -------------------------------------------------
# Retrieve experiment
# -------------------------------------------------

found = get_experiment(
    experiment_id
)

print("\nLOOKUP")
print("------")
print(found)

assert found is not None
assert found["experiment_id"] == experiment_id
assert found["dataset_filename"] == (
    "registry_test.csv"
)
assert found["best_model"]["model"] == (
    "Linear Regression"
)

# -------------------------------------------------
# List experiments
# -------------------------------------------------

experiments = get_experiments()

print("\nLIST")
print("----")
print("Total experiments:", len(experiments))

assert any(
    item.get("experiment_id")
    == experiment_id
    for item in experiments
)

# -------------------------------------------------
# Delete experiment
# -------------------------------------------------

deleted = delete_experiment(
    experiment_id
)

print("\nDELETE")
print("------")
print("Deleted:", deleted)

assert deleted is True

# -------------------------------------------------
# Verify deletion
# -------------------------------------------------

deleted_lookup = get_experiment(
    experiment_id
)

print("\nVERIFY DELETE")
print("-------------")
print(
    "Lookup after delete:",
    deleted_lookup,
)

assert deleted_lookup is None

print("\nALL REGISTRY TESTS PASSED")
print("=========================")