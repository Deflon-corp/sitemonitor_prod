import React, { useMemo, useState } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Sample data for PDFs – replace with API */
const SAMPLE_ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: `pdf-${i + 1}`,
  title: i % 3 === 0 ? "(No title found)" : `Document ${i + 1}.pdf`,
  url: `https://example.com/docs/document-${i + 1}.pdf`,
  unwanted: 0,
  required: i % 2,
  matches: 1,
  priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
  views: Math.floor(Math.random() * 200),
}));

const ContentWithPolicyMatchesPdfTabContent = ({ domainUrl, onOpenPageDetails }) => {
  const [titleSearch, setTitleSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredRows = useMemo(() => {
    const q = (titleSearch || "").toLowerCase().trim();
    if (!q) return SAMPLE_ROWS;
    return SAMPLE_ROWS.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [titleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  return (
    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
      <div className="card border-0 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fs-13 fw-semibold" style={{ minWidth: 320 }}>
                  <div className="d-flex flex-column gap-1">
                    <span className="d-flex align-items-center gap-1">
                      Title and URL
                      <i className="isax isax-sort text-muted" aria-hidden="true" />
                    </span>
                    <input
                      type="search"
                      className="form-control form-control-sm"
                      placeholder="Search"
                      value={titleSearch}
                      onChange={(e) => { setTitleSearch(e.target.value); setCurrentPage(1); }}
                      aria-label="Search title and URL"
                    />
                    <span className="text-muted small">{domainUrl ?? "https://example.com/"}</span>
                  </div>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">Unwanted</th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">Required</th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <span className="d-flex align-items-center gap-1">
                    Matches <i className="isax isax-sort text-muted" aria-hidden="true" />
                  </span>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <span className="d-flex align-items-center gap-1">
                    Priority <i className="isax isax-sort text-muted" aria-hidden="true" />
                  </span>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <span className="d-flex align-items-center gap-1">
                    Views <i className="isax isax-sort text-muted" aria-hidden="true" />
                  </span>
                </th>
                <th className="py-3 pe-4" style={{ width: 100 }} aria-label="View page" />
                <th className="py-3 pe-4" style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex flex-column gap-1">
                      <span className="text-body">{row.title}</span>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1"
                      >
                        {row.url}
                        <ExternalLinkIcon size={12} className="flex-shrink-0" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="d-inline-flex align-items-center gap-1">
                      <i className="isax isax-circle text-secondary" style={{ fontSize: "0.5rem" }} aria-hidden="true" />
                      {row.unwanted}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="d-inline-flex align-items-center gap-1">
                      <i className="isax isax-danger text-warning" style={{ fontSize: "0.75rem" }} aria-hidden="true" />
                      {row.required}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="d-inline-flex align-items-center gap-1">
                      <i className="isax isax-search-normal-1 text-primary" style={{ fontSize: "0.75rem" }} aria-hidden="true" />
                      {row.matches}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`badge rounded-pill ${row.priority === "High" ? "bg-danger" : row.priority === "Medium" ? "bg-warning text-dark" : "bg-secondary"}`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="py-3">{row.views}</td>
                  <td className="py-3 pe-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-2"
                      title="View page"
                      aria-label="Open page details"
                      onClick={() => onOpenPageDetails?.(row)}
                    >
                      <i className="isax isax-document-text fs-16" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="py-3 pe-4">
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-1"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        aria-label="Action"
                      >
                        Action
                        <i className="isax isax-arrow-down-1 fs-14" aria-hidden="true" />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary" onClick={(e) => e.preventDefault()}>
                            <i className="isax isax-refresh-25" aria-hidden="true" />
                            Run policy again
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary" onClick={(e) => e.preventDefault()}>
                            <i className="isax isax-eye-slash" aria-hidden="true" />
                            Ignore
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary" onClick={(e) => e.preventDefault()}>
                            <i className="isax isax-tick-circle" aria-hidden="true" />
                            Mark as fixed
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 px-0">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Rows per page</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-muted small">
            {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
          </span>
        </div>
        <nav aria-label="PDFs pagination">
          <ul className="pagination pagination-sm mb-0 gap-1">
            <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
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
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
            })}
            <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ContentWithPolicyMatchesPdfTabContent;
