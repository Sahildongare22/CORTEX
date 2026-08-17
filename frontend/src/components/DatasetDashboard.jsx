import {
  Upload,
  Database,
  Columns3,
  AlertTriangle,
  Copy,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Target,
  ShieldCheck,
  Brain,
  Info,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Table2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

function DatasetDashboard() {

const [file, setFile] = useState(null);
const [analysis, setAnalysis] = useState(null);

const [preview, setPreview] = useState(null);
const [previewLoading, setPreviewLoading] = useState(false);

const [searchTerm, setSearchTerm] = useState("");


const [pageSize] = useState(10);

const [analysisLoading, setAnalysisLoading] = useState(false);
const [error, setError] = useState("");

const [experiment, setExperiment] = useState(null);
const [experimentLoading, setExperimentLoading] = useState(false);
const [experimentError, setExperimentError] = useState("");

const [experimentHistory, setExperimentHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyError, setHistoryError] = useState("");

const [selectedExperiment, setSelectedExperiment] = useState(null);
const [selectedExperimentLoading, setSelectedExperimentLoading] = useState(false);
const [selectedExperimentError, setSelectedExperimentError] = useState("");
const [compareIds, setCompareIds] = useState([]);
const [
  predictionRefreshKey,
  setPredictionRefreshKey,
] = useState(0);

const loadPreview = async (filename, selectedPage = 1) => {
  if (!filename) return;

  setPreviewLoading(true);
  setError("");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/dataset/preview?filename=${encodeURIComponent(
        filename
      )}&page=${selectedPage}&page_size=${pageSize}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Dataset preview failed."
      );
    }

    setPreview(data);
    
  } catch (err) {
    setError(
      err.message || "Failed to load dataset preview."
    );
  } finally {
    setPreviewLoading(false);
  }
};
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      setFile(null);
      return;
    }

  setFile(selectedFile);
setError("");
setAnalysis(null);
setPreview(null);
setSearchTerm("");
setExperiment(null);
setExperimentError("");

  };

  const analyzeDataset = async () => {
  if (!file) {
    setError(
      "Please choose a CSV file first."
    );
    return;
  }

  setAnalysisLoading(true);
  setError("");
  setAnalysis(null);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/dataset/analyze",
      {
        method: "POST",
        body: formData,
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let message =
        "Dataset analysis failed.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (
        data?.detail?.message
      ) {
        message = data.detail.message;
      } else if (
        Array.isArray(data?.detail)
      ) {
        message = data.detail
          .map(
            (item) =>
              item?.msg || "Validation error."
          )
          .join("; ");
      }

      throw new Error(message);
    }

    if (!data?.filename || !data?.analysis) {
      throw new Error(
        "The dataset analysis response was incomplete."
      );
    }

    setAnalysis(data);

    await loadPreview(
      data.filename,
      1
    );
  } catch (err) {
    setError(
      err.message ||
        "Unable to analyze the dataset. Please try again."
    );
  } finally {
    setAnalysisLoading(false);
  }
};

  const runExperiment = async () => {
  if (!analysis?.filename) {
    setExperimentError(
      "Analyze a dataset before running an experiment."
    );
    return;
  }

  setExperimentLoading(true);
  setExperimentError("");
  setExperiment(null);

  try {
    const params = new URLSearchParams({
      filename: analysis.filename,
      folds: "5",
    });

    const response = await fetch(
      `http://127.0.0.1:8000/api/experiment/run?${params.toString()}`,
      {
        method: "POST",
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let message =
        "AutoML experiment failed.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (
        data?.detail?.message
      ) {
        message = data.detail.message;
      } else if (
        Array.isArray(data?.detail)
      ) {
        message = data.detail
          .map(
            (item) =>
              item?.msg ||
              "Validation error."
          )
          .join("; ");
      }

      throw new Error(message);
    }

    if (!data?.experiment) {
      throw new Error(
        "The AutoML response was incomplete."
      );
    }

    setExperiment(
      data.experiment
    );

    await loadExperimentHistory();
  } catch (err) {
    setExperimentError(
      err.message ||
        "Unable to run the AutoML experiment. Please try again."
    );
  } finally {
    setExperimentLoading(false);
  }
};
  const loadExperimentHistory = useCallback(async () => {
  setHistoryLoading(true);
  setHistoryError("");

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/experiments"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to load experiment history."
      );
    }

    setExperimentHistory(
      Array.isArray(data.experiments)
        ? data.experiments
        : []
    );
  } catch (err) {
    setHistoryError(
      err.message || "Failed to load experiment history."
    );
  } finally {
    setHistoryLoading(false);
  }
}, []);

const loadExperimentDetail = async (experimentId) => {
  if (!experimentId) return;

  setSelectedExperimentLoading(true);
  setSelectedExperimentError("");

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/experiments/${encodeURIComponent(
        experimentId
      )}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Failed to load experiment details."
      );
    }

    setSelectedExperiment(data.experiment);
  } catch (err) {
    setSelectedExperimentError(
      err.message ||
        "Failed to load experiment details."
    );
  } finally {
    setSelectedExperimentLoading(false);
  }
};

useEffect(() => {
  loadExperimentHistory();
}, [loadExperimentHistory]);


  const datasetAnalysis = analysis?.analysis;

  return (
    <div className="min-h-screen bg-[#08090c] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#0b0d11]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                CORTEX
              </h1>

              <p className="text-xs text-gray-500">
                Autonomous ML Research Platform
              </p>
            </div>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
            System Online
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* HERO */}
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Dataset Intelligence
          </p>

          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Turn raw data into
            <span className="text-gray-400">
              {" "}machine intelligence.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-gray-400">
            Upload a dataset and let CORTEX automatically profile its
            structure, quality, and machine-learning readiness.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <FileSpreadsheet size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-medium">
                    Analyze a dataset
                  </h3>

                  <p className="text-sm text-gray-500">
                    CSV files supported
                  </p>
                </div>
              </div>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10">
                <Upload size={18} />
                Choose CSV
              </div>
            </label>
          </div>

          {file && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Database className="text-gray-400" size={20} />

                <div>
                  <p className="text-sm font-medium">{file.name}</p>

                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
               <button
    onClick={analyzeDataset}
    disabled={analysisLoading}
    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {analysisLoading
      ? "Analyzing..."
      : "Analyze Dataset"}
  </button>

              {analysis && (
  <button
    onClick={runExperiment}
    disabled={experimentLoading}
    className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-6 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {experimentLoading
      ? "Running AutoML..."
      : "Run AutoML Experiment"}
  </button>
)}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        {/* RESULTS */}
        {analysis && datasetAnalysis && (
          <section className="space-y-8">
{experimentError && (
  <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
    {experimentError}
  </div>
)}

{experiment && (
  <ExperimentLeaderboard experiment={experiment} />
)}
<AnalyticsSummary
  experiment={
    selectedExperiment || experiment
  }
/>
<ExperimentHistory
  experiments={experimentHistory}
  loading={historyLoading}
  error={historyError}
  onSelectExperiment={loadExperimentDetail}
  compareIds={compareIds}
  setCompareIds={setCompareIds}
/>
<ExperimentComparison
  experiments={experimentHistory}
  compareIds={compareIds}
/>
<ExperimentDetail
  experiment={selectedExperiment}
  loading={selectedExperimentLoading}
  error={selectedExperimentError}
/>
<ExplainabilityCard
  experiment={
    selectedExperiment || experiment
  }
/>
<PredictionErrorCard
  experiment={
    selectedExperiment || experiment
  }
/>
<ModelReasoningCard
  experiment={
    selectedExperiment || experiment
  }
/>

<PredictionCard
  experiment={
    selectedExperiment || experiment
  }
  onPredictionCreated={() => {
    setPredictionRefreshKey(
      (value) => value + 1
    );
  }}
/>

<PredictionHistoryCard
  experiment={
    selectedExperiment || experiment
  }
  refreshKey={predictionRefreshKey}
/>

{/* ANALYSIS HEADER */}

{/* ANALYSIS HEADER */}
            {/* ANALYSIS HEADER */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Analysis complete
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  {analysis.filename}
                </h3>
              </div>

              <div className="hidden items-center gap-2 text-sm text-emerald-300 md:flex">
                <CheckCircle2 size={18} />
                Dataset analyzed
              </div>
            </div>

            {/* BASIC METRICS */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={<Database size={20} />}
                label="Rows"
                value={datasetAnalysis.rows}
              />

              <MetricCard
                icon={<Columns3 size={20} />}
                label="Columns"
                value={datasetAnalysis.columns}
              />

              <MetricCard
                icon={<AlertTriangle size={20} />}
                label="Missing Values"
                value={datasetAnalysis.missing_values}
              />

              <MetricCard
                icon={<Copy size={20} />}
                label="Duplicate Rows"
                value={datasetAnalysis.duplicate_rows}
              />
            </div>

            {/* INTELLIGENCE OVERVIEW */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* HEALTH SCORE */}
              <HealthCard
                score={datasetAnalysis.health_score}
              />

              {/* PROBLEM TYPE */}
              <ProblemTypeCard
                problemType={datasetAnalysis.problem_type}
              />
            </div>

            {/* WARNINGS + TARGETS */}
            <div className="grid gap-6 lg:grid-cols-2">

              <WarningsCard
                warnings={datasetAnalysis.warnings}
              />

              <TargetCandidatesCard
              targetDetection={datasetAnalysis.target_detection}
/>
              
            </div>
{/* STATISTICAL INTELLIGENCE */}
<div className="space-y-6">

  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
        <BarChart3 size={22} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Statistical Profiling
        </p>

        <h3 className="mt-1 text-lg font-semibold">
          Numeric Statistics
        </h3>
      </div>
    </div>

    <NumericStatistics
      statistics={datasetAnalysis.numeric_statistics}
    />
  </section>

  <div className="grid gap-6 lg:grid-cols-2">

    <CategoricalStatistics
      statistics={datasetAnalysis.categorical_statistics}
    />

    <CorrelationCard
      correlations={datasetAnalysis.correlations}
    />

  </div>

  <InsightsCard
    insights={datasetAnalysis.insights}
  />

</div>
            {/* COLUMN TYPES */}
            <div className="grid gap-6 lg:grid-cols-2">

              <ColumnGroup
                title="Numeric Columns"
                columns={datasetAnalysis.numeric_columns}
              />

              <ColumnGroup
                title="Categorical Columns"
                columns={datasetAnalysis.categorical_columns}
              />
            </div>

            {/* COLUMN INTELLIGENCE */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

              <div className="border-b border-white/10 px-6 py-5">
                <h3 className="text-lg font-semibold">
                  Column Intelligence
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Automatic structural analysis for every column.
                </p>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] text-left">

                  <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Column</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Missing</th>
                      <th className="px-6 py-4">Missing %</th>
                      <th className="px-6 py-4">Unique</th>
                    </tr>
                  </thead>

                  <tbody>

                    {datasetAnalysis.column_info.map((column) => (
                      <tr
                        key={column.name}
                        className="border-t border-white/5"
                      >

                        <td className="px-6 py-4 text-sm font-medium">
                          {column.name}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {column.dtype}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {column.missing}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {column.missing_percentage}%
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-400">
                          {column.unique}
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </section>
  <DatasetExplorer
  preview={preview}
  loading={previewLoading}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  onPageChange={(nextPage) => {
    if (!analysis?.filename) return;

    loadPreview(analysis.filename, nextPage);
  }}
/>
          </section>
        )}
      </main>
    </div>
  );
}


/* =========================
   HEALTH CARD
========================= */

function HealthCard({ score }) {
  const safeScore = Number(score ?? 0);

  let label = "Needs Attention";

  if (safeScore >= 90) {
    label = "Excellent";
  } else if (safeScore >= 75) {
    label = "Good";
  } else if (safeScore >= 50) {
    label = "Fair";
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
            <ShieldCheck size={22} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Dataset Health
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              {label}
            </h3>
          </div>

        </div>

        <div className="text-right">
          <p className="text-3xl font-semibold">
            {safeScore}
          </p>

          <p className="text-xs text-gray-500">
            / 100
          </p>
        </div>

      </div>

      <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">

        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{
            width: `${Math.max(0, Math.min(safeScore, 100))}%`,
          }}
        />

      </div>

      <p className="mt-4 text-sm leading-6 text-gray-400">
        CORTEX evaluates missing data, duplicate records,
        and structural quality to estimate overall dataset health.
      </p>

    </div>
  );
}


/* =========================
   PROBLEM TYPE
========================= */

function ProblemTypeCard({ problemType }) {

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-indigo-400/10 p-3 text-indigo-300">
          <Brain size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            ML Problem Detection
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Likely Problem
          </h3>
        </div>

      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          CORTEX assessment
        </p>

        <p className="mt-3 text-2xl font-semibold">
          {problemType || "Unknown"}
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          This is a heuristic assessment based on the
          structure and detected target candidates.
        </p>

      </div>

    </div>
  );
}


/* =========================
   WARNINGS
========================= */

function WarningsCard({ warnings = [] }) {

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300">
          <AlertTriangle size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Data Quality
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Warnings & Signals
          </h3>
        </div>

      </div>

      <div className="mt-6 space-y-3">

        {warnings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">

            <CheckCircle2
              size={18}
              className="text-emerald-300"
            />

            <p className="text-sm text-emerald-200">
              No major data-quality warnings detected.
            </p>

          </div>
        ) : (
          warnings.map((warning, index) => (
            <div
              key={`${warning.message}-${index}`}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
            >

              {warning.severity === "warning" ? (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-300"
                />
              ) : (
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-sky-300"
                />
              )}

              <p className="text-sm leading-6 text-gray-300">
                {warning.message}
              </p>

            </div>
          ))
        )}

      </div>

    </div>
  );
}


