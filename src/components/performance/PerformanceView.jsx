import React, { useState, useEffect, useRef } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsDrawer from "@/components/prioritized-content/PageDetailsDrawer";
import performanceApi from "@/api/performanceApi";
import { triggerDomainScanApi, getDomainByIdApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const PerformanceView = () => {
  const [summary, setSummary] = useState(null);
  const [pages, setPages] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const searchTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchPerformanceData = async (resetPage = false) => {
    if (!domainId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const activePage = resetPage ? 1 : currentPage;
      if (resetPage) setCurrentPage(1);

      // 1. Fetch Summary
      const summaryRes = await performanceApi.getSummary(domainId);
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }

      // 2. Fetch Pages
      const pagesRes = await performanceApi.getPages(domainId, {
        page: activePage,
        limit: pageSize,
        search: searchQuery,
        sortBy,
        sortOrder
      });

      if (pagesRes.success) {
        setPages(pagesRes.data.pages || []);
        setTotal(pagesRes.data.total || 0);
        setTotalPages(pagesRes.data.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkScanStatus = async () => {
    if (!domainId) return;
    try {
      const res = await getDomainByIdApi(domainId);
      if (res.success && res.data) {
        const status = res.data.dm_seo_status;
        if (status === "pending" || status === "scanning") {
          setScanning(true);
        } else {
          // Scan is completed or failed
          if (scanning) {
            // Reload performance stats as scan is done
            fetchPerformanceData(true);
          }
          setScanning(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error("Error checking scan status:", error);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [currentPage, pageSize, sortBy, sortOrder]);

  // Handle active status polling on mount or when domainId changes
  useEffect(() => {
    if (!domainId) return;

    checkScanStatus();
    
    pollIntervalRef.current = setInterval(checkScanStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [domainId]);

  const handleRunScan = async () => {
    if (!domainId || scanning) return;
    try {
      setScanning(true);
      setScanMessage("");
      const response = await triggerDomainScanApi(domainId);
      if (response.success) {
        setScanMessage("Scan triggered successfully! Page speed metrics and Core Web Vitals are compiling in the background...");
        // Auto-clear message after 6 seconds
        setTimeout(() => setScanMessage(""), 6000);

        // Start active polling immediately
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(checkScanStatus, 4000);
      } else {
        setScanMessage(response.message || "Failed to trigger scan. Please try again.");
        setScanning(false);
      }
    } catch (err) {
      console.error("Error triggering scan:", err);
      setScanMessage("Error triggering scan. Please check your connection.");
      setScanning(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPerformanceData(true);
    }, 450);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const openPageDetails = (title, url) => {
    setSelectedPageForDetails({ id: 0, title, url });
    setPageDetailsDrawerOpen(true);
  };

  const closePageDetailsDrawer = () => {
    setPageDetailsDrawerOpen(false);
    setSelectedPageForDetails(null);
  };

  const getScoreColorClass = (score) => {
    if (score >= 90) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  const getScoreBgClass = (score) => {
    if (score >= 90) return "bg-success text-white";
    if (score >= 50) return "bg-warning text-dark";
    return "bg-danger text-white";
  };

  const getVitalsBadgeClass = (val, type) => {
    if (type === "lcp") {
      if (val <= 2.5) return "bg-success bg-opacity-10 text-success";
      if (val <= 4.0) return "bg-warning bg-opacity-10 text-warning";
      return "bg-danger bg-opacity-10 text-danger";
    }
    if (type === "cls") {
      if (val <= 0.1) return "bg-success bg-opacity-10 text-success";
      if (val <= 0.25) return "bg-warning bg-opacity-10 text-warning";
      return "bg-danger bg-opacity-10 text-danger";
    }
    if (type === "inp") {
      if (val <= 200) return "bg-success bg-opacity-10 text-success";
      if (val <= 500) return "bg-warning bg-opacity-10 text-warning";
      return "bg-danger bg-opacity-10 text-danger";
    }
    return "bg-light text-dark";
  };

  const getLighthouseLabel = (score) => {
    if (score >= 90) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  };

  // SVG Ring calculation values
  const avgScore = summary?.avgScore || 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  const formatVal = (val, unit = "") => {
    if (val === null || val === undefined || isNaN(Number(val))) return "N/A";
    return `${Number(val).toFixed(2)}${unit}`;
  };

  let ringColor = "#dc3545"; // Red
  if (avgScore >= 90) ringColor = "#198754"; // Green
  else if (avgScore >= 50) ringColor = "#ffc107"; // Yellow

  return (
    <div className="performance-view">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i className="isax isax-flash5 text-primary fs-22" aria-hidden="true" />
            Page Performance
          </h5>
          <p className="text-muted fs-13 mb-0">Powered by Google Lighthouse diagnostics. Analyze, filter, and optimize your Core Web Vitals to elevate your user experience.</p>
        </div>
        {domainId && (
          scanning ? (
            <div className="d-flex align-items-center gap-2 py-2 px-3 text-primary bg-primary bg-opacity-10 rounded-2 fw-medium border border-primary border-opacity-25 shadow-sm animate-pulse" style={{ minHeight: 38 }}>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span className="fs-13">Scan in progress...</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 shadow-sm py-2 px-3 fw-medium"
              onClick={handleRunScan}
            >
              <i className="isax isax-flash-1 fs-16" />
              Scan New Performance
            </button>
          )
        )}
      </div>

      {scanMessage && (
        <div className={`alert border-0 shadow-sm mb-4 d-flex align-items-center justify-content-between ${scanMessage.includes("successfully") ? "alert-success text-success bg-success bg-opacity-10" : "alert-danger text-danger bg-danger bg-opacity-10"}`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`isax ${scanMessage.includes("successfully") ? "isax-tick-circle5" : "isax-info-circle5"} fs-18`} />
            <span className="fs-13 fw-medium">{scanMessage}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setScanMessage("")} aria-label="Close" />
        </div>
      )}

      {!domainId ? (
        <div className="alert alert-info py-4 border-0 shadow-sm glassmorphic-card">
          <div className="d-flex align-items-center gap-3">
            <i className="isax isax-info-circle5 text-info fs-24" />
            <div>
              <h6 className="mb-1 fw-semibold">No Domain Selected</h6>
              <p className="mb-0 text-muted fs-13">Please select a domain in the sidebar to review page performance metrics.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="row g-3 mb-4">
            {/* Avg Score Ring Card */}
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9))", backdropFilter: "blur(8px)" }}>
                <div className="card-body d-flex align-items-center gap-4 py-4">
                  {/* SVG circular progress ring */}
                  <div className="position-relative flex-shrink-0" style={{ width: 100, height: 100 }}>
                    <svg width="100" height="100" className="transform -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#e9ecef"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                      />
                    </svg>
                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                      <span className="fs-22 fw-bold text-dark d-block leading-none">{avgScore}</span>
                      <span className="text-muted fs-10 text-uppercase tracking-wider">Score</span>
                    </div>
                  </div>

                  <div>
                    <h6 className="fw-semibold text-dark mb-1">Average Performance</h6>
                    <p className={`fs-14 fw-bold mb-1 ${getScoreColorClass(avgScore)}`}>
                      {getLighthouseLabel(avgScore)}
                    </p>
                    <p className="text-muted fs-12 mb-0">Compiled from {summary?.scoredPages || 0} scanned pages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Web Vitals Summary Card */}
            <div className="col-12 col-xl-8">
              <div className="card border-0 shadow-sm h-100 bg-white">
                <div className="card-body py-4">
                  <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2">
                    <i className="isax isax-chart-21 text-primary fs-18" />
                    Average Core Web Vitals
                  </h6>
                  <div className="row g-3">
                    <div className="col-6 col-md-4">
                      <div className="p-3 bg-light rounded-3 text-center h-100 d-flex flex-column justify-content-between">
                        <div>
                          <span className="text-muted fs-11 d-block text-uppercase mb-1 fw-medium">Loading Speed (LCP)</span>
                          <p className="text-muted fs-10 mb-2 lh-sm">How fast primary content loads on the screen</p>
                          <span className="fs-18 fw-bold text-dark">{formatVal(summary?.avgLCP, "s")}</span>
                        </div>
                        <span className={`badge rounded-pill d-block mt-2 py-1 ${getVitalsBadgeClass(summary?.avgLCP, "lcp")}`}>
                          {summary?.avgLCP <= 2.5 ? "Good (< 2.5s)" : summary?.avgLCP <= 4.0 ? "Needs Work (< 4.0s)" : "Poor (> 4.0s)"}
                        </span>
                      </div>
                    </div>
                    <div className="col-6 col-md-4">
                      <div className="p-3 bg-light rounded-3 text-center h-100 d-flex flex-column justify-content-between">
                        <div>
                          <span className="text-muted fs-11 d-block text-uppercase mb-1 fw-medium">Responsiveness (INP)</span>
                          <p className="text-muted fs-10 mb-2 lh-sm">Delay on user clicks, taps, or keystrokes</p>
                          <span className="fs-18 fw-bold text-dark">{formatVal(summary?.avgINP, "ms")}</span>
                        </div>
                        <span className={`badge rounded-pill d-block mt-2 py-1 ${getVitalsBadgeClass(summary?.avgINP, "inp")}`}>
                          {summary?.avgINP <= 200 ? "Good (< 200ms)" : summary?.avgINP <= 500 ? "Needs Work (< 500ms)" : "Poor (> 500ms)"}
                        </span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 text-center h-100 d-flex flex-column justify-content-between">
                        <div>
                          <span className="text-muted fs-11 d-block text-uppercase mb-1 fw-medium">Visual Stability (CLS)</span>
                          <p className="text-muted fs-10 mb-2 lh-sm">Unexpected layout shifts of page elements</p>
                          <span className="fs-18 fw-bold text-dark">{formatVal(summary?.avgCLS)}</span>
                        </div>
                        <span className={`badge rounded-pill d-block mt-2 py-1 ${getVitalsBadgeClass(summary?.avgCLS, "cls")}`}>
                          {summary?.avgCLS <= 0.1 ? "Good (< 0.1)" : summary?.avgCLS <= 0.25 ? "Needs Work (< 0.25)" : "Poor (> 0.25)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Category Counts */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-success bg-opacity-10 text-success border-start border-success border-4 h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-semibold mb-1">Good pages</h6>
                    <p className="fs-13 text-success mb-0 opacity-75">Score: 90 - 100</p>
                  </div>
                  <span className="fs-28 fw-bold">{summary?.distribution?.good || 0}</span>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-warning bg-opacity-10 text-warning-emphasis border-start border-warning border-4 h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-semibold mb-1">Needs Improvement</h6>
                    <p className="fs-13 text-warning-emphasis mb-0 opacity-75">Score: 50 - 89</p>
                  </div>
                  <span className="fs-28 fw-bold">{summary?.distribution?.needsImprovement || 0}</span>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm bg-danger bg-opacity-10 text-danger border-start border-danger border-4 h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-semibold mb-1">Poor Pages</h6>
                    <p className="fs-13 text-danger mb-0 opacity-75">Score: 0 - 49</p>
                  </div>
                  <span className="fs-28 fw-bold">{summary?.distribution?.poor || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Server-Side Paginated Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {/* Toolbar */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-4 border-bottom border-secondary border-opacity-10">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted fs-13 flex-shrink-0">Show</span>
                  <select
                    className="form-select form-select-sm"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ width: 80 }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-muted fs-13 flex-shrink-0">entries</span>
                </div>

                <div
                  className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
                  style={{ minWidth: 250 }}
                >
                  <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
                    <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} />
                  </span>
                  <input
                    type="search"
                    className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
                    placeholder="Search by Title or URL..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    aria-label="Search"
                    style={{ paddingLeft: "0.5rem" }}
                  />
                </div>
              </div>

              {/* Table rendering */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted fs-13">Fetching performance pages...</p>
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center text-muted py-5">No pages found or match your search criteria.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "35%", minWidth: 250 }} className="ps-4">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-dark fw-semibold text-decoration-none d-flex align-items-center gap-1 fs-12 text-uppercase"
                            onClick={() => handleSort("title")}
                          >
                            Page Details
                            {sortBy === "title" && (sortOrder === "desc" ? "↓" : "↑")}
                          </button>
                        </th>
                        <th style={{ width: "15%" }} className="text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-dark fw-semibold text-decoration-none mx-auto d-flex align-items-center gap-1 fs-12 text-uppercase"
                            onClick={() => handleSort("score")}
                          >
                            Performance Score
                            {sortBy === "score" && (sortOrder === "desc" ? "↓" : "↑")}
                          </button>
                        </th>
                        <th style={{ width: "12%" }} className="text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-dark fw-semibold text-decoration-none mx-auto d-flex align-items-center gap-1 fs-12 text-uppercase"
                            onClick={() => handleSort("lcp")}
                          >
                            Loading Speed (LCP)
                            {sortBy === "lcp" && (sortOrder === "desc" ? "↓" : "↑")}
                          </button>
                        </th>
                        <th style={{ width: "12%" }} className="text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-dark fw-semibold text-decoration-none mx-auto d-flex align-items-center gap-1 fs-12 text-uppercase"
                            onClick={() => handleSort("inp")}
                          >
                            Responsiveness (INP)
                            {sortBy === "inp" && (sortOrder === "desc" ? "↓" : "↑")}
                          </button>
                        </th>
                        <th style={{ width: "12%" }} className="text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-dark fw-semibold text-decoration-none mx-auto d-flex align-items-center gap-1 fs-12 text-uppercase"
                            onClick={() => handleSort("cls")}
                          >
                            Visual Stability (CLS)
                            {sortBy === "cls" && (sortOrder === "desc" ? "↓" : "↑")}
                          </button>
                        </th>
                        <th style={{ width: "14%" }} className="pe-4 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((p, i) => (
                        <tr key={p.id || i}>
                          <td className="ps-4">
                            <h6 className="mb-1 fw-semibold text-body fs-13 text-truncate" style={{ maxWidth: 380 }} title={p.title}>
                              {p.title}
                            </h6>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-truncate"
                              style={{ maxWidth: 380 }}
                            >
                              <ExternalLinkIcon size={11} className="flex-shrink-0" />
                              {p.url}
                            </a>
                          </td>
                          <td className="text-center">
                            <span className={`badge py-2 px-3 rounded-pill fs-12 ${getScoreBgClass(p.performanceScore)}`}>
                              {p.performanceScore}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge py-2 px-3 rounded-pill fs-12 ${getVitalsBadgeClass(p.lcp, "lcp")}`}>
                              {formatVal(p.lcp, "s")}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge py-2 px-3 rounded-pill fs-12 ${getVitalsBadgeClass(p.inp, "inp")}`}>
                              {formatVal(p.inp, "ms")}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge py-2 px-3 rounded-pill fs-12 ${getVitalsBadgeClass(p.cls, "cls")}`}>
                              {formatVal(p.cls)}
                            </span>
                          </td>
                          <td className="pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                              title="Open Diagnostics Drawer"
                              onClick={() => openPageDetails(p.title, p.url)}
                            >
                              <i className="isax isax-document-text fs-18 text-primary" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {!loading && pages.length > 0 && (
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-4 border-top border-secondary border-opacity-10">
                  <div className="text-muted fs-13">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} entries
                  </div>
                  <nav aria-label="Page performance navigation">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <li key={idx} className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage(idx + 1)}
                          >
                            {idx + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Advanced diagnostics PageDetailsDrawer */}
      <PageDetailsDrawer
        open={pageDetailsDrawerOpen}
        onClose={closePageDetailsDrawer}
        page={selectedPageForDetails}
        defaultTab="performance"
        performanceSectionEmbedded={true}
      />
    </div>
  );
};

export default PerformanceView;
