import React, { useState, useMemo, useRef, useEffect, useCallback  } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageIssuesIcon from "../icons/PageIssuesIcon";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import { useQaPagesList } from "../../hooks/useQaPagesList";

const TABS = [
  { key: "all", label: "All", icon: "document" },
  { key: "misspellings", label: "Misspellings", icon: "isax-edit-2" },
  { key: "potential", label: "Potential misspellings", icon: "isax-edit-2" },
];

/** Document icon: purple outline, two lines, subtle cyan shadow (matches Pages with Misspellings branding). */
function DocumentIcon({ className, size = 22 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g>
        {/* Subtle cyan/blue shadow offset */}
        <g transform="translate(1, 1)">
          <rect x="2" y="2" width="14" height="18" rx="2" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.4" />
          <line x1="5" y1="7" x2="13" y2="7" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
          <line x1="5" y1="11" x2="13" y2="11" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        </g>
        {/* Main document shape (purple via currentColor) */}
        <rect x="2" y="2" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const TAB_PARAM = "tab";

function toDrawerPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function PagesWithMisspellingsView() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("misspellings");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const listFilter =
    activeTab === "misspellings"
      ? "misspellings"
      : activeTab === "potential"
        ? "potential-misspellings"
        : "spellcheck-pages";

  const { rows: apiRows, pagination, loading } = useQaPagesList({
    filter: listFilter,
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: "issues",
    sortOrder: sortDir,
    enabled: activeTab === "all" || activeTab === "misspellings" || activeTab === "potential",
  });
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

  const sortedRows = apiRows;

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  const baseName = safeFilename("Pages-With-Misspellings-Report");

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Language,Misspellings,Potential Misspellings,Views\n";
    const body = sortedRows
      .map((r) => `"${(r.title || "").replace(/"/g, '""')}","${r.url.replace(/"/g, '""')}","${r.language.replace(/"/g, '""')}",${r.misspellings},${r.potentialMisspellings},${r.views}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, sortedRows]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedRows.map((r) => ({ Title: r.title || "", URL: r.url, Language: r.language, Misspellings: r.misspellings, "Potential Misspellings": r.potentialMisspellings, Views: r.views }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, sortedRows]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Language", "Misspellings", "Potential", "Views"]];
    const body = sortedRows.map((r) => [(r.title || "").slice(0, 28), r.url.slice(0, 45), r.language.slice(0, 20), String(r.misspellings), String(r.potentialMisspellings), String(r.views)]);
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 7 }, columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 48 }, 2: { cellWidth: 24 }, 3: { cellWidth: 22 }, 4: { cellWidth: 20 }, 5: { cellWidth: 12 } } });
    doc.save(`${baseName}.pdf`);
  }, [baseName, sortedRows]);

  const totalPages = pagination.pages || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const viewKey = "spellcheck-pages";

  function SortBtn({ column, children }) {
    return (
      <button type="button" className="btn btn-link p-0 border-0 text-body fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort(column)}>
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
    <div className="d-flex flex-column h-100 pages-misspellings-view">
      {/* Header */}
      <div className="mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 48, height: 48 }}>
              <DocumentIcon className="text-primary" size={22} />
            </span>
            <div>
              <h5 className="mb-0 fw-semibold text-body">Pages with Misspellings</h5>
              <p className="text-muted fs-13 mb-0 mt-1">
                <span className="fw-medium text-body">{loading ? "…" : pagination.total ?? sortedRows.length}</span> pages
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <DownloadReportDropdown
              reportBaseName={baseName}
              onExportCSV={exportCSV}
              onExportExcel={exportExcel}
              onExportPDF={exportPDF}
              className="btn-outline-secondary rounded-2"
            />
            <button type="button" className="btn btn-outline-secondary btn-sm rounded-2" title="Filter">
              <i className="isax isax-filter fs-18" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Search in one row (All, Misspellings, Potential) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <nav className="nav nav-tabs border-0 gap-2 gap-md-4 mb-0" aria-label="Filter by type">
          {TABS.map(({ key, label, icon }) => {
            const isActive = activeTab === key;
            const href = `/domain/quality-assurance?view=pages-misspellings&${TAB_PARAM}=${key}`;
            return (
              <Link
                key={key}
                to={href}
                className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
              >
                {icon === "document" ? <DocumentIcon size={18} className={isActive ? "text-primary" : "text-body"} /> : <i className={`isax ${icon}`} aria-hidden="true"></i>}
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="position-relative" style={{ width: "min(100%, 320px)" }}>
          <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
          <input
            type="search"
            className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2 bg-white"
            placeholder="Search by title or URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </div>

      {(activeTab === "all" || activeTab === "misspellings" || activeTab === "potential") && (
        <React.Fragment>
          {/* Table card */}
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover table-striped align-middle mb-0 table-borderless">
                <thead>
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="py-3 ps-4 text-body fw-semibold fs-13">
                      <SortBtn column="title">Title</SortBtn>
                    </th>
                    <th className="py-3 text-body fw-semibold fs-13">
                      <SortBtn column="language">Language</SortBtn>
                    </th>
                    <th className="py-3 text-body fw-semibold fs-13 text-center">
                      <SortBtn column="misspellings">
                        <span className="d-inline-flex align-items-center gap-1">
                          <span className="rounded-circle bg-warning opacity-75" style={{ width: 8, height: 8 }} aria-hidden="true"></span> Misspellings
                        </span>
                      </SortBtn>
                    </th>
                    <th className="py-3 text-body fw-semibold fs-13 text-center">
                      <SortBtn column="potentialMisspellings">
                        <span className="d-inline-flex align-items-center gap-1">
                          <span className="rounded-circle bg-primary opacity-75" style={{ width: 8, height: 8 }} aria-hidden="true"></span> Potential
                        </span>
                      </SortBtn>
                    </th>
                    <th className="py-3 text-body fw-semibold fs-13">
                      <SortBtn column="views">
                        Views
                        <span
                          ref={viewsTooltipRef}
                          className="ms-1 d-inline-flex opacity-75"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          data-bs-title="Total page views over the last 30 days"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="isax isax-information text-muted fs-12" aria-hidden="true"></i>
                        </span>
                      </SortBtn>
                    </th>
                    <th className="py-3 pe-4 text-body fw-semibold fs-13 text-end" style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">Loading pages…</td>
                    </tr>
                  )}
                  {!loading && paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">No pages found.</td>
                    </tr>
                  )}
                  {!loading && paginatedRows.map((row) => (
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
        </React.Fragment>
      )}

      <PageDetailsMisspellingsDrawer open={pageDetailsOpen} onClose={() => setPageDetailsOpen(false)} page={selectedPage ? toDrawerPage(selectedPage) : null} />
    </div>
  );
}
