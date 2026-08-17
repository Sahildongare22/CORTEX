import urllib.request
import json


BASE_URL = "http://127.0.0.1:8000"


def get_json(path):
    url = f"{BASE_URL}{path}"

    with urllib.request.urlopen(
        url,
        timeout=10,
    ) as response:
        return (
            response.status,
            json.loads(
                response.read().decode()
            ),
        )


def print_result(
    name,
    status,
    data,
):
    print(f"\n{name}")
    print("-" * len(name))
    print("Status:", status)
    print("Response:", data)


print("\nCORTEX API SMOKE TEST")
print("=====================")


# -------------------------------------------------
# Root endpoint
# -------------------------------------------------

status, data = get_json("/")

print_result(
    "ROOT",
    status,
    data,
)

assert status == 200
assert data.get("status") == "online"
assert data.get("project") == "CORTEX"


# -------------------------------------------------
# Health endpoint
# -------------------------------------------------

status, data = get_json(
    "/health"
)

print_result(
    "HEALTH",
    status,
    data,
)

assert status == 200
assert data.get("status") == "healthy"


# -------------------------------------------------
# Experiment history
# -------------------------------------------------

status, data = get_json(
    "/api/experiments"
)

print_result(
    "EXPERIMENTS",
    status,
    data,
)

assert status == 200
assert isinstance(
    data.get("experiments"),
    list,
)
assert data.get("count") == len(
    data.get("experiments")
)


# -------------------------------------------------
# Prediction history
# -------------------------------------------------

status, data = get_json(
    "/api/predictions"
)

print_result(
    "PREDICTIONS",
    status,
    data,
)

assert status == 200
assert isinstance(
    data.get("predictions"),
    list,
)
assert data.get("count") == len(
    data.get("predictions")
)


print("\nALL SMOKE TESTS PASSED")
print("======================")