import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

from app.model_engine import build_preprocessor
from app.explainability import explain_fitted_model


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
            LinearRegression(),
        ),
    ]
)

pipeline.fit(
    X,
    y,
)

result = explain_fitted_model(
    pipeline
)

print("\nCORTEX EXPLAINABILITY")
print("=====================")

print(
    "Method:",
    result["method"],
)

print(
    "Model:",
    result["model"],
)

print(
    "Feature count:",
    result["feature_count"],
)

print("\nFEATURE IMPORTANCE")
print("------------------")

for index, feature in enumerate(
    result["features"],
    start=1,
):
    print(
        f"{index}. {feature['feature']}"
    )

    print(
        f"   Importance: "
        f"{feature['importance_percentage']}%"
    )

    print(
        f"   Direction: "
        f"{feature['direction']}"
    )

    print(
        f"   Coefficient: "
        f"{feature.get('coefficient', 'N/A')}"
    )