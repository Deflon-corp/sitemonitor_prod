import React from "react";

/**
 * Circular progress indicator for compliance (e.g. 100% = full teal circle).
 */
const ComplianceCircle = ({ percent }) => {
  const r = 12;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <span className="d-inline-flex align-items-center justify-content-center flex-shrink-0 ms-2" style={{ width: 28, height: 28 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" className="rotate-n90">
        <circle cx="14" cy="14" r={r} fill="none" stroke="var(--bs-body-tertiary)" strokeWidth="3" />
        <circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
    </span>
  );
};

/**
 * One policy row for Policy list >> Required: Title (green check, subtitle, icons), Actions, Compliance (%, COMPLIANCE, circle), Policy Hits.
 */
const RequiredPolicyListRow = ({ row }) => {
  return (
    <tr>
      <td className="py-2 ps-4">
        <div className="d-flex align-items-start gap-2">
          <span
            className={`d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle ${
              row.status === "hits" ? "bg-secondary bg-opacity-25" : "bg-success bg-opacity-25"
            }`}
            style={{ width: 32, height: 32 }}
          >
            {row.status === "hits" ? (
              <i className="isax isax-search-normal-1 text-secondary fs-16" aria-hidden="true" />
            ) : (
              <i className="isax isax-tick-circle text-success fs-16" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <span className="fw-semibold text-body d-block fs-13">{row.title}</span>
            <span className="text-muted fs-12 d-block">Search in: {row.searchScope}</span>
            <div className="d-flex align-items-center gap-2 mt-1">
              <i className="isax isax-information text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
              <i className="isax isax-timer-1 text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
              <i className="isax isax-refresh-2 text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </td>
      <td className="py-2">
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-1 text-body"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Policy actions"
          >
            Action
            <i className="isax isax-arrow-down-1" aria-hidden="true" />
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button type="button" className="dropdown-item">
                Edit policy
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item">
                View details
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item">
                Duplicate
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button type="button" className="dropdown-item text-danger">
                Delete
              </button>
            </li>
          </ul>
        </div>
      </td>
      <td className="py-2">
        <div className="d-flex align-items-center">
          <div className="d-flex flex-column">
            <span className="text-primary fw-medium fs-13">{row.compliancePercent}%</span>
            <span className="text-muted fs-12">COMPLIANCE</span>
          </div>
          <ComplianceCircle percent={row.compliancePercent} />
        </div>
      </td>
      <td className="py-2 pe-4">
        {row.policyHits != null ? (
          <span className="text-primary fw-medium fs-13">{row.policyHits} HITS</span>
        ) : (
          <span className="text-success fs-13">No hits found</span>
        )}
      </td>
    </tr>
  );
};

export default RequiredPolicyListRow;