/* =========================
   TARGET CANDIDATES
========================= */

function TargetCandidatesCard({
  targetDetection,
}) {
  const recommended =
    targetDetection?.recommended_target;

  const candidates =
    targetDetection?.candidates || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">
          <Target size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            ML Intelligence
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Target Detection
          </h3>
        </div>
      </div>

      {recommended ? (
        <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Recommended Target
              </p>

              <h4 className="mt-2 text-2xl font-semibold text-white">
                {recommended.column}
              </h4>

              <p className="mt-2 text-sm text-gray-400">
                {recommended.problem_type}
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold">
                {recommended.confidence}%
              </p>

              <p className="text-xs text-gray-500">
                confidence
              </p>
            </div>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{
                width: `${Math.min(
                  Math.max(
                    Number(recommended.confidence) || 0,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>

        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-gray-500">
            CORTEX could not identify a suitable target column.
          </p>
        </div>
      )}

      {candidates.length > 1 && (
        <div className="mt-6">

          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            Other Candidates
          </p>

          <div className="mt-3 space-y-2">
            {candidates
              .filter(
                (candidate) =>
                  candidate.column !== recommended?.column
              )
              .map((candidate) => (
                <div
                  key={candidate.column}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {candidate.column}
                    </p>

                    <p className="text-xs text-gray-500">
                      {candidate.problem_type}
                    </p>
                  </div>

                  <span className="text-sm text-gray-400">
                    {candidate.confidence}%
                  </span>
                </div>
              ))}
          </div>

        </div>
      )}

    </div>
  );
}

/* =========================
   METRIC CARD
========================= */

function MetricCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-300">
        {icon}
      </div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
      </p>

    </div>
  );
}


/* =========================
   COLUMN GROUP
========================= */

function ColumnGroup({
  title,
  columns,
}) {

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      {columns.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No columns detected.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">

          {columns.map((column) => (
            <span
              key={column}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300"
            >
              {column}
            </span>
          ))}

        </div>
      )}

    </div>
  );
}
function NumericStatistics({ statistics = {} }) {
  const entries = Object.entries(statistics);

  if (entries.length === 0) {
    return (
      <p className="mt-6 text-sm text-gray-500">
        No numeric statistics available.
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {entries.map(([column, stats]) => (
        <div
          key={column}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">
              {column}
            </h4>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
              {stats.count} values
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <StatItem label="Mean" value={formatNumber(stats.mean)} />
            <StatItem label="Median" value={formatNumber(stats.median)} />
            <StatItem label="Min" value={formatNumber(stats.min)} />
            <StatItem label="Max" value={formatNumber(stats.max)} />
            <StatItem label="Std Dev" value={formatNumber(stats.std)} />
            <StatItem label="Outliers" value={stats.outliers} />
          </div>

          <div className="mt-5 border-t border-white/5 pt-4 text-xs text-gray-500">
            Q1: {formatNumber(stats.q1)} · Q3:{" "}
            {formatNumber(stats.q3)} · Skewness:{" "}
            {formatNumber(stats.skewness)}
          </div>
        </div>
      ))}
    </div>
  );
}
function CategoricalStatistics({ statistics = {} }) {
  const entries = Object.entries(statistics);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-fuchsia-400/10 p-3 text-fuchsia-300">
          <Columns3 size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Distribution
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Categorical Statistics
          </h3>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No categorical statistics available.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {entries.map(([column, stats]) => (
            <div
              key={column}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {column}
                </h4>

                <span className="text-xs text-gray-500">
                  {stats.unique_values} unique
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Most common:{" "}
                <span className="text-gray-300">
                  {stats.most_common ?? "—"}
                </span>
              </p>

              <div className="mt-5 space-y-3">
                {stats.categories.slice(0, 5).map((item) => (
                  <div key={item.value}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">
                        {item.value}
                      </span>

                      <span className="text-gray-500">
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${Math.min(
                            item.percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CorrelationCard({ correlations }) {
  const matrix = correlations?.matrix || {};
  const columns = Object.keys(matrix);

  const relationships =
    correlations?.strong_relationships || [];

  if (columns.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-blue-400/10 p-3 text-blue-300">
            <TrendingUp size={22} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Relationships
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              Correlation Intelligence
            </h3>
          </div>

        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-sm text-gray-500">
            Not enough numeric features to build a correlation matrix.
          </p>

        </div>

      </section>
    );
  }

  const getCorrelation = (
    columnA,
    columnB
  ) => {
    const value =
      matrix?.[columnA]?.[columnB];

    return typeof value === "number"
      ? value
      : null;
  };

  const getCellClass = (value) => {
    if (value === null) {
      return "bg-white/[0.02] text-gray-600";
    }

    if (value >= 0.8) {
      return "bg-emerald-400/40 text-emerald-100";
    }

    if (value >= 0.5) {
      return "bg-emerald-400/20 text-emerald-200";
    }

    if (value >= 0.2) {
      return "bg-emerald-400/10 text-gray-200";
    }

    if (value <= -0.8) {
      return "bg-red-400/40 text-red-100";
    }

    if (value <= -0.5) {
      return "bg-red-400/20 text-red-200";
    }

    if (value <= -0.2) {
      return "bg-red-400/10 text-gray-200";
    }

    return "bg-white/[0.04] text-gray-300";
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      {/* HEADER */}
      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-blue-400/10 p-3 text-blue-300">
          <TrendingUp size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Relationships
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Correlation Heatmap
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Pearson correlation between numeric features.
          </p>
        </div>

      </div>

      {/* HEATMAP */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">

        <div className="overflow-x-auto">

          <table className="min-w-max border-collapse">

            <thead>

              <tr>

                <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[#0b0d11] px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">
                  Feature
                </th>

                {columns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-white/10 px-3 py-3 text-center text-xs font-medium text-gray-500"
                  >
                    {column}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>

              {columns.map((row) => (

                <tr key={row}>

                  <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-[#0b0d11] px-4 py-3 text-left text-xs font-medium text-gray-400">
                    {row}
                  </th>

                  {columns.map((column) => {

                    const value =
                      getCorrelation(
                        row,
                        column
                      );

                    return (
                      <td
                        key={`${row}-${column}`}
                        title={
                          value !== null
                            ? `${row} ↔ ${column}: ${value.toFixed(
                                4
                              )}`
                            : "No correlation value"
                        }
                        className={`border-b border-white/5 px-3 py-3 text-center font-mono text-xs ${getCellClass(
                          value
                        )}`}
                      >
                        {value !== null
                          ? value.toFixed(2)
                          : "—"}
                      </td>
                    );
                  })}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* LEGEND */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-500">

        <span>
          Strong positive
        </span>

        <span className="h-3 w-8 rounded bg-emerald-400/40" />

        <span>
          Positive
        </span>

        <span className="h-3 w-8 rounded bg-emerald-400/10" />

        <span>
          Near zero
        </span>

        <span className="h-3 w-8 rounded bg-white/[0.04]" />

        <span>
          Negative
        </span>

        <span className="h-3 w-8 rounded bg-red-400/10" />

        <span>
          Strong negative
        </span>

        <span className="h-3 w-8 rounded bg-red-400/40" />

      </div>

      {/* STRONG RELATIONSHIPS */}
      {relationships.length > 0 && (
        <div className="mt-7">

          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Strong Relationships
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {relationships.map((item) => (

              <div
                key={`${item.column_a}-${item.column_b}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-sm font-medium">
                      {item.column_a}
                    </p>

                    <p className="text-xs text-gray-500">
                      ↕ {item.column_b}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-lg font-semibold">
                      {item.correlation}
                    </p>

                    <p className="text-xs capitalize text-gray-500">
                      {item.strength}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>
      )}

    </section>
  );
}

