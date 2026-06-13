import React, { useCallback, useMemo, useState, useEffect } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import ReadabilityScorePagesDrawer from "./ReadabilityScorePagesDrawer";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";
import { getQaReadabilityApi } from "../../api/qaApi";
import { useQaDomainId } from "../../hooks/useQaDomainId";
import { useQaRefreshKey } from "../../contexts/QaScanContext";

/** All levels for the bar chart (Y-axis order from bottom to top). */
const BAR_CHART_LEVELS = [
  "Below 5th grade",
  "5th grade",
  "6th grade",
  "7th grade",
  "8th to 9th grade",
  "10th to 12th grade",
  "College",
  "College graduate",
  "Score could not be generated",
  "Language not supported",
];

const DEFAULT_READABILITY_BY_SCORE = [
  { level: "6th grade", pages: 0 },
  { level: "7th grade", pages: 0 },
  { level: "8th to 9th grade", pages: 0, isMost: true },
  { level: "10th to 12th grade", pages: 0 },
  { level: "College", pages: 0 },
];

/** Tooltip for each readability level (shown when hovering the info icon). */
const READABILITY_LEVEL_TOOLTIPS = {
  "6th grade":
    "Pages that are easy to read. Conversational English for consumers",
  "7th grade": "Plain English. Easy for most readers.",
  "8th to 9th grade": "Standard reading level. Suitable for general audiences.",
  "10th to 12th grade": "More complex language. High school level.",
  College: "Academic or professional reading level.",
  "College graduate": "Specialized or technical content.",
  "Below 5th grade": "Very easy to read.",
  "5th grade": "Easy to read.",
  "Score could not be generated":
    "Readability score could not be calculated for this content.",
  "Language not supported":
    "Language is not supported for readability scoring.",
};

function getPagesForLevel(level, byScore) {
  const row = (byScore || []).find((r) => r.level === level);
  return row?.pages ?? 0;
}

const X_AXIS_MAX_PAGES = 350;

