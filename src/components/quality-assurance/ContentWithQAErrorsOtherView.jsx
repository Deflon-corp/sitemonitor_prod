import React, { useState, useMemo, useRef, useEffect  } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageIssuesIcon from "../icons/PageIssuesIcon";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS = [
  { id: "o1", title: "Data Sheet.xlsx", url: "https://example.com/files/data-sheet.xlsx", notifications: 4, priority: "Medium", views: 56 },
  { id: "o2", title: "(No title found)", url: "https://example.com/files/report-2024.docx", notifications: 6, priority: "High", views: 23 },
  { id: "o3", title: "Pricing Guide", url: "https://example.com/files/pricing-guide.docx", notifications: 2, priority: "Low", views: 89 },
  { id: "o4", title: "Template v2", url: "https://example.com/files/template-v2.doc", notifications: 8, priority: "High", views: 12 },
  { id: "o5", title: "Process Flow", url: "https://example.com/files/process-flow.pptx", notifications: 3, priority: "Medium", views: 45 },
  { id: "o6", title: "(No title found)", url: "https://example.com/files/checklist.xls", notifications: 5, priority: "Low", views: 78 },
  { id: "o7", title: "Compliance Report", url: "https://example.com/files/compliance-report.xlsx", notifications: 7, priority: "High", views: 34 },
  { id: "o8", title: "User Manual", url: "https://example.com/files/user-manual.docx", notifications: 1, priority: "Low", views: 167 },
  { id: "o9", title: "Q4 Summary", url: "https://example.com/files/q4-summary.xlsx", notifications: 9, priority: "Medium", views: 28 },
  { id: "o10", title: "Draft Policy", url: "https://example.com/files/draft-policy.doc", notifications: 4, priority: "Medium", views: 9 },
  { id: "o11", title: "(No title found)", url: "https://example.com/files/legacy-format.wpd", notifications: 10, priority: "High", views: 2 },
  { id: "o12", title: "Archive List", url: "https://example.com/files/archive-list.csv", notifications: 2, priority: "Low", views: 15 },
  { id: "o13", title: "Export Data", url: "https://example.com/files/export-data.xlsx", notifications: 6, priority: "Medium", views: 41 },
];

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

export default function ContentWithQAErrorsOtherView() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const priorityTooltipRef = useRef(null);
  const viewsTooltipRef = useRef(null);

  useEffect(() => {
    function init(el) {
      if (!el || typeof window === "undefined") return;
      const bootstrap = window.bootstrap;
      if (!bootstrap?.Tooltip) return;
      const t = new bootstrap.Tooltip(el, { placement: "top" });
      return () => t.dispose();
    }
    const d1 = init(priorityTooltipRef.current);
    const d2 = init(viewsTooltipRef.current);
    return () => {
      d1?.();
      d2?.();
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return SAMPLE_ROWS;
    const q = search.toLowerCase();
    return SAMPLE_ROWS.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [search]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title") return dir * (a.title.localeCompare(b.title) || a.url.localeCompare(b.url));
      if (sortBy === "notifications") return dir * (a.notifications - b.notifications);
      if (sortBy === "priority") return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-document-copy fs-20 text-primary" aria-hidden="true"></i> Other Documents
        </h5>
        <p className="text-muted fs-13 mb-0">{filteredRows.length} other documents</p>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-3 mb-3">
        <button type="button" className="btn btn-sm bg-primary text-white rounded-2 border-0" title="Filter">
          <i className="isax isax-filter fs-18" aria-hidden="true"></i>
        </button>
        <div className="position-relative" style={{ width: 280 }}>
          <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
          <input
            type="search"
            className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                    onClick={() => handleSort("title")}
                  >
                    Title and URL
                    {sortBy === "title" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                    onClick={() => handleSort("notifications")}
                  >
                    Notifications
                    {sortBy === "notifications" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                    onClick={() => handleSort("priority")}
                  >
                    Priority
                    <span
                      ref={priorityTooltipRef}
                      className="ms-1 d-inline-flex"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      data-bs-title="Priority level"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="isax isax-information text-muted" aria-hidden="true"></i>
                    </span>
                    {sortBy === "priority" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                    onClick={() => handleSort("views")}
                  >
                    Views
                    <span
                      ref={viewsTooltipRef}
                      className="ms-1 d-inline-flex"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      data-bs-title="Total page views over the last 30 days"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="isax isax-information text-muted" aria-hidden="true"></i>
                    </span>
                    {sortBy === "views" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex flex-column">
                      <span className="text-body fs-13">{row.title}</span>
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break">
                        <span className="flex-shrink-0 d-inline-flex text-primary">
                          <ExternalLinkIcon size={12} />
                        </span>
                        {row.url}
                      </a>
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="badge rounded-pill bg-primary bg-opacity-15 text-primary fs-13">{row.notifications}</span>
                  </td>
                  <td className="py-2">
                    <span className={`badge rounded-pill ${row.priority === "High" ? "bg-danger" : row.priority === "Medium" ? "bg-warning text-dark" : "bg-secondary"}`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-body fs-13">{row.views}</span>
                  </td>
                  <td className="py-3 pe-4">
                    <div className="d-flex align-items-center gap-1">
                      <button type="button" className="btn btn-sm btn-light text-primary px-2 py-1 fs-12 d-inline-flex align-items-center gap-1" title="Open page issues">
                        <PageIssuesIcon size={14} /> (Open page issues)
                      </button>
                      <button type="button" className="btn btn-sm btn-light text-primary p-1" title="View details">
                        <i className="isax isax-search-normal-1 fs-16" aria-hidden="true"></i>
                      </button>
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
          <nav aria-label="Other documents pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
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
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
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

