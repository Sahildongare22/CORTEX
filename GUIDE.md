# CORTEX — Installation & Run Guide

CORTEX is an autonomous machine learning research platform for dataset analysis, AutoML, model evaluation, explainability, experiment management, analytics, and production prediction.

---

### 1. Requirements

Install these before running CORTEX:

Python 3.x  
Node.js  
npm  
Git

---

### 2. Clone CORTEX

Open a terminal and run:

git clone https://github.com/Sahildongare22/CORTEX.git
cd CORTEX

---

### 3. Install CORTEX

Go into the backend folder:

cd backend

Create the Python virtual environment:

python -m venv venv

Activate it on Windows:

.\venv\Scripts\Activate.ps1

Install the backend dependencies:

pip install -r requirements.txt

Now open a second terminal and go to the frontend:

cd CORTEX\frontend

Install the frontend dependencies:

npm install

CORTEX is now installed.

---

### 4. Run CORTEX

You need two terminals.

In Terminal 1, start the backend:

cd CORTEX\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

Keep this terminal running.

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

In Terminal 2, start the frontend:

cd CORTEX\frontend
npm run dev

Open the application:

http://localhost:5173

---

### 5. Use CORTEX

After opening the application:

1. Upload a CSV dataset.
2. Analyze the dataset.
3. Review dataset intelligence and statistical profiling.
4. Review automatically detected targets and problem type.
5. Run an AutoML experiment.
6. CORTEX performs K-Fold cross-validation.
7. Multiple regression models are evaluated.
8. Review the model leaderboard.
9. Review the recommended model.
10. Review feature importance and explainability.
11. Review the correlation heatmap.
12. Review model performance charts.
13. Review actual-vs-predicted analysis.
14. Review residual and error analysis.
15. Open the Experiment Registry.
16. View experiment details.
17. Compare experiments.
18. Select an experiment for production prediction.
19. Enter feature values.
20. Generate a prediction.
21. Review Prediction History.

---

### 6. Run Tests

Open a terminal and go to the backend:

cd CORTEX\backend
.\venv\Scripts\Activate.ps1

Run the API smoke test:

python test_api_smoke.py

Run the experiment registry test:

python test_registry.py

Run the prediction API test:

python test_prediction_api.py

Additional tests are available for cross-validation, explainability, error analysis, model reasoning, model storage, preprocessing, and target detection.

---

### 7. Stop CORTEX

When finished, press:

Ctrl + C

in the backend terminal and the frontend terminal.

---

### 8. Run CORTEX Again Later

After CORTEX has already been installed, you do not need to repeat the installation.

Start the backend:

cd CORTEX\backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

Start the frontend in another terminal:

cd CORTEX\frontend
npm run dev

Then open:

http://localhost:5173

---

### 9. Current Scope

CORTEX currently focuses on regression workflows.

Classification cross-validation is not implemented in the current model engine.

---

### 10. GitHub Repository

https://github.com/Sahildongare22/CORTEX
