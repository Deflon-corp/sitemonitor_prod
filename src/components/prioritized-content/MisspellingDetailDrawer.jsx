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
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsDrawerFromMisspelling from "@/components/prioritized-content/PageDetailsDrawerFromMisspelling";

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
 * Drawer shown when user clicks "Open misspelling page" (e.g. from Page Details >> Misspellings).
 * Shows: header (Misspelling: word, ID, search, G, Action, Copy URL),
 * Issue details (Element, Language, Date found, Snippet, Found on page),
 * and "All pages with this Misspelling" table.
 */
export default function MisspellingDetailDrawer({
  open,
  onClose,
  issue,
  page,
  pagesWithMisspelling = DEFAULT_PAGES,
  onOpenPageDetails,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const resolvedPagesWithMisspelling = useMemo(() => {
    if (pagesWithMisspelling && pagesWithMisspelling.length > 0)
      return pagesWithMisspelling;
    if (page)
      return [
        {
          title: page.title || "Untitled Page",
          url: page.url,
          language: "N/A",
          misspellings: 0,
          potentialMisspellings: 0,
          views: 0,
        },
      ];
    return [];
  }, [pagesWithMisspelling, page]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return resolvedPagesWithMisspelling;
    const q = searchQuery.toLowerCase();
    return resolvedPagesWithMisspelling.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q),
    );
  }, [resolvedPagesWithMisspelling, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "misspellings")
        return dir * (a.misspellings - b.misspellings);
      if (sortBy === "potentialMisspellings")
        return dir * (a.potentialMisspellings - b.potentialMisspellings);
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

  const handleCopyUrl = () => {
    const url =
      issue && resolvedPagesWithMisspelling.length > 0
        ? resolvedPagesWithMisspelling[0].url
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

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(issue.word)}`;
  const firstPage = resolvedPagesWithMisspelling[0];

  const drawerContent = (
    <React.Fragment>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: backdropZIndex }}
        aria-hidden={true}
        onClick={onClose}
      />
      {
        <div
          className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
          style={{
            zIndex: panelZIndex,
            width: "min(100%, 960px)",
            maxWidth: "960px",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="misspelling-detail-drawer-title"
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
                    id="misspelling-detail-drawer-title"
                  >
                    {"Misspelling: "}
                    {issue.word}
                  </h6>
                  <p className="text-muted fs-13 mb-0">
                    {"ID: "}
                    {issue.id}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light"
                  title="Search"
                  aria-label="Search"
                >
                  <i className="isax isax-search-normal-1" aria-hidden={true} />
                </button>
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-icon btn-sm btn-light text-primary"
                  title="Lookup in Google"
                  aria-label={`Lookup ${issue.word} in Google`}
                >
                  <span className="fw-bold">G</span>
                </a>
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
                  <dt className="col-4 text-muted">Element</dt>
                  <dd className="col-8 mb-2">Text</dd>
                  <dt className="col-4 text-muted">Date found</dt>
                  <dd className="col-8 mb-2">
                    {formatDateFound(issue.dateFound)}
                  </dd>
                  <dt className="col-4 text-muted">Snippet</dt>
                  <dd className="col-8 mb-2">
                    <span className="border border-danger rounded px-2 py-1 text-danger small">
                      {issue.word}
                    </span>
                  </dd>
                  <dt className="col-4 text-muted">Suggestions</dt>
                  <dd className="col-8 mb-2">
                    {issue.suggestions && issue.suggestions.length > 0 ? (
                      <div className="d-inline-flex flex-wrap gap-1">
                        {issue.suggestions.map((s, idx) => (
                          <span
                            key={idx}
                            className="badge bg-success bg-opacity-10 text-success fw-semibold fs-12 px-2.5 py-1 rounded-pill"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
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
                          <span className="text-primary">
                            <ExternalLinkIcon size={12} />
                          </span>
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
                    All pages with this Misspelling
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
                          Title
                        </th>
                        <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                            onClick={() => handleSort("misspellings")}
                          >
                            Misspellings
                            {sortBy === "misspellings" ? (
                              <i
                                className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                                aria-hidden={true}
                              />
                            ) : (
                              <i
                                className="isax isax-sort fs-12 opacity-50"
                                aria-hidden={true}
                              />
                            )}
                          </button>
                        </th>
                        <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                            onClick={() => handleSort("potentialMisspellings")}
                          >
                            Potential misspellings
                            {sortBy === "potentialMisspellings" ? (
                              <i
                                className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                                aria-hidden={true}
                              />
                            ) : (
                              <i
                                className="isax isax-sort fs-12 opacity-50"
                                aria-hidden={true}
                              />
                            )}
                          </button>
                        </th>
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
                                <ExternalLinkIcon size={12} />
                                {p.url}
                              </a>
                            </div>
                          </td>
                          <td className="py-2 fs-13 text-body">
                            {p.misspellings}
                          </td>
                          <td className="py-2 fs-13 text-body">
                            {p.potentialMisspellings}
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
                      {resolvedPagesWithMisspelling.length === 0
                        ? 0
                        : (currentPage - 1) * rowsPerPage + 1}
                      –
                      {Math.min(
                        currentPage * rowsPerPage,
                        resolvedPagesWithMisspelling.length,
                      )}
                      {" of "}
                      {resolvedPagesWithMisspelling.length}
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
                      {Array.from(
                        { length: Math.min(7, totalPages) },
                        (_, i) => {
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
                        },
                      )}
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

        /* Header: X, Misspelling: word, ID, search, G, Action, Copy URL */
      }
      {!onOpenPageDetails && (
        <PageDetailsDrawerFromMisspelling
          open={selectedPageForDetails != null}
          onClose={() => setSelectedPageForDetails(null)}
          page={selectedPageForDetails ? selectedPageForDetails.page : null}
          defaultQaSubView={_nullishCoalesce(
            _optionalChain([
              selectedPageForDetails,
              "optionalAccess",
              (_4) => _4.qaSubView,
            ]),
            () => "misspellings",
          )}
        />
      )}
    </React.Fragment>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
}
