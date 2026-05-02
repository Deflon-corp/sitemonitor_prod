import React, { useState, useMemo, useCallback } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Replace with API: pages with ignored checks. Empty by default to show "No content was found". */
const SAMPLE_PAGES = [];

const TEAL = "#14b8a6";

const ComplianceRing = ({ percent }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent)) / 100 * circumference;
  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
      <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={TEAL} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
      </svg>
      <span className="position-absolute fw-semibold text-body" style={{ fontSize: "0.7rem" }}>{Math.round(percent)}%</span>
    </div>
  );
};

const PagesWithIgnoredChecksView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const openIssuePage = (p, index) => {
    setSelectedPageForDetails({ id: index, title: p.title, url: p.url });
    setPageDetailsDrawerOpen(true);
  };

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_PAGES;
    const q = searchQuery.toLowerCase();
    return SAMPLE_PAGES.filter(
      (p) => (p.title || "").toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "ignoredChecks") return dir * (a.ignoredChecks - b.ignoredChecks);
      if (sortBy === "compliancePercent") return dir * (a.compliancePercent - b.compliancePercent);
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.views - b.views);
    });
  }, [filteredPages, sortBy, sortDir]);

  const totalPagesCount = sortedPages.length;
  const totalPages = Math.max(1, Math.ceil(totalPagesCount / rowsPerPage));
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

  const reportBaseName = safeFilename("Pages-With-Ignored-Checks-Report");

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Ignored checks,Page compliance %,Priority,Views\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
          p.ignoredChecks,
          p.compliancePercent.toFixed(2),
          `"${p.priority}"`,
          p.views,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${reportBaseName}.csv`);
  }, [reportBaseName, sortedPages]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedPages.map((p) => ({
      Title: p.title || "",
      URL: p.url,
      "Ignored checks": p.ignoredChecks,
      "Page compliance %": p.compliancePercent,
      Priority: p.priority,
      Views: p.views,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
  }, [reportBaseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Ignored checks", "Compliance %", "Priority", "Views"]];
    const body = sortedPages.map((p) => [
      (p.title || "").slice(0, 30),
      p.url.slice(0, 50),
      String(p.ignoredChecks),
      p.compliancePercent.toFixed(2),
      p.priority,
      String(p.views),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 18 }, 5: { cellWidth: 14 } },
    });
    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, sortedPages]);

  return (
    <div className="pages-with-ignored-checks-view">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i className="isax isax-eye-slash text-primary fs-22" aria-hidden="true" /> Pages with ignored checks
          </h5>
          <p className="text-muted fs-13 mb-0">
            {totalPagesCount} pages with ignored checks WCAG 2.2
          </p>
        </div>
        {/* Toolbar */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <DownloadReportDropdown
            reportBaseName={reportBaseName}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            className="border border-secondary border-opacity-25 rounded-2"
          />
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
            title="Filter"
            aria-label="Filter"
          >
            <i className="isax isax-filter text-primary fs-18" aria-hidden="true" />
          </button>
          <div
            className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
            style={{ width: 220 }}
          >
            <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
              <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} aria-hidden="true" />
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

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {sortedPages.length === 0 ? (
            <div className="text-center text-muted py-5">No content was found.</div>
          ) : (
            <>
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
                          onClick={() => handleSort("ignoredChecks")}
                        >
                          Ignored checks
                          {sortBy === "ignoredChecks" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 text-body fs-13 fw-semibold">Page compliance</th>
                      <th className="py-3 text-body fs-13 fw-semibold">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                          onClick={() => handleSort("priority")}
                        >
                          Priority
                          {sortBy === "priority" ? (
                            <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" />
                          ) : (
                            <i className="isax isax-arrow-down-1 fs-12 opacity-50" aria-hidden="true" />
                          )}
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
                      <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} aria-label="Actions" />
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
                          <span className="fs-13 text-body">{p.ignoredChecks}</span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-13 text-body fw-medium">
                              {p.compliancePercent.toFixed(2)}% COMPLIANCE
                            </span>
                            <ComplianceRing percent={p.compliancePercent} />
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
                        <td className="py-3">
                          <div className="d-flex flex-column gap-1">
                            <span className="fs-13 text-body">{p.views}</span>
                            <div className="progress rounded-pill" style={{ height: 4, maxWidth: 80 }}>
                              <div className="progress-bar bg-secondary bg-opacity-25" style={{ width: "100%" }} role="progressbar" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pe-4">
                          <div className="d-inline-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                              title="Open page details"
                              aria-label="Open page details"
                              onClick={() => openIssuePage(p, idx)}
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
                    aria-label="Rows per page"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted small">
                    {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, totalPagesCount)} of {totalPagesCount}
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
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={selectedPageForDetails}
        defaultTab="accessibility"
      />
    </div>
  );
};

export default PagesWithIgnoredChecksView;
