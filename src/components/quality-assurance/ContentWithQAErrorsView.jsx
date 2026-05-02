import React, { useState, useMemo  } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";
import ContentWithQAErrorsPagesView from "./ContentWithQAErrorsPagesView";
import ContentWithQAErrorsPdfView from "./ContentWithQAErrorsPdfView";
import ContentWithQAErrorsOtherView from "./ContentWithQAErrorsOtherView";
import QAQuickInfoMenu from "./QAQuickInfoMenu";

const TABS = [
  { key: "all", label: "All", icon: "isax-folder" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "other", label: "Other Documents", icon: "isax-document-copy" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Sample data – replace with API */
const SAMPLE_ROWS = Array.from({ length: 499 }, (_, i) => ({
  id: `qa-${i + 1}`,
  title: i % 5 === 0 ? "(No title found)" : "Search",
  url: `https://www.bajajfinserv.in/search${i > 0 ? `?q=${i}` : ""}`,
  notifications: [12, 10, 8, 6, 4][i % 5],
  priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
  views: 0,
}));

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

const TAB_PARAM = "tab";

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function ContentWithQAErrorsView() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "all";
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  function openPageDetails(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }

  const filteredRows = useMemo(() => {
    let rows = SAMPLE_ROWS;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
    }
    return rows;
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
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ column }) {
    return (
      <i
        className={`isax ms-1 fs-12 ${sortBy === column ? (sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
        style={{ opacity: sortBy === column ? 1 : 0.4 }}
        aria-hidden="true"
      ></i>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-document-copy fs-20 text-primary" aria-hidden="true"></i> Content with QA Errors
        </h5>
        <p className="text-muted fs-13 mb-0">{filteredRows.length} pages</p>
      </div>

      {/* Filter tabs – same pattern as Prioritized Content >> All */}
      <nav className="prioritized-content-filters mb-4" aria-label="Content type filter">
        <div className="d-flex flex-wrap gap-1 gap-md-4 align-items-center">
          {TABS.map(({ key, label, icon }) => {
            const isActive = activeTab === key;
            return (
              <Link
                key={key}
                to={`/quality-assurance?view=qa-errors&${TAB_PARAM}=${key}`}
                className={`prioritized-content-filter-link d-inline-flex align-items-center text-primary text-decoration-none py-2 ${isActive ? "active" : ""}`}
              >
                <i className={`isax ${icon} me-2`} aria-hidden="true"></i>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {activeTab === "pages" && <ContentWithQAErrorsPagesView />}
      {activeTab === "pdf" && <ContentWithQAErrorsPdfView />}
      {activeTab === "other" && <ContentWithQAErrorsOtherView />}
      {activeTab === "all" && (
        <React.Fragment>
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 fw-semibold text-body fs-13">
                        <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("title")}>
                          Title and URL
                          <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("notifications")}>
                          Notifications
                          <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="py-3 fw-semibold text-body fs-13">
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
                      <th className="py-3 fw-semibold text-body fs-13">
                        <span className="d-inline-flex align-items-center">
                          Views
                          <span className="ms-1 opacity-75" title="View count">
                            <i className="isax isax-info-circle fs-14" aria-hidden="true"></i>
                          </span>
                          <button type="button" className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center" onClick={() => handleSort("views")}>
                            <SortIcon column="views" />
                          </button>
                        </span>
                      </th>
                      <th className="py-3 pe-4 fw-semibold text-body fs-13 text-end" style={{ width: "100px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 ps-4">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-primary">{row.title}</span>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted small text-decoration-none d-inline-flex align-items-center mt-1"
                              title="Open in new tab"
                            >
                              <span className="d-inline-flex align-items-center me-1" aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              {row.url}
                            </a>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-link p-0 border-0 text-decoration-none d-inline-flex align-items-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              aria-label="Show QA quick info"
                            >
                              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">{row.notifications}</span>
                            </button>
                            <QAQuickInfoMenu brokenLinks={row.notifications} brokenImages={0} misspellings={0} />
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">{row.priority}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-body">{row.views}</span>
                          <div className="progress mt-1" style={{ height: 4, width: 60 }}>
                            <div className="progress-bar bg-secondary" role="progressbar" style={{ width: "0%" }} aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} />
                          </div>
                        </td>
                        <td className="py-3 pe-4 text-end">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2 text-dark"
                            title="Open page details"
                            onClick={() => openPageDetails(row)}
                          >
                            <i className="isax isax-document-text text-primary" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <nav aria-label="Content with QA errors pagination">
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
        </React.Fragment>
      )}

      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toPageDetailsPage(selectedPage) : null}
        defaultTab="qa"
      />
    </div>
  );
}

