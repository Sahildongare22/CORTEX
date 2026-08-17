from pathlib import Path

from sklearn.linear_model import LinearRegression

from app.model_store import (
    get_model_path,
    load_model,
    model_exists,
    save_model,
)


experiment_id = "EXP-0011"

model = LinearRegression()

path = save_model(
    experiment_id,
    model,
)

print("\nCORTEX MODEL STORE")
print("==================")

print(
    "Saved path:",
    path,
)

print(
    "Exists:",
    model_exists(
        experiment_id
    ),
)

loaded_model = load_model(
    experiment_id
)

print(
    "Loaded model:",
    type(loaded_model).__name__,
)

print(
    "Path object exists:",
    Path(path).exists(),
)