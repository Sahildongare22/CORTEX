import pandas as pd

from app.target_detector import detect_targets


df = pd.read_csv(
    "data/test_dataset.csv"
)

result = detect_targets(df)

print("\nRECOMMENDED TARGET")
print(result["recommended_target"])

print("\nALL CANDIDATES")

for candidate in result["candidates"]:
    print(candidate)