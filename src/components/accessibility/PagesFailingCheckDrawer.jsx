import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import { getAccessibilityPagesApi } from "@/api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PagesFailingCheckDrawer = ({
  open,
  onClose,
  check,
  onOpenPageDetails,
  onOpenDocuments,
}) => {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchPages = useCallback(async () => {
    if (!open || !domainId || !check) return;
    setIsLoading(true);
    try {
      const res = await getAccessibilityPagesApi(domainId, {
        limit: 500, // fetch all for the drawer up to 500
        issueId: check.id,
      });
      if (res.success && res.data) {
        setPages(
          (res.data.pages || []).map((p) => ({
            id: p.id,
            title: p.title || "(No title found)",
            url: p.url || "",
            priority:
              p.failedCount > 10
                ? "High"
                : p.failedCount > 3
                  ? "Medium"
                  : "Low",
            views: 0,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch pages for check", err);
    } finally {
      setIsLoading(false);
    }
  }, [domainId, check, open]);

  useEffect(() => {
    if (open) fetchPages();
  }, [open, fetchPages]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.url || "").toLowerCase().includes(q),
    );
  }, [pages, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            (a.url || "").localeCompare(b.url || ""))
        );
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.views - b.views);
    });
  }, [filteredPages, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPages.slice(start, start + rowsPerPage);
  }, [sortedPages, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSearchQuery("");
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !check) return null;

  const DRAWER_Z_BACKDROP = 1065;
  const DRAWER_Z_PANEL = 1070;

  const drawerContent = (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{
          zIndex: DRAWER_Z_PANEL,
          width: "min(100%, 960px)",
          maxWidth: "960px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pages-failing-check-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-outline-primary border border-secondary border-opacity-25 rounded-2"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle text-body"
                  aria-hidden="true"
                />
              </button>
              <div>
                <h6
                  className="mb-0 fw-semibold text-body"
                  id="pages-failing-check-drawer-title"
                >
                  Pages failing check
                </h6>
                <p className="text-muted fs-13 mb-0 mt-1">"{check.question}"</p>
              </div>
            </div>
            <div
              className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
              style={{ width: 220 }}
            >
              <span
                className="d-flex align-items-center ps-3 flex-shrink-0 text-muted"
                aria-hidden="true"
              >
                <i
                  className="isax isax-search-normal-1"
                  style={{ fontSize: "1rem" }}
                  aria-hidden="true"
                />
              </span>
              <input
                type="search"
                className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search"
                style={{ paddingLeft: "0.5rem" }}
              />
            </div>
          </div>
        </div>

        {/* Content - Table */}
        <div className="flex-grow-1 overflow-auto px-4 py-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("title")}
                        >
                          Page URL
                          {sortBy === "title" ? (
                            <i
                              className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                              aria-hidden="true"
                            />
                          ) : (
                            <i
                              className="isax isax-sort fs-12 opacity-50"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("priority")}
                        >
                          Priority
                          {sortBy === "priority" ? (
                            <i
                              className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                              aria-hidden="true"
                            />
                          ) : (
                            <i
                              className="isax isax-sort fs-12 opacity-50"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </th>
                      <th
                        className="py-3 pe-4 text-body fs-13 fw-semibold text-end"
                        style={{ width: 120 }}
                        aria-label="Actions"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          <div
                            className="spinner-border spinner-border-sm text-primary mb-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mb-0 fs-13">Loading pages...</p>
                        </td>
                      </tr>
                    ) : paginatedPages.length > 0 ? (
                      paginatedPages.map((p, idx) => (
                        <tr key={`${p.url}-${idx}`}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column">
                              <span className="text-body fs-13">{p.title}</span>
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                              >
                                <span className="flex-shrink-0 d-inline-flex text-primary">
                                  <ExternalLinkIcon size={12} />
                                </span>
                                {p.url}
                              </a>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Medium" ? "bg-warning bg-opacity-10 text-warning" : "bg-secondary bg-opacity-10 text-secondary"}`}
                            >
                              {p.priority}
                            </span>
                          </td>
                          <td className="py-3 pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-primary rounded-2"
                              title="Documents"
                              aria-label="Open page accessibility (WCAG) details"
                              onClick={() => onOpenDocuments?.(p)}
                            >
                              <i
                                className="isax isax-document-text fs-14 text-white"
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">
                          <p className="mb-0 fs-14">
                            No pages found matching this check.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm rounded-2"
                    style={{ width: "auto", minWidth: 70 }}
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
                    {Math.min(currentPage * rowsPerPage, sortedPages.length)} of{" "}
                    {sortedPages.length}
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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        «
                      </button>
                    </li>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= 7) p = i + 1;
                      else if (currentPage <= 4) p = i + 1;
                      else if (currentPage >= totalPages - 3)
                        p = totalPages - 6 + i;
                      else p = currentPage - 3 + i;
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
                    {totalPages > 7 && currentPage < totalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link rounded-2">…</span>
                      </li>
                    )}
                    {totalPages > 7 && (
                      <li className="page-item">
                        <button
                          type="button"
                          className="page-link rounded-2"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </li>
                    )}
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
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};

export default PagesFailingCheckDrawer;
