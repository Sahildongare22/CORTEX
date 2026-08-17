import pandas as pd

from app.model_engine import run_cross_validated_experiment
from app.target_detector import detect_targets


df = pd.read_csv(
    r"..\data\diabetes_benchmark.csv"
)

target_detection = detect_targets(df)

recommended = target_detection["recommended_target"]

if not recommended:
    raise RuntimeError("No target was detected.")

target_column = recommended["column"]
problem_type = recommended["problem_type"]

X = df.drop(
    columns=[target_column]
)

y = df[target_column]

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

result = run_cross_validated_experiment(
    X=X,
    y=y,
    numeric_features=numeric_features,
    categorical_features=categorical_features,
    problem_type=problem_type,
    target_column=target_column,
    folds=5,
)

print("\nCORTEX CROSS-VALIDATION")
print("=======================")

print("Target:", result["target"])
print("Problem:", result["problem_type"])
print("Folds:", result["folds"])

print("\nMODEL LEADERBOARD")
print("-----------------")

for index, model in enumerate(
    result["leaderboard"],
    start=1,
):
    print(f"{index}. {model['model']}")
    print(f"   Mean R²:   {model['mean_r2']}")
    print(f"   Std R²:    {model['std_r2']}")
    print(f"   Mean MAE:  {model['mean_mae']}")
    print(f"   Mean RMSE: {model['mean_rmse']}")

print("\nBEST MODEL")
print("----------")
print(result["best_model"])