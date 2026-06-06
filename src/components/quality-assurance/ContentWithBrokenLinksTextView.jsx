import React, { useState, useMemo, useRef, useEffect } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS = [
  { id: "bl-txt1", title: "Readme", url: "https://example.com/docs/readme.txt", notifications: 8, priority: "Medium", views: 0 },
  { id: "bl-txt2", title: "(No title found)", url: "https://example.com/legacy/changelog.txt", notifications: 5, priority: "Low", views: 4 },
  { id: "bl-txt3", title: "License", url: "https://example.com/legal/license.txt", notifications: 10, priority: "High", views: 18 },
  { id: "bl-txt4", title: "Data Export", url: "https://example.com/exports/sample-data.txt", notifications: 6, priority: "Medium", views: 32 },
  { id: "bl-txt5", title: "API Changelog", url: "https://example.com/api/changelog.txt", notifications: 12, priority: "High", views: 9 },
  { id: "bl-txt6", title: "(No title found)", url: "https://example.com/old/notes.txt", notifications: 3, priority: "Low", views: 0 },
  { id: "bl-txt7", title: "Terms of Service", url: "https://example.com/terms/terms-of-service.txt", notifications: 7, priority: "Medium", views: 21 },
  { id: "bl-txt8", title: "Cookie Policy", url: "https://example.com/policies/cookies.txt", notifications: 4, priority: "Low", views: 11 },
  { id: "bl-txt9", title: "Sitemap Index", url: "https://example.com/sitemap-index.txt", notifications: 9, priority: "High", views: 45 },
  { id: "bl-txt10", title: "Error Log Sample", url: "https://example.com/dev/error-sample.txt", notifications: 2, priority: "Low", views: 2 },
  { id: "bl-txt11", title: "(No title found)", url: "https://example.com/archive/backup-list.txt", notifications: 11, priority: "High", views: 0 },
  { id: "bl-txt12", title: "Contact List", url: "https://example.com/internal/contacts.txt", notifications: 6, priority: "Medium", views: 7 },
  { id: "bl-txt13", title: "Release Notes", url: "https://example.com/releases/notes-v2.txt", notifications: 8, priority: "Medium", views: 28 },
  { id: "bl-txt14", title: "FAQ Export", url: "https://example.com/help/faq-export.txt", notifications: 5, priority: "Low", views: 15 },
  { id: "bl-txt15", title: "Disclaimer", url: "https://example.com/legal/disclaimer.txt", notifications: 7, priority: "Medium", views: 12 },
  { id: "bl-txt16", title: "(No title found)", url: "https://example.com/temp/upload-log.txt", notifications: 1, priority: "Low", views: 0 },
  { id: "bl-txt17", title: "Guidelines", url: "https://example.com/content/guidelines.txt", notifications: 9, priority: "High", views: 56 },
  { id: "bl-txt18", title: "Metadata Schema", url: "https://example.com/schema/metadata.txt", notifications: 4, priority: "Low", views: 3 },
];

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function ContentWithBrokenLinksTextView(props = {}) {
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
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body">
                        <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("title")}>
                          Title and URL
                          <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("notifications")}>
                          Issues Found
                          <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <span className="d-inline-flex align-items-center">
                          Priority
                          <span className="ms-1 opacity-75" title="Priority level">
                            <i className="isax isax-info-circle fs-14" aria-hidden="true"></i>
                          </span>
                          <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center" onClick={() => handleSort("priority")}>
                            <SortIcon column="priority" />
                          </button>
                        </span>
                      </th>
                      <th className="fw-semibold text-body text-end" style={{ width: "100px" }}></th>
                    </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 ps-4">
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
          <nav aria-label="Text documents pagination">
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

