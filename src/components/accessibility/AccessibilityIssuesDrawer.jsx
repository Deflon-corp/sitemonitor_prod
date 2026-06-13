import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";

import { getAccessibilityPagesApi } from "@/api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SectionBlock = ({ section, onOpenPageDetails }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const sortedPages = useMemo(() => {
    if (!sortBy) return section.pages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...section.pages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.views - b.views);
    });
  }, [section.pages, sortBy, sortDir]);

  const totalPagesCount = Math.max(
    1,
    Math.ceil(sortedPages.length / rowsPerPage),
  );
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

  return (
    <div className="border-bottom border-secondary border-opacity-25 pb-4 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h6 className="mb-0 fw-semibold text-body fs-13">
          {section.issueTypeName}
        </h6>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-1"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Individual issues count"
            >
              <span className="text-muted fs-13">Individual issues</span>
              <span className="fw-semibold text-body">
                {section.count.toLocaleString()}
              </span>
              <i
                className="isax isax-arrow-down-1 fs-12 text-muted"
                aria-hidden="true"
              />
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item-text fs-13">
                  {section.count.toLocaleString()} issues
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
                  Title and url
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
                className="py-3 pe-4 text-body fs-13 fw-semibold"
                style={{ width: 100 }}
                aria-label="Actions"
              />
            </tr>
          </thead>
          <tbody>
            {paginatedPages.map((p, idx) => (
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
                    className={`badge rounded-pill ${
                      p.priority === "High"
                        ? "bg-danger bg-opacity-10 text-danger"
                        : p.priority === "Medium"
                          ? "bg-warning bg-opacity-10 text-warning"
                          : "bg-secondary bg-opacity-10 text-secondary"
                    }`}
                  >
                    {p.priority}
                  </span>
                </td>

                <td className="py-3 pe-4">
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                      title="Open page details"
                      aria-label="Open page details"
                      onClick={() => onOpenPageDetails?.(p)}
                    >
                      <i
                        className="isax isax-document-text fs-14 text-primary"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Rows per page</span>
          <select
            className="form-select form-select-sm rounded-2"
            style={{ width: "auto", minWidth: 60 }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Rows per page"
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-muted small">
            {(currentPage - 1) * rowsPerPage + 1}-
            {Math.min(currentPage * rowsPerPage, sortedPages.length)} of{" "}
            {sortedPages.length}
          </span>
        </div>
        <nav aria-label="Pagination">
          <ul className="pagination pagination-sm mb-0 gap-1">
            <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous"
              >
                «
              </button>
            </li>
            {Array.from({ length: Math.min(7, totalPagesCount) }, (_, i) => {
              let p;
              if (totalPagesCount <= 7) p = i + 1;
              else if (currentPage <= 4) p = i + 1;
              else if (currentPage >= totalPagesCount - 3)
                p = totalPagesCount - 6 + i;
              else p = currentPage - 3 + i;
              if (p < 1 || p > totalPagesCount) return null;
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
            {totalPagesCount > 7 && currentPage < totalPagesCount - 3 && (
              <li className="page-item disabled">
                <span className="page-link rounded-2">…</span>
              </li>
            )}
            {totalPagesCount > 7 && (
              <li className="page-item">
                <button
                  type="button"
                  className="page-link rounded-2"
                  onClick={() => setCurrentPage(totalPagesCount)}
                >
                  {totalPagesCount}
                </button>
              </li>
            )}
            <li
              className={`page-item ${currentPage >= totalPagesCount ? "disabled" : ""}`}
            >
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPagesCount, p + 1))
                }
                disabled={currentPage >= totalPagesCount}
                aria-label="Next"
              >
                »
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

const AccessibilityIssuesDrawer = ({
  open,
  onClose,
  guidelineId,
  issueType,
  guidelineLabel,
  totalCount = 0,
  onOpenPageDetails,
}) => {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (!open || !domainId || !guidelineId) return;
    setIsLoading(true);
    getAccessibilityPagesApi(domainId, {
      limit: 500,
      guidelineId,
      issueType,
    })
      .then((res) => {
        if (res.success && res.data) {
          setPages(
            res.data.pages.map((p) => ({
              title: p.title || "(No title found)",
              url: p.url,
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
      })
      .catch((err) => console.error("Failed to fetch pages for guideline", err))
      .finally(() => setIsLoading(false));
  }, [domainId, guidelineId, issueType, open]);

  const section = useMemo(() => {
    return {
      issueTypeName: "Pages with issues matching this guideline",
      count: pages.length,
      pages: pages,
    };
  }, [pages]);

  useEffect(() => {
    if (!open) return;
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

  if (!open) return null;

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
        aria-labelledby="accessibility-issues-drawer-title"
      >
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle text-body"
                  aria-hidden="true"
                />
              </button>
              <h6
                className="mb-0 fw-semibold text-body"
                id="accessibility-issues-drawer-title"
              >
                List of accessibility issues
              </h6>
            </div>
          </div>
          {guidelineLabel && (
            <p className="text-muted fs-13 mb-0 mt-2 ps-5">{guidelineLabel}</p>
          )}
        </div>

        <div className="flex-grow-1 overflow-auto px-4 py-4">
          {isLoading ? (
            <div className="text-center text-muted py-5">
              <div
                className="spinner-border spinner-border-sm text-primary me-2"
                role="status"
                aria-hidden="true"
              />
              Loading pages...
            </div>
          ) : pages.length === 0 ? (
            <p className="text-muted mb-0">No issues to display.</p>
          ) : (
            <SectionBlock
              section={section}
              onOpenPageDetails={onOpenPageDetails}
            />
          )}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};

export default AccessibilityIssuesDrawer;