function ReadabilityBarChart({ byScore }) {
  const chartWidth = 880;
  const barHeight = 28;
  const gap = 6;
  const padding = { left: 200, right: 24, top: 24, bottom: 48 };
  const chartHeight =
    10 * (barHeight + gap) - gap + padding.top + padding.bottom;
  const barAreaWidth = chartWidth - padding.left - padding.right - 40;
  const barColor = "#3b82f6";
  const xAxisCenterX =
    padding.left + (chartWidth - padding.left - padding.right) / 2;
  const tickLabelY = chartHeight - 28;
  const pagesLabelY = chartHeight - 10;

  return (
    <div className="w-100">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-100"
        style={{ maxWidth: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* X-axis tick labels (above the "Pages" label to avoid overlap) */}
        {[0, 50, 100, 150, 200, 250, 300, 350].map((tick) => {
          const x =
            padding.left +
            (tick / 350) * (chartWidth - padding.left - padding.right - 40);
          return (
            <g key={tick}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={chartHeight - padding.bottom}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={x}
                y={tickLabelY}
                textAnchor="middle"
                className="text-muted"
                fill="currentColor"
                style={{ fontSize: 14 }}
              >
                {tick}
              </text>
            </g>
          );
        })}
        {/* X-axis "Pages" label - below tick numbers with clear gap */}
        <text
          x={xAxisCenterX}
          y={pagesLabelY}
          textAnchor="middle"
          className="text-muted"
          fill="currentColor"
          style={{ fontSize: 14 }}
        >
          Pages
        </text>
        {/* Y-axis levels and bars */}
        {BAR_CHART_LEVELS.map((level, i) => {
          const pages = getPagesForLevel(level, byScore);
          const y = padding.top + i * (barHeight + gap) + barHeight / 2;
          const barW = (pages / X_AXIS_MAX_PAGES) * barAreaWidth;
          return (
            <g key={level}>
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-body"
                fill="currentColor"
                style={{ fontSize: 14 }}
              >
                {level}
              </text>
              <rect
                x={padding.left}
                y={y - barHeight / 2}
                width={Math.max(barW, 0)}
                height={barHeight}
                fill={barColor}
                rx={2}
                data-level={level}
                data-pages={pages}
                {...(pages > 0 ? { title: `${level} — Pages: ${pages}` } : {})}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ReadabilityDonutChart({ mostLevel, mostPercent, totalPages }) {
  const percent = mostPercent;
  const radius = 72;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;
  const gap = circumference - filled;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <p className="text-center mb-1 fs-13 text-muted">
        Most of your pages have the readability level
      </p>
      <p
        className="text-center mb-3 mb-md-4 fw-bold text-body"
        style={{ fontSize: "1.1rem" }}
      >
        {mostLevel}
      </p>
      <div
        className="position-relative d-inline-flex align-items-center justify-content-center"
        style={{
          width: radius * 2 + stroke * 2,
          height: radius * 2 + stroke * 2,
        }}
      >
        <svg
          width={radius * 2 + stroke * 2}
          height={radius * radius + stroke * 2}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
          />
        </svg>
        <div
          className="position-absolute text-center px-2"
          style={{ maxWidth: 90, lineHeight: 1.2 }}
        >
          <span
            className="d-block fw-bold text-body"
            style={{ fontSize: "1.5rem" }}
          >
            {percent} %
          </span>
          <span className="d-block text-muted" style={{ fontSize: "0.7rem" }}>
            (of approx. {totalPages.toLocaleString()} pages)
          </span>
        </div>
      </div>
    </div>
  );
}

function toPageDetailsPage(p) {
  return { id: 0, title: p.title, url: p.url };
}

export default function ReadabilitySummaryView() {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [readabilityData, setReadabilityData] = useState(null);
  const [selectedScoreLevel, setSelectedScoreLevel] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [pageDetailsPage, setPageDetailsPage] = useState(null);
  const reportName = "Readability-Summary-Report";
  const baseName = safeFilename(reportName);

  useEffect(() => {
    if (!domainId) return;
    getQaReadabilityApi(domainId).then((res) => {
      if (res.success) setReadabilityData(res.data);
    });
  }, [domainId, refreshKey]);

  const READABILITY_BY_SCORE = useMemo(() => {
    const dist = readabilityData?.distribution;
    if (!dist?.length) return DEFAULT_READABILITY_BY_SCORE;
    const most = readabilityData.mostCommonLevel;
    return dist.map((d) => ({
      level: d.level,
      pages: d.count,
      isMost: d.level === most,
    }));
  }, [readabilityData]);

  const TOTAL_PAGES_APPROX = readabilityData?.totalPages || 0;
  const MOST_LEVEL = readabilityData?.mostCommonLevel || "—";
  const MOST_PAGES = readabilityData?.pagesAtMostCommon || 0;
  const MOST_PERCENT =
    TOTAL_PAGES_APPROX > 0
      ? Math.round((MOST_PAGES / TOTAL_PAGES_APPROX) * 1000) / 10
      : 0;

  const exportRows = useMemo(
    () =>
      BAR_CHART_LEVELS.map((level) => ({
        level,
        pages: getPagesForLevel(level, READABILITY_BY_SCORE),
      })),
    [READABILITY_BY_SCORE],
  );

  const exportCSV = useCallback(() => {
    const header = "Readability level,Pages\n";
    const body = exportRows
      .map((r) => `"${r.level.replace(/"/g, '""')}",${r.pages}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, exportRows]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = exportRows.map((r) => ({
      "Readability level": r.level,
      Pages: r.pages,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Readability Summary");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, exportRows]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Readability level", "Pages"]];
    const body = exportRows.map((r) => [r.level, String(r.pages)]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 24 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName, exportRows]);

  return (
    <div className="readability-summary-view">
      {/* Top header: title + filter, download report, user icons */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
            style={{ width: 40, height: 40 }}
          >
            <i className="isax isax-home-2 fs-20" aria-hidden="true" />
          </span>
          <h5 className="mb-0 fw-semibold text-body">Readability Summary</h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Download Report"
            >
              <i
                className="isax isax-document-download text-primary fs-18"
                aria-hidden="true"
              />
              Download Report
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportCSV}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  />
                  CSV
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportPDF}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  />
                  PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportExcel}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  />
                  Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main card: Readability Summary + bar chart + donut */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <h6 className="fw-semibold text-body mb-1">Readability Summary</h6>
          <p className="fs-13 text-muted mb-4">
            Readability scores across all web pages (based on Flesch Kincaid)
          </p>
          <div className="row align-items-start g-4">
            <div className="col-lg-8">
              <ReadabilityBarChart byScore={READABILITY_BY_SCORE} />
            </div>
            <div className="col-lg-4 d-flex justify-content-center justify-content-lg-start">
              <ReadabilityDonutChart
                mostLevel={MOST_LEVEL}
                mostPercent={MOST_PERCENT}
                totalPages={TOTAL_PAGES_APPROX}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Readability by score */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-4">
          <h6 className="fw-semibold text-body mb-3">Readability by score</h6>
          <div className="table-responsive">
            <table className="table table-borderless align-middle mb-0">
              <tbody>
                {READABILITY_BY_SCORE.map((row) => (
                  <tr
                    key={row.level}
                    className="border-bottom border-secondary border-opacity-25"
                  >
                    <td className="py-3 ps-0">
                      <span className="d-inline-flex align-items-center gap-2 text-body">
                        {row.level}
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 min-w-auto text-muted text-decoration-none"
                          style={{ minWidth: 20 }}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          data-bs-title={
                            READABILITY_LEVEL_TOOLTIPS[row.level] ?? ""
                          }
                          title={
                            READABILITY_LEVEL_TOOLTIPS[row.level] ?? undefined
                          }
                          aria-label={`Info for ${row.level}`}
                        >
                          <i
                            className="isax isax-info-circle fs-16"
                            aria-hidden="true"
                          />
                        </button>
                        {row.isMost && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill fs-12 fw-normal">
                            Most pages have this readability level
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pe-0 text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-primary text-decoration-none fw-medium"
                        aria-label={`${row.pages} pages with ${row.level} readability`}
                        title="View pages with this readability level"
                        onClick={() => setSelectedScoreLevel(row.level)}
                      >
                        {row.pages} {row.pages === 1 ? "PAGE" : "PAGES"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ReadabilityScorePagesDrawer
        open={selectedScoreLevel != null}
        onClose={() => setSelectedScoreLevel(null)}
        scoreLevel={selectedScoreLevel}
        totalCount={
          selectedScoreLevel != null
            ? READABILITY_BY_SCORE.find((r) => r.level === selectedScoreLevel)
                ?.pages
            : undefined
        }
        pages={[]}
        domainId={domainId}
        onOpenPageDetails={(page) => {
          setPageDetailsPage(toPageDetailsPage(page));
          setSelectedScoreLevel(null);
          setPageDetailsOpen(true);
        }}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsOpen}
        onClose={() => {
          setPageDetailsOpen(false);
          setPageDetailsPage(null);
        }}
        page={pageDetailsPage}
        defaultQaSubView="readability"
      />
    </div>
  );
}
