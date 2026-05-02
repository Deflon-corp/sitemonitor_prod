import React from "react";
const DEFAULT_HITS_BAR_MAX = 500;

/**
 * Single policy row for the Global Policy List table (Title, Added by, Creation date, Hits, Action).
 * Used when displaying All, Matches, Required, Unwanted, or Archived policies.
 */
const PolicyListTableRow = ({ row, hitsBarMax = DEFAULT_HITS_BAR_MAX }) => {
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
            </div>
          </div>
        </div>
      </td>
      <td className="py-2 text-body fs-13">{row.addedBy}</td>
      <td className="py-2 text-body fs-13">{row.creationDate}</td>
      <td className="py-2">
        {row.hits > 0 ? (
          <div
            className="rounded-2 bg-primary text-white d-inline-flex align-items-center justify-content-center fw-medium fs-13 position-relative overflow-hidden"
            style={{
              minWidth: 64,
              height: 28,
              width: Math.max(64, Math.min(140, (row.hits / hitsBarMax) * 140)),
            }}
          >
            <span className="position-relative z-1">{row.hits}</span>
          </div>
        ) : (
          <span className="text-muted fs-13">{row.hits}</span>
        )}
      </td>
      <td className="py-2 pe-4">
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-1 dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Policy actions"
          >
            Action
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
    </tr>
  );
};

export default PolicyListTableRow;
