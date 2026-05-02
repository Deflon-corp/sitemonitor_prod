import React, { useState, useMemo } from "react";

const IMPACT_FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "technical", label: "Technical" },
];

const SEO_ISSUES_SAMPLE = [
  { id: "1", label: "Missing H1", hasIssue: true, impact: "high" },
  { id: "2", label: "Too short META description", hasIssue: true, impact: "medium" },
  { id: "3", label: "Too many internal links", hasIssue: true, impact: "medium" },
  { id: "4", label: "Missing title", hasIssue: false, impact: "none" },
  { id: "5", label: "Title found on more than one page", hasIssue: false, impact: "none" },
  { id: "6", label: "Multiple H1 on page", hasIssue: false, impact: "none" },
  { id: "7", label: "Pages with - No index", hasIssue: false, impact: "none" },
  { id: "8", label: "Canonical URL", hasIssue: false, impact: "none" },
  { id: "9", label: "Open Graph tags", hasIssue: false, impact: "none" },
];

const ComplianceRing = ({ percent, size = 48 }) => {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bs-light, #e9ecef)" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bs-primary, #0d6efd)"
        strokeWidth="4"
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

const ImpactDots = ({ impact }) => {
  if (impact === "none") return null;
  if (impact === "high") {
    return (
      <div className="d-flex align-items-center gap-1">
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} aria-hidden="true" />
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} aria-hidden="true" />
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} aria-hidden="true" />
      </div>
    );
  }
  if (impact === "medium") {
    return (
      <div className="d-flex align-items-center gap-1">
        <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} aria-hidden="true" />
        <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} aria-hidden="true" />
        <span className="rounded-circle bg-secondary bg-opacity-50" style={{ width: 6, height: 6 }} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="d-flex align-items-center gap-1">
      <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} aria-hidden="true" />
      <span className="rounded-circle bg-secondary bg-opacity-50" style={{ width: 6, height: 6 }} aria-hidden="true" />
      <span className="rounded-circle bg-secondary bg-opacity-50" style={{ width: 6, height: 6 }} aria-hidden="true" />
    </div>
  );
};

const SeoSection = () => {
  const [impactFilter, setImpactFilter] = useState("all");
  const [selectedIssueId, setSelectedIssueId] = useState(SEO_ISSUES_SAMPLE?.[0]?.id || null);
  const [detailTab, setDetailTab] = useState("information");

  const overallPercent = 78.57;

  const filteredIssues = useMemo(() => {
    if (impactFilter === "all") return SEO_ISSUES_SAMPLE;
    if (impactFilter === "technical") return SEO_ISSUES_SAMPLE.filter((r) => r.impact === "none");
    return SEO_ISSUES_SAMPLE.filter((r) => r.impact === impactFilter);
  }, [impactFilter]);

  const selectedIssue = selectedIssueId ? SEO_ISSUES_SAMPLE.find((r) => r.id === selectedIssueId) || null : null;

  return (
    <>
      {/* Header */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                <i className="isax isax-chart-215 fs-22" aria-hidden="true" />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Search Engine Optimization (SEO)</h6>
                <p className="text-muted fs-13 mb-0">SEO compliance for this page.</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <ComplianceRing percent={overallPercent} size={44} />
              <div>
                <span className="fw-semibold fs-15">{overallPercent}%</span>
                <p className="text-muted fs-12 mb-0" style={{ lineHeight: 1.2 }}>
                  Overall SEO compliance for this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Two columns */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <nav className="nav nav-tabs border-0 gap-2">
            {IMPACT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${
                  impactFilter === f.key ? "border-primary text-primary" : "border-transparent text-body"
                }`}
                onClick={() => setImpactFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="row g-3">
        {/* Left: Issues list */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-3">Issue</th>
                      <th className="fw-semibold text-body py-3">SEO impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2 border-bottom">
                          <button
                            type="button"
                            className="btn btn-link p-0 text-primary text-decoration-none border-0 text-start d-inline-flex align-items-center gap-2"
                            onClick={() => setSelectedIssueId(row.id)}
                          >
                            {row.hasIssue ? (
                              <span
                                className="rounded-circle d-flex align-items-center justify-content-center text-danger flex-shrink-0"
                                style={{ width: 24, height: 24, backgroundColor: "rgba(220, 53, 69, 0.15)" }}
                                aria-hidden="true"
                              >
                                <i className="isax isax-danger fs-14" />
                              </span>
                            ) : (
                              <span
                                className="rounded-circle d-flex align-items-center justify-content-center text-success flex-shrink-0"
                                style={{ width: 24, height: 24, backgroundColor: "rgba(25, 135, 84, 0.15)" }}
                                aria-hidden="true"
                              >
                                <i className="isax isax-tick-circle fs-14" />
                              </span>
                            )}
                            <span className="fw-medium fs-13">{row.label}</span>
                          </button>
                        </td>
                        <td className="py-2 border-bottom">
                          {row.hasIssue ? (
                            <ImpactDots impact={row.impact} />
                          ) : (
                            <span className="text-muted fs-13">No issues found</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              {selectedIssue ? (
                <>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      {selectedIssue.hasIssue ? (
                        <span
                          className="rounded-circle d-flex align-items-center justify-content-center text-danger flex-shrink-0"
                          style={{ width: 28, height: 28, backgroundColor: "rgba(220, 53, 69, 0.15)" }}
                          aria-hidden="true"
                        >
                          <i className="isax isax-danger fs-16" />
                        </span>
                      ) : (
                        <span
                          className="rounded-circle d-flex align-items-center justify-content-center text-success flex-shrink-0"
                          style={{ width: 28, height: 28, backgroundColor: "rgba(25, 135, 84, 0.15)" }}
                          aria-hidden="true"
                        >
                          <i className="isax isax-tick-circle fs-16" />
                        </span>
                      )}
                      <h6 className="mb-0 fw-semibold">{selectedIssue.label}</h6>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn btn-sm btn-light dropdown-toggle"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          Action
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center text-primary border-0 bg-transparent text-start w-100"
                            >
                              <i className="isax isax-eye-slash me-2" />
                              Ignore on this page
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center text-primary border-0 bg-transparent text-start w-100"
                            >
                              <i className="isax isax-tick-circle me-2" />
                              Mark as fixed
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center text-primary border-0 bg-transparent text-start w-100"
                            >
                              <i className="isax isax-eye-slash me-2" />
                              Ignore this check for this domain
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <nav className="nav nav-tabs border-0 gap-2 mb-3">
                    <button
                      type="button"
                      className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${
                        detailTab === "information" ? "border-primary text-primary" : "border-transparent text-body"
                      }`}
                      onClick={() => setDetailTab("information")}
                    >
                      Information
                    </button>
                    <button
                      type="button"
                      className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${
                        detailTab === "quick-help" ? "border-primary text-primary" : "border-transparent text-body"
                      }`}
                      onClick={() => setDetailTab("quick-help")}
                    >
                      Quick help
                    </button>
                  </nav>
                  <div className="pt-2">
                    {detailTab === "information" && (
                      <p className="text-muted fs-13 mb-0">
                        {selectedIssue.hasIssue
                          ? `This page has an issue: ${selectedIssue.label}. Review and fix for better SEO compliance.`
                          : "Good job! No issues were found."}
                      </p>
                    )}
                    {detailTab === "quick-help" && (
                      <p className="text-muted fs-13 mb-0">Quick help content for {selectedIssue.label}.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">Select an issue from the list to view details.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SeoSection;
