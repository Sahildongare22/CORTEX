from __future__ import annotations


def explain_model_selection(
    leaderboard: list[dict],
    best_model: dict | None,
    explainability: dict | None = None,
    error_analysis: dict | None = None,
) -> dict:
    """
    Generate a human-readable explanation for why the
    recommended model was selected.
    """

    if not best_model:
        return {
            "summary": (
                "CORTEX could not determine a recommended model."
            ),
            "points": [],
        }

    best_name = best_model.get(
        "model",
        "Unknown model",
    )

    best_r2 = best_model.get(
        "mean_r2"
    )

    points = []

    # -------------------------------------------------
    # 1. Why the model won
    # -------------------------------------------------

    summary = (
        f"{best_name} was selected as the recommended model "
        "because it achieved the highest mean R² across "
        "the evaluated models."
    )

    if isinstance(best_r2, (int, float)):
        summary = (
            f"{best_name} was selected as the recommended model "
            f"because it achieved the highest mean R² of "
            f"{best_r2:.4f} across the validation folds."
        )

    # -------------------------------------------------
    # 2. Compare against the runner-up
    # -------------------------------------------------

    if len(leaderboard) >= 2:
        runner_up = leaderboard[1]

        runner_name = runner_up.get(
            "model",
            "Unknown model",
        )

        runner_r2 = runner_up.get(
            "mean_r2"
        )

        if (
            isinstance(best_r2, (int, float))
            and isinstance(runner_r2, (int, float))
        ):
            difference = best_r2 - runner_r2

            points.append(
                f"It outperformed {runner_name} by "
                f"{difference:.4f} mean R² points."
            )

    # -------------------------------------------------
    # 3. Strongest features
    # -------------------------------------------------

    if explainability:
        features = explainability.get(
            "features",
            [],
        )

        top_features = features[:3]

        if top_features:
            feature_text = ", ".join(
                f"{item.get('feature', 'unknown')} "
                f"({item.get('importance_percentage', 0):.2f}%)"
                for item in top_features
            )

            points.append(
                f"The strongest feature influences were "
                f"{feature_text}."
            )

    # -------------------------------------------------
    # 4. Error behavior
    # -------------------------------------------------

    if error_analysis:
        metrics = error_analysis.get(
            "metrics",
            {},
        )

        largest_errors = error_analysis.get(
            "largest_errors",
            [],
        )

        mae = metrics.get("mae")
        rmse = metrics.get("rmse")

        if (
            isinstance(mae, (int, float))
            and isinstance(rmse, (int, float))
        ):
            points.append(
                f"The model achieved a mean absolute error "
                f"of {mae:.2f} and an RMSE of {rmse:.2f}."
            )

        if largest_errors:
            largest = largest_errors[0].get(
                "absolute_error"
            )

            if isinstance(
                largest,
                (int, float),
            ):
                points.append(
                    f"Its largest observed absolute error "
                    f"was approximately {largest:.2f}."
                )

    return {
        "summary": summary,
        "points": points,
    }