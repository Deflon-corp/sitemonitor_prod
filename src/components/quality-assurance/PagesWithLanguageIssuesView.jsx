import React, { useState, useMemo, useCallback  } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";
import { useQaPagesList } from "../../hooks/useQaPagesList";

const TABS = [
  { key: "incorrect", label: "Pages with incorrect language", icon: "isax-danger" },
  { key: "missing", label: "Pages missing language", icon: "isax-bookmark-2" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const TAB_PARAM = "tab";



function toDrawerPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function PagesWithLanguageIssuesView() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "incorrect";
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const { rows: fetchedRows, loading } = useQaPagesList({
    filter: "qa-errors",
    page: currentPage,
    limit: rowsPerPage,
    search,
    enabled: true,
  });

  const filteredByTab = useMemo(() => {
    if (activeTab === "incorrect")
      return fetchedRows.filter((r) => r.declaredLanguage !== "—" && r.declaredLanguage !== r.detectedLanguage);
    return fetchedRows.filter((r) => r.declaredLanguage === "—");
  }, [activeTab, fetchedRows]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return filteredByTab;
    const q = search.toLowerCase();
    return filteredByTab.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [filteredByTab, search]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title") return dir * (a.title.localeCompare(b.title) || a.url.localeCompare(b.url));
      if (sortBy === "declaredLanguage") return dir * a.declaredLanguage.localeCompare(b.declaredLanguage);
      if (sortBy === "detectedLanguage") return dir * a.detectedLanguage.localeCompare(b.detectedLanguage);
      if (sortBy === "multiLanguage") return dir * (a.multiLanguage === b.multiLanguage ? 0 : a.multiLanguage ? 1 : -1);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const handleSortClick = useCallback(function(key) {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }, [sortBy]);

  const openPageDetails = useCallback(function(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }, []);

  function SortBtn({ column, children }) {
    return (
      <button
        type="button"
        className="btn btn-link p-0 border-0 text-body fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
        onClick={function() { handleSortClick(column); }}
      >
        {children}
        {sortBy === column ? (
          <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
        ) : (
          <i className="isax isax-arrow-down-1 fs-12 opacity-50" aria-hidden="true"></i>
        )}
      </button>
    );
  }

  return (
    <div className="pages-with-language-issues-view d-flex flex-column h-100">
      <div className="mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary fw-bold"
              style={{ width: 48, height: 48, fontSize: "0.85rem" }}
              aria-hidden="true"
            >
              AB
            </span>
            <div>
              <h5 className="mb-0 fw-semibold text-body d-flex align-items-center gap-2">
                Pages with language issues
                <i className="isax isax-tick-circle text-primary fs-18" aria-hidden="true"></i>
              </h5>
              <p className="text-muted fs-13 mb-0 mt-1">
                <span className="fw-medium text-body">{sortedRows.length}</span> page{sortedRows.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2" title="Filter" aria-label="Filter">
              <i className="isax isax-filter text-primary fs-18" aria-hidden="true"></i>
            </button>
            <div className="position-relative" style={{ width: 220 }}>
              <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
              <input
                type="search"
                className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
                placeholder="Search..."
                value={search}
                onChange={function(e) {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search"
                style={{ paddingLeft: "2rem" }}
              />
            </div>
          </div>
        </div>
      </div>

      <nav className="nav nav-tabs border-0 gap-2 gap-md-4 mb-4" aria-label="Issue type">
        {TABS.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          const href = `/quality-assurance?view=language-issues&${TAB_PARAM}=${key}`;
          return (
            <Link
              key={key}
              to={href}
              className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
            >
              <i className={`isax ${icon} fs-18`} aria-hidden="true"></i>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="card border-0 shadow-sm rounded-3 flex-grow-1">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                    <SortBtn column="title">Title and URL</SortBtn>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <SortBtn column="declaredLanguage">Declared language</SortBtn>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <SortBtn column="detectedLanguage">Detected language</SortBtn>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <SortBtn column="multiLanguage">Multi-language</SortBtn>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <SortBtn column="views">
                      Views
                      <span className="ms-1 d-inline-flex" title="Total page views" aria-label="Info">
                        <i className="isax isax-information text-muted fs-12" aria-hidden="true"></i>
                      </span>
                    </SortBtn>
                  </th>
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 100 }} aria-label="Actions"></th>
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
                          <span className="text-truncate" style={{ maxWidth: 280 }}>{row.url}</span>
                        </a>
                      </div>
                    </td>
                    <td className="py-3 fs-13 text-body">{row.declaredLanguage}</td>
                    <td className="py-3">
                      <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fs-13 fw-normal">{row.detectedLanguage}</span>
                    </td>
                    <td className="py-3 fs-13 text-body">
                      {row.multiLanguage ? (
                        <i className="isax isax-tick-circle text-success" aria-hidden="true"></i>
                      ) : (
                        <i className="isax isax-close-circle text-muted" aria-hidden="true" title="No"></i>
                      )}
                    </td>
                    <td className="py-3 fs-13 text-body">{row.views}</td>
                    <td className="py-3 pe-4">
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                          title="Open page details"
                          aria-label="Open page details"
                          onClick={function() { openPageDetails(row); }}
                        >
                          <i className="isax isax-document-text fs-14" aria-hidden="true"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page</span>
              <select
                className="form-select form-select-sm rounded-2"
                style={{ width: "auto", minWidth: 60 }}
                value={rowsPerPage}
                onChange={function(e) {
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
            <nav aria-label="Pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                  <button type="button" className="page-link rounded-2" onClick={function() { setCurrentPage(1); }} disabled={currentPage <= 1} aria-label="First">«</button>
                </li>
                <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                  <button type="button" className="page-link rounded-2" onClick={function() { setCurrentPage(function(p) { return Math.max(1, p - 1); }); }} disabled={currentPage <= 1} aria-label="Previous">‹</button>
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
                      <button type="button" className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`} onClick={function() { setCurrentPage(p); }}>{p}</button>
                    </li>
                  );
                })}
                {totalPages > 7 && currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link rounded-2">…</span></li>}
                {totalPages > 7 && <li className="page-item"><button type="button" className="page-link rounded-2" onClick={function() { setCurrentPage(totalPages); }}>{totalPages}</button></li>}
                <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                  <button type="button" className="page-link rounded-2" onClick={function() { setCurrentPage(function(p) { return Math.min(totalPages, p + 1); }); }} disabled={currentPage >= totalPages} aria-label="Next">›</button>
                </li>
                <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                  <button type="button" className="page-link rounded-2" onClick={function() { setCurrentPage(totalPages); }} disabled={currentPage >= totalPages} aria-label="Last">»</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <PageDetailsMisspellingsDrawer
        open={pageDetailsOpen}
        onClose={function() { setPageDetailsOpen(false); }}
        page={selectedPage ? toDrawerPage(selectedPage) : null}
        defaultQaSubView="language"
      />
    </div>
  );
}
