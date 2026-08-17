from dataclasses import dataclass

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


@dataclass
class PreparedDataset:
    X_train: object
    X_test: object
    y_train: pd.Series
    y_test: pd.Series
    numeric_features: list[str]
    categorical_features: list[str]
    removed_columns: list[str]
    target_column: str
    problem_type: str
    train_rows: int
    test_rows: int


def prepare_dataset(
    df: pd.DataFrame,
    target_column: str,
    problem_type: str,
    id_columns: list[str] | None = None,
    test_size: float = 0.20,
    random_state: int = 42,
) -> PreparedDataset:
    """
    Prepare a dataframe for ML training.

    Steps:
    1. Validate target
    2. Remove ID-like columns
    3. Separate X and y
    4. Detect numeric/categorical features
    5. Impute missing values
    6. Scale numeric values
    7. One-hot encode categorical values
    8. Split into train/test sets
    """

    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' was not found."
        )

    if len(df) < 2:
        raise ValueError(
            "The dataset must contain at least 2 rows."
        )

    if not 0 < test_size < 1:
        raise ValueError(
            "test_size must be between 0 and 1."
        )

    # ---------------------------------------------------------
    # Remove invalid / empty target rows
    # ---------------------------------------------------------

    working_df = df.copy()

    before_rows = len(working_df)

    working_df = working_df.dropna(
        subset=[target_column]
    )

    if len(working_df) == 0:
        raise ValueError(
            "No rows remain after removing missing target values."
        )

    # ---------------------------------------------------------
    # Remove ID-like columns
    # ---------------------------------------------------------

    requested_id_columns = id_columns or []

    removed_columns = []

    for column in requested_id_columns:
        if (
            column in working_df.columns
            and column != target_column
        ):
            working_df = working_df.drop(
                columns=[column]
            )
            removed_columns.append(column)

    # ---------------------------------------------------------
    # Separate target and features
    # ---------------------------------------------------------

    X = working_df.drop(
        columns=[target_column]
    )

    y = working_df[target_column].copy()

    if X.shape[1] == 0:
        raise ValueError(
            "No feature columns remain after preprocessing."
        )

    # ---------------------------------------------------------
    # Detect feature types
    # ---------------------------------------------------------

    numeric_features = [
        str(column)
        for column in X.select_dtypes(
            include="number"
        ).columns.tolist()
    ]

    categorical_features = [
        str(column)
        for column in X.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()
    ]

    # ---------------------------------------------------------
    # Numeric pipeline
    # ---------------------------------------------------------

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                ),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    # ---------------------------------------------------------
    # Categorical pipeline
    # ---------------------------------------------------------

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                ),
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    # ---------------------------------------------------------
    # Combined preprocessing
    # ---------------------------------------------------------

    transformers = []

    if numeric_features:
        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_features,
            )
        )

    if categorical_features:
        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            )
        )

    if not transformers:
        raise ValueError(
            "No numeric or categorical features were detected."
        )

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    # ---------------------------------------------------------
    # Train/test split
    # ---------------------------------------------------------

    stratify = None

    # Stratification is useful for classification when
    # every class has enough observations.
    if problem_type == "Classification":
        class_counts = y.value_counts()

        if (
            len(class_counts) > 1
            and int(class_counts.min()) >= 2
        ):
            stratify = y

    try:
        X_train, X_test, y_train, y_test = (
            train_test_split(
                X,
                y,
                test_size=test_size,
                random_state=random_state,
                stratify=stratify,
            )
        )
    except ValueError:
        # Fall back to a normal split if the dataset is too
        # small for stratification.
        X_train, X_test, y_train, y_test = (
            train_test_split(
                X,
                y,
                test_size=test_size,
                random_state=random_state,
            )
        )

    # ---------------------------------------------------------
    # Fit preprocessing only on training data
    # ---------------------------------------------------------

    X_train_processed = preprocessor.fit_transform(
        X_train
    )

    X_test_processed = preprocessor.transform(
        X_test
    )

    # ---------------------------------------------------------
    # Basic validation
    # ---------------------------------------------------------

    if len(X_train_processed) == 0:
        raise ValueError(
            "Training data is empty after preprocessing."
        )

    if len(X_test_processed) == 0:
        raise ValueError(
            "Test data is empty after preprocessing."
        )

    return PreparedDataset(
        X_train=X_train_processed,
        X_test=X_test_processed,
        y_train=y_train,
        y_test=y_test,
        numeric_features=numeric_features,
        categorical_features=categorical_features,
        removed_columns=removed_columns,
        target_column=target_column,
        problem_type=problem_type,
        train_rows=int(len(X_train)),
        test_rows=int(len(X_test)),
    )