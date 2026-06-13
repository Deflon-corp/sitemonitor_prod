import React, { useState, useMemo, useEffect } from "react";
import { useQaPagesList } from "../../hooks/useQaPagesList";
import { Link, useSearchParams } from "react-router-dom";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";
import QAQuickInfoMenu from "./QAQuickInfoMenu";
import { QaPanelEmpty } from "./QaDataStates";
import { QaTableStatusRow } from "./QaDataStates";
import { QA_TABLE } from "./qaConstants";

const TABS = [
  { key: "all", label: "All", icon: "isax-folder" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "other", label: "Other Documents", icon: "isax-document-copy" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const VIEW_FILTER_MAP = {
  "summary-broken-links": "broken-links",
  "summary-broken-images": "broken-images",
  "summary-misspellings": "misspellings",
  "summary-potential-misspellings": "potential-misspellings",
};

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };
const TAB_PARAM = "tab";

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function SummaryCategoryView({
  title,
  viewKey,
  defaultQaSubView,
  icon,
}) {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("notifications");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const listFilter = VIEW_FILTER_MAP[viewKey] || "qa-errors";
  const apiSortBy =
    sortBy === "notifications"
      ? "issues"
      : sortBy === "title"
        ? "title"
        : "url";
  const {
    rows: apiRows,
    pagination,
    loading,
  } = useQaPagesList({
    filter: listFilter,
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: apiSortBy,
    sortOrder: sortDir,
    enabled: activeTab === "all" || activeTab === "pages",
  });
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const openPageDetails = (row) => {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  };

  const sortedRows =
    activeTab === "all" || activeTab === "pages" ? apiRows : [];

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ column }) => (
    <i
      className={`isax ms-1 fs-12 ${sortBy === column ? (sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
      style={{ opacity: sortBy === column ? 1 : 0.4 }}
      aria-hidden="true"
    />
  );

  const totalPages =
    activeTab === "all" || activeTab === "pages" ? pagination.pages || 1 : 1;
  const paginatedRows = sortedRows;

  return (
    <div className="d-flex flex-column h-100">
      {/* Header with highlighted option */}
      <div className="mb-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <Link
            to="/domain/quality-assurance?view=summary"
            className="fs-13 text-muted text-decoration-none d-inline-flex align-items-center gap-1"
          >
            Summary
          </Link>
          <span className="text-muted">/</span>
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill fs-13 fw-medium">
            {title}
          </span>
        </div>
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className={`isax ${icon} fs-20 text-primary`} aria-hidden="true" />
          {title}
        </h5>
        <p className="text-muted fs-13 mb-0">
          {loading
            ? "Loading…"
            : `${pagination.total ?? sortedRows.length} pages`}
        </p>
      </div>

      {/* Filter tabs */}
      <nav
        className="prioritized-content-filters mb-4"
        aria-label="Content type filter"
      >
        <div className="d-flex flex-wrap gap-1 gap-md-4 align-items-center">
          {TABS.map(({ key, label, icon: tabIcon }) => {
            const isActive = activeTab === key;
            return (
              <Link
                key={key}
                to={`/domain/quality-assurance?view=${viewKey}&${TAB_PARAM}=${key}`}
                className={`prioritized-content-filter-link d-inline-flex align-items-center text-primary text-decoration-none py-2 ${isActive ? "active" : ""}`}
              >
                <i className={`isax ${tabIcon} me-2`} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {(activeTab === "pdf" || activeTab === "other") && (
        <QaPanelEmpty
          title={activeTab === "pdf" ? "PDF documents" : "Other documents"}
          message="Document-level breakdown is not available from the current scan. Use the All or Pages tab to see affected web pages."
        />
      )}
      {(activeTab === "all" || activeTab === "pages") && (
        <>
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-3 ps-4">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("title")}
                        >
                          Title and URL <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body py-3">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("notifications")}
                        >
                          Issues Found <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body py-3">
                        <span className="d-inline-flex align-items-center">
                          Priority
                          <span
                            className="ms-1 opacity-75"
                            title="Priority level"
                          >
                            <i
                              className="isax isax-info-circle fs-14"
                              aria-hidden="true"
                            />
                          </span>
                        </span>
                      </th>
                      <th
                        className="py-3 pe-4 fw-semibold text-body fs-13 text-end"
                        style={{ width: "100px" }}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    <QaTableStatusRow
                      colSpan={4}
                      loading={loading}
                      isEmpty={!loading && paginatedRows.length === 0}
                    />
                    {!loading &&
                      paginatedRows.map((row) => (
                        <tr key={row.id}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-primary">
                                {row.title}
                              </span>
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted small text-decoration-none d-inline-flex align-items-center mt-1"
                                title="Open in new tab"
                              >
                                <span
                                  className="d-inline-flex align-items-center me-1"
                                  aria-hidden="true"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-primary"
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
                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                                  {row.notifications}
                                </span>
                              </button>
                              <QAQuickInfoMenu
                                brokenLinks={row.notifications}
                                brokenImages={0}
                                misspellings={0}
                              />
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                              {row.priority}
                            </span>
                          </td>

                          <td className="py-3 pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light"
                              title="Open page details"
                              onClick={() => openPageDetails(row)}
                            >
                              <i
                                className="isax isax-document-text text-primary"
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
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
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-muted small">
                  {(currentPage - 1) * rowsPerPage + 1}–
                  {Math.min(currentPage * rowsPerPage, sortedRows.length)} of{" "}
                  {sortedRows.length}
                </span>
              </div>
              <nav aria-label="Pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li
                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  >
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
                      aria-label="Next"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}

      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toPageDetailsPage(selectedPage) : null}
        defaultTab="qa"
        defaultQaSubView={defaultQaSubView}
      />
    </div>
  );
}
