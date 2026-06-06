import React, { useState, useMemo, useRef, useEffect } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageIssuesIcon from "../icons/PageIssuesIcon";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS = [
  { id: "p1", title: "Search", url: "https://example.com/search", notifications: 12, priority: "High", views: 0 },
  { id: "p2", title: "(No title found)", url: "https://example.com/page/2", notifications: 10, priority: "High", views: 24 },
  { id: "p3", title: "Laptops", url: "https://example.com/bmall/laptops", notifications: 8, priority: "Medium", views: 156 },
  { id: "p4", title: "Personal Loan", url: "https://example.com/loans/personal-loan", notifications: 6, priority: "Medium", views: 89 },
  { id: "p5", title: "(No title found)", url: "https://example.com/about", notifications: 5, priority: "Low", views: 42 },
  { id: "p6", title: "Contact Us", url: "https://example.com/contact", notifications: 4, priority: "Low", views: 31 },
  { id: "p7", title: "Home", url: "https://example.com/", notifications: 3, priority: "High", views: 1200 },
  { id: "p8", title: "Insurance", url: "https://example.com/insurance", notifications: 9, priority: "Medium", views: 67 },
  { id: "p9", title: "(No title found)", url: "https://example.com/faq", notifications: 7, priority: "Low", views: 18 },
  { id: "p10", title: "Careers", url: "https://example.com/careers", notifications: 2, priority: "Low", views: 12 },
  { id: "p11", title: "Terms and Conditions", url: "https://example.com/terms", notifications: 11, priority: "High", views: 5 },
  { id: "p12", title: "Privacy Policy", url: "https://example.com/privacy", notifications: 6, priority: "Medium", views: 8 },
];

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

export default function ContentWithQAErrorsPagesView() {
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
          <i className="isax isax-document-text fs-20 text-primary" aria-hidden="true"></i> Pages
        </h5>
        <p className="text-muted fs-13 mb-0">{filteredRows.length} pages</p>
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
          <nav aria-label="Pages pagination">
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

