import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDomainsApi, deleteDomainApi, archiveDomainApi, restoreDomainApi, hardDeleteDomainApi } from "../../api/domainApi";
import { ConfirmAlert } from "../common/alerts/ConfirmAlert";
import { ToastAlert } from "../common/alerts/ToastAlert"; // Assuming ToastAlert is available or I can use alert/toast if I find one

const SELECTED_DOMAIN_KEY = "selectedDomainId";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const ExternalLinkIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ScriptSetupDrawer = ({ isOpen, onClose, domain }) => {
  if (!isOpen) return null;
  return (
    <div className="offcanvas offcanvas-end show" style={{ visibility: "visible" }} tabIndex="-1">
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">Script Setup Guide: {domain?.name}</h5>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
      <div className="offcanvas-body">
        <p>To start monitoring <strong>{domain?.name}</strong>, add this script to your site's <code>&lt;head&gt;</code> section:</p>
        <pre className="bg-light p-3 rounded">
          {`<script src="https://app.sitemonitor.com/widget.js" data-id="${domain?.id}"></script>`}
        </pre>
      </div>
    </div>
  );
};

const ExcludedIpDrawer = ({ isOpen, onClose, domain }) => {
  if (!isOpen) return null;
  return (
    <div className="offcanvas offcanvas-end show" style={{ visibility: "visible" }} tabIndex="-1">
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">Excluded IP Addresses: {domain?.name}</h5>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
      <div className="offcanvas-body">
        <p>Manage excluded IP addresses for <strong>{domain?.name}</strong> to prevent tracking internal traffic.</p>
        <ul className="list-group">
          <li className="list-group-item">192.168.1.1 (Office)</li>
          <li className="list-group-item">10.0.0.1 (Developer)</li>
        </ul>
      </div>
    </div>
  );
};

function formatApiDate(dateStr) {
  if (!dateStr) return { month: "N/A", day: "--", year: "----" };
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return { month, day, year };
}

const DomainOverview = () => {
  const navigate = useNavigate();

  const [domains, setDomains] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [scriptSetupDrawerOpen, setScriptSetupDrawerOpen] = useState(false);
  const [scriptSetupDomain, setScriptSetupDomain] = useState(null);

  const [excludedIpDrawerOpen, setExcludedIpDrawerOpen] = useState(false);
  const [excludedIpDomain, setExcludedIpDomain] = useState(null);

  const [scanningDomainIds, setScanningDomainIds] = useState(new Set());

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDomainsApi(currentPage, rowsPerPage, isArchivedView);
      if (response.success) {
        setDomains(response.data.domains);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, isArchivedView]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Handlers
  const selectDomainFromOverview = (domainId) => {
    if (typeof window === "undefined" || !domainId) return;

    window.sessionStorage.setItem(SELECTED_DOMAIN_KEY, domainId);
    window.dispatchEvent(
      new CustomEvent("sitemonitor:select-domain", { detail: { id: domainId } })
    );
    navigate("/domain");
  };

  const openScriptSetupGuide = (domain) => {
    setScriptSetupDomain(domain);
    setScriptSetupDrawerOpen(true);
  };

  const openExcludedIpDrawer = (domain) => {
    setExcludedIpDomain(domain);
    setExcludedIpDrawerOpen(true);
  };

  const startOnDemandScan = async (domain) => {
    const confirmed = await ConfirmAlert(`Are you sure you want to start an on-demand scan for ${domain.name}?`);
    if (confirmed) {
      setScanningDomainIds((prev) => new Set(prev).add(domain.id));
    }
  };

  const handleDeleteDomain = async (domain) => {
    const confirmed = await ConfirmAlert(`Are you sure you want to remove the domain ${domain.dm_title}? This action cannot be undone.`);
    if (confirmed) {
      try {
        const response = await deleteDomainApi(domain.dm_id);
        if (response.success) {
          window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
          fetchDomains();
        }
      } catch (error) {
        console.error("Failed to delete domain:", error);
      }
    }
  };

  const handleArchiveDomain = async (domain) => {
    const confirmed = await ConfirmAlert(`Are you sure you want to archive ${domain.dm_title}?`);
    if (confirmed) {
      try {
        const response = await archiveDomainApi(domain.dm_id);
        if (response.success) {
          window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
          fetchDomains();
        }
      } catch (error) {
        console.error("Failed to archive domain:", error);
      }
    }
  };

  const handleRestoreDomain = async (domain) => {
    const confirmed = await ConfirmAlert(`Are you sure you want to restore ${domain.dm_title}?`);
    if (confirmed) {
      try {
        const response = await restoreDomainApi(domain.dm_id);
        if (response.success) {
          window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
          fetchDomains();
        }
      } catch (error) {
        console.error("Failed to restore domain:", error);
      }
    }
  };

  const handleHardDeleteDomain = async (domain) => {
    const confirmed = await ConfirmAlert(`Are you sure you want to PERMANENTLY delete ${domain.dm_title}? This cannot be undone.`);
    if (confirmed) {
      try {
        const response = await hardDeleteDomainApi(domain.dm_id);
        if (response.success) {
          window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
          fetchDomains();
        }
      } catch (error) {
        console.error("Failed to hard delete domain:", error);
      }
    }
  };

  return (
    <div className="domain-overview-section">
      <div className="domain-overview-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="domain-overview-title mb-1">Domain Overview</h1>
          <p className="domain-overview-subtitle text-muted mb-0">
            You have {totalItems} {isArchivedView ? "archived " : ""}domain(s) on your account
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm p-1 bg-light rounded-pill">
            <button
              type="button"
              className={`btn rounded-pill px-3 ${!isArchivedView ? "btn-white shadow-sm" : "btn-light border-0"}`}
              onClick={() => {
                setIsArchivedView(false);
                setCurrentPage(1);
              }}
            >
              Active
            </button>
            <button
              type="button"
              className={`btn rounded-pill px-3 ${isArchivedView ? "btn-white shadow-sm" : "btn-light border-0"}`}
              onClick={() => {
                setIsArchivedView(true);
                setCurrentPage(1);
              }}
            >
              Archived
            </button>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          >
            <i className="isax isax-filter" /> Filter
          </button>
          <Link to="/home/add-domain" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
            <i className="isax isax-add" /> Add domain
          </Link>
        </div>
      </div>

      {/* Domain Table */}
      <div className="card border-0 shadow-sm domain-overview-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 domain-overview-table">
              <thead>
                <tr>
                  <th className="text-muted fw-medium">Last Scan</th>
                  <th className="text-muted fw-medium">Domain</th>
                  <th className="text-muted fw-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : domains.length > 0 ? (
                  domains.map((domain) => {
                    const { month, day, year } = formatApiDate(domain.dm_created_at);
                    const domainId = domain._id;
                    const isScanning = scanningDomainIds.has(domainId);

                    return (
                      <tr
                        key={domainId}
                        className="domain-overview-row-selectable"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          if (e.target.closest("a[href^='http']")) return;
                          if (e.target.closest("button")) return;
                          if (e.target.closest(".dropdown")) return;
                          selectDomainFromOverview(domainId);
                        }}
                      >
                        {/* Last Scan */}
                        <td>
                          <div className="domain-overview-date d-flex flex-column">
                            <span className="fw-medium">{month}</span>
                            <span className="display-6 lh-1 fw-bold text-body">{day}</span>
                            <span className="text-muted small">{year}</span>
                          </div>
                        </td>

                        {/* Domain Info */}
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span className="fw-medium text-body">{domain.dm_title}</span>
                            <a
                              href={domain.dm_url.startsWith('http') ? domain.dm_url : `https://${domain.dm_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1"
                            >
                              <ExternalLinkIcon size={12} className="flex-shrink-0 text-primary" />
                              {domain.dm_url}
                            </a>
                          </div>

                          {isScanning ? (
                            <div className="mt-2">
                              <div className="text-muted small mb-1">Scan in progress</div>
                              <div className="progress rounded-pill" style={{ height: 8 }}>
                                <div
                                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                  role="progressbar"
                                  style={{ width: "100%" }}
                                  aria-valuenow="100"
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="domain-overview-metrics d-flex flex-wrap align-items-center gap-3 mt-2">
                              {/* Dummy metrics as they are not in the provided API response */}
                              <span className="d-inline-flex align-items-center gap-1 small text-success" title="Issues">
                                <i className="isax isax-hammer" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-primary" title="Passed">
                                <i className="isax isax-tick-circle" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-primary" title="Pages">
                                <i className="isax isax-chart-2" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-success" title="Secure">
                                <i className="isax isax-lock-1" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-primary" title="Accessibility">
                                <i className="isax isax-profile-2user" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-success" title="Documents">
                                <i className="isax isax-document-text" /> 0
                              </span>
                              <span className="d-inline-flex align-items-center gap-1 small text-primary" title="Scanned">
                                <i className="isax isax-folder" /> 0
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Action Dropdown */}
                        <td className="text-end">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-light border dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              Action
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/domain">
                                  <i className="isax isax-home me-2" aria-hidden="true" /> Go to domain
                                </Link>
                              </li>
                              {/* <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                                  onClick={() => openScriptSetupGuide({ name: domain.dm_title, id: domain._id })}
                                >
                                  <i className="isax isax-code me-2" aria-hidden="true" /> Script setup guide
                                </button>
                              </li> */}
                              <li>
                                <Link
                                  className="dropdown-item d-flex align-items-center"
                                  to={`/home/update-domain/${domain.dm_id}`}
                                >
                                  <i className="isax isax-setting-25 me-2" aria-hidden="true" /> Edit domain
                                </Link>
                              </li>
                              {/* <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                                  onClick={() => openExcludedIpDrawer({ name: domain.dm_title, id: domain._id })}
                                >
                                  <i className="isax isax-chart-2 me-2" aria-hidden="true" /> Statistics excluded IP addresses
                                </button>
                              </li> */}
                              {/* <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                                  onClick={() => startOnDemandScan({ name: domain.dm_title, id: domain._id })}
                                >
                                  <i className="isax isax-refresh-25 me-2" aria-hidden="true" /> Start on demand scan
                                </button>
                              </li> */}
                              {/* <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/home/add-domain">
                                  <i className="isax isax-copy me-2" aria-hidden="true" /> Clone
                                </Link>
                              </li> */}
                              <li>
                                <hr className="dropdown-divider" />
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center text-danger w-100 border-0 bg-transparent text-start"
                                  onClick={() => isArchivedView ? handleHardDeleteDomain(domain) : handleArchiveDomain(domain)}
                                >
                                  <i className={`isax ${isArchivedView ? "isax-trash" : "isax-archive-add"} me-2`} aria-hidden="true" /> {isArchivedView ? "Hard Delete" : "Archive domain"}
                                </button>
                              </li>
                              {isArchivedView && (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center text-success w-100 border-0 bg-transparent text-start"
                                    onClick={() => handleRestoreDomain(domain)}
                                  >
                                    <i className="isax isax-rotate-right me-2" aria-hidden="true" /> Restore domain
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-muted">
                      No {isArchivedView ? "archived " : ""}domains found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && domains.length > 0 && (
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
                  {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, totalItems)} of{" "}
                  {totalItems}
                </span>
              </div>

              <nav aria-label="Domain list pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <li key={p} className="page-item">
                      <button
                        type="button"
                        className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
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


      {/* Drawers */}
      <ScriptSetupDrawer
        isOpen={scriptSetupDrawerOpen}
        onClose={() => setScriptSetupDrawerOpen(false)}
        domain={scriptSetupDomain}
      />
      <ExcludedIpDrawer
        isOpen={excludedIpDrawerOpen}
        onClose={() => setExcludedIpDrawerOpen(false)}
        domain={excludedIpDomain}
      />
    </div>
  );
};

export default DomainOverview;
