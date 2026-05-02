import React from "react";

/** Language tag analysis: category and page count for the bar chart. */
const LANGUAGE_TAG_ANALYSIS = [
  { label: "Pages without issues", pages: 499, color: "#22c55e" },
  { label: "Pages with issues", pages: 1, color: "#ef4444" },
  { label: "Pages with multiple languages detected", pages: 1, color: "#94a3b8" },
  { label: "Pages with insufficient text for language detection", pages: 1, color: "#94a3b8" },
];

const X_AXIS_MAX = 500;
const CHART_WIDTH = 880;
const BAR_HEIGHT = 32;
const BAR_GAP = 8;
const PADDING = { left: 280, right: 24, top: 24, bottom: 48 };

function LanguageTagAnalysisChart() {
  const chartHeight = LANGUAGE_TAG_ANALYSIS.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP + PADDING.top + PADDING.bottom;
  const barAreaWidth = CHART_WIDTH - PADDING.left - PADDING.right - 40;
  const xAxisCenterX = PADDING.left + (CHART_WIDTH - PADDING.left - PADDING.right - 40) / 2;
  const tickLabelY = chartHeight - 28;
  const pagesLabelY = chartHeight - 10;
  const ticks = [0, 100, 200, 300, 400, 500];

  return (
    <div className="w-100">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
        className="w-100"
        style={{ maxWidth: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((tick) => {
          const x = PADDING.left + (tick / X_AXIS_MAX) * barAreaWidth;
          return (
            <g key={tick}>
              <line x1={x} y1={PADDING.top} x2={x} y2={chartHeight - PADDING.bottom} stroke="#e2e8f0" strokeWidth="1" />
              <text x={x} y={tickLabelY} textAnchor="middle" className="text-muted" fill="currentColor" style={{ fontSize: 14 }}>
                {tick}
              </text>
            </g>
          );
        })}
        <text x={xAxisCenterX} y={pagesLabelY} textAnchor="middle" className="text-muted" fill="currentColor" style={{ fontSize: 14 }}>
          Pages
        </text>
        {LANGUAGE_TAG_ANALYSIS.map((row, i) => {
          const y = PADDING.top + i * (BAR_HEIGHT + BAR_GAP) + BAR_HEIGHT / 2;
          const barW = (row.pages / X_AXIS_MAX) * barAreaWidth;
          return (
            <g key={row.label}>
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-body"
                fill="currentColor"
                style={{ fontSize: 14 }}
              >
                {row.label}
              </text>
              <rect
                x={PADDING.left}
                y={y - BAR_HEIGHT / 2}
                width={Math.max(barW, 0)}
                height={BAR_HEIGHT}
                fill={row.color}
                rx={2}
              >
                <title>{`${row.label}: ${row.pages} pages`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Detected: 1 language, 499 pages, 1 undetected. Declared: English 499, Indonesian 1. */
const DETECTED_LANGUAGES = [{ code: "en", name: "English (en)", pages: 499 }];
const DETECTED_UNDETECTED = 1;
const DECLARED_LANGUAGES = [
  { code: "en", name: "English (en)", pages: 499, color: "#3b82f6" },
  { code: "id", name: "Indonesian (id)", pages: 1, color: "#22c55e" },
];
const TOTAL_PAGES = 500;

export default function LanguageValidationSummaryView() {
  const detectedTotal = DETECTED_LANGUAGES.reduce((s, l) => s + l.pages, 0);
  const declaredTotal = DECLARED_LANGUAGES.reduce((s, l) => s + l.pages, 0);

  return (
    <div className="language-validation-summary-view">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary fw-bold"
            style={{ width: 40, height: 40, fontSize: "0.85rem" }}
            aria-hidden="true"
          >
            AB
          </span>
          <div>
            <h5 className="mb-0 fw-semibold text-body">Language Validation summary</h5>
            <p className="text-muted fs-13 mb-0 mt-1">Identify pages with incorrect or missing language tags.</p>
          </div>
        </div>
      </div>

      {/* Language tag analysis */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <h6 className="fw-semibold text-body mb-3">Language tag analysis</h6>
          <LanguageTagAnalysisChart />
        </div>
      </div>

      {/* Language distribution */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-4">
          <h6 className="fw-semibold text-body mb-4">Language distribution</h6>

          <div className="d-flex flex-column gap-4">
            {/* Detected languages */}
            <div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <span className="fw-medium text-body">Detected languages</span>
                <span className="text-muted fs-13">
                  {DETECTED_LANGUAGES.length} different detected languages across {detectedTotal} pages ({DETECTED_UNDETECTED} pages undetected)
                </span>
              </div>
              <div
                className="rounded-3 overflow-hidden d-flex align-items-center justify-content-center text-white fw-semibold"
                style={{ height: 48, backgroundColor: "#3b82f6", fontSize: "1.1rem" }}
                role="img"
                aria-label={`${detectedTotal} pages detected`}
              >
                {detectedTotal}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
                {DETECTED_LANGUAGES.map((lang) => (
                  <span key={lang.code} className="d-inline-flex align-items-center gap-2 fs-13 text-body">
                    <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: 10, height: 10, backgroundColor: "#3b82f6" }} aria-hidden="true"></span>
                    {lang.name} {lang.pages} pages
                  </span>
                ))}
              </div>
            </div>

            {/* Declared languages */}
            <div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <span className="fw-medium text-body">Declared languages</span>
                <span className="text-muted fs-13">
                  {DECLARED_LANGUAGES.length} different declared languages across {declaredTotal} pages
                </span>
              </div>
              <div className="d-flex rounded-3 overflow-hidden" style={{ height: 48 }}>
                {DECLARED_LANGUAGES.map((lang) => {
                  const pct = (lang.pages / TOTAL_PAGES) * 100;
                  const isWide = pct >= 15;
                  return (
                    <div
                      key={lang.code}
                      className="d-flex align-items-center justify-content-center text-white fw-semibold"
                      style={{
                        width: `${pct}%`,
                        minWidth: pct > 0 ? 24 : 0,
                        backgroundColor: lang.color,
                        fontSize: isWide ? "1.1rem" : "0.85rem",
                      }}
                      role="img"
                      aria-label={`${lang.name} ${lang.pages} pages`}
                    >
                      {lang.pages}
                    </div>
                  );
                })}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
                {DECLARED_LANGUAGES.map((lang) => (
                  <span key={lang.code} className="d-inline-flex align-items-center gap-2 fs-13 text-body">
                    <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: 10, height: 10, backgroundColor: lang.color }} aria-hidden="true"></span>
                    {lang.name} {lang.pages} page{lang.pages !== 1 ? "s" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

