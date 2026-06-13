import React, { useState, useMemo, useEffect } from "react";
import { useQaPagesList } from "../../hooks/useQaPagesList";
import { useQaScan } from "../../contexts/QaScanContext";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";
import QAQuickInfoMenu from "./QAQuickInfoMenu";

const TABS = [
  { key: "all", label: "All", icon: "isax-folder" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "other", label: "Other Documents", icon: "isax-document-copy" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };
const TAB_PARAM = "tab";

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

function QaErrorsEmptyState({ title, message }) {
  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
      <div className="card-body text-center py-5 text-muted">
        <i
          className={`isax ${title === "PDF Documents" ? "isax-document-text" : "isax-document-copy"} fs-32 mb-3 d-block opacity-50`}
          aria-hidden="true"
        />
        <h6 className="text-body fw-semibold mb-2">{title}</h6>
        <p className="fs-13 mb-0 mx-auto" style={{ maxWidth: 420 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ContentWithQAErrorsView() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("notifications");
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const { isScanning, scanMessage } = useQaScan();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const useLiveTable = activeTab === "all" || activeTab === "pages";
  const apiSortBy =
    sortBy === "notifications"
      ? "issues"
      : sortBy === "title"
        ? "title"
        : sortBy === "readability"
          ? "readability"
          : "url";

  const {
    rows: apiRows,
    pagination,
    loading,
    error,
    domainId,
  } = useQaPagesList({
    filter: "qa-errors",
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: apiSortBy,
    sortOrder: sortDir,
    enabled: useLiveTable,
  });

  const displayRows = useMemo(() => {
    if (!useLiveTable) return [];
    if (sortBy !== "priority") return apiRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...apiRows].sort((a, b) => {
      if (sortBy === "priority") {
        return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      }
      return 0;
    });
  }, [apiRows, sortBy, sortDir, useLiveTable]);

  function openPageDetails(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }

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
      />
    );
  }

  const totalPages = useLiveTable ? pagination.pages || 1 : 1;
  const totalCount = useLiveTable
    ? (pagination.total ?? displayRows.length)
    : 0;

  const tabLabels = {
    all: "content items",
    pages: "pages",
    pdf: "PDF documents",
    other: "other documents",
  };

  return (
    <div className="d-flex flex-column min-h-0">
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i
            className="isax isax-document-copy fs-20 text-primary"
            aria-hidden="true"
          />
          Content with QA Errors
        </h5>
        <p className="text-muted fs-13 mb-0">
          {isScanning
            ? "QA scan in progress…"
            : useLiveTable
              ? loading
                ? "Loading…"
                : `${totalCount} ${tabLabels[activeTab] || "pages"}`
              : `0 ${tabLabels[activeTab] || "items"}`}
          {!domainId &&
            !loading &&
            !isScanning &&
            " — select a domain to load scan data"}
          {error && ` (${error})`}
        </p>
        {scanMessage && useLiveTable && (
          <p className="text-info fs-12 mb-0 mt-1">{scanMessage}</p>
        )}
      </div>

      <nav
        className="prioritized-content-filters mb-4"
        aria-label="Content type filter"
      >
        <div className="d-flex flex-wrap gap-1 gap-md-4 align-items-center">
          {TABS.map(({ key, label, icon }) => {
            const isActive = activeTab === key;
            return (
              <Link
                key={key}
                to={`/domain/quality-assurance?view=qa-errors&${TAB_PARAM}=${key}`}
                className={`prioritized-content-filter-link d-inline-flex align-items-center text-primary text-decoration-none py-2 ${isActive ? "active" : ""}`}
              >
                <i className={`isax ${icon} me-2`} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {activeTab === "pdf" && (
        <QaErrorsEmptyState
          title="PDF Documents"
          message="No PDF documents with QA errors in the latest scan. The QA crawler currently analyzes HTML pages only."
        />
      )}

      {activeTab === "other" && (
        <QaErrorsEmptyState
          title="Other Documents"
          message="No other document types with QA errors in the latest scan. Run a QA scan to refresh page-level results."
        />
      )}

      {useLiveTable && (
        <>
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
            <div className="position-relative" style={{ width: 220 }}>
              <i
                className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
                style={{ fontSize: "1rem" }}
                aria-hidden="true"
              />
              <input
                type="search"
                className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search pages"
                style={{ paddingLeft: "2rem" }}
              />
            </div>
          </div>

          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 fw-semibold text-body fs-13">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("title")}
                        >
                          Title and URL
                          <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("notifications")}
                        >
                          Issues Found
                          <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="py-3 fw-semibold text-body fs-13">
                        <span className="d-inline-flex align-items-center">
                          Priority
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                            onClick={() => handleSort("priority")}
                          >
                            <SortIcon column="priority" />
                          </button>
                        </span>
                      </th>
                      <th
                        className="py-3 pe-4 fw-semibold text-body fs-13 text-end"
                        style={{ width: 100 }}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          Loading pages with QA errors…
                        </td>
                      </tr>
                    )}
                    {!loading && !domainId && (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          Select a domain from the sidebar to view QA scan
                          results.
                        </td>
                      </tr>
                    )}
                    {!loading && domainId && displayRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          No pages with QA errors found. Click{" "}
                          <strong>Run QA scan</strong> above to crawl and
                          analyze your site.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      displayRows.map((row) => (
                        <tr key={row.id || row.url}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-primary">
                                {row.title || row.url}
                              </span>
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted small text-decoration-none mt-1 text-break"
                              >
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
                                brokenLinks={row.brokenLinksCount ?? 0}
                                brokenImages={row.brokenImagesCount ?? 0}
                                misspellings={row.misspellingsCount ?? 0}
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
                              className="btn btn-icon btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2 text-dark"
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
                  {totalCount === 0
                    ? "0 results"
                    : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, totalCount)} of ${totalCount}`}
                </span>
              </div>
              <nav aria-label="Content with QA errors pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li
                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                    if (p < 1 || p > totalPages) return null;
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
      />
    </div>
  );
}
