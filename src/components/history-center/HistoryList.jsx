import { Link, useLocation } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import HeartbeatDateRangePicker from "../heartbeat/HeartbeatDateRangePicker";
import { DOMAINS } from "../../lib/domains-config";

const LANDING_NAV = [
  { href: "/home", label: "Domain Overview", icon: "isax-global" },
  { href: "/home/users", label: "Users", icon: "isax-people" },
  { href: "/home/policies", label: "Policies", icon: "isax-shield-tick" },
  {
    href: "/home/history-center",
    label: "History center",
    icon: "isax-chart-2",
  },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_ROWS_PER_PAGE = 10;

const CHART_LEGEND = [
  { label: "Pages with accessibility issues", color: "#8b5cf6" },
  { label: "Pages with SEO opportunities", color: "#f97316" },
  { label: "Pages with QA issues", color: "#38bdf8" },
  { label: "Pages with policy issues", color: "#ec4899" },
  { label: "Pages crawled", color: "#2563eb" },
  { label: "Documents crawled", color: "#22c55e" },
];

const DEFAULT_START = new Date(2025, 11, 2); // Dec 2, 2025
const DEFAULT_END = new Date(2026, 2, 2); // Mar 2, 2026

// Helper functions
function csvCell(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function triggerCsvDownload(filename, csvText) {
  const blob = new Blob(["\ufeff", csvText], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function HistoryList({ data = [] }) {
  const pathname = useLocation().pathname;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  const totalPages = Math.max(
    1,
    Math.ceil(data.length / rowsPerPage),
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [currentPage, rowsPerPage, data]);

  const downloadHistoryReport = useCallback(() => {
    const headers = [
      "Crawled at",
      "Pages with Accessibility Issues",
      "Pages with SEO Opportunities",
      "Pages with QA Issues",
      "Pages with Policy Issues",
      "Pages crawled",
      "Documents crawled",
      "Changes since previous crawl",
    ];

    const rows = data.map((r) =>
      [
        r.crawledAt,
        r.accessibilityIssues,
        r.seoOpportunities,
        r.qaIssues,
        r.policyIssues,
        r.pagesCrawled,
        r.documentsCrawled,
        r.changesPct,
      ]
        .map(csvCell)
        .join(","),
    );

    const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
    const date = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(`history-center-report-${date}.csv`, csv);
  }, [data]);

  return (
    <div className="content landing-content">
      {/* Navigation Tabs */}
      <div className="landing-nav-tabs">
        <div className="landing-nav-tabs-inner">
          {LANDING_NAV.map((item) => {
            const isActive =
              (pathname === "/home" && item.label === "Domain Overview") ||
              (pathname === "/home/users" && item.label === "Users") ||
              (pathname === "/home/policies" && item.label === "Policies") ||
              (pathname === "/home/history-center" &&
                item.label === "History center");

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`landing-pill ${isActive ? "landing-pill-active" : "landing-pill-inactive"}`}
              >
                <i
                  className={`isax ${item.icon} landing-pill-icon`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="domain-overview-section">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="domain-overview-title mb-1">History Center</h1>
            <p className="domain-overview-subtitle text-muted mb-0">
              Track changes across domains and modules
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={downloadHistoryReport}
            aria-label="Download report"
          >
            <i className="isax isax-document-download" aria-hidden="true" />
            Download Report
          </button>
        </div>

        {/* Filters */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <select
            className="form-select form-select-sm"
            style={{ width: "auto", minWidth: 180 }}
            aria-label="Domain"
          >
            <option>Example Domain-500</option>
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: "auto", minWidth: 260 }}
            aria-label="Module"
          >
            <optgroup label="All modules - Content with Issues">
              <option value="all">All modules - Content with Issues</option>
              <option value="seo">SEO</option>
              <option value="qa">Quality Assurance</option>
              <option value="policies">Policies</option>
              <option value="accessibility">Accessibility</option>
              <option value="readability">Readability</option>
              <option value="performance">Performance</option>
            </optgroup>
          </select>

          <Link to="/" className="btn btn-outline-primary btn-sm">
            Go to domain
          </Link>
        </div>

        {/* Date Range Picker */}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
          <div className="d-flex align-items-center gap-2 text-muted small">
            <span>Changes in selected time frame:</span>
            <HeartbeatDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              highlightIcon={true}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted small fw-medium mb-1">
                  Total amount of content
                </h6>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-4 fw-bold text-body">500</span>
                  <span className="text-muted small">0%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1">
                  Content with issues
                  <i
                    className="isax isax-information text-muted"
                    style={{ fontSize: "0.75rem" }}
                    aria-hidden="true"
                  />
                </h6>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-4 fw-bold text-body">500</span>
                  <span className="text-muted small">0%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1">
                  Total number of issues
                  <i
                    className="isax isax-information text-muted"
                    style={{ fontSize: "0.75rem" }}
                    aria-hidden="true"
                  />
                </h6>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-4 fw-bold text-body">219,255</span>
                  <span className="text-success small d-flex align-items-center gap-1">
                    <i className="isax isax-arrow-down-3" aria-hidden="true" />{" "}
                    40.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <h6 className="mb-0 fw-semibold text-body">Trend over time</h6>
            </div>

            <div
              style={{ height: 280 }}
              className="d-flex align-items-center justify-content-center bg-body-tertiary bg-opacity-25 rounded-3 mb-3"
            >
              <svg
                width="100%"
                height="260"
                viewBox="0 0 700 260"
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
              >
                <line
                  x1="48"
                  y1="220"
                  x2="652"
                  y2="220"
                  stroke="var(--bs-border-color)"
                  strokeWidth="1"
                />
                <line
                  x1="48"
                  y1="36"
                  x2="48"
                  y2="220"
                  stroke="var(--bs-border-color)"
                  strokeWidth="1"
                />
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  points="80,60 180,80 280,70 380,90 480,85 580,95"
                />
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points="80,200 180,180 280,160 380,140 480,120 580,100"
                />
                <text
                  x="350"
                  y="250"
                  textAnchor="middle"
                  className="small text-muted"
                  fill="currentColor"
                >
                  Dec 10
                </text>
                <text
                  x="100"
                  y="30"
                  textAnchor="middle"
                  className="small text-muted"
                  fill="currentColor"
                >
                  Pages
                </text>
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="d-flex flex-wrap gap-3 gap-md-4">
              {CHART_LEGEND.map((item) => (
                <span
                  key={item.label}
                  className="d-flex align-items-center gap-1 small text-muted"
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color,
                      borderRadius: 2,
                    }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                      Crawled at
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Pages with Accessibility Issues
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Pages with SEO Opportunities
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Pages with QA Issues
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Pages with Policy Issues
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Pages crawled
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Documents crawled
                    </th>
                    <th className="py-3 pe-4 text-body fs-13 fw-semibold">
                      Changes since previous crawl
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 ps-4">{row.crawledAt}</td>
                      <td className="py-3">{row.accessibilityIssues}</td>
                      <td className="py-3">{row.seoOpportunities}</td>
                      <td className="py-3">{row.qaIssues}</td>
                      <td className="py-3">{row.policyIssues}</td>
                      <td className="py-3">{row.pagesCrawled}</td>
                      <td className="py-3">{row.documentsCrawled}</td>
                      <td className="py-3 pe-4">{row.changesPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-muted small">
                {(currentPage - 1) * rowsPerPage + 1}–
                {Math.min(currentPage * rowsPerPage, data.length)} of{" "}
                {data.length}
              </span>
            </div>

            <nav aria-label="History table pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous"
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                  if (p > totalPages) return null;
                  return (
                    <li key={p} className="page-item">
                      <button
                        type="button"
                        className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  );
                })}

                <li
                  className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    aria-label="Next"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
