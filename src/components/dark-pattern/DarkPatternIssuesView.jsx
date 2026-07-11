import React, { useState } from "react";

const DarkPatternIssuesView = () => {
  const urlIssues = [
    {
      id: 1,
      url: "https://example.com/checkout",
      type: "Hidden Costs",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Additional handling fee added at final step.",
      date: "2026-07-10",
    },
    {
      id: 2,
      url: "https://example.com/pricing",
      type: "Misdirection",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Annual plan pre-selected without clear monthly option.",
      date: "2026-07-10",
    },
    {
      id: 3,
      url: "https://example.com/account/settings",
      type: "Roach Motel",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Account deletion requires calling customer service.",
      date: "2026-07-10",
    },
    {
      id: 4,
      url: "https://example.com/newsletter/unsubscribe",
      type: "Confirmshaming",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Unsubscribe button text says 'I hate saving money'.",
      date: "2026-07-10",
    },
    {
      id: 5,
      url: "https://example.com/cart",
      type: "Sneak into Basket",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Extended warranty automatically added to cart.",
      date: "2026-07-10",
    },
    {
      id: 6,
      url: "https://example.com/premium-upgrade",
      type: "Forced Continuity",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Free trial silently converts to paid subscription.",
      date: "2026-07-11",
    },
    {
      id: 7,
      url: "https://example.com/flash-sale",
      type: "Fake Scarcity",
      severity: "Low",
      severityClass: "bg-info bg-opacity-10 text-info",
      description: "Countdown timer resets on page refresh.",
      date: "2026-07-11",
    },
    {
      id: 8,
      url: "https://example.com/social-login",
      type: "Privacy Zuckering",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Default settings share friends list publicly.",
      date: "2026-07-11",
    },
    {
      id: 9,
      url: "https://example.com/search-results",
      type: "Bait and Switch",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Clicking a product opens a sponsored app install instead.",
      date: "2026-07-12",
    },
    {
      id: 10,
      url: "https://example.com/flight-booking",
      type: "Hidden Costs",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Seat selection fee applied without warning.",
      date: "2026-07-12",
    },
    {
      id: 11,
      url: "https://example.com/app-install",
      type: "Misdirection",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Skip button is greyed out making it look disabled.",
      date: "2026-07-12",
    },
    {
      id: 12,
      url: "https://example.com/delete-account",
      type: "Confirmshaming",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Dialog says 'I don't care about my security'.",
      date: "2026-07-12",
    }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(urlIssues.length / rowsPerPage);
  
  const currentIssues = urlIssues.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-danger fs-20 text-primary" />
          Detected Issues by URL
        </h5>
        <p className="text-muted fs-13 mb-0">
          A detailed list of all dark patterns found across individual URLs.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fs-15 fw-semibold">Affected URLs</h6>
          <div className="input-group" style={{ width: '250px' }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="isax isax-search-normal-1 fs-16 text-muted"></i>
            </span>
            <input type="text" className="form-control bg-light border-start-0" placeholder="Search URLs..." />
          </div>
        </div>
        <div className="card-body px-0 py-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Page URL</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Dark Pattern Type</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Severity</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Description</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4 text-end">Date Detected</th>
                </tr>
              </thead>
              <tbody>
                {currentIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-4 py-3">
                      <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-primary fw-medium fs-14 text-decoration-none d-flex align-items-center gap-2">
                        {issue.url}
                        <i className="isax isax-export-1 fs-14"></i>
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body fw-medium fs-13">
                        {issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge rounded-pill px-3 py-2 fs-12 fw-medium ${issue.severityClass}`} style={{ width: "90px" }}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 fs-13 text-muted" style={{ maxWidth: '300px' }}>
                      {issue.description}
                    </td>
                    <td className="px-4 py-3 fs-13 text-muted text-end">
                      {issue.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {urlIssues.length > 0 && (
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
                  {[10, 25, 50, 100, 500].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <span className="text-muted small">
                  {(currentPage - 1) * rowsPerPage + 1}–
                  {Math.min(currentPage * rowsPerPage, urlIssues.length)} of{" "}
                  {urlIssues.length}
                </span>
              </div>

              <nav aria-label="Dark pattern list pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li
                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from(
                    { length: Math.min(totalPages, 10) },
                    (_, i) => {
                      const p =
                        currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
                    },
                  )}

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
    </div>
  );
};

export default DarkPatternIssuesView;
