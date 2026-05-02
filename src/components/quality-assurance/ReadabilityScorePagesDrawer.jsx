import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import { downloadBlob, safeFilename } from "../../lib/download";
const QUICK_HELP_TEXT =
  "Put simply, readability is the ease with which a reader can understand the written text. Readability tests, readability formulas, or readability metrics are formulae for evaluating the readability of text, by counting syllables, words, and sentences. Scores are compared with scales based on judged linguistic difficulty or reading grade level.";

export const SAMPLE_PAGES_6TH_GRADE = [
  {
    title: "(No title found)",
    url: "https://www.bajajfinserv.in/bmall/hp-spectre-x360-intel-core-i5-11th-gen-8-gb-ram-512-gb-ssd-windows-10-home-13-3-inc",
    readabilityScore: 81,
    readabilityLevel: "6th grade",
    totalWords: 238,
    priority: "Medium",
    views: 0,
  },
];

const TOTAL_PAGES_FOR_PERCENT = 500;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;



export default function ReadabilityScorePagesDrawer({
  open,
  onClose,
  scoreLevel,
  totalCount: totalCountProp,
  pages: pagesProp,
  onOpenPageDetails,
}) {
  const pages = pagesProp ?? SAMPLE_PAGES_6TH_GRADE;
  const totalCount = totalCountProp ?? pages.length;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter((p) => (p.title || "").toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
  }, [pages, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "readabilityScore") return dir * (a.readabilityScore - b.readabilityScore);
      if (sortBy === "totalWords") return dir * (a.totalWords - b.totalWords);
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

  const countWithScore = totalCount;
  const countOther = TOTAL_PAGES_FOR_PERCENT - countWithScore;
  const percentWithScore = TOTAL_PAGES_FOR_PERCENT > 0 ? ((countWithScore / TOTAL_PAGES_FOR_PERCENT) * 100).toFixed(1) : "0";
  const percentOther = TOTAL_PAGES_FOR_PERCENT > 0 ? ((countOther / TOTAL_PAGES_FOR_PERCENT) * 100).toFixed(1) : "0";

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const reportName = scoreLevel ? `Pages-With-Score-${scoreLevel.replace(/\s+/g, "-")}` : "Readability-Pages-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Readability Score,Readability Level,Total words,Priority,Views\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
          p.readabilityScore,
          `"${p.readabilityLevel.replace(/"/g, '""')}"`,
          p.totalWords,
          `"${p.priority}"`,
          p.views,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, sortedPages]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedPages.map((p) => ({
      Title: p.title || "",
      URL: p.url,
      "Readability Score": p.readabilityScore,
      "Readability Level": p.readabilityLevel,
      "Total words": p.totalWords,
      Priority: p.priority,
      Views: p.views,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Score", "Level", "Words", "Priority", "Views"]];
    const body = sortedPages.map((p) => [
      (p.title || "").slice(0, 30),
      p.url.slice(0, 40),
      String(p.readabilityScore),
      p.readabilityLevel,
      String(p.totalWords),
      p.priority,
      String(p.views),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 45 }, 2: { cellWidth: 14 }, 3: { cellWidth: 22 }, 4: { cellWidth: 14 }, 5: { cellWidth: 18 }, 6: { cellWidth: 14 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName, sortedPages]);

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

  if (!open || !scoreLevel) return null;

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
        style={{ zIndex: DRAWER_Z_PANEL, width: "min(100%, 960px)", maxWidth: "960px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="readability-score-pages-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i className="isax isax-close-circle text-body" aria-hidden="true" />
              </button>
              <div>
                <h6 className="mb-0 fw-semibold text-body" id="readability-score-pages-drawer-title">
                  Pages with score: {scoreLevel}
                </h6>
                <p className="text-muted fs-13 mb-0 mt-1">
                  {countWithScore} {countWithScore === 1 ? "page" : "pages"} found
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Download Report"
                  aria-label="Download Report"
                >
                  <i className="isax isax-document-download text-primary fs-18" aria-hidden="true" />
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto px-4 py-3">
          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-semibold text-body mb-2">Quick help</h6>
                  <p className="fs-13 text-muted mb-0">{QUICK_HELP_TEXT}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-semibold text-body mb-2">Pages with score: {scoreLevel}</h6>
                  <div className="mb-2">
                    <div className="progress rounded-pill" style={{ height: 8 }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${percentWithScore}%` }}
                        aria-valuenow={countWithScore}
                        aria-valuemin={0}
                        aria-valuemax={TOTAL_PAGES_FOR_PERCENT}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between fs-13 text-muted">
                    <span>
                      {countWithScore} pages ({percentWithScore}%)
                    </span>
                    <span>
                      {countOther} pages ({percentOther}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
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
                          Title and URL
                          {sortBy === "title" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("readabilityScore")}
                        >
                          Readability Score
                          {sortBy === "readabilityScore" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold">Total words</th>
                      <th className="py-3 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("priority")}
                        >
                          Priority
                          <i className="isax isax-arrow-down-1 fs-12 opacity-50" aria-hidden="true" />
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("views")}
                        >
                          Views
                          <span className="ms-1 d-inline-flex" title="Total page views" aria-label="Info">
                            <i className="isax isax-information text-muted fs-12" aria-hidden="true" />
                          </span>
                          {sortBy === "views" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 100 }} aria-label="Actions" />
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
                          <span className="fw-medium text-body">{p.readabilityScore}</span>
                          <span className="text-muted fs-13 ms-1">{p.readabilityLevel}</span>
                        </td>
                        <td className="py-3 fs-13 text-body">{p.totalWords}</td>
                        <td className="py-3">
                          <span
                            className={`badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Medium" ? "bg-warning bg-opacity-10 text-warning" : "bg-secondary bg-opacity-10 text-secondary"}`}
                          >
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-3 fs-13 text-body">{p.views}</td>
                        <td className="py-3 pe-4">
                          <div className="d-inline-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                              title="Open page details"
                              aria-label={`Open page details for ${p.title || p.url}`}
                              onClick={() => onOpenPageDetails?.(p)}
                            >
                              <i className="isax isax-document-text fs-14" aria-hidden="true" />
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
                    {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedPages.length)} of {sortedPages.length}
                  </span>
                </div>
                <nav aria-label="Pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage <= 1}
                        aria-label="First"
                      >
                        «
                      </button>
                    </li>
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
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
                        <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage(totalPages)}>
                          {totalPages}
                        </button>
                      </li>
                    )}
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        aria-label="Next"
                      >
                        ›
                      </button>
                    </li>
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
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
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
