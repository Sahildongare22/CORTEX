import pandas as pd

from app.preprocessor import prepare_dataset
from app.target_detector import detect_targets


df = pd.read_csv(
    r"..\data\test_dataset.csv"
)

target_detection = detect_targets(df)

recommended = target_detection["recommended_target"]

if not recommended:
    raise RuntimeError(
        "No target column was detected."
    )

target_column = recommended["column"]
problem_type = recommended["problem_type"]

id_columns = [
    column
    for column in df.columns
    if column == "Name"
]

prepared = prepare_dataset(
    df=df,
    target_column=target_column,
    problem_type=problem_type,
    id_columns=id_columns,
)

print("\nMODEL PREPARATION")
print("-----------------")

print(
    "Target:",
    prepared.target_column
)

print(
    "Problem type:",
    prepared.problem_type
)

print(
    "Numeric features:",
    prepared.numeric_features
)

print(
    "Categorical features:",
    prepared.categorical_features
)

print(
    "Removed columns:",
    prepared.removed_columns
)

print(
    "Training rows:",
    prepared.train_rows
)

print(
    "Test rows:",
    prepared.test_rows
)

print(
    "Processed X_train shape:",
    prepared.X_train.shape
)

print(
    "Processed X_test shape:",
    prepared.X_test.shape
)