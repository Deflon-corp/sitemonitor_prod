import React, { useEffect } from "react";



const AccessibilityIssueDrawer = ({ open, onClose, issue }) => {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !issue) return null;

  const copyUrl = () => {
    const url = issue.pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    navigator.clipboard?.writeText(url);
  };



  return (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: 1060 }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{ zIndex: 1065, width: "min(100%, 900px)", maxWidth: "900px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-issue-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i className="isax isax-close-circle fs-20" />
              </button>
              <div>
                <h6 className="mb-0 fw-semibold" id="accessibility-issue-drawer-title">Accessibility issue</h6>
                <p className="text-muted fs-13 mb-0">ID: {issue.id}</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-icon btn-sm btn-light" title="Search" aria-label="Search">
                <i className="isax isax-search-normal fs-18" />
              </button>
              <div className="dropdown">
                <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  Action
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button type="button" className="dropdown-item">Ignore</button></li>
                  <li><button type="button" className="dropdown-item">Mark as fixed</button></li>
                </ul>
              </div>
              <button type="button" className="btn btn-sm btn-light d-inline-flex align-items-center gap-1" onClick={copyUrl} title="Copy URL">
                <i className="isax isax-document-copy fs-18" /> Copy URL
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto px-4 py-3">
          {/* Issue description */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-2">Issue description</h6>
              <p className="text-muted fs-14 mb-0">{issue.description || "Description not available."}</p>
            </div>
          </div>

          {/* How to fix */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-2">How to fix</h6>
              <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger rounded fs-14">
                {issue.failureSummary || "No fix suggestion available."}
              </div>
            </div>
          </div>

          {/* Issue details */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Issue details</h6>
              <dl className="row mb-0 fs-13">
                <dt className="col-6 col-md-5 text-muted">Effect on overall compliance level</dt>
                <dd className="col-6 col-md-7 mb-2">{issue.effectOnCompliance}</dd>
                <dt className="col-6 col-md-5 text-muted">Element</dt>
                <dd className="col-6 col-md-7 mb-2">{issue.element}</dd>
                <dt className="col-6 col-md-5 text-muted">Date found</dt>
                <dd className="col-6 col-md-7 mb-0">{issue.dateFound}</dd>
              </dl>
            </div>
          </div>

          {/* Snippet */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Snippet</h6>
              <div className="d-flex gap-3">
                <pre
                  className="flex-grow-1 p-3 rounded bg-light border small mb-0 overflow-auto text-body"
                  style={{ fontSize: "0.75rem", minHeight: 200 }}
                >
                  <code>
                    {issue.snippetHtml.split(/(<[^>]+>)/g).map((part, i) =>
                      part.startsWith("<") ? (
                        <span key={i} className="text-primary">{part}</span>
                      ) : (
                        <span key={i} className="text-muted">{part}</span>
                      )
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Found on page & Issue check details */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-2">Found on page</h6>
              <p className="text-muted fs-13 mb-1">{issue.pageTitle ?? "—"}</p>
              {issue.pageUrl ? (
                <a
                  href={issue.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-decoration-none fs-13 d-inline-flex align-items-center gap-1"
                >
                  <span className="text-primary">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <path d="M15 3h6v6" />
                      <path d="M10 14L21 3" />
                    </svg>
                  </span>
                  {issue.pageUrl}
                </a>
              ) : (
                <span className="text-muted fs-13">—</span>
              )}
              <h6 className="fw-semibold mb-0 mt-4 pt-3 border-top text-body">Issue check details</h6>
              <div className="table-responsive mt-2">
                <table className="table table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-2">Check</th>
                      <th className="fw-semibold text-body py-2">Help center</th>
                      <th className="fw-semibold text-body py-2">Responsibility</th>
                      <th className="fw-semibold text-body py-2">Success criteria</th>
                      <th className="fw-semibold text-body py-2">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-danger flex-shrink-0"
                            style={{ width: 24, height: 24, backgroundColor: "rgba(220, 53, 69, 0.15)" }}
                          >
                            <i className="isax isax-danger fs-14" aria-hidden="true" />
                          </span>
                          <span className="fw-medium fs-13">{issue.checkName}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <button type="button" className="btn btn-icon btn-sm btn-link text-primary p-0" title="Help center">
                          <i className="isax isax-teacher fs-18" />
                        </button>
                      </td>
                      <td className="py-2 fs-13">{issue.responsibility ?? "—"}</td>
                      <td className="py-2 fs-13">{issue.successCriteria ?? "—"}</td>
                      <td className="py-2">
                        <span className="badge bg-success bg-opacity-10 text-success">{issue.difficulty ?? "—"}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>


        </div>
      </div>
    </>
  );
};

export default AccessibilityIssueDrawer;
