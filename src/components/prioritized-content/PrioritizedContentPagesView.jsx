import React, { useState, useMemo } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PrioritizedContentPagesView = ({
  rows,
  onOpenPageDetails,
}) => {
  const [sortKey, setSortKey] = useState("title");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      if (sortKey === "title") return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      if (sortKey === "notifications") return sortAsc ? a.notifications - b.notifications : b.notifications - a.notifications;
      if (sortKey === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return sortAsc ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority];
      }
      return sortAsc ? a.views - b.views : b.views - a.views;
    });
    return list;
  }, [rows, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ column }) => (
    <i
      className={`isax ms-1 fs-12 ${sortKey === column ? (sortAsc ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
      style={{ opacity: sortKey === column ? 1 : 0.4 }}
      aria-hidden="true"
    />
  );

  const priorityBadgeClass = (p) => {
    if (p === "High") return "bg-danger bg-opacity-10 text-danger";
    if (p === "Medium") return "bg-warning bg-opacity-25 text-dark";
    return "bg-secondary bg-opacity-25 text-body";
  };

  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4 overflow-hidden">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center fw-semibold"
                    onClick={() => toggleSort("title")}
                  >
                    Title and URL
                    <SortIcon column="title" />
                  </button>
                </th>
                <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center fw-semibold"
                    onClick={() => toggleSort("notifications")}
                  >
                    Notifications
                    <SortIcon column="notifications" />
                  </button>
                </th>
                <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                  <span className="d-inline-flex align-items-center fw-semibold">
                    Priority
                    <span className="ms-1" title="Priority level">
                      <i className="isax isax-info-circle fs-14 text-muted" aria-hidden="true" />
                    </span>
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                      onClick={() => toggleSort("priority")}
                    >
                      <SortIcon column="priority" />
                    </button>
                  </span>
                </th>
                <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                  <span className="d-inline-flex align-items-center fw-semibold">
                    Views
                    <span className="ms-1" title="View count">
                      <i className="isax isax-info-circle fs-14 text-muted" aria-hidden="true" />
                    </span>
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                      onClick={() => toggleSort("views")}
                    >
                      <SortIcon column="views" />
                    </button>
                  </span>
                </th>
                <th className="border-0 py-3 px-4" style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id} className="border-bottom border-secondary border-opacity-25">
                  <td className="px-4 py-3">
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-medium text-body">{row.title.trim() || "(No title found)"}</span>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                        title="Open in new tab"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex-shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 3h6v6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 14L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-break">{row.url}</span>
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">{row.notifications}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge rounded-pill ${priorityBadgeClass(row.priority)}`}>{row.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-body">{row.views}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-light"
                        title="Options"
                        onClick={() => onOpenPageDetails?.(row)}
                      >
                        <i className="isax isax-more-square text-primary" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-light rounded-circle"
                        title="View page"
                        onClick={() => onOpenPageDetails?.(row)}
                      >
                        <i className="isax isax-search-normal-1 text-primary" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
              {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, sortedRows.length)} of{" "}
              {sortedRows.length}
            </span>
          </div>
          <nav aria-label="Pages pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous"
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                  <button type="button" className="page-link" onClick={() => setCurrentPage(p)}>
                    {p}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
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
    </div>
  );
};

export default PrioritizedContentPagesView;
