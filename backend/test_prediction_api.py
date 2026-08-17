import json
import urllib.request


BASE_URL = "http://127.0.0.1:8000"
EXPERIMENT_ID = "EXP-0019"


features = {
    "s1": -0.04,
    "s5": 0.02,
    "bmi": 0.06,
    "s2": -0.04,
    "bp": 0.02,
    "sex": 0.05,
    "s4": -0.01,
    "s3": -0.04,
    "s6": -0.02,
    "age": 0.05,
}


print("\nCORTEX PREDICTION API TEST")
print("==========================")


# -------------------------------------------------
# Build request
# -------------------------------------------------

payload = json.dumps(
    features
).encode("utf-8")

request = urllib.request.Request(
    f"{BASE_URL}/api/predict"
    f"?experiment_id={EXPERIMENT_ID}",
    data=payload,
    headers={
        "Content-Type": "application/json",
    },
    method="POST",
)


# -------------------------------------------------
# Call prediction API
# -------------------------------------------------

with urllib.request.urlopen(
    request,
    timeout=15,
) as response:

    status = response.status

    data = json.loads(
        response.read().decode("utf-8")
    )


print("\nRESPONSE")
print("--------")
print("Status:", status)
print("Experiment:", data.get("experiment_id"))
print("Model:", data.get("model"))
print("Prediction:", data.get("prediction"))
print("Prediction ID:", data.get("prediction_id"))
print("Created At:", data.get("created_at"))


# -------------------------------------------------
# Assertions
# -------------------------------------------------

assert status == 200

assert (
    data.get("experiment_id")
    == EXPERIMENT_ID
)

assert data.get("model") == (
    "LinearRegression"
)

assert isinstance(
    data.get("prediction"),
    (int, float),
)

assert data.get("prediction_id")

assert data.get("created_at")


print("\nALL PREDICTION API TESTS PASSED")
print("================================")