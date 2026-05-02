import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

/** Sample data for Pages – replace with API */
const SAMPLE_ROWS = Array.from({ length: 42 }, (_, i) => ({
  id: `page-${i + 1}`,
  title: i % 4 === 0 ? "(No title found)" : `Page ${i + 1} - Search`,
  url: `https://www.bajajfinserv.in/page/${i + 1}${i > 0 ? `?ref=${i}` : ""}`,
  unwanted: i % 3,
  required: i % 2,
  matches: 1,
  priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
  views: Math.floor(Math.random() * 500),
}));

const ContentWithPolicyMatchesPagesView = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const viewsTooltipRef = useRef(null);

  useEffect(() => {
    const el = viewsTooltipRef.current;
    if (!el || typeof window === "undefined") return;
    const bootstrap = window.bootstrap;
    if (!bootstrap?.Tooltip) return;
    const t = new bootstrap.Tooltip(el, { placement: "top" });
    return () => t.dispose();
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return SAMPLE_ROWS;
    const q = search.toLowerCase();
    return SAMPLE_ROWS.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [search]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "priority") return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportName = "Content-with-Policy-Matches-Pages";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Unwanted,Required,Matches,Priority,Views\n";
    const body = sortedRows
      .map((r) =>
        [`"${(r.title || "").replace(/"/g, '""')}"`, `"${(r.url || "").replace(/"/g, '""')}"`, r.unwanted, r.required, r.matches, r.priority, r.views].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedRows.map((r) => ({
      Title: r.title,
      URL: r.url,
      Unwanted: r.unwanted,
      Required: r.required,
      Matches: r.matches,
      Priority: r.priority,
      Views: r.views,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Unwanted", "Required", "Matches", "Priority", "Views"]];
    const body = paginatedRows.map((r) => [
      (r.title || "").slice(0, 30),
      (r.url || "").slice(0, 40),
      String(r.unwanted),
      String(r.required),
      String(r.matches),
      r.priority,
      String(r.views),
    ]);
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 7 } });
    doc.save(`${baseName}.pdf`);
  }, [paginatedRows, baseName]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-document-text fs-20 text-primary" aria-hidden="true" />
          Pages
        </h5>
        <p className="text-muted fs-13 mb-0">Found {filteredRows.length} pages</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-3 mb-3">
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm bg-primary text-white rounded-2 border-0 d-inline-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="Download Report"
          >
            <i className="isax isax-document-download" aria-hidden="true" />
            <span>Download Report</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportCSV}>
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                CSV
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportPDF}>
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                PDF
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportExcel}>
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                Excel
              </button>
            </li>
          </ul>
        </div>
        <div className="position-relative" style={{ width: 280 }}>
          <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true" />
          <input
            type="search"
            className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            aria-label="Search"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>
      </div>

      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fs-13 fw-semibold">Title and URL</th>
                <th className="py-3 text-body fs-13 fw-semibold">Unwanted</th>
                <th className="py-3 text-body fs-13 fw-semibold">Required</th>
                <th className="py-3 text-body fs-13 fw-semibold">Matches</th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("priority")} aria-label={sortBy === "priority" ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.` : "Sort by Priority"}>
                    Priority
                    {sortBy === "priority" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
                    ) : (
                      <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th className="py-3 pe-4 text-body fs-13 fw-semibold">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("views")} aria-label={sortBy === "views" ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.` : "Sort by Views"}>
                    Views
                    <span ref={viewsTooltipRef} className="ms-1 d-inline-flex" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Total page views over the last 30 days" onClick={(e) => e.stopPropagation()} role="img" aria-label="Total page views over the last 30 days">
                      <i className="isax isax-information text-muted" aria-hidden="true" />
                    </span>
                    {sortBy === "views" ? (
                      <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
                    ) : (
                      <i className="isax isax-sort ms-1 text-muted opacity-50" aria-hidden="true" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex flex-column">
                      <span className="text-body fs-13">{row.title}</span>
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1">
                        <span className="flex-shrink-0 d-inline-flex text-primary">
                          <ExternalLinkIcon size={12} />
                        </span>
                        {row.url}
                      </a>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                      <i className="isax isax-close-circle text-secondary" aria-hidden="true" />
                      {row.unwanted}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                      <i className="isax isax-danger text-warning" aria-hidden="true" />
                      {row.required}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                      <i className="isax isax-search-normal-1 text-primary" aria-hidden="true" />
                      {row.matches}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`badge rounded-pill ${row.priority === "High" ? "bg-danger" : row.priority === "Medium" ? "bg-warning text-dark" : "bg-secondary"}`}>{row.priority}</span>
                  </td>
                  <td className="py-2 pe-4">
                    <div className="d-flex align-items-center gap-1">
                      <input type="number" className="form-control form-control-sm" style={{ width: 56 }} value={row.views} readOnly aria-label="Views" />
                      <button type="button" className="btn btn-icon btn-sm btn-light" title="Open page details">
                        <i className="isax isax-document-text text-primary" aria-hidden="true" />
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
            <select className="form-select form-select-sm rounded-2" style={{ width: "auto", minWidth: 60 }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-muted small">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}</span>
          </div>
          <nav aria-label="Pages pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">Previous</button>
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
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ContentWithPolicyMatchesPagesView;