function InsightsCard({ insights = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Automated Reasoning
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            CORTEX Insights
          </h3>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-gray-500">
            No notable statistical insights detected.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {insights.map((insight, index) => (
            <div
              key={`${insight.type}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-start gap-3">

                <div
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    insight.severity === "warning"
                      ? "bg-amber-300"
                      : "bg-cyan-300"
                  }`}
                />

                <p className="text-sm leading-6 text-gray-300">
                  {insight.message}
                </p>

              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-200">
        {value}
      </p>
    </div>
  );
}


function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}
function DatasetExplorer({
  preview,
  loading,
  searchTerm,
  setSearchTerm,
  onPageChange,
}) {
  if (!preview && !loading) {
    return null;
  }

  const filteredRows =
    preview?.rows?.filter((row) => {
      if (!searchTerm.trim()) {
        return true;
      }

      const query = searchTerm.toLowerCase();

      return Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    }) || [];

  const canGoPrevious =
    preview && preview.page > 1;

  const canGoNext =
    preview &&
    preview.page < preview.total_pages;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-400/10 p-3 text-sky-300">
            <Table2 size={22} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Data Explorer
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              Inspect Dataset
            </h3>
          </div>
        </div>

        {preview && (
          <div className="text-sm text-gray-500">
            {preview.total_rows.toLocaleString()} rows ·{" "}
            {preview.total_columns} columns
          </div>
        )}
      </div>

      {/* Search */}
      {preview && (
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search visible rows..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/20"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
          <p className="text-sm text-gray-400">
            Loading dataset preview...
          </p>
        </div>
      ) : preview ? (
        <>
          {/* Table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">

                <thead className="bg-white/[0.03]">
                  <tr>
                    {preview.columns.map((column) => (
                      <th
                        key={column}
                        className="border-b border-white/10 px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={preview.columns.length}
                        className="px-5 py-12 text-center text-sm text-gray-500"
                      >
                        No matching rows found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >
                        {preview.columns.map((column) => (
                          <td
                            key={column}
                            className="max-w-[280px] truncate px-5 py-4 text-sm text-gray-300"
                            title={String(row[column] ?? "")}
                          >
                            {row[column] === null ||
                            row[column] === undefined ||
                            row[column] === ""
                              ? "—"
                              : String(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">
              Page {preview.page} of{" "}
              {preview.total_pages}
            </p>

            <div className="flex items-center gap-2">

              <button
                disabled={!canGoPrevious || loading}
                onClick={() =>
                  onPageChange(preview.page - 1)
                }
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                disabled={!canGoNext || loading}
                onClick={() =>
                  onPageChange(preview.page + 1)
                }
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight size={16} />
              </button>

            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
function ExperimentLeaderboard({ experiment }) {
  const leaderboard = experiment?.leaderboard || [];
  const bestModel = experiment?.best_model;

  return (
    <section className="rounded-3xl border border-violet-400/15 bg-violet-400/[0.03] p-7">

  {/* EVALUATION HEADER */}
  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

    <div>
      <div className="flex items-center gap-3">

        <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300">
          Evaluation
        </span>

        <span className="text-xs text-gray-600">
          {experiment.validation?.method} ·{" "}
          {experiment.validation?.folds} folds
        </span>

      </div>

      <h3 className="mt-3 text-2xl font-semibold">
        Model Evaluation
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Compare model performance, error, stability, and selection reasoning.
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">

      <p className="text-xs uppercase tracking-wider text-gray-500">
        Models Evaluated
      </p>

      <p className="mt-1 text-xl font-semibold text-white">
        {leaderboard.length}
      </p>

    </div>

  </div>

      {/* Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Target
          </p>

          <p className="mt-2 text-lg font-semibold">
            {experiment.target_column}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Problem
          </p>

          <p className="mt-2 text-lg font-semibold">
            {experiment.problem_type}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Models Tested
          </p>

          <p className="mt-2 text-lg font-semibold">
            {experiment.models_tested}
          </p>
        </div>

      </div>
      <div className="my-8 border-t border-white/5" />
      {/* Best model */}
      {bestModel && (
        <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
                Recommended Model
              </p>

              <h4 className="mt-2 text-2xl font-semibold">
                {bestModel.model}
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-6">

              <MetricMini
                label="Mean R²"
                value={bestModel.mean_r2}
              />

              <MetricMini
                label="MAE"
                value={bestModel.mean_mae}
              />

              <MetricMini
                label="RMSE"
                value={bestModel.mean_rmse}
              />

            </div>

          </div>

        </div>
      )}
      <div className="my-8 border-t border-white/5" />
      {/* Leaderboard */}
      <div className="mt-8">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Model Leaderboard
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">

                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Model</th>
                  <th className="px-5 py-4">Mean R²</th>
                  <th className="px-5 py-4">Std R²</th>
                  <th className="px-5 py-4">MAE</th>
                  <th className="px-5 py-4">RMSE</th>
                </tr>

              </thead>

              <tbody>

                {leaderboard.map((model, index) => {
                  const isWinner =
                    index === 0;

                  return (
                    <tr
                      key={model.model}
                      className={`border-t border-white/5 ${
                        isWinner
                          ? "bg-white/[0.03]"
                          : ""
                      }`}
                    >

                      <td className="px-5 py-4">
                        <span
                          className={
                            isWinner
                              ? "font-semibold text-emerald-300"
                              : "text-gray-500"
                          }
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          {isWinner && (
                            <span className="text-emerald-300">
                              🏆
                            </span>
                          )}

                          {model.model}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-300">
                        {model.mean_r2}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {model.std_r2}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {model.mean_mae}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {model.mean_rmse}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>

            </div>
                  {/* MODEL PERFORMANCE CHARTS */}
      <div className="my-8 border-t border-white/5" />

      <PerformanceMetricCharts
        models={leaderboard}
      />
      <div className="my-8 border-t border-white/5" />
      {/* PERFORMANCE COMPARISON */}
      <div className="mt-8">

        <div className="flex items-end justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Performance Comparison
            </p>

            <h4 className="mt-2 text-lg font-semibold">
              R² Across Models
            </h4>
          </div>

          <p className="text-xs text-gray-500">
            Higher is better
          </p>

        </div>

        <div className="mt-5 space-y-5">

          {leaderboard.map((model, index) => {

            const maxR2 = Math.max(
              ...leaderboard.map(
                (item) => item.mean_r2
              )
            );

            const percentage =
              maxR2 > 0
                ? (model.mean_r2 / maxR2) * 100
                : 0;

            const isWinner =
              index === 0;

            return (
              <div key={model.model}>

                <div className="mb-2 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    {isWinner && (
                      <span className="text-emerald-300">
                        🏆
                      </span>
                    )}

                    <span
                      className={
                        isWinner
                          ? "text-sm font-medium text-emerald-200"
                          : "text-sm text-gray-300"
                      }
                    >
                      {model.model}
                    </span>

                  </div>

                  <span className="font-mono text-sm text-gray-400">
                    {Number(
                      model.mean_r2
                    ).toFixed(4)}
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/5">

                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isWinner
                        ? "bg-emerald-400"
                        : "bg-violet-400/50"
                    }`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

        </div>

      </div>
      <div className="my-8 border-t border-white/5" />
      {/* ERROR METRIC COMPARISON */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        {/* MAE */}
        <MetricComparison
          title="MAE"
          subtitle="Mean Absolute Error"
          direction="lower"
          models={leaderboard}
          valueKey="mean_mae"
        />

        {/* RMSE */}
        <MetricComparison
          title="RMSE"
          subtitle="Root Mean Squared Error"
          direction="lower"
          models={leaderboard}
          valueKey="mean_rmse"
        />

      </div>
      <div className="my-8 border-t border-white/5" />
     {/* CROSS-VALIDATION STABILITY */}
      <div className="mt-8">
        <StabilityComparison
          models={leaderboard}
        />
      </div>
      <div className="my-8 border-t border-white/5" />
      {/* MODEL SELECTION SUMMARY */}
      <div className="mt-8">
        <ModelSelectionSummary
          leaderboard={leaderboard}
          bestModel={bestModel}
        />
      </div>

    </section>
  );
}
function ModelSelectionSummary({
  leaderboard,
  bestModel,
}) {
  if (
    !leaderboard ||
    leaderboard.length === 0 ||
    !bestModel
  ) {
    return null;
  }

  const bestR2 = Math.max(
    ...leaderboard.map(
      (model) => Number(model.mean_r2)
    )
  );

  const bestMae = Math.min(
    ...leaderboard.map(
      (model) => Number(model.mean_mae)
    )
  );

  const bestRmse = Math.min(
    ...leaderboard.map(
      (model) => Number(model.mean_rmse)
    )
  );

  const bestStability = Math.min(
    ...leaderboard.map(
      (model) => Number(model.std_r2)
    )
  );

  const winnerHasBestR2 =
    Number(bestModel.mean_r2) === bestR2;

  const winnerHasBestMae =
    Number(bestModel.mean_mae) === bestMae;

  const winnerHasBestRmse =
    Number(bestModel.mean_rmse) === bestRmse;

  const winnerHasBestStability =
    Number(bestModel.std_r2) === bestStability;

  return (
    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
            Model Selection Summary
          </p>

          <h4 className="mt-2 text-xl font-semibold">
            Why this model was selected
          </h4>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            CORTEX compares predictive performance,
            error metrics, and cross-validation stability
            before recommending a model.
          </p>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200">
          Recommended
        </div>

      </div>

      {/* WINNER */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

        <div className="flex items-center gap-3">

          <div className="text-2xl">
            🏆
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Selected Model
            </p>

            <p className="mt-1 text-xl font-semibold text-emerald-200">
              {bestModel.model}
            </p>
          </div>

        </div>

      </div>

      {/* METRIC REASONS */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SelectionMetric
          label="Mean R²"
          value={bestModel.mean_r2}
          description={
            winnerHasBestR2
              ? "Best predictive score"
              : "Primary evaluation score"
          }
          positive={winnerHasBestR2}
        />

        <SelectionMetric
          label="MAE"
          value={bestModel.mean_mae}
          description={
            winnerHasBestMae
              ? "Lowest prediction error"
              : "Prediction error"
          }
          positive={winnerHasBestMae}
        />

        <SelectionMetric
          label="RMSE"
          value={bestModel.mean_rmse}
          description={
            winnerHasBestRmse
              ? "Lowest overall error"
              : "Overall error"
          }
          positive={winnerHasBestRmse}
        />

        <SelectionMetric
          label="Std R²"
          value={bestModel.std_r2}
          description={
            winnerHasBestStability
              ? "Most stable"
              : "Stability tradeoff"
          }
          positive={winnerHasBestStability}
        />

      </div>

      {/* EXPLANATION */}
      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          CORTEX Assessment
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-300">

          {bestModel.model} was selected because it achieved
          {winnerHasBestR2
            ? " the highest mean R²"
            : " the strongest primary validation result"}
          {winnerHasBestMae
            ? ", the lowest MAE"
            : ""}
          {winnerHasBestRmse
            ? ", and the lowest RMSE"
            : ""}.
          {" "}

          {winnerHasBestStability
            ? "It also demonstrated the strongest cross-validation stability."
            : "Another model demonstrated lower R² variability across folds, so stability represents a tradeoff rather than the primary reason for selection."}

        </p>

      </div>

    </div>
  );
}
function SelectionMetric({
  label,
  value,
  description,
  positive,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">

      <p className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p
        className={
          positive
            ? "mt-2 text-lg font-semibold text-emerald-300"
            : "mt-2 text-lg font-semibold text-white"
        }
      >
        {Number(value).toFixed(4)}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>

    </div>
  );
}
function StabilityComparison({ models }) {
  if (!models || models.length === 0) {
    return null;
  }

  const values = models.map(
    (model) => Number(model.std_r2)
  );

  const bestValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6">

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Cross-Validation Stability
          </p>

          <h4 className="mt-2 text-lg font-semibold">
            R² Stability Across Folds
          </h4>

          <p className="mt-1 max-w-2xl text-xs text-gray-500">
            Standard deviation of R² across validation folds.
            Lower values indicate more consistent performance.
          </p>
        </div>

        <p className="text-xs text-gray-500">
          Lower is better
        </p>

      </div>

      <div className="mt-6 space-y-5">

        {models.map((model) => {
          const value = Number(model.std_r2);

          const isBest =
            value === bestValue;

          const percentage =
            maxValue > 0
              ? (value / maxValue) * 100
              : 0;

          return (
            <div key={model.model}>

              <div className="mb-2 flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-2">

                  {isBest && (
                    <span className="text-emerald-300">
                      ✓
                    </span>
                  )}

                  <span
                    className={
                      isBest
                        ? "truncate text-sm font-medium text-emerald-200"
                        : "truncate text-sm text-gray-300"
                    }
                  >
                    {model.model}
                  </span>

                </div>

                <span
                  className={
                    isBest
                      ? "font-mono text-sm text-emerald-300"
                      : "font-mono text-sm text-gray-400"
                  }
                >
                  {value.toFixed(4)}
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">

                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isBest
                      ? "bg-emerald-400"
                      : "bg-violet-400/50"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

function MetricMini({ label, value }) {
  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
function MetricComparison({
  title,
  subtitle,
  direction,
  models,
  valueKey,
}) {
  if (!models || models.length === 0) {
    return null;
  }

  const values = models.map(
    (model) => Number(model[valueKey])
  );

  const bestValue =
    direction === "lower"
      ? Math.min(...values)
      : Math.max(...values);

  const maxValue = Math.max(...values);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6">

      <div className="flex items-end justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Error Metric
          </p>

          <h4 className="mt-2 text-lg font-semibold">
            {title}
          </h4>

          <p className="mt-1 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <p className="text-xs text-gray-500">
          Lower is better
        </p>

      </div>

      <div className="mt-6 space-y-5">

        {models.map((model) => {
          const value = Number(
            model[valueKey]
          );

          const isBest =
            value === bestValue;

          const percentage =
            maxValue > 0
              ? (value / maxValue) * 100
              : 0;

          return (
            <div key={model.model}>

              <div className="mb-2 flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-2">

                  {isBest && (
                    <span className="text-emerald-300">
                      ✓
                    </span>
                  )}

                  <span
                    className={
                      isBest
                        ? "truncate text-sm font-medium text-emerald-200"
                        : "truncate text-sm text-gray-300"
                    }
                  >
                    {model.model}
                  </span>

                </div>

                <span
                  className={
                    isBest
                      ? "font-mono text-sm text-emerald-300"
                      : "font-mono text-sm text-gray-400"
                  }
                >
                  {value.toFixed(4)}
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">

                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isBest
                      ? "bg-emerald-400"
                      : "bg-violet-400/50"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
function ExperimentHistory({
  experiments = [],
  loading,
  error,
  onSelectExperiment,
  compareIds,
  setCompareIds,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [problemFilter, setProblemFilter] =
    useState("all");

  const filteredExperiments =
    experiments.filter((experiment) => {
      const search =
        searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        experiment.experiment_id
          ?.toLowerCase()
          .includes(search) ||
        experiment.dataset_filename
          ?.toLowerCase()
          .includes(search) ||
        experiment.target_column
          ?.toLowerCase()
          .includes(search) ||
        experiment.best_model?.model
          ?.toLowerCase()
          .includes(search);

      const matchesProblem =
        problemFilter === "all" ||
        experiment.problem_type
          ?.toLowerCase() ===
          problemFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesProblem
      );
    });

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Experiment Registry
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Experiment History
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Persistent record of previous AutoML runs.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {filteredExperiments.length}{" "}
          experiment
          {filteredExperiments.length === 1
            ? ""
            : "s"}
        </div>

      </div>

      {/* SEARCH & FILTER */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">

        <div className="relative">

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search experiments, datasets, targets, or models..."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400/30"
          />

        </div>

        <select
          value={problemFilter}
          onChange={(event) =>
            setProblemFilter(
              event.target.value
            )
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300 outline-none focus:border-violet-400/30"
        >
          <option value="all">
            All problem types
          </option>

          <option value="regression">
            Regression
          </option>

          <option value="classification">
            Classification
          </option>
        </select>

      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">

          <p className="text-sm text-gray-400">
            Loading experiment history...
          </p>

        </div>

      ) : experiments.length === 0 ? (

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">

          <p className="text-sm text-gray-500">
            No experiments have been recorded yet.
          </p>

        </div>

      ) : filteredExperiments.length === 0 ? (

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">

          <p className="text-sm text-gray-400">
            No experiments match your search.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setProblemFilter("all");
            }}
            className="mt-3 text-xs text-violet-300 transition hover:text-violet-200"
          >
            Clear filters
          </button>

        </div>

      ) : (

        <div className="mt-6 grid gap-4">

          {[...filteredExperiments]
            .reverse()
            .map((item) => (

              <ExperimentHistoryCard
                key={item.experiment_id}
                experiment={item}
                onClick={() =>
                  onSelectExperiment(
                    item.experiment_id
                  )
                }
                compareIds={compareIds}
                setCompareIds={
                  setCompareIds
                }
              />

            ))}

        </div>

      )}

    </section>
  );
}

function ExperimentHistoryCard({
  experiment,
  onClick,
  compareIds,
  setCompareIds,
}) {
  const bestModel = experiment?.best_model;

  return (
  <div
  onClick={onClick}
  className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/15 hover:bg-white/[0.02]"
>
<div className="mb-4 flex items-center justify-between">
  <label
    className="flex cursor-pointer items-center gap-2 text-sm text-gray-400"
    onClick={(event) => event.stopPropagation()}
  >
    <input
      type="checkbox"
      checked={compareIds.includes(
        experiment.experiment_id
      )}
      onChange={(event) => {
        event.stopPropagation();

        setCompareIds((current) => {
          if (event.target.checked) {
            if (current.length >= 2) {
              return current;
            }

            return [
              ...current,
              experiment.experiment_id,
            ];
          }

          return current.filter(
            (id) =>
              id !== experiment.experiment_id
          );
        });
      }}
      className="h-4 w-4 rounded border-white/20 bg-black/20"
    />

    Compare
  </label>

  <div className="flex items-center gap-3">

  <span
    className={`rounded-full border px-3 py-1 text-xs font-medium ${
      experiment.status === "completed"
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : experiment.status === "failed"
        ? "border-red-400/20 bg-red-400/10 text-red-300"
        : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
    }`}
  >
    {experiment.status || "completed"}
  </span>

  <span className="text-xs text-gray-600">
    {experiment.experiment_id}
  </span>

</div>
</div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              {experiment.experiment_id}
            </span>

            <span className="text-xs text-gray-500">
              {experiment.validation?.method}
            </span>

            <span className="text-xs text-gray-500">
              {experiment.validation?.folds} folds
            </span>

          </div>

          <h4 className="mt-3 text-lg font-semibold">
            {experiment.dataset_filename}
          </h4>

          <p className="mt-2 text-sm text-gray-500">
            Target:{" "}
            <span className="text-gray-300">
              {experiment.target_column}
            </span>
            {" · "}
            {experiment.problem_type}
          </p>

        </div>

     <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:min-w-[520px]">

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      Best Model
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {bestModel?.model || "—"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      Mean R²
    </p>

    <p className="mt-1 text-sm font-semibold text-emerald-300">
      {bestModel?.mean_r2 ?? "—"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      MAE
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {bestModel?.mean_mae ?? "—"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      RMSE
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {bestModel?.mean_rmse ?? "—"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      Models
    </p>

    <p className="mt-1 text-sm font-medium text-white">
      {experiment.models_tested ?? 0}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-wider text-gray-500">
      Status
    </p>

    <p className="mt-1 text-sm font-medium text-emerald-300">
      Completed
    </p>
  </div>

</div>

      </div>

    </div>
  );
}
function ExperimentDetail({
  experiment,
  loading,
  error,
}) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
        <p className="text-sm text-gray-400">
          Loading experiment details...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-400/20 bg-red-400/10 p-7">
        <p className="text-sm text-red-300">
          {error}
        </p>
      </section>
    );
  }

  if (!experiment) {
    return null;
  }

  const bestModel = experiment.best_model;
  const leaderboard = experiment.leaderboard || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300">
              Experiment Detail
            </span>

            <span className="text-xs text-gray-600">
              {experiment.experiment_id}
            </span>

          </div>

          <h3 className="mt-3 text-2xl font-semibold">
            {experiment.dataset_filename}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Detailed record of this AutoML experiment.
          </p>

        </div>

       <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">

  <p className="text-xs uppercase tracking-wider text-gray-500">
    Status
  </p>

  <p
    className={`mt-1 text-sm font-semibold ${
      experiment.status === "failed"
        ? "text-red-300"
        : experiment.status === "running"
        ? "text-yellow-300"
        : "text-emerald-300"
    }`}
  >
    {experiment.status || "completed"}
  </p>

  <p className="mt-2 text-xs text-gray-600">
    Created {experiment.created_at}
  </p>

</div>

      </div>

      {/* EXPERIMENT METADATA */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Target
          </p>

          <p className="mt-2 font-semibold">
            {experiment.target_column}
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Problem
          </p>

          <p className="mt-2 font-semibold">
            {experiment.problem_type}
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Validation
          </p>

          <p className="mt-2 font-semibold">
            {experiment.validation?.method || "—"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {experiment.validation?.folds || "—"} folds
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Models Tested
          </p>

          <p className="mt-2 font-semibold">
            {experiment.models_tested ?? 0}
          </p>

        </div>

      </div>

      {/* RECOMMENDED MODEL */}
      {bestModel && (
        <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
                Recommended Model
              </p>

              <div className="mt-2 flex items-center gap-3">

                <span className="text-2xl">
                  🏆
                </span>

                <h4 className="text-2xl font-semibold text-emerald-200">
                  {bestModel.model}
                </h4>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">

              <div>

                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Mean R²
                </p>

                <p className="mt-1 text-lg font-semibold text-emerald-300">
                  {bestModel.mean_r2}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Std R²
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {bestModel.std_r2}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-gray-500">
                  MAE
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {bestModel.mean_mae}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-gray-500">
                  RMSE
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {bestModel.mean_rmse}
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* FULL LEADERBOARD */}
      <div className="mt-8">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Model Evaluation
            </p>

            <h4 className="mt-2 text-lg font-semibold">
              Full Leaderboard
            </h4>

          </div>

          <p className="text-xs text-gray-600">
            {leaderboard.length} models evaluated
          </p>

        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">

                <tr>

                  <th className="px-5 py-4">
                    Rank
                  </th>

                  <th className="px-5 py-4">
                    Model
                  </th>

                  <th className="px-5 py-4">
                    Mean R²
                  </th>

                  <th className="px-5 py-4">
                    Std R²
                  </th>

                  <th className="px-5 py-4">
                    MAE
                  </th>

                  <th className="px-5 py-4">
                    RMSE
                  </th>

                </tr>

              </thead>

              <tbody>

                {leaderboard.map(
                  (model, index) => {

                    const isWinner =
                      index === 0;

                    return (
                      <tr
                        key={model.model}
                        className={`border-t border-white/5 ${
                          isWinner
                            ? "bg-white/[0.02]"
                            : ""
                        }`}
                      >

                        <td className="px-5 py-4">

                          <span
                            className={
                              isWinner
                                ? "font-semibold text-emerald-300"
                                : "text-gray-500"
                            }
                          >
                            #{index + 1}
                          </span>

                        </td>

                        <td className="px-5 py-4 font-medium">

                          <div className="flex items-center gap-2">

                            {isWinner && (
                              <span className="text-emerald-300">
                                🏆
                              </span>
                            )}

                            {model.model}

                          </div>

                        </td>

                        <td className="px-5 py-4 text-gray-300">
                          {model.mean_r2}
                        </td>

                        <td className="px-5 py-4 text-gray-400">
                          {model.std_r2}
                        </td>

                        <td className="px-5 py-4 text-gray-400">
                          {model.mean_mae}
                        </td>

                        <td className="px-5 py-4 text-gray-400">
                          {model.mean_rmse}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </section>
  );
}
function ExperimentComparison({
  experiments = [],
  compareIds = [],
}) {
  if (compareIds.length !== 2) {
    return null;
  }

  const selected = compareIds
    .map((id) =>
      experiments.find(
        (experiment) =>
          experiment.experiment_id === id
      )
    )
    .filter(Boolean);

  if (selected.length !== 2) {
    return null;
  }

  const [first, second] = selected;

  const firstBest = first.best_model;
  const secondBest = second.best_model;

  const firstWins = [];
  const secondWins = [];

  const compareMetric = (
    firstValue,
    secondValue,
    higherIsBetter,
    label
  ) => {
    const a = Number(firstValue);
    const b = Number(secondValue);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return "—";
    }

    if (a === b) {
      return "Tie";
    }

    const firstBetter = higherIsBetter
      ? a > b
      : a < b;

    if (firstBetter) {
      firstWins.push(label);
      return first.experiment_id;
    }

    secondWins.push(label);
    return second.experiment_id;
  };

  const r2Winner = compareMetric(
    firstBest?.mean_r2,
    secondBest?.mean_r2,
    true,
    "R²"
  );

  const maeWinner = compareMetric(
    firstBest?.mean_mae,
    secondBest?.mean_mae,
    false,
    "MAE"
  );

  const rmseWinner = compareMetric(
    firstBest?.mean_rmse,
    secondBest?.mean_rmse,
    false,
    "RMSE"
  );

  const stabilityWinner = compareMetric(
    firstBest?.std_r2,
    secondBest?.std_r2,
    false,
    "Stability"
  );

  const overallWinner =
    firstWins.length > secondWins.length
      ? first.experiment_id
      : secondWins.length > firstWins.length
      ? second.experiment_id
      : null;

  return (
    <section className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300">
              Experiment Analysis
            </span>

            <span className="text-xs text-gray-600">
              2 experiments
            </span>

          </div>

          <h3 className="mt-3 text-2xl font-semibold">
            Compare Experiments
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Side-by-side comparison of two AutoML runs.
          </p>

        </div>

        {overallWinner && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4">

            <p className="text-xs uppercase tracking-wider text-gray-500">
              Overall Advantage
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-300">
              {overallWinner}
            </p>

          </div>
        )}

      </div>

      {/* EXPERIMENT CARDS */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">

        {[first, second].map((experiment) => {

          const best = experiment.best_model;

          return (
            <div
              key={experiment.experiment_id}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >

              <div className="flex items-center justify-between">

                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
                  {experiment.experiment_id}
                </span>

                <span className="text-xs text-gray-500">
                  {experiment.validation?.folds ?? "—"}-Fold CV
                </span>

              </div>

              <h4 className="mt-4 text-lg font-semibold">
                {experiment.dataset_filename}
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                {experiment.target_column} ·{" "}
                {experiment.problem_type}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Best Model
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {best?.model ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Mean R²
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    {best?.mean_r2 ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    MAE
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {best?.mean_mae ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    RMSE
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {best?.mean_rmse ?? "—"}
                  </p>
                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* METRIC COMPARISON */}
      <div className="mt-8">

        <div className="flex items-end justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Performance Comparison
            </p>

            <h4 className="mt-2 text-lg font-semibold">
              Metric-by-Metric Analysis
            </h4>
          </div>

          <p className="text-xs text-gray-600">
            Best result highlighted
          </p>

        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">

                <tr>

                  <th className="px-5 py-4">
                    Metric
                  </th>

                  <th className="px-5 py-4">
                    {first.experiment_id}
                  </th>

                  <th className="px-5 py-4">
                    {second.experiment_id}
                  </th>

                  <th className="px-5 py-4">
                    Better
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* R2 */}
                <tr className="border-t border-white/5">

                  <td className="px-5 py-4 text-gray-400">
                    Mean R²
                  </td>

                  <td className="px-5 py-4">
                    {firstBest?.mean_r2 ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    {secondBest?.mean_r2 ?? "—"}
                  </td>

                  <td className="px-5 py-4 font-medium text-emerald-300">
                    {r2Winner}
                  </td>

                </tr>

                {/* STD R2 */}
                <tr className="border-t border-white/5">

                  <td className="px-5 py-4 text-gray-400">
                    Std R²
                  </td>

                  <td className="px-5 py-4">
                    {firstBest?.std_r2 ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    {secondBest?.std_r2 ?? "—"}
                  </td>

                  <td className="px-5 py-4 font-medium text-emerald-300">
                    {stabilityWinner}
                  </td>

                </tr>

                {/* MAE */}
                <tr className="border-t border-white/5">

                  <td className="px-5 py-4 text-gray-400">
                    MAE
                  </td>

                  <td className="px-5 py-4">
                    {firstBest?.mean_mae ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    {secondBest?.mean_mae ?? "—"}
                  </td>

                  <td className="px-5 py-4 font-medium text-emerald-300">
                    {maeWinner}
                  </td>

                </tr>

                {/* RMSE */}
                <tr className="border-t border-white/5">

                  <td className="px-5 py-4 text-gray-400">
                    RMSE
                  </td>

                  <td className="px-5 py-4">
                    {firstBest?.mean_rmse ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    {secondBest?.mean_rmse ?? "—"}
                  </td>

                  <td className="px-5 py-4 font-medium text-emerald-300">
                    {rmseWinner}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* SUMMARY */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Comparison Summary
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">

          <div>
            <p className="text-xs text-gray-500">
              {first.experiment_id} advantages
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {firstWins.length}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              {firstWins.length > 0
                ? firstWins.join(" · ")
                : "None"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              {second.experiment_id} advantages
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {secondWins.length}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              {secondWins.length > 0
                ? secondWins.join(" · ")
                : "None"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Overall
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-300">
              {overallWinner || "Tie"}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Based on metric wins
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}

function ExplainabilityCard({
  experiment,
}) {
  const explainability =
    experiment?.explainability;

  if (!explainability) {
    return null;
  }

  const features =
    explainability.features || [];

  if (features.length === 0) {
    return null;
  }

  const topFeatures = features.slice(0, 10);

  const maxImportance = Math.max(
    ...topFeatures.map(
      (feature) =>
        Number(
          feature.importance_percentage
        ) || 0
    ),
    1
  );

  return (
    <section className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300/70">
            Explainable AI
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Feature Importance
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {explainability.method}
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {explainability.model}
        </div>

      </div>

      {/* SUMMARY */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

        <p className="text-sm leading-6 text-gray-400">
          CORTEX ranks features according to their
          measured influence on the selected model.
          Larger percentages indicate greater relative
          importance within this explanation.
        </p>

      </div>

      {/* VISUAL RANKING */}
      <div className="mt-8">

        <div className="flex items-end justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Importance Ranking
            </p>

            <h4 className="mt-2 text-lg font-semibold">
              Top {topFeatures.length} Features
            </h4>
          </div>

          <p className="text-xs text-gray-600">
            Relative importance
          </p>

        </div>

        <div className="mt-5 space-y-5">

          {topFeatures.map(
            (feature, index) => {

              const importance =
                Number(
                  feature.importance_percentage
                ) || 0;

              const barWidth =
                maxImportance > 0
                  ? (importance /
                      maxImportance) *
                    100
                  : 0;

              const isPositive =
                feature.direction ===
                "positive";

              const isNegative =
                feature.direction ===
                "negative";

              const directionClass =
                isPositive
                  ? "text-emerald-300"
                  : isNegative
                  ? "text-rose-300"
                  : "text-gray-400";

              return (
                <div
                  key={`ranking-${feature.feature}-${index}`}
                >

                  <div className="mb-2 flex items-center justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <span className="w-5 text-xs text-gray-600">
                        #{index + 1}
                      </span>

                      <span className="truncate text-sm font-medium text-white">
                        {feature.feature}
                      </span>

                    </div>

                    <span
                      className={`font-mono text-sm ${directionClass}`}
                    >
                      {importance.toFixed(2)}%
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full bg-amber-300/70 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          barWidth,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* DIRECTION SUMMARY */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Positive Influence
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-300">
            {
              topFeatures.filter(
                (feature) =>
                  feature.direction ===
                  "positive"
              ).length
            }
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Top ranked features
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Negative Influence
          </p>

          <p className="mt-2 text-lg font-semibold text-rose-300">
            {
              topFeatures.filter(
                (feature) =>
                  feature.direction ===
                  "negative"
              ).length
            }
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Top ranked features
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Features Shown
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {topFeatures.length}
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Highest-importance features
          </p>

        </div>

      </div>

      {/* DETAILED EXPLANATIONS */}
      <div className="mt-8">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Detailed Feature Analysis
        </p>

        <div className="mt-4 space-y-4">

          {topFeatures.map(
            (feature, index) => {

              const isPositive =
                feature.direction ===
                "positive";

              const isNegative =
                feature.direction ===
                "negative";

              const directionLabel =
                isPositive
                  ? "Positive"
                  : isNegative
                  ? "Negative"
                  : "Model-dependent";

              const directionClass =
                isPositive
                  ? "text-emerald-300"
                  : isNegative
                  ? "text-rose-300"
                  : "text-gray-400";

              return (
                <div
                  key={`detail-${feature.feature}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <span className="text-xs text-gray-600">
                          #{index + 1}
                        </span>

                        <p className="truncate text-sm font-medium text-white">
                          {feature.feature}
                        </p>

                      </div>

                      <p
                        className={`mt-2 text-xs ${directionClass}`}
                      >
                        {directionLabel}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-lg font-semibold">
                        {feature.importance_percentage}%
                      </p>

                      {feature.coefficient !==
                        undefined && (
                        <p className="mt-1 text-xs text-gray-500">
                          coefficient:{" "}
                          {feature.coefficient}
                        </p>
                      )}

                    </div>

                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {feature.explanation}
                  </p>

                </div>
              );
            }
          )}

        </div>

      </div>

    </section>
  );
}

function PredictionErrorCard({ experiment }) {
  const errorAnalysis =
    experiment?.error_analysis;

  if (!errorAnalysis) {
    return null;
  }

  const metrics =
    errorAnalysis.metrics || {};

  const summary =
    errorAnalysis.error_summary || {};

  const largestErrors =
    errorAnalysis.largest_errors || [];

  const actualVsPredicted =
    errorAnalysis.actual_vs_predicted || [];

  
    const residuals =
    actualVsPredicted
      .map((item) => Number(item.error))
      .filter((value) =>
        Number.isFinite(value)
      );

  const maxAbsResidual = Math.max(
    ...residuals.map((value) =>
      Math.abs(value)
    ),
    1
  );

  const residualBinCount = 8;

  const residualBinSize =
    (maxAbsResidual * 2) /
    residualBinCount;

  const residualBins = Array.from(
    { length: residualBinCount },
    (_, index) => {
      const min =
        -maxAbsResidual +
        index * residualBinSize;

      const max =
        min + residualBinSize;

      const count = residuals.filter(
        (value) =>
          value >= min &&
          (index === residualBinCount - 1
            ? value <= max
            : value < max)
      ).length;

      return {
        min,
        max,
        count,
      };
    }
  );

  const maxBinCount = Math.max(
    ...residualBins.map(
      (bin) => bin.count
    ),
    1
  );

  return (
    <section className="rounded-3xl border border-rose-400/15 bg-rose-400/[0.03] p-7">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-rose-300/70">
          Explainable AI
        </p>

        <h3 className="mt-2 text-2xl font-semibold">
          Prediction Error Analysis
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Out-of-fold analysis of the selected model's
          predictions.
        </p>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <ErrorMetric
          label="R²"
          value={metrics.r2}
        />

        <ErrorMetric
          label="MAE"
          value={metrics.mae}
        />

        <ErrorMetric
          label="RMSE"
          value={metrics.rmse}
        />

        <ErrorMetric
          label="Mean Error"
          value={metrics.mean_error}
        />

      </div>

      {/* Error summary */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Samples
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {summary.samples ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Underpredicted
          </p>

          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {summary.underpredicted ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Overpredicted
          </p>

          <p className="mt-2 text-2xl font-semibold text-cyan-300">
            {summary.overpredicted ?? "—"}
          </p>
        </div>

      </div>
             {/* RESIDUAL ANALYSIS */}
      <div className="mt-8">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Residual Analysis
            </p>

            <h4 className="mt-2 text-lg font-semibold">
              Error Distribution
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              Residuals show how far predictions deviate from the actual target.
            </p>
          </div>

          <div className="text-xs text-gray-600">
            {residuals.length} residuals
          </div>

        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">

          {/* HISTOGRAM */}
          <div className="flex h-64 items-end gap-2">

            {residualBins.map(
              (bin, index) => {

                const height =
                  maxBinCount > 0
                    ? (bin.count /
                        maxBinCount) *
                      100
                    : 0;

                const midpoint =
                  (bin.min + bin.max) /
                  2;

                const isNegative =
                  midpoint < 0;

                return (
                  <div
                    key={`residual-bin-${index}`}
                    className="flex h-full flex-1 flex-col justify-end"
                  >

                    <div
                      className="group relative flex items-end justify-center"
                      style={{
                        height: `${Math.max(
                          height,
                          bin.count > 0
                            ? 4
                            : 0
                        )}%`,
                      }}
                    >

                      {bin.count > 0 && (
                        <div
                          className={`w-full min-w-[10px] rounded-t-lg transition-all duration-500 ${
                            isNegative
                              ? "bg-cyan-400/60"
                              : "bg-amber-300/70"
                          }`}
                          style={{
                            height: "100%",
                          }}
                          title={`${bin.count} residuals`}
                        />
                      )}

                      {bin.count > 0 && (
                        <span className="pointer-events-none absolute -top-6 hidden text-[10px] text-gray-400 group-hover:block">
                          {bin.count}
                        </span>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* ZERO LINE / LABELS */}
          <div className="mt-3 border-t border-white/10 pt-3">

            <div className="flex justify-between text-[10px] text-gray-600">

              <span>
                -{maxAbsResidual.toFixed(0)}
              </span>

              <span>
                0
              </span>

              <span>
                +{maxAbsResidual.toFixed(0)}
              </span>

            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/60" />
              Underprediction
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              Overprediction
            </div>

          </div>

        </div>

      </div>

      {/* Largest errors */}
      <div className="mt-8">

        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Largest Prediction Errors
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">

                <tr>
                  <th className="px-5 py-4">
                    #
                  </th>

                  <th className="px-5 py-4">
                    Actual
                  </th>

                  <th className="px-5 py-4">
                    Predicted
                  </th>

                  <th className="px-5 py-4">
                    Error
                  </th>

                  <th className="px-5 py-4">
                    Absolute Error
                  </th>
                </tr>

              </thead>

              <tbody>

                {largestErrors.map(
                  (item, index) => (
                    <tr
                      key={`${item.index}-${index}`}
                      className="border-t border-white/5"
                    >

                      <td className="px-5 py-4 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 text-gray-300">
                        {item.actual}
                      </td>

                      <td className="px-5 py-4 text-gray-300">
                        {item.predicted}
                      </td>

                      <td
                        className={`px-5 py-4 font-medium ${
                          Number(item.error) >= 0
                            ? "text-amber-300"
                            : "text-cyan-300"
                        }`}
                      >
                        {item.error}
                      </td>

                      <td className="px-5 py-4 font-semibold text-white">
                        {item.absolute_error}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

            {/* Actual vs Predicted */}
      <div className="mt-8">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Actual vs Predicted
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Points closer to the diagonal represent more accurate predictions.
            </p>
          </div>

          <div className="text-xs text-gray-600">
            {actualVsPredicted.length} samples
          </div>

        </div>

        {actualVsPredicted.length === 0 ? (

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm text-gray-500">
              No actual vs predicted data is available.
            </p>
          </div>

        ) : (

          (() => {
            const validPoints =
              actualVsPredicted
                .filter((item) => {
                  const actual =
                    Number(item.actual);

                  const predicted =
                    Number(item.predicted);

                  return (
                    Number.isFinite(actual) &&
                    Number.isFinite(predicted)
                  );
                })
                .slice(0, 200);

            if (validPoints.length === 0) {
              return (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No valid prediction points are available.
                  </p>
                </div>
              );
            }

            const values = validPoints.flatMap(
              (item) => [
                Number(item.actual),
                Number(item.predicted),
              ]
            );

            const minValue = Math.min(
              ...values
            );

            const maxValue = Math.max(
              ...values
            );

            const range =
              maxValue - minValue || 1;

            const mapX = (value) =>
              40 +
              ((value - minValue) / range) *
                700;

            const mapY = (value) =>
              370 -
              ((value - minValue) / range) *
                320;

            return (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">

                <div className="overflow-x-auto">

                  <svg
                    viewBox="0 0 800 420"
                    className="h-[420px] min-w-[760px] w-full"
                    role="img"
                    aria-label="Actual versus predicted scatter plot"
                  >

                    {/* GRID */}
                    <line
                      x1="40"
                      y1="370"
                      x2="740"
                      y2="370"
                      stroke="rgba(255,255,255,0.12)"
                    />

                    <line
                      x1="40"
                      y1="50"
                      x2="40"
                      y2="370"
                      stroke="rgba(255,255,255,0.12)"
                    />

                    <line
                      x1="40"
                      y1="370"
                      x2="740"
                      y2="50"
                      stroke="rgba(255,255,255,0.12)"
                      strokeDasharray="6 6"
                    />

                    {/* Y AXIS LABEL */}
                    <text
                      x="16"
                      y="215"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="12"
                      textAnchor="middle"
                      transform="rotate(-90 16 215)"
                    >
                      Predicted
                    </text>

                    {/* X AXIS LABEL */}
                    <text
                      x="390"
                      y="405"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      Actual
                    </text>

                    {/* POINTS */}
                    {validPoints.map(
                      (item, index) => {
                        const actual =
                          Number(
                            item.actual
                          );

                        const predicted =
                          Number(
                            item.predicted
                          );

                        const x =
                          mapX(actual);

                        const y =
                          mapY(predicted);

                        const error =
                          Math.abs(
                            actual -
                              predicted
                          );

                        const radius =
                          error > range * 0.25
                            ? 4
                            : 3;

                        return (
                          <circle
                            key={`${item.index}-${index}`}
                            cx={x}
                            cy={y}
                            r={radius}
                            fill={
                              error >
                              range * 0.25
                                ? "rgba(251,113,133,0.75)"
                                : "rgba(244,63,94,0.65)"
                            }
                          >
                            <title>
                              Sample #{item.index}{" "}
                              • Actual: {actual}{" "}
                              • Predicted: {predicted}{" "}
                              • Error: {item.error}
                            </title>
                          </circle>
                        );
                      }
                    )}

                  </svg>

                </div>

                {/* LEGEND */}
                <div className="flex flex-wrap items-center gap-5 border-t border-white/10 px-5 py-4 text-xs text-gray-500">

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                    Prediction point
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-7 border-t border-dashed border-white/40" />
                    Ideal prediction
                  </div>

                  <div>
                    {validPoints.length} plotted samples
                  </div>

                </div>

              </div>
            );
          })()

        )}

      </div>

    </section>
  );
}


function ErrorMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

      <p className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value ?? "—"}
      </p>

    </div>
  );
}
function ModelReasoningCard({ experiment }) {
  const reasoning =
    experiment?.model_reasoning;

  if (!reasoning) {
    return null;
  }

  const bestModel =
    experiment?.best_model;

  const points =
    reasoning.points || [];

  return (
    <section className="rounded-3xl border border-violet-400/15 bg-violet-400/[0.03] p-7">

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-300/70">
            Model Reasoning
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Why This Model Won
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            CORTEX's explanation for the recommended model.
          </p>
        </div>

        {bestModel?.model && (
          <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200">
            {bestModel.model}
          </div>
        )}

      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            ✓
          </div>

          <p className="text-sm leading-7 text-gray-300">
            {reasoning.summary}
          </p>

        </div>

      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">

        {points.map((point, index) => (
          <div
            key={`${index}-${point}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >

            <div className="flex items-start gap-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-400">
                {index + 1}
              </div>

              <p className="text-sm leading-6 text-gray-400">
                {point}
              </p>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}
function PredictionCard({
  experiment,
  onPredictionCreated,
}) {
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] =
    useState(false);
  const [predictionError, setPredictionError] =
    useState("");

  const featureNames =
    experiment?.explainability?.features?.map(
      (item) => item.feature
    ) || [];

  if (!experiment || featureNames.length === 0) {
    return null;
  }

  const handleChange = (feature, value) => {
    setFeatures((previous) => ({
      ...previous,
      [feature]: value,
    }));
  };

  const runPrediction = async () => {
    setPredictionLoading(true);
    setPredictionError("");
    setPrediction(null);

    try {
      const numericFeatures = {};

      for (const feature of featureNames) {
        const value = Number(
          features[feature]
        );

        if (!Number.isFinite(value)) {
          throw new Error(
            `Enter a valid value for ${feature}.`
          );
        }

        numericFeatures[feature] = value;
      }

      const params = new URLSearchParams({
        experiment_id:
          experiment.experiment_id,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/api/predict?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            numericFeatures
          ),
        }
      );

      let data = null;

try {
  data = await response.json();
} catch {
  data = null;
}

      if (!response.ok) {
  let message =
    "Prediction failed.";

  if (typeof data?.detail === "string") {
    message = data.detail;
  } else if (
    data?.detail?.message
  ) {
    message = data.detail.message;
  } else if (
    Array.isArray(data?.detail)
  ) {
    message = data.detail
      .map(
        (item) =>
          item?.msg ||
          "Validation error."
      )
      .join("; ");
  }

  throw new Error(message);
}
if (
  !data?.prediction_id ||
  typeof data?.prediction !== "number"
) {
  throw new Error(
    "The prediction response was incomplete."
  );
}

      setPrediction(data);

      if (onPredictionCreated) {
        onPredictionCreated();
      }
    } catch (err) {
      setPredictionError(
        err.message ||
          "Failed to generate prediction."
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
            Model Serving
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Make a Prediction
          </h3>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Enter feature values and generate a prediction
            using the saved winning model.
          </p>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200">
          {experiment.experiment_id}
        </div>

      </div>

      {/* INPUTS */}
      <div className="mt-7">

        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-gray-500">
          Input Features
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {featureNames.map((feature) => (
            <div key={feature}>

              <label className="mb-2 block text-xs uppercase tracking-wider text-gray-500">
                {feature}
              </label>

              <input
                type="number"
                step="any"
                value={features[feature] ?? ""}
                onChange={(event) =>
                  handleChange(
                    feature,
                    event.target.value
                  )
                }
                placeholder={`Enter ${feature}`}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40 focus:bg-black/30"
              />

            </div>
          ))}

        </div>

      </div>

      {/* ERROR */}
      {predictionError && (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {predictionError}
        </div>
      )}

      {/* ACTION */}
      <button
        type="button"
        onClick={runPrediction}
        disabled={predictionLoading}
        className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {predictionLoading
          ? "Generating prediction..."
          : "Generate Prediction"}
      </button>

      {/* RESULT */}
      {prediction && (
        <div className="mt-7 overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/20">

          {/* RESULT HEADER */}
          <div className="border-b border-white/10 px-6 py-5">

            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
              Prediction Result
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Successfully generated using the saved model.
            </p>

          </div>

          {/* MAIN RESULT */}
          <div className="px-6 py-7">

            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Predicted Target
            </p>

            <p className="mt-2 text-5xl font-semibold tracking-tight text-emerald-300">
              {Number(
                prediction.prediction
              ).toFixed(2)}
            </p>

          </div>

          {/* METADATA */}
          <div className="grid border-t border-white/10 sm:grid-cols-3">

            <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Model
              </p>

              <p className="mt-2 text-sm text-gray-300">
                {prediction.model}
              </p>
            </div>

            <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Prediction ID
              </p>

              <p className="mt-2 break-all font-mono text-xs text-gray-300">
                {prediction.prediction_id ||
                  "Saved"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Generated
              </p>

              <p className="mt-2 text-sm text-gray-300">
                {prediction.created_at
                  ? new Date(
                      prediction.created_at
                    ).toLocaleString()
                  : "Just now"}
              </p>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}
function PredictionHistoryCard({
  experiment,
  refreshKey,
}) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!experiment?.experiment_id) {
      return;
    }

    const loadPredictions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/predictions/${encodeURIComponent(
            experiment.experiment_id
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Failed to load prediction history."
          );
        }

        setPredictions(
          data.predictions || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load prediction history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [
  experiment?.experiment_id,
  refreshKey,
  ]);

  if (!experiment) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.03] p-7">

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
            Prediction Tracking
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Prediction History
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Previous predictions generated using this experiment.
          </p>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
          {predictions.length} prediction
          {predictions.length === 1 ? "" : "s"}
        </div>

      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
          Loading prediction history...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        predictions.length === 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm text-gray-400">
              No predictions have been generated
              for this experiment yet.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        predictions.length > 0 && (
          <div className="mt-6 space-y-4">

            {predictions
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item.prediction_id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Prediction ID
                      </p>

                      <p className="mt-1 font-mono text-sm text-gray-300">
                        {item.prediction_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Model
                      </p>

                      <p className="mt-1 text-sm text-gray-300">
                        {item.model}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Predicted Target
                      </p>

                      <p className="mt-1 text-xl font-semibold text-cyan-300">
                        {Number(
                          item.prediction
                        ).toFixed(2)}
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">

                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Generated
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "Unknown"}
                    </p>

                  </div>

                  <details className="mt-4">

                    <summary className="cursor-pointer text-sm text-cyan-300 hover:text-cyan-200">
                      View input features
                    </summary>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                      {Object.entries(
                        item.features || {}
                      ).map(
                        ([feature, value]) => (
                          <div
                            key={feature}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                          >
                            <p className="text-xs text-gray-500">
                              {feature}
                            </p>

                            <p className="mt-1 text-sm text-gray-300">
                              {value}
                            </p>
                          </div>
                        )
                      )}

                    </div>

                  </details>

                </div>
              ))}

          </div>
        )}

    </section>
  );
}
function PerformanceMetricCharts({
  models,
}) {
  if (!models || models.length === 0) {
    return null;
  }

  const r2Values = models.map((model) =>
    Number(model.mean_r2)
  );

  const maeValues = models.map((model) =>
    Number(model.mean_mae)
  );

  const rmseValues = models.map((model) =>
    Number(model.mean_rmse)
  );

  const bestR2 = Math.max(
    ...r2Values
  );

  const bestMae = Math.min(
    ...maeValues
  );

  const bestRmse = Math.min(
    ...rmseValues
  );

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Model Performance
          </p>

          <h4 className="mt-2 text-lg font-semibold">
            Performance Charts
          </h4>

          <p className="mt-1 text-xs text-gray-600">
            Relative visual comparison of the evaluated models.
          </p>
        </div>

      </div>

      {/* CHARTS */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">

        {/* R² */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                R²
              </p>

              <p className="mt-1 text-sm font-medium">
                Predictive Performance
              </p>
            </div>

            <span className="text-xs text-gray-600">
              Higher is better
            </span>

          </div>

          <div className="mt-5 space-y-4">

            {models.map((model) => {

              const value =
                Number(model.mean_r2);

              const width =
                bestR2 > 0
                  ? (value / bestR2) * 100
                  : 0;

              const isBest =
                value === bestR2;

              return (
                <div key={`r2-${model.model}`}>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <span
                      className={
                        isBest
                          ? "truncate text-xs font-medium text-emerald-300"
                          : "truncate text-xs text-gray-400"
                      }
                    >
                      {model.model}
                    </span>

                    <span className="font-mono text-xs text-gray-300">
                      {value.toFixed(4)}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className={`h-full rounded-full ${
                        isBest
                          ? "bg-emerald-400"
                          : "bg-violet-400/50"
                      }`}
                      style={{
                        width: `${Math.min(
                          width,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* MAE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                MAE
              </p>

              <p className="mt-1 text-sm font-medium">
                Absolute Error
              </p>
            </div>

            <span className="text-xs text-gray-600">
              Lower is better
            </span>

          </div>

          <div className="mt-5 space-y-4">

            {models.map((model) => {

              const value =
                Number(model.mean_mae);

              const width =
                value > 0
                  ? (bestMae / value) * 100
                  : 0;

              const isBest =
                value === bestMae;

              return (
                <div key={`mae-${model.model}`}>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <span
                      className={
                        isBest
                          ? "truncate text-xs font-medium text-emerald-300"
                          : "truncate text-xs text-gray-400"
                      }
                    >
                      {model.model}
                    </span>

                    <span className="font-mono text-xs text-gray-300">
                      {value.toFixed(4)}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className={`h-full rounded-full ${
                        isBest
                          ? "bg-emerald-400"
                          : "bg-cyan-400/50"
                      }`}
                      style={{
                        width: `${Math.min(
                          width,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* RMSE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                RMSE
              </p>

              <p className="mt-1 text-sm font-medium">
                Overall Error
              </p>
            </div>

            <span className="text-xs text-gray-600">
              Lower is better
            </span>

          </div>

          <div className="mt-5 space-y-4">

            {models.map((model) => {

              const value =
                Number(model.mean_rmse);

              const width =
                value > 0
                  ? (bestRmse / value) * 100
                  : 0;

              const isBest =
                value === bestRmse;

              return (
                <div key={`rmse-${model.model}`}>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <span
                      className={
                        isBest
                          ? "truncate text-xs font-medium text-emerald-300"
                          : "truncate text-xs text-gray-400"
                      }
                    >
                      {model.model}
                    </span>

                    <span className="font-mono text-xs text-gray-300">
                      {value.toFixed(4)}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className={`h-full rounded-full ${
                        isBest
                          ? "bg-emerald-400"
                          : "bg-cyan-400/50"
                      }`}
                      style={{
                        width: `${Math.min(
                          width,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </div>
  );
}
function AnalyticsSummary({ experiment }) {
  if (!experiment) {
    return null;
  }

  const bestModel =
    experiment.best_model;

  const topFeature =
    experiment.explainability?.features?.[0];


  const strongestCorrelation =
  experiment.correlations?.strong_relationships?.[0] ||
  null;

  const errorSummary =
    experiment.error_analysis
      ?.error_summary || {};

  const underpredicted =
    Number(
      errorSummary.underpredicted
    ) || 0;

  const overpredicted =
    Number(
      errorSummary.overpredicted
    ) || 0;

  const totalErrors =
    underpredicted +
    overpredicted;

  return (
    <section className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.03] p-7">

      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
            CORTEX Analytics
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Analytics Summary
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Key findings extracted from model evaluation,
            explainability, correlations, and error analysis.
          </p>
        </div>

        <div className="text-xs text-gray-600">
          {experiment.experiment_id}
        </div>

      </div>

      {/* SUMMARY CARDS */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* BEST MODEL */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Best Model
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-300">
            {bestModel?.model || "—"}
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Mean R²:{" "}
            {bestModel?.mean_r2 ?? "—"}
          </p>

        </div>

        {/* TOP FEATURE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Top Feature
          </p>

          <p className="mt-2 text-lg font-semibold text-amber-300">
            {topFeature?.feature || "—"}
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Importance:{" "}
            {topFeature?.importance_percentage ?? "—"}%
          </p>

        </div>

        {/* STRONGEST CORRELATION */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Strongest Correlation
          </p>

          {strongestCorrelation ? (
            <>
              <p className="mt-2 text-sm font-semibold text-cyan-300">
                {strongestCorrelation.column_a}
                {" ↔ "}
                {strongestCorrelation.column_b}
              </p>

              <p className="mt-2 text-xs text-gray-600">
                r ={" "}
                {strongestCorrelation.correlation}
              </p>
            </>
          ) : (
            <p className="mt-2 text-lg font-semibold text-gray-400">
              —
            </p>
          )}

        </div>

        {/* ERROR BALANCE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">
            Error Balance
          </p>

          <div className="mt-2 flex items-end gap-3">

            <p className="text-lg font-semibold text-cyan-300">
              {underpredicted}
            </p>

            <span className="pb-1 text-xs text-gray-600">
              under
            </span>

            <p className="text-lg font-semibold text-amber-300">
              {overpredicted}
            </p>

            <span className="pb-1 text-xs text-gray-600">
              over
            </span>

          </div>

          <p className="mt-2 text-xs text-gray-600">
            {totalErrors} directional errors
          </p>

        </div>

      </div>

    </section>
  );
}
export default DatasetDashboard;