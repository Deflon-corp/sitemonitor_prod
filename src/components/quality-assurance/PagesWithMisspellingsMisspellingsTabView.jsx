import React, { useState, useMemo, useRef, useEffect  } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageIssuesIcon from "../icons/PageIssuesIcon";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** 10–20 sample rows: pages with misspellings only (misspellings > 0). */
const SAMPLE_ROWS = [
  { id: "m1", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-intel-core-i3-6th-gen-4-gb-ram-1-tb-hdd-dos-15-6-inch-laptop-black-rel-491297624-ip310/p/29185", language: "English (Australian)", misspellings: 2, potentialMisspellings: 113, views: 0 },
  { id: "m2", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/hp-15s-dua-3560-intel-core-i3-11th-gen-8-gb-ram-256-gb-ssd-15-6-inch-laptop/p/29186", language: "English (Australian)", misspellings: 2, potentialMisspellings: 115, views: 0 },
  { id: "m3", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/dell-vostro-3520-intel-core-i5-12th-gen-8-gb-ram-512-gb-ssd-15-6-inch-laptop/p/29187", language: "English (Australian)", misspellings: 3, potentialMisspellings: 116, views: 0 },
  { id: "m4", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/acer-aspire-3-amd-ryzen-5-8-gb-ram-512-gb-ssd-15-6-inch-laptop/p/29188", language: "English (Australian)", misspellings: 2, potentialMisspellings: 117, views: 0 },
  { id: "m5", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/asus-vivobook-15-intel-core-i3-8-gb-256-gb-ssd-15-6-inch-laptop/p/29189", language: "English (Australian)", misspellings: 1, potentialMisspellings: 119, views: 0 },
  { id: "m6", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-ideapad-slim-3-amd-ryzen-5-8-gb-512-gb-ssd-15-6-inch-laptop/p/29190", language: "English (Australian)", misspellings: 2, potentialMisspellings: 112, views: 0 },
  { id: "m7", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/hp-pavilion-15-intel-core-i5-8-gb-512-gb-ssd-15-6-inch-laptop/p/29191", language: "English (Australian)", misspellings: 4, potentialMisspellings: 118, views: 0 },
  { id: "m8", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/dell-inspiron-15-intel-core-i3-8-gb-256-gb-ssd-15-6-inch-laptop/p/29192", language: "English (Australian)", misspellings: 2, potentialMisspellings: 114, views: 0 },
  { id: "m9", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-thinkpad-e15-amd-ryzen-5-8-gb-512-gb-ssd-15-6-inch-laptop/p/29193", language: "English (Australian)", misspellings: 2, potentialMisspellings: 121, views: 0 },
  { id: "m10", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/acer-swift-3-intel-core-i5-8-gb-512-gb-ssd-14-inch-laptop/p/29194", language: "English (Australian)", misspellings: 1, potentialMisspellings: 110, views: 0 },
  { id: "m11", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/asus-zenbook-14-amd-ryzen-5-8-gb-512-gb-ssd-14-inch-laptop/p/29195", language: "English (Australian)", misspellings: 2, potentialMisspellings: 122, views: 0 },
  { id: "m12", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/hp-14s-intel-celeron-4-gb-256-gb-ssd-14-inch-laptop/p/29196", language: "English (Australian)", misspellings: 2, potentialMisspellings: 108, views: 0 },
  { id: "m13", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/dell-latitude-3520-intel-core-i5-8-gb-256-gb-ssd-15-6-inch-laptop/p/29197", language: "English (Australian)", misspellings: 3, potentialMisspellings: 120, views: 0 },
  { id: "m14", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-legion-5-amd-ryzen-7-16-gb-512-gb-ssd-15-6-inch-gaming-laptop/p/29198", language: "English (Australian)", misspellings: 2, potentialMisspellings: 125, views: 0 },
  { id: "m15", title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/asus-tuf-gaming-f15-intel-core-i5-8-gb-512-gb-ssd-15-6-inch-laptop/p/29199", language: "English (Australian)", misspellings: 2, potentialMisspellings: 124, views: 0 },
];

function toDrawerPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function PagesWithMisspellingsMisspellingsTabView({ search: searchProp, onSearchChange } = {}) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    if (searchProp !== undefined) setCurrentPage(1);
  }, [searchProp]);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const viewsTooltipRef = useRef(null);

  useEffect(() => {
    function init(el) {
      if (!el || typeof window === "undefined") return;
      const bootstrap = window.bootstrap;
      if (!bootstrap?.Tooltip) return;
      const t = new bootstrap.Tooltip(el, { placement: "top", customClass: "tooltip-views" });
      return () => t.dispose();
    }
    init(viewsTooltipRef.current);
  }, []);

  function openPageDetails(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

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
      if (sortBy === "language") return dir * a.language.localeCompare(b.language);
      if (sortBy === "misspellings") return dir * (a.misspellings - b.misspellings);
      if (sortBy === "potentialMisspellings") return dir * (a.potentialMisspellings - b.potentialMisspellings);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped align-middle mb-0 table-borderless">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fw-semibold fs-13">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("title")}>
                    Title
                    {sortBy === "title" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("language")}>
                    Language
                    {sortBy === "language" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("misspellings")}>
                    Misspellings
                    {sortBy === "misspellings" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("potentialMisspellings")}>
                    Potential
                    {sortBy === "potentialMisspellings" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("views")}>
                    Views
                    <span
                      ref={viewsTooltipRef}
                      className="ms-1 d-inline-flex"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      data-bs-title="Total page views over the last 30 days"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="isax isax-information text-muted" aria-hidden="true"></i>
                    </span>
                    {sortBy === "views" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true"></i>
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true"></i>
                    )}
                  </button>
                </th>
                <th className="py-3 pe-4 text-body fw-semibold fs-13 text-end" style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex flex-column gap-1">
                      <span className="text-body fs-13">{row.title}</span>
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break">
                        <ExternalLinkIcon size={12} />
                        <span className="text-truncate" style={{ maxWidth: 320 }}>{row.url}</span>
                      </a>
                    </div>
                  </td>
                  <td className="py-3 fs-13 text-body">{row.language}</td>
                  <td className="py-3 text-center">
                    <span className="fs-13 text-body">{row.misspellings}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="fs-13 text-body">{row.potentialMisspellings}</span>
                  </td>
                  <td className="py-3 fs-13 text-body">{row.views}</td>
                  <td className="py-3 pe-4 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      <button type="button" className="btn btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2 text-body px-2" title="Open page details" onClick={() => openPageDetails(row)}>
                        <PageIssuesIcon size={16} />
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
          <nav aria-label="Table pagination">
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

      <PageDetailsMisspellingsDrawer open={pageDetailsOpen} onClose={() => setPageDetailsOpen(false)} page={selectedPage ? toDrawerPage(selectedPage) : null} />
    </div>
  );
}
