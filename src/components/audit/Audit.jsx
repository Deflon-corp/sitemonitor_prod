import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getDomainsApi, getDomainAuditDataApi, getDomainSeoPagesApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import { SEO_HEALTH_ISSUES } from "@/lib/seo-health-config";
import { SPELL_CHECKER_AUDIT_CONFIG, SPELL_CHECKER_SLUGS_ORDER } from "@/lib/spell-checker-audit-data";

// Performance ring helper
function PerformanceRing({ score, size = 100, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = score >= 90 ? "#198754" : score >= 50 ? "#fd7e14" : "#dc3545";
  const textColor = score >= 90 ? "text-success" : score >= 50 ? "text-warning" : "text-danger";
  return (
    <div className="position-relative d-inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="text-light" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={r} cx={size / 2} cy={size / 2} />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={r}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={`position-absolute top-50 start-50 translate-middle fw-bold fs-20 ${textColor}`}>{score}</span>
    </div>
  );
}

export default function RunWebsiteAuditPage() {
  const [domains, setDomains] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [suggestedPages, setSuggestedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load all domains on mount
  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await getDomainsApi(1, 100);
        if (res.success && res.data?.domains) {
          setDomains(res.data.domains);

          // Pre-select from sessionStorage
          const savedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
          const preSelected = savedId
            ? res.data.domains.find((d) => d._id === savedId)
            : res.data.domains[0];

          if (preSelected) {
            setSelectedDomain(preSelected);
          }
        }
      } catch (err) {
        console.error("Failed to load domains:", err);
      } finally {
        setIsLoadingDomains(false);
      }
    }
    loadDomains();
  }, []);

  // Fetch audit data whenever selectedDomain or selectedPage changes
  const fetchAuditData = useCallback(async (domain, page = null) => {
    if (!domain) return;
    setIsLoading(true);
    // If a page is selected, we use the page's report data. 
    // For now, we'll fetch domain audit data and if a page is selected, we'll try to get its specific data if needed.
    // However, the current Audit endpoint returns domain-wide summary.
    // If a specific page is selected, we might want to show its specific report.
    try {
      const res = await getDomainAuditDataApi(domain._id);
      if (res.success) {
        setAuditData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchAuditData(selectedDomain, selectedPage);
    }
  }, [selectedDomain, selectedPage, fetchAuditData]);

  // Handle URL input change and suggest pages of the selected domain
  useEffect(() => {
    if (!selectedDomain || !showSuggestions) {
      setSuggestedPages([]);
      return;
    }

    // If input is exactly the domain URL and hasn't been edited to search pages, don't show all pages yet
    // unless they clear it or start typing.
    // However, the user wants "if i am enter search filed then dropdwan shos this domain scaining urls"
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await getDomainSeoPagesApi(selectedDomain._id, 1, 10, urlInput);
        if (res.success && res.data?.pages) {
          setSuggestedPages(res.data.pages);
        }
      } catch (err) {
        console.error("Failed to fetch page suggestions:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [urlInput, selectedDomain, showSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPage = (page) => {
    setSelectedPage(page);
    setUrlInput(page.url);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUrlInput(value);
    setShowSuggestions(true);
    
    // If typing, deselect current page to show domain-wide data unless exact match
    if (selectedPage && value !== selectedPage.url) {
      setSelectedPage(null);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  // Format date/time
  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Derive performance status
  // If a page is selected, use its specific performance score
  const perfScore = selectedPage ? (selectedPage.performanceScore || 0) : (auditData?.performance?.score || 0);
  const perfStatus = selectedPage ? (perfScore >= 90 ? "Good" : perfScore >= 50 ? "Needs Improvement" : "Poor") : (auditData?.performance?.status || (perfScore >= 90 ? "Good" : perfScore >= 50 ? "Needs Improvement" : "Poor"));
  const perfStatusClass = perfStatus === "Good" ? "text-success" : perfStatus === "Needs Improvement" ? "text-warning" : "text-danger";

  // SEO Health data merged with real counts
  // If a page is selected, we show if THAT page has the issue (count 0 or 1)
  const seoHealthIssues = SEO_HEALTH_ISSUES.map((issue) => {
    let count = auditData?.seoHealth?.[issue.slug] ?? 0;
    if (selectedPage) {
      // Check if page has this issue
      // We can map slug to page fields
      const hasIssue = (slug) => {
        switch(slug) {
          case 'meta-title-missing': return !selectedPage.hasTitle;
          case 'meta-description-missing': return !selectedPage.hasDescription;
          case 'h1-tags-missing': return !selectedPage.h1Count || selectedPage.h1Count === 0;
          case 'multiple-h1-tags': return selectedPage.h1Count > 1;
          case 'no-canonical': return !selectedPage.hasCanonical;
          case 'missing-alt-text': return (selectedPage.imagesWithoutAlt || 0) > 0;
          default: return false;
        }
      };
      count = hasIssue(issue.slug) ? 1 : 0;
    }
    return { ...issue, count };
  });

  // Response Status
  const rs = selectedPage ? { [selectedPage.httpStatus]: 1, validUrls: selectedPage.httpStatus < 400 ? 1 : 0 } : (auditData?.responseStatus || {});

  // Pages Analyzed
  const pa = selectedPage ? { totalPages: 1, statusCodes: { [selectedPage.httpStatus]: 1 }, validUrls: selectedPage.httpStatus < 400 ? 1 : 0 } : (auditData?.pagesAnalyzed || {});

  // Spell Checker
  const spellCheckerData = SPELL_CHECKER_SLUGS_ORDER.map((slug) => {
    const cfg = SPELL_CHECKER_AUDIT_CONFIG[slug];
    if (!cfg) return null;
    let affectedCount = cfg.affectedCount;
    
    if (selectedPage) {
      if (slug === "content-spelling") affectedCount = selectedPage.misspellingsCount || 0;
      else if (slug === "anchor-cta-spelling") affectedCount = selectedPage.brokenLinksCount || 0;
      else affectedCount = 0; // Simplified for page view
    } else if (slug === "broken-links" && auditData?.spellChecker?.totalBrokenLinks != null) {
      affectedCount = auditData.spellChecker.totalBrokenLinks;
    } else if (slug === "content-spelling" && auditData?.spellChecker?.totalMisspellings != null) {
      affectedCount = auditData.spellChecker.totalMisspellings;
    } else if (auditData?.spellChecker?.[slug] != null) {
      affectedCount = auditData.spellChecker[slug];
    }
    
    return { slug, cfg: { ...cfg, affectedCount } };
  }).filter(Boolean);

  return (
    <DashboardLayout breadcrumbTitle="Run Website Audit" breadcrumbParentHref="/domain/audit">
      <div className="content">
        <h5 className="mb-4">Run Website Audit</h5>

        {/* Input Section */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end g-3">
              <div className="col-lg-8 col-md-10">
                <label className="form-label fw-medium">Website URL</label>
                <div className="position-relative">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <i className="isax isax-search-normal text-muted" />
                    </span>
                    <input
                      ref={inputRef}
                      id="audit-url-input"
                      type="text"
                      className="form-control"
                      placeholder={selectedDomain ? `Search pages in ${selectedDomain.dm_url}...` : "Loading domain..."}
                      value={urlInput}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      autoComplete="off"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && (isLoadingSuggestions || suggestedPages.length > 0) && (
                    <div
                      ref={dropdownRef}
                      className="position-absolute w-100 bg-white border border-light rounded-2 shadow-sm mt-1"
                      style={{ zIndex: 1050, maxHeight: 240, overflowY: "auto" }}
                    >
                      {isLoadingSuggestions && (
                        <div className="p-3 text-center text-muted fs-13">
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Searching pages...
                        </div>
                      )}
                      {!isLoadingSuggestions && suggestedPages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          className="d-flex align-items-center w-100 px-3 py-2 border-0 bg-transparent text-start hover-bg-light"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectPage(page)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                        >
                          <div className="flex-grow-1 min-w-0">
                            <div className="text-body fs-13 text-truncate">{page.url}</div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className={`badge rounded-pill ${page.httpStatus === 200 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.6rem' }}>
                                    {page.httpStatus}
                                </span>
                                <span className="text-muted fs-11">Score: {page.seoScore}%</span>
                            </div>
                          </div>
                          {selectedPage?.id === page.id && (
                            <i className="isax isax-tick-circle text-success ms-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-4 col-md-2 d-flex align-items-end gap-2">
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => fetchAuditData(selectedDomain, selectedPage)}
                  disabled={isLoading || !selectedDomain}
                  id="audit-analyze-btn"
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  ) : (
                    <i className="isax isax-search-normal" />
                  )}
                  {isLoading ? "Analyzing..." : "Analyze"}
                </button>
                {selectedPage && (
                    <button 
                        className="btn btn-outline-secondary" 
                        onClick={() => { setSelectedPage(null); setUrlInput(""); }}
                        title="Clear page selection"
                    >
                        Clear
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results header */}
        {selectedDomain && (
          <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <h6 className="mb-0">
              Result for {selectedPage ? <span className="text-primary">{selectedPage.url}</span> : <span className="text-primary">{selectedDomain.dm_url}</span>}
              {!selectedPage && <span className="badge bg-light text-muted ms-2 fs-10">Domain Overview</span>}
              {selectedPage && <span className="badge bg-primary-subtle text-primary ms-2 fs-10">Single Page</span>}
            </h6>
            {(selectedPage?.lastCrawled || auditData?.lastScanDate) && (
              <p className="fs-13 text-muted mb-0">
                Last scan: {formatDateTime(selectedPage ? selectedPage.lastCrawled : auditData.lastScanDate)}
              </p>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted fs-13">Fetching audit data...</p>
            </div>
          </div>
        )}

        {/* No domain selected */}
        {!isLoading && !selectedDomain && !isLoadingDomains && (
          <div className="text-center py-5">
            <i className="isax isax-search-normal text-muted" style={{ fontSize: "3rem" }} />
            <h6 className="mt-3 text-muted">No domain selected</h6>
            <p className="fs-13 text-muted">Please select a domain from the sidebar to view audit results.</p>
          </div>
        )}

        {/* No scan data */}
        {!isLoading && selectedDomain && !auditData && (
          <div className="text-center py-5">
            <i className="isax isax-chart-215 text-muted" style={{ fontSize: "3rem" }} />
            <h6 className="mt-3 text-muted">No scan data available</h6>
            <p className="fs-13 text-muted">
              No scan results found for <strong>{selectedDomain.dm_url}</strong>. Trigger a scan from the Dashboard to get audit data.
            </p>
          </div>
        )}

        {/* Results Cards */}
        {!isLoading && auditData && (
          <div className="row">
            {/* Performance Card */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-header border-0 d-flex align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <span className={`avatar avatar-36 avatar-rounded flex-shrink-0 me-2 d-flex align-items-center justify-content-center ${perfScore >= 90 ? "bg-success-subtle text-success" : perfScore >= 50 ? "bg-warning-subtle text-warning" : "bg-danger-subtle text-danger"}`}>
                      <i className="isax isax-tick-circle fs-18" />
                    </span>
                    Performance
                  </h6>
                </div>
                <div className="card-body">
                  <div className="text-center mb-3">
                    <PerformanceRing score={perfScore} />
                  </div>
                  <p className={`text-center fw-medium mb-2 ${perfStatusClass}`}>{perfStatus}</p>
                  <ul className="list-unstyled mb-0 mt-4">
                    <li className="d-flex align-items-center justify-content-between py-2 border-bottom border-light">
                      <span className="d-flex align-items-center">
                        <i className={`fa-solid fa-circle ${perfStatusClass} fs-8 me-2`} />
                        <span className="fs-13">Largest Contentful Paint</span>
                      </span>
                      <span className="fs-13 fw-medium">
                        {selectedPage ? (selectedPage.performance?.lcp || "N/A") : (auditData.performance?.avgLCP ? `${auditData.performance.avgLCP}s` : "N/A")}
                      </span>
                    </li>
                    <li className="d-flex align-items-center justify-content-between py-2">
                      <span className="d-flex align-items-center">
                        <i className={`fa-solid fa-circle ${perfStatusClass} fs-8 me-2`} />
                        <span className="fs-13">Interaction to Next Paint</span>
                      </span>
                      <span className="fs-13 fw-medium">
                        {selectedPage ? (selectedPage.performance?.inp || "N/A") : (auditData.performance?.avgINP ? `${auditData.performance.avgINP}ms` : "N/A")}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pages Analyzed Card */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-header border-0 d-flex align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <span className="avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center">
                      <i className="isax isax-folder fs-18" />
                    </span>
                    Domain Scan Coverage
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="d-flex align-items-center mb-2">
                        <i className="isax isax-folder text-primary me-2" />
                        <span className="fs-13">Total Pages</span>
                      </div>
                      <p className="fw-semibold mb-3 fs-5">{pa.totalPages || 0}</p>
                      
                      <div className="mt-4">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fs-12 text-muted">200 OK</span>
                            <span className="fs-12 fw-medium">{pa.statusCodes?.[200] || 0}</span>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                            <div className="progress-bar bg-success" style={{ width: pa.totalPages ? `${(pa.statusCodes?.[200] || 0) / pa.totalPages * 100}%` : '0%' }}></div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fs-12 text-muted">404 Error</span>
                            <span className="fs-12 fw-medium">{pa.statusCodes?.[404] || 0}</span>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                            <div className="progress-bar bg-danger" style={{ width: pa.totalPages ? `${(pa.statusCodes?.[404] || 0) / pa.totalPages * 100}%` : '0%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center mb-2">
                        <i className="isax isax-document-text text-primary me-2" />
                        <span className="fs-13">Valid URLs</span>
                      </div>
                      <p className="fw-semibold mb-3 fs-5 text-success">{pa.validUrls || 0}</p>

                      <div className="mt-4">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fs-12 text-muted">301/302</span>
                            <span className="fs-12 fw-medium">{(pa.statusCodes?.[301] || 0) + (pa.statusCodes?.[302] || 0)}</span>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                            <div className="progress-bar bg-warning" style={{ width: pa.totalPages ? `${((pa.statusCodes?.[301] || 0) + (pa.statusCodes?.[302] || 0)) / pa.totalPages * 100}%` : '0%' }}></div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fs-12 text-muted">500 Error</span>
                            <span className="fs-12 fw-medium">{pa.statusCodes?.[500] || 0}</span>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                            <div className="progress-bar bg-dark" style={{ width: pa.totalPages ? `${(pa.statusCodes?.[500] || 0) / pa.totalPages * 100}%` : '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Health Card */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-header border-0 d-flex align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <span className="avatar avatar-36 avatar-rounded bg-warning-subtle text-warning flex-shrink-0 me-2 d-flex align-items-center justify-content-center">
                      <i className="isax isax-search-normal fs-18" />
                    </span>
                    SEO Health
                  </h6>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    {seoHealthIssues.map((issue) => (
                      <li key={issue.slug} className="border-bottom border-light">
                        <Link
                          to={`/domain/audit/seo-health/${issue.slug}`}
                          className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                        >
                          <span className="d-flex align-items-center">
                            <i className={`isax isax-document-text ${issue.count > 0 ? 'text-danger' : 'text-success'} me-2`} />
                            <span className="fs-13">{issue.label}</span>
                          </span>
                          <span className={`fw-medium ${issue.count > 0 ? 'text-danger' : 'text-muted'}`}>
                            {issue.count}{" "}
                            <i className="isax isax-arrow-right-3 fs-10 ms-1" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Response Status Card */}
            <div className="col-xl-6 col-lg-6 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-header border-0 d-flex align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <span className="avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center">
                      <i className="isax isax-refresh fs-18" />
                    </span>
                    Response Status
                  </h6>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li key="valid-urls" className="border-bottom border-light">
                      <Link
                        to="/domain/audit/response-status/valid-urls"
                        className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                      >
                        <span className="fs-13">Valid URLs</span>
                        <span className="fw-medium text-success">{rs.validUrls ?? 0} <i className="isax isax-arrow-right-3 fs-10 ms-1" /></span>
                      </Link>
                    </li>
                    <li key="200" className="border-bottom border-light">
                      <Link
                        to="/domain/audit/response-status/200"
                        className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                      >
                        <span className="fs-13">200 Code</span>
                        <span className="fw-medium text-success">{rs[200] ?? 0} <i className="isax isax-arrow-right-3 fs-10 ms-1" /></span>
                      </Link>
                    </li>
                    <li key="301" className="border-bottom border-light">
                      <Link
                        to="/domain/audit/response-status/301"
                        className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                      >
                        <span className="fs-13">301/302 Redirect</span>
                        <span className="fw-medium text-warning">{(rs[301] ?? 0) + (rs[302] ?? 0)} <i className="isax isax-arrow-right-3 fs-10 ms-1" /></span>
                      </Link>
                    </li>
                    <li key="404" className="border-bottom border-light">
                      <Link
                        to="/domain/audit/response-status/404"
                        className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                      >
                        <span className="fs-13">404 Code</span>
                        <span className="fw-medium text-danger">{rs[404] ?? 0} <i className="isax isax-arrow-right-3 fs-10 ms-1" /></span>
                      </Link>
                    </li>
                    <li key="500">
                      <Link
                        to="/domain/audit/response-status/500"
                        className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                      >
                        <span className="fs-13">500 Code</span>
                        <span className="fw-medium text-danger">{rs[500] ?? 0} <i className="isax isax-arrow-right-3 fs-10 ms-1" /></span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Spell Checker Card */}
            <div className="col-xl-6 col-lg-6 d-flex">
              <div className="card flex-fill border-0 shadow-sm">
                <div className="card-header border-0 d-flex align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <span className="avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center">
                      <i className="isax isax-edit fs-18" />
                    </span>
                    Content Quality (Spelling)
                  </h6>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    {spellCheckerData.map(({ slug, cfg }, index) => {
                      const isLast = index === spellCheckerData.length - 1;
                      return (
                        <li key={slug} className={isLast ? "" : "border-bottom border-light"}>
                          <Link
                            to={`/domain/audit/spell-checker/${slug}`}
                            className="d-flex align-items-center justify-content-between py-2 text-body text-decoration-none hover-bg-light px-1 rounded transition-all"
                          >
                            <span className="fs-13">{cfg.title}</span>
                            <span className={`fw-medium ${cfg.affectedCount > 0 ? 'text-danger' : 'text-muted'}`}>
                              {cfg.affectedCount}{" "}
                              <i className="isax isax-arrow-right-3 fs-10 ms-1" />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
