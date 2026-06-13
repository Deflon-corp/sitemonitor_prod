import React, { useState, useMemo } from "react";

const IMPACT_FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

const ComplianceRing = ({ percent, size = 48 }) => {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (safePercent / 100) * circumference;

  let color = "#0d6efd";
  if (safePercent >= 90) color = "#22c55e";
  else if (safePercent >= 70) color = "#0ea5e9";
  else if (safePercent >= 40) color = "#f59e0b";
  else color = "#ef4444";

  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ecef" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

const ImpactDots = ({ impact }) => {
  const imp = String(impact || "").toLowerCase();
  if (imp === "none") return null;
  if (imp === "high") {
    return (
      <div className="d-flex align-items-center gap-1">
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} />
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} />
        <span className="rounded-circle bg-danger" style={{ width: 6, height: 6 }} />
      </div>
    );
  }
  if (imp === "medium") {
    return (
      <div className="d-flex align-items-center gap-1">
        <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} />
        <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} />
        <span className="rounded-circle bg-light border" style={{ width: 6, height: 6 }} />
      </div>
    );
  }
  return (
    <div className="d-flex align-items-center gap-1">
      <span className="rounded-circle bg-primary" style={{ width: 6, height: 6 }} />
      <span className="rounded-circle bg-light border" style={{ width: 6, height: 6 }} />
      <span className="rounded-circle bg-light border" style={{ width: 6, height: 6 }} />
    </div>
  );
};

const SeoSection = ({ issues = [], score = 0 }) => {
  const [impactFilter, setImpactFilter] = useState("all");
  const [manualSelectedId, setManualSelectedId] = useState(null);

  const formattedIssues = useMemo(() => {
    if (!Array.isArray(issues)) return [];
    return issues.map((issue, idx) => {
      if (!issue) return null;
      const getDesc = (iss) => {
        if (typeof iss.description === "string" && iss.description) return iss.description;
        if (typeof iss.message === "string" && iss.message) return iss.message;
        if (typeof iss.title === "string" && iss.title) return iss.title;
        if (typeof iss.details === "string" && iss.details) return iss.details;
        return "";
      };
      
      const getLabel = (iss) => {
        if (typeof iss.message === "string" && iss.message) return iss.message;
        if (typeof iss.title === "string" && iss.title) return iss.title;
        if (typeof iss.type === "string" && iss.type) return iss.type;
        return "Unnamed issue";
      };

      return {
        id: `seo-issue-${idx}`,
        label: getLabel(issue),
        impact: String(issue.priority || "low").toLowerCase(),
        description: getDesc(issue),
      };
    }).filter(Boolean);
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (impactFilter === "all") return formattedIssues;
    return formattedIssues.filter((r) => r.impact === impactFilter);
  }, [impactFilter, formattedIssues]);

  // Derive selection: if manual is in current filtered list, use it. Otherwise use first of filtered.
  const selectedIssue = useMemo(() => {
    if (filteredIssues.length === 0) return null;
    const manual = manualSelectedId ? filteredIssues.find(i => i.id === manualSelectedId) : null;
    return manual || filteredIssues[0];
  }, [filteredIssues, manualSelectedId]);

  const selectedIssueId = selectedIssue?.id || null;

  return (
    <div className="seo-section">
      <div className="card border shadow-sm mb-3">
        <div className="card-body d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar avatar-40 bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
              <i className="isax isax-chart-215 fs-20" />
            </div>
            <div>
              <h6 className="mb-0">SEO Audit Score</h6>
              <p className="text-muted small mb-0">Live scan results for this page</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <ComplianceRing percent={score} size={44} />
            <div className="text-end">
              <div className="fw-bold fs-5">{score || 0}%</div>
              <div className="text-muted" style={{ fontSize: '10px' }}>COMPLIANCE</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border shadow-sm mb-3">
        <div className="card-body py-2">
          <nav className="nav nav-tabs border-0 gap-2">
            {IMPACT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${impactFilter === f.key ? "border-primary text-primary" : "border-transparent text-body"}`}
                onClick={() => {
                  setImpactFilter(f.key);
                  setManualSelectedId(null); // Reset selection when filter changes
                }}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </div>
      </div>


      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '400px' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-3">Audit Rule</th>
                      <th className="py-3">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((row) => (
                      <tr
                        key={row.id}
                        className={selectedIssueId === row.id ? "table-primary" : ""}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setManualSelectedId(row.id)}
                      >
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="isax isax-danger text-danger fs-16" />
                            <span className="small fw-medium">{row.label}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <ImpactDots impact={row.impact} />
                        </td>
                      </tr>
                    ))}
                    {filteredIssues.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-5 text-muted">No issues found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-body">
              {selectedIssue ? (
                <>
                  <h6 className="mb-3 d-flex align-items-center gap-2">
                    <i className="isax isax-info-circle text-primary" /> Issue Details
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-3 border border-secondary border-opacity-10">
                      <span className="fw-semibold text-body" style={{ fontSize: "0.85rem" }}>Priority:</span>
                      <span 
                        className={`badge text-capitalize border ${
                          selectedIssue.impact === 'high' ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' :
                          selectedIssue.impact === 'medium' ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25' :
                          'bg-primary bg-opacity-10 text-primary border-primary border-opacity-25'
                        }`} 
                        style={{ fontSize: "0.75rem" }}
                      >
                        {selectedIssue.impact}
                      </span>
                    </div>

                    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
                      <div className="card-body py-3">
                        <h6 className="fw-semibold text-body mb-2" style={{ fontSize: "0.9rem" }}>Issue Description</h6>
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                          {selectedIssue.description || selectedIssue.label || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                  Select an issue to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoSection;
