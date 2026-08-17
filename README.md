# CORTEX

CORTEX is an autonomous machine learning research platform that turns CSV datasets into structured machine-learning insights, model evaluations, explainability results, experiments, and production predictions.

## Core Capabilities

- Dataset intelligence and structural analysis
- Dataset health scoring and quality warnings
- Automatic target detection
- Statistical profiling
- Correlation analysis and heatmap visualization
- K-Fold cross-validation
- Multiple regression models
- Model evaluation and leaderboard
- Feature importance and explainability
- Prediction error analysis
- Actual vs predicted analysis
- Residual analysis
- Experiment registry
- Experiment search and filtering
- Experiment comparison
- Saved model serving
- Production prediction API
- Prediction history
- Backend smoke and integration tests

## ML Pipeline

CSV Dataset
    ?
Dataset Intelligence
    ?
Statistical Profiling
    ?
Target Detection
    ?
Feature Preparation
    ?
K-Fold Cross Validation
    ?
Multiple ML Models
    ?
Evaluation Metrics
    ?
Best Model Selection
    ?
Explainability
    ?
Error Analysis
    ?
Experiment Registry
    ?
Saved Model
    ?
Production Prediction

## Models

- Linear Regression
- Extra Trees
- Random Forest
- Gradient Boosting

## Visual Analytics

- Correlation Heatmap
- Feature Importance
- Model Performance Charts
- Actual vs Predicted Scatter Plot
- Residual / Error Distribution
- Largest Prediction Error Analysis

## Project Structure

cortex/
+-- backend/
+-- frontend/
+-- data/
+-- docs/
+-- experiments/
+-- ml_engine/
+-- README.md
+-- .gitignore

## Run Backend

cd "C:\Users\hp\OneDrive\Desktop\my projects\cortex\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

Backend:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

## Run Frontend

cd "C:\Users\hp\OneDrive\Desktop\my projects\cortex\frontend"
npm run dev

Frontend:
http://localhost:5173

## Testing

python test_api_smoke.py
python test_registry.py
python test_prediction_api.py

Additional backend tests cover cross-validation, explainability, error analysis, model reasoning, and model storage.

## Production Prediction

CORTEX can load a saved experiment model, validate prediction features, generate a prediction, and persist the prediction in experiment-specific history.

## Current Scope

CORTEX currently focuses on regression workflows. Classification cross-validation is not implemented in the current model engine.

## Status

CORTEX provides an end-to-end workflow from dataset analysis and AutoML evaluation through experiment management, explainability, analytics, model serving, production prediction, and reliability testing.
