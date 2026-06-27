import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState, useEffect } from "react";
import HeartbeatDateRangePicker from "../heartbeat/HeartbeatDateRangePicker";
import { getDomainsApi, getDomainScanHistoryApi } from "../../api/domainApi";

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
  { label: "Pages crawled", color: "#2563eb" }
];

const DEFAULT_END = new Date();
const DEFAULT_START = new Date(new Date().setMonth(new Date().getMonth() - 6)); // 6 months ago

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

export default function HistoryList() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();

  const [domains, setDomains] = useState([]);
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [selectedModule, setSelectedModule] = useState("all");

  // Load domains
  useEffect(() => {
    async function loadDomains() {
      try {
        const response = await getDomainsApi(1, 100);
        if (response && response.success) {
          const list = response.data.domains || [];
          setDomains(list);
          if (list.length > 0) {
            setSelectedDomainId(list[0]._id || list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load domains:", err);
      }
    }
    loadDomains();
  }, []);

  // Load history data when selected domain changes
  useEffect(() => {
    if (!selectedDomainId) return;
    async function loadHistory() {
      try {
        setLoading(true);
        const response = await getDomainScanHistoryApi(selectedDomainId);
        if (response && response.success) {
          setHistoryData(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load scan history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [selectedDomainId]);

  // Map backend history data to grid rows
  const formattedRows = useMemo(() => {
    return historyData.map((summary, index) => {
      const rawDate = summary.lastScanDate || summary.createdAt;
      const crawledAtDate = new Date(rawDate);
      const crawledAt = crawledAtDate.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      // Accessibility issues count
      const accessibilityCount = summary.performanceMetrics?.avgAccessibilityScore !== undefined ? 
                                 Math.round((summary.totalPages || 1) * (Math.max(0, 100 - summary.performanceMetrics.avgAccessibilityScore) / 100)) : 0;

      const policyCount = summary.policySummary?.totalHits || 0;
      const seoCount = summary.totalUniqueIssues || 0;
      const qaCount = summary.issueBreakdown?.low || 0;
      const totalPages = summary.totalPages || 0;

      // Calculate changesPct compared to the next chronological item (which is index + 1 in a descending sorted array)
      let changesPct = "0%";
      const prevSummary = historyData[index + 1];
      if (prevSummary) {
        const currentTotal = accessibilityCount + policyCount + seoCount + qaCount;
        const prevAccessibilityCount = prevSummary.performanceMetrics?.avgAccessibilityScore !== undefined ? 
                                      Math.round((prevSummary.totalPages || 1) * (Math.max(0, 100 - prevSummary.performanceMetrics.avgAccessibilityScore) / 100)) : 0;
        const prevTotal = (prevSummary.policySummary?.totalHits || 0) + 
                          (prevSummary.totalUniqueIssues || 0) + 
                          (prevSummary.issueBreakdown?.low || 0) + 
                          prevAccessibilityCount;
        if (prevTotal > 0) {
          const diff = currentTotal - prevTotal;
          const pct = Math.round((diff / prevTotal) * 100);
          changesPct = pct > 0 ? `+${pct}%` : `${pct}%`;
        }
      }

      return {
        id: summary._id || index,
        rawDate: crawledAtDate,
        crawledAt,
        accessibilityIssues: accessibilityCount,
        seoOpportunities: seoCount,
        qaIssues: qaCount,
        policyIssues: policyCount,
        pagesCrawled: totalPages,
        documentsCrawled: totalPages,
        changesPct
      };
    });
  }, [historyData]);

  // Filter rows by date range
  const filteredRows = useMemo(() => {
    return formattedRows.filter(r => {
      const d = r.rawDate;
      return d >= startDate && d <= endDate;
    });
  }, [formattedRows, startDate, endDate]);

  const totalPagesCount = Math.max(
    1,
    Math.ceil(filteredRows.length / rowsPerPage),
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [currentPage, rowsPerPage, filteredRows]);

  // CSV Export
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

    const rows = filteredRows.map((r) =>
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
  }, [filteredRows]);

  // Chart data calculations
  const chartPoints = useMemo(() => {
    if (filteredRows.length === 0) {
      return { accessibility: "", seo: "", qa: "", policy: "", pages: "", dates: [] };
    }

    // Take up to 10 entries from filtered rows, reverse to order chronological (left to right)
    const chartRows = [...filteredRows].slice(0, 10).reverse();
    const count = chartRows.length;
    
    // Find max value to scale the Y axis
    const maxVal = Math.max(
      10,
      ...chartRows.map(r => Math.max(r.accessibilityIssues, r.seoOpportunities, r.qaIssues, r.policyIssues, r.pagesCrawled))
    );

    const xStart = 50;
    const xEnd = 650;
    const yStart = 200; // bottom of graph
    const yEnd = 40;   // top of graph

    const getX = (idx) => {
      if (count <= 1) return (xStart + xEnd) / 2;
      return xStart + (idx * (xEnd - xStart)) / (count - 1);
    };

    const getY = (val) => {
      return yStart - (val * (yStart - yEnd)) / maxVal;
    };

    const accessibility = chartRows.map((r, idx) => `${getX(idx)},${getY(r.accessibilityIssues)}`).join(" ");
    const seo = chartRows.map((r, idx) => `${getX(idx)},${getY(r.seoOpportunities)}`).join(" ");
    const qa = chartRows.map((r, idx) => `${getX(idx)},${getY(r.qaIssues)}`).join(" ");
    const policy = chartRows.map((r, idx) => `${getX(idx)},${getY(r.policyIssues)}`).join(" ");
    const pages = chartRows.map((r, idx) => `${getX(idx)},${getY(r.pagesCrawled)}`).join(" ");

    const dates = chartRows.map((r, idx) => {
      const label = r.rawDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { x: getX(idx), label };
    });

    return { accessibility, seo, qa, policy, pages, dates };
  }, [filteredRows]);

  // Navigate back to selected Domain Overview
  const handleGoToDomain = () => {
    const selectedDomain = domains.find(d => (d._id || d.id) === selectedDomainId);
    if (selectedDomain) {
      window.dispatchEvent(
        new CustomEvent("sitemonitor:select-domain", {
          detail: { domainId: selectedDomain._id || selectedDomain.id, domain: selectedDomain }
        })
      );
      navigate("/home");
    }
  };

  const latestScan = filteredRows[0] || {};
  const latestSummary = historyData[0] || {};

  // Total issues calculation
  const totalIssuesCount = latestScan ? 
                           (latestScan.accessibilityIssues || 0) + 
                           (latestScan.seoOpportunities || 0) + 
                           (latestScan.qaIssues || 0) + 
                           (latestScan.policyIssues || 0) : 0;

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
            disabled={filteredRows.length === 0}
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
            value={selectedDomainId}
            onChange={(e) => {
              setSelectedDomainId(e.target.value);
              setCurrentPage(1);
            }}
          >
            {domains.map((d) => (
              <option key={d._id || d.id} value={d._id || d.id}>
                {d.dm_title || d.dm_url}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: "auto", minWidth: 260 }}
            aria-label="Module"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <optgroup label="All modules - Content with Issues">
              <option value="all">All modules - Content with Issues</option>
              <option value="seo">SEO</option>
              <option value="qa">Quality Assurance</option>
              <option value="policies">Policies</option>
              <option value="accessibility">Accessibility</option>
            </optgroup>
          </select>

          <button 
            type="button" 
            onClick={handleGoToDomain}
            className="btn btn-outline-primary btn-sm"
            disabled={!selectedDomainId}
          >
            Go to domain
          </button>
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
                setCurrentPage(1);
              }}
              highlightIcon={true}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Retrieving history data...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center">
            <i className="isax isax-folder-open text-muted mb-3" style={{ fontSize: "3rem" }}></i>
            <h5 className="text-muted">No History Found</h5>
            <p className="text-muted mb-0">We couldn't find scan summaries in the selected date range.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="text-muted small fw-medium mb-1">
                      Total pages crawled
                    </h6>
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="fs-4 fw-bold text-body">{latestScan.pagesCrawled || 0}</span>
                      <span className="text-muted small">pages</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="text-muted small fw-medium mb-1 d-flex align-items-center gap-1">
                      Average SEO Score
                      <i
                        className="isax isax-information text-muted"
                        style={{ fontSize: "0.75rem" }}
                        aria-hidden="true"
                      />
                    </h6>
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="fs-4 fw-bold text-body">
                        {latestSummary.finalSeoScore !== undefined ? `${latestSummary.finalSeoScore}%` : "0%"}
                      </span>
                      <span className="text-muted small">health</span>
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
                      <span className="fs-4 fw-bold text-body">{totalIssuesCount}</span>
                      <span className={`small d-flex align-items-center gap-1 ${latestScan.changesPct?.startsWith("-") ? "text-success" : latestScan.changesPct?.startsWith("+") ? "text-danger" : "text-muted"}`}>
                        {latestScan.changesPct?.startsWith("-") ? (
                          <i className="isax isax-arrow-down-3" aria-hidden="true" />
                        ) : latestScan.changesPct?.startsWith("+") ? (
                          <i className="isax isax-arrow-up-3" aria-hidden="true" />
                        ) : null}
                        {latestScan.changesPct}
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
                    {/* Y Grid Lines */}
                    <line x1="48" y1="200" x2="652" y2="200" stroke="var(--bs-border-color)" strokeWidth="1" />
                    <line x1="48" y1="120" x2="652" y2="120" stroke="var(--bs-border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="48" y1="40" x2="652" y2="40" stroke="var(--bs-border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="48" y1="40" x2="48" y2="200" stroke="var(--bs-border-color)" strokeWidth="1" />

                    {(selectedModule === "all" || selectedModule === "accessibility") && chartPoints.accessibility && (
                      <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" points={chartPoints.accessibility} />
                    )}
                    {(selectedModule === "all" || selectedModule === "seo") && chartPoints.seo && (
                      <polyline fill="none" stroke="#f97316" strokeWidth="2.5" points={chartPoints.seo} />
                    )}
                    {(selectedModule === "all" || selectedModule === "qa") && chartPoints.qa && (
                      <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={chartPoints.qa} />
                    )}
                    {(selectedModule === "all" || selectedModule === "policies") && chartPoints.policy && (
                      <polyline fill="none" stroke="#ec4899" strokeWidth="2.5" points={chartPoints.policy} />
                    )}
                    {selectedModule === "all" && chartPoints.pages && (
                      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={chartPoints.pages} />
                    )}

                    {/* Date labels */}
                    {chartPoints.dates.map((d, i) => (
                      <g key={i}>
                        <line x1={d.x} y1="200" x2={d.x} y2="205" stroke="var(--bs-border-color)" strokeWidth="1" />
                        <text
                          x={d.x}
                          y="225"
                          textAnchor="middle"
                          className="small text-muted"
                          fill="currentColor"
                          style={{ fontSize: "10px" }}
                        >
                          {d.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Chart Legend */}
                <div className="d-flex flex-wrap gap-3 gap-md-4">
                  {CHART_LEGEND.filter(item => {
                    if (selectedModule === "all") return true;
                    if (selectedModule === "seo" && item.label.includes("SEO")) return true;
                    if (selectedModule === "qa" && item.label.includes("QA")) return true;
                    if (selectedModule === "policies" && item.label.includes("policy")) return true;
                    if (selectedModule === "accessibility" && item.label.includes("accessibility")) return true;
                    return false;
                  }).map((item) => (
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
                          <td className="py-3 pe-4">
                            <span className={row.changesPct.startsWith("-") ? "text-success fw-semibold" : row.changesPct.startsWith("+") ? "text-danger fw-semibold" : "text-muted"}>
                              {row.changesPct}
                            </span>
                          </td>
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
                    {Math.min(currentPage * rowsPerPage, filteredRows.length)} of{" "}
                    {filteredRows.length}
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

                    {Array.from({ length: Math.min(totalPagesCount, 10) }, (_, i) => {
                      const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                      if (p > totalPagesCount) return null;
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
                      className={`page-item ${currentPage >= totalPagesCount ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPagesCount, p + 1))
                        }
                        disabled={currentPage >= totalPagesCount}
                        aria-label="Next"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
