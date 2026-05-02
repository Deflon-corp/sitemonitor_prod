import React, { useState, useMemo  } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS = [
  { id: 101, url: "https://legacy.bajajfinserv.in/old-dashboard", responseCode: "404", type: "link", documentsCount: 0, pagesCount: 88 },
  { id: 102, url: "https://cdn.old-domain.com/retired-asset", responseCode: "404", type: "link", documentsCount: 0, pagesCount: 45 },
  { id: 103, url: "https://www.bajajfinserv.in/deprecated-tool", responseCode: "410", type: "link", documentsCount: 0, pagesCount: 22 },
  { id: 104, url: "https://partner-discontinued.com/page", responseCode: "404", type: "link", documentsCount: 0, pagesCount: 15 },
  { id: 105, url: "https://www.bajajfinserv.in/archive/2019", responseCode: "404", type: "link", documentsCount: 0, pagesCount: 9 },
  { id: 106, url: "https://external-api.com/v1/deprecated", responseCode: "410", type: "link", documentsCount: 0, pagesCount: 6 },
  { id: 107, url: "https://www.bajajfinserv.in/sunset-feature", responseCode: "404", type: "link", documentsCount: 0, pagesCount: 3 },
];

export default function BrokenLinksIgnoredView({ onOpenContentDrawer, onOpenDocumentsDrawer }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortByUrl, setSortByUrl] = useState(null);

  const filteredRows = SAMPLE_ROWS;

  const sortedRows = useMemo(() => {
    if (!sortByUrl) return filteredRows;
    return [...filteredRows].sort((a, b) =>
      sortByUrl === "asc" ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url)
    );
  }, [filteredRows, sortByUrl]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  function handleSortUrl() {
    setCurrentPage(1);
    setSortByUrl((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <p className="text-muted fs-13 mb-0">{sortedRows.length} ignored links</p>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4" style={{ width: 40 }}>
                  <input type="checkbox" className="form-check-input" aria-label="Select all" />
                </th>
                <th className="fw-semibold text-body py-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center gap-1"
                    onClick={handleSortUrl}
                  >
                    Broken link
                    {sortByUrl != null && (
                      <i className={`isax fs-14 ${sortByUrl === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
                    )}
                    {sortByUrl == null && <i className="isax isax-sort fs-14 opacity-50" aria-hidden="true"></i>}
                  </button>
                </th>
                <th className="fw-semibold text-body py-3">Response code</th>
                <th className="fw-semibold text-body py-3">Type</th>
                <th className="fw-semibold text-body py-3 text-center">Documents</th>
                <th className="fw-semibold text-body py-3 text-center">
                  <span className="d-inline-flex align-items-center">Pages
                    <i className="isax isax-arrow-down-1 ms-1 fs-12 opacity-75" aria-hidden="true"></i>
                  </span>
                </th>
                <th className="fw-semibold text-body py-3 pe-4" style={{ width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="ps-4 py-3">
                    <input type="checkbox" className="form-check-input" aria-label={`Select link ${row.id}`} />
                  </td>
                  <td className="py-3">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                      {row.url}
                    </a>
                  </td>
                  <td className="py-2">
                    <span className="text-body">{row.responseCode}</span>
                  </td>
                  <td className="py-2">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">{row.type}</span>
                  </td>
                  <td className="py-3 text-center">
                    {onOpenDocumentsDrawer ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none"
                        onClick={() => onOpenDocumentsDrawer(row.url)}
                        title="View documents with this broken link"
                      >
                        <span className="text-primary fw-medium">{row.documentsCount}</span>
                      </button>
                    ) : (
                      <span className="text-primary fw-medium">{row.documentsCount}</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {onOpenContentDrawer ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none"
                        onClick={() => onOpenContentDrawer(row.url)}
                        title="View content with this broken link"
                      >
                        <span className="text-primary fw-medium">{row.pagesCount}</span>
                      </button>
                    ) : (
                      <span className="text-primary fw-medium">{row.pagesCount}</span>
                    )}
                  </td>
                  <td className="py-3 pe-4">
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-light d-inline-flex align-items-center gap-1"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Action
                        <i className="isax isax-arrow-down-1 fs-12" aria-hidden="true"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li><button type="button" className="dropdown-item">Unignore</button></li>
                        <li><button type="button" className="dropdown-item">Mark as fixed</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 bg-body-tertiary bg-opacity-50 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Rows per page</span>
            <select
              className="form-select form-select-sm rounded-2"
              style={{ width: "auto", minWidth: 60 }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-muted small">
              {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}
            </span>
          </div>
          <nav aria-label="Ignored broken links pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">
                  Previous
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                if (p > totalPages) return null;
                return (
                  <li key={p} className="page-item">
                    <button type="button" className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  </li>
                );
              })}
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

