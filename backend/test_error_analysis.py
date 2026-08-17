import pandas as pd

from app.error_analysis import (
    analyze_regression_errors,
)


df = pd.read_csv(
    r"..\data\diabetes_benchmark.csv"
)

target_column = "target"

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

result = analyze_regression_errors(
    X=X,
    y=y,
    numeric_features=numeric_features,
    categorical_features=categorical_features,
    model_name="Linear Regression",
    folds=5,
    top_n=10,
)

print("\nCORTEX PREDICTION ERROR ANALYSIS")
print("================================")

print(
    "Model:",
    result["model"],
)

print(
    "Validation:",
    result["validation"],
)

print("\nMETRICS")
print("-------")

for metric, value in result["metrics"].items():
    print(
        f"{metric}: {value}"
    )

print("\nERROR SUMMARY")
print("-------------")

for key, value in result["error_summary"].items():
    print(
        f"{key}: {value}"
    )

print("\nLARGEST ERRORS")
print("--------------")

for index, item in enumerate(
    result["largest_errors"],
    start=1,
):
    print(
        f"{index}. "
        f"Actual={item['actual']} | "
        f"Predicted={item['predicted']} | "
        f"Error={item['error']} | "
        f"Absolute Error={item['absolute_error']}"
    )