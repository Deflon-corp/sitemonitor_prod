import React, { useState, useMemo, useRef, useEffect } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS = [
  { id: "bl-pdf1", title: "Annual Report 2024", url: "https://example.com/docs/annual-report-2024.pdf", notifications: 15, priority: "High", views: 0 },
  { id: "bl-pdf2", title: "(No title found)", url: "https://example.com/assets/terms-conditions.pdf", notifications: 10, priority: "High", views: 12 },
  { id: "bl-pdf3", title: "Product Brochure", url: "https://example.com/downloads/product-brochure.pdf", notifications: 8, priority: "Medium", views: 45 },
  { id: "bl-pdf4", title: "Privacy Policy", url: "https://example.com/legal/privacy-policy.pdf", notifications: 6, priority: "Medium", views: 28 },
  { id: "bl-pdf5", title: "Loan Application Form", url: "https://example.com/forms/loan-application.pdf", notifications: 12, priority: "High", views: 89 },
  { id: "bl-pdf6", title: "(No title found)", url: "https://example.com/docs/whitepaper-q3.pdf", notifications: 4, priority: "Low", views: 7 },
  { id: "bl-pdf7", title: "Insurance Guide", url: "https://example.com/insurance/guide.pdf", notifications: 9, priority: "Medium", views: 34 },
  { id: "bl-pdf8", title: "FAQ Document", url: "https://example.com/help/faq.pdf", notifications: 5, priority: "Low", views: 19 },
  { id: "bl-pdf9", title: "Compliance Report", url: "https://example.com/compliance/report-2024.pdf", notifications: 11, priority: "High", views: 3 },
  { id: "bl-pdf10", title: "User Manual", url: "https://example.com/support/user-manual.pdf", notifications: 7, priority: "Medium", views: 56 },
  { id: "bl-pdf11", title: "(No title found)", url: "https://example.com/old/catalog.pdf", notifications: 14, priority: "High", views: 0 },
  { id: "bl-pdf12", title: "Rate Card", url: "https://example.com/rates/rate-card.pdf", notifications: 6, priority: "Medium", views: 102 },
  { id: "bl-pdf13", title: "Sustainability Report", url: "https://example.com/esg/sustainability-2024.pdf", notifications: 3, priority: "Low", views: 22 },
  { id: "bl-pdf14", title: "Investor Presentation", url: "https://example.com/investors/presentation.pdf", notifications: 8, priority: "Medium", views: 41 },
  { id: "bl-pdf15", title: "(No title found)", url: "https://example.com/archive/legacy-doc.pdf", notifications: 2, priority: "Low", views: 1 },
  { id: "bl-pdf16", title: "Claim Form", url: "https://example.com/insurance/claim-form.pdf", notifications: 13, priority: "High", views: 67 },
];

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function ContentWithBrokenLinksPdfView(props = {}) {
  const { search: searchProp, onSearchChange } = props;
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const priorityTooltipRef = useRef(null);
  const viewsTooltipRef = useRef(null);

  useEffect(() => {
    if (onSearchChange) setCurrentPage(1);
  }, [search, onSearchChange]);

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
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
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
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
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
                      <i className="isax isax-info-circle text-muted" aria-hidden="true"></i>
                    </span>
                    {sortBy === "priority" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-arrow-down-1 ms-1 text-muted opacity-50" aria-hidden="true"></i>
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
                      data-bs-title="View count"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="isax isax-info-circle text-muted" aria-hidden="true"></i>
                    </span>
                    {sortBy === "views" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
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
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1">
                        <span className="flex-shrink-0 d-inline-flex text-primary">
                          <ExternalLinkIcon size={12} />
                        </span>
                        {row.url}
                      </a>
                    </div>
                  </td>
                  <td className="py-3">
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
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-light"
                        title="Open page details"
                        onClick={() => {
                          setSelectedPage(row);
                          setPageDetailsOpen(true);
                        }}
                      >
                        <i className="isax isax-document-text text-primary" aria-hidden="true"></i>
                      </button>
                      <button type="button" className="btn btn-icon btn-sm btn-light" title="Search">
                        <i className="isax isax-search-normal-1 text-primary" aria-hidden="true"></i>
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
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-muted small">
              {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}
            </span>
          </div>
          <nav aria-label="PDF documents pagination">
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
      <PageDetailsDrawer open={pageDetailsOpen} onClose={() => setPageDetailsOpen(false)} page={selectedPage ? toPageDetailsPage(selectedPage) : null} defaultTab="qa" />
    </div>
  );
}

