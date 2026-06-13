function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import IgnoredSpellingPageDetailsDrawer from "@/components/prioritized-content/IgnoredSpellingPageDetailsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGES = [];

function formatDateFound(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleString("en", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e2) {
    return dateStr;
  }
}

const DEFAULT_BACKDROP_Z = 1065;
const DEFAULT_PANEL_Z = 1070;

/**
 * Drawer shown when user clicks "Open issue page" from Page Details >> Ignored Misspellings.
 * Shows: header (Ignored spelling: word, ID, Action, Copy URL), Issue details, and "All pages with this Ignored Spelling" table.
 */
export default function IgnoredSpellingDetailDrawer({
  open,
  onClose,
  issue,
  page,
  pagesWithIgnoredSpelling = DEFAULT_PAGES,
  onOpenPageDetails,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const resolvedPagesWithIgnoredSpelling = useMemo(() => {
    if (pagesWithIgnoredSpelling && pagesWithIgnoredSpelling.length > 0)
      return pagesWithIgnoredSpelling;
    if (page)
      return [
        {
          title: page.title || "Untitled Page",
          url: page.url,
          priority: "Medium",
          views: 0,
        },
      ];
    return [];
  }, [pagesWithIgnoredSpelling, page]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return resolvedPagesWithIgnoredSpelling;
    const q = searchQuery.toLowerCase();
    return resolvedPagesWithIgnoredSpelling.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q),
    );
  }, [resolvedPagesWithIgnoredSpelling, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPages.slice(start, start + rowsPerPage);
  }, [filteredPages, currentPage, rowsPerPage]);

  const handleCopyUrl = () => {
    const url =
      issue && resolvedPagesWithIgnoredSpelling.length > 0
        ? resolvedPagesWithIgnoredSpelling[0].url
        : window.location.href;
    void navigator.clipboard.writeText(url);
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

  if (!open || !issue) return null;

  const firstPage = resolvedPagesWithIgnoredSpelling[0];

  const drawerContent = (
    <React.Fragment>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: backdropZIndex }}
        aria-hidden={true}
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{
          zIndex: panelZIndex,
          width: "min(100%, 960px)",
          maxWidth: "960px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ignored-spelling-detail-drawer-title"
      >
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i className="isax isax-arrow-left" aria-hidden={true} />
              </button>
              <div>
                <h6
                  className="mb-0 fw-semibold"
                  id="ignored-spelling-detail-drawer-title"
                >
                  {"Ignored spelling: "}
                  {issue.word}
                </h6>
                <p className="text-muted fs-13 mb-0">
                  {"ID: "}
                  {issue.id}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(issue.word)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-icon btn-sm btn-light text-primary"
                title="Lookup in Google"
              >
                <span className="fw-bold">G</span>
              </a>
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-sm btn-light dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {"Action "}
                  <i
                    className="isax isax-arrow-down-1 ms-1 fs-12"
                    aria-hidden={true}
                  />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button type="button" className="dropdown-item">
                      Remove from ignored
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item">
                      Add to dictionary
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={handleCopyUrl}
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto px-4 py-3">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Issue details</h6>
              <dl className="row mb-0 fs-13">
                <dt className="col-4 text-muted">Word</dt>
                <dd className="col-8 mb-2 fw-medium">{issue.word}</dd>
                <dt className="col-4 text-muted">Date found</dt>
                <dd className="col-8 mb-2">
                  {formatDateFound(issue.dateFound)}
                </dd>
                <dt className="col-4 text-muted">Found on page</dt>
                <dd className="col-8 mb-0">
                  <div className="d-flex flex-column">
                    <span className="fw-medium">
                      {_nullishCoalesce(
                        _optionalChain([
                          firstPage,
                          "optionalAccess",
                          (_2) => _2.title,
                        ]),
                        () => "(No title found)",
                      )}
                    </span>
                    {_optionalChain([
                      firstPage,
                      "optionalAccess",
                      (_3) => _3.url,
                    ]) ? (
                      <a
                        href={firstPage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"
                      >
                        {firstPage.url}
                      </a>
                    ) : null}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="d-flex flex-nowrap align-items-center justify-content-between gap-3 px-4 pt-3 pb-2">
                <h6 className="fw-semibold mb-0 text-body">
                  All pages with this Ignored Spelling
                </h6>
                <div
                  className="position-relative flex-shrink-0"
                  style={{ width: 220 }}
                >
                  <i
                    className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
                    style={{ fontSize: "1rem" }}
                    aria-hidden={true}
                  />
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Search"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold text-nowrap">
                        Title and URL
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                        Priority
                      </th>
                      <th
                        className="py-3 pe-4 text-nowrap"
                        style={{ width: 100 }}
                        aria-label="Actions"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPages.map((p, idx) => (
                      <tr key={`${p.url}-${idx}`}>
                        <td className="py-2 ps-4">
                          <div className="d-flex flex-column">
                            <span className="text-body fs-13">{p.title}</span>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                            >
                              {p.url}
                            </a>
                          </div>
                        </td>
                        <td className="py-2">
                          <span
                            className={`badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Low" ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}
                          >
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-2 pe-4">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light text-primary"
                            title="Open page details"
                            onClick={() => {
                              if (onOpenPageDetails) {
                                onOpenPageDetails(p);
                              } else {
                                setSelectedPageForDetails(p);
                              }
                            }}
                            aria-label={`Open page details for ${p.title}`}
                          >
                            <i
                              className="isax isax-document-text fs-14"
                              aria-hidden={true}
                            />
                          </button>
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
                    {resolvedPagesWithIgnoredSpelling.length === 0
                      ? 0
                      : (currentPage - 1) * rowsPerPage + 1}
                    –
                    {Math.min(
                      currentPage * rowsPerPage,
                      resolvedPagesWithIgnoredSpelling.length,
                    )}
                    {" of "}
                    {resolvedPagesWithIgnoredSpelling.length}
                  </span>
                </div>
                <nav aria-label="Pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage <= 1}
                        aria-label="First"
                      >
                        «
                      </button>
                    </li>
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        ‹
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
                            className={`page-link ${currentPage === p ? "active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    })}
                    {totalPages > 7 && currentPage < totalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    )}
                    {totalPages > 7 && (
                      <li className="page-item">
                        <button
                          type="button"
                          className="page-link"
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
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Next"
                      >
                        ›
                      </button>
                    </li>
                    <li
                      className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage >= totalPages}
                        aria-label="Last"
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
      {!onOpenPageDetails && (
        <IgnoredSpellingPageDetailsDrawer
          open={selectedPageForDetails != null}
          onClose={() => setSelectedPageForDetails(null)}
          page={
            selectedPageForDetails
              ? {
                  title: selectedPageForDetails.title,
                  url: selectedPageForDetails.url,
                }
              : null
          }
          defaultQaSubView="ignored-misspellings"
        />
      )}
    </React.Fragment>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
}
