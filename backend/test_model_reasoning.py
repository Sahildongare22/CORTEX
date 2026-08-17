from app.model_reasoning import (
    explain_model_selection,
)


leaderboard = [
    {
        "model": "Linear Regression",
        "mean_r2": 0.4785,
        "mean_mae": 44.2697,
        "mean_rmse": 54.8489,
    },
    {
        "model": "Extra Trees",
        "mean_r2": 0.4459,
        "mean_mae": 45.9231,
        "mean_rmse": 56.6672,
    },
]

best_model = leaderboard[0]

explainability = {
    "features": [
        {
            "feature": "s1",
            "importance_percentage": 22.9,
        },
        {
            "feature": "s5",
            "importance_percentage": 21.71,
        },
        {
            "feature": "bmi",
            "importance_percentage": 15.02,
        },
    ]
}

error_analysis = {
    "metrics": {
        "mae": 44.2603,
        "rmse": 54.9029,
    },
    "largest_errors": [
        {
            "absolute_error": 154.4934,
        }
    ],
}

result = explain_model_selection(
    leaderboard=leaderboard,
    best_model=best_model,
    explainability=explainability,
    error_analysis=error_analysis,
)

print("\nCORTEX MODEL REASONING")
print("======================")

print("\nSUMMARY")
print("-------")
print(result["summary"])

print("\nREASONING")
print("---------")

for index, point in enumerate(
    result["points"],
    start=1,
):
    print(f"{index}. {point}")
    