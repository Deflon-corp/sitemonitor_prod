import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import DictionaryPageDetailsDrawer from "@/components/prioritized-content/DictionaryPageDetailsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGES = [
  { title: "Compare", url: "https://www.bajajfinserv.in/bmall/compare", language: "English (Australian)", pages: 1, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-intel-core-i3-6th-gen-4-gb-ram-1-tb-hdd-dos-15-6-inch-laptop-black-rel-491297624-ip310/p/29185", language: "English (Australian)", pages: 2, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/hp-15s-dua-3560-intel-core-i3-11th-gen-8-gb-ram-256-gb-ssd-15-6-inch-laptop/p/29186", language: "English (Australian)", pages: 2, views: 0 },
];

const formatDateAdded = (dateStr) => {
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
};

const DEFAULT_BACKDROP_Z = 1065;
const DEFAULT_PANEL_Z = 1070;

const DictionaryDetailDrawer = ({
  open,
  onClose,
  issue,
  pagesWithEntry = DEFAULT_PAGES,
  onOpenPageDetails,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pagesWithEntry;
    const q = searchQuery.toLowerCase();
    return pagesWithEntry.filter((p) => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
  }, [pagesWithEntry, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "pages") return dir * (a.pages - b.pages);
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
    const url = issue && pagesWithEntry.length > 0 ? pagesWithEntry[0].url : window.location.href;
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
  const firstPage = pagesWithEntry[0];

  const drawerContent = (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: backdropZIndex }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{ zIndex: panelZIndex, width: "min(100%, 960px)", maxWidth: "960px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dictionary-detail-drawer-title"
      >
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-icon btn-sm btn-light" onClick={onClose} title="Close" aria-label="Close">
                <i className="isax isax-arrow-left" aria-hidden="true" />
              </button>
              <div>
                <h6 className="mb-0 fw-semibold" id="dictionary-detail-drawer-title">Dictionary: {issue.word}</h6>
                <p className="text-muted fs-13 mb-0">ID: {issue.id}</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-icon btn-sm btn-light" title="Search" aria-label="Search">
                <i className="isax isax-search-normal-1" aria-hidden="true" />
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
              <div className="dropdown">
                <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  Action <i className="isax isax-arrow-down-1 ms-1 fs-12" aria-hidden="true" />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button type="button" className="dropdown-item">Remove from dictionary</button></li>
                </ul>
              </div>
              <button type="button" className="btn btn-sm btn-light" onClick={handleCopyUrl}>Copy URL</button>
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
                <dt className="col-4 text-muted">Language</dt>
                <dd className="col-8 mb-2">{issue.language}</dd>
                <dt className="col-4 text-muted">Date added</dt>
                <dd className="col-8 mb-2">{formatDateAdded(issue.dateAdded)}</dd>
                <dt className="col-4 text-muted">Found on page</dt>
                <dd className="col-8 mb-0">
                  <div className="d-flex flex-column">
                    <span className="fw-medium">{firstPage?.title ?? "(No title found)"}</span>
                    {firstPage?.url ? (
                      <a
                        href={firstPage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"
                      >
                        <span className="text-primary"><ExternalLinkIcon size={12} /></span>
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
                <h6 className="fw-semibold mb-0 text-body">All pages with this Dictionary entry</h6>
                <div className="position-relative flex-shrink-0" style={{ width: 220 }}>
                  <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true" />
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    aria-label="Search"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold text-nowrap">Title</th>
                      <th className="py-3 text-body fs-13 fw-semibold text-nowrap">Language</th>
                      <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("pages")}
                        >
                          Pages
                          {sortBy === "pages" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("views")}
                        >
                          Views
                          {sortBy === "views" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 pe-4 text-nowrap" style={{ width: 100 }} aria-label="Actions" />
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
                        <td className="py-2 text-body fs-13">{p.language}</td>
                        <td className="py-2 fs-13 text-body">{p.pages}</td>
                        <td className="py-2 fs-13 text-body">{p.views}</td>
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
                            <i className="isax isax-document-text fs-14" aria-hidden="true" />
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
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-muted small">
                    {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedPages.length)} of {sortedPages.length}
                  </span>
                </div>
                <nav aria-label="Pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} aria-label="First">«</button>
                    </li>
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">‹</button>
                    </li>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= 7) p = i + 1;
                      else if (currentPage <= 4) p = i + 1;
                      else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                      else p = currentPage - 3 + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <li key={p} className="page-item">
                          <button type="button" className={`page-link ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                        </li>
                      );
                    })}
                    {totalPages > 7 && currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">…</span></li>}
                    {totalPages > 7 && <li className="page-item"><button type="button" className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></li>}
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">›</button>
                    </li>
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="Last">»</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!onOpenPageDetails && (
        <DictionaryPageDetailsDrawer
          open={selectedPageForDetails != null}
          onClose={() => setSelectedPageForDetails(null)}
          page={selectedPageForDetails ? { title: selectedPageForDetails.title, url: selectedPageForDetails.url } : null}
          defaultQaSubView="dictionary"
        />
      )}
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

export default DictionaryDetailDrawer;
