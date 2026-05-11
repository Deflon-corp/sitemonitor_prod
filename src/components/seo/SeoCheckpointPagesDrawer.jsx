import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDomainSeoPagesApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DEFAULT_QUICK_HELP = ["This page is missing a title.", "We recommend that all your pages has an unique title."];

const SeoCheckpointPagesDrawer = ({
  open,
  onClose,
  issueName,
  pageCount,
  compliancePercent,
  quickHelpLines = DEFAULT_QUICK_HELP,
  onOpenPageDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchPages = useCallback(async () => {
    if (!domainId || !issueName || !open) return;
    setIsLoading(true);
    try {
      const response = await getDomainSeoPagesApi(domainId, currentPage, rowsPerPage, searchQuery, issueName);
      if (response.success) {
        setPages(response.data.pages);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch issue pages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId, issueName, currentPage, rowsPerPage, searchQuery, open]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return pages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...pages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.views - b.views);
    });
  }, [pages, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const pagesInCompliance = Math.round((pageCount * compliancePercent) / 100);
  const pagesToFix = pageCount - pagesInCompliance;
  const complianceDisplay = Math.min(100, Math.max(0, compliancePercent));
  const toFixPercent = pageCount > 0 ? Math.round((pagesToFix / pageCount) * 100) : 0;

  const reportBaseName = safeFilename(`${issueName.replace(/\s+/g, "-")}-Pages-Report`);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Priority,Views\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
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
    doc.setFontSize(12);
    doc.text(`${issueName} – Pages`, 14, 10);
    const head = [["Title", "URL", "Priority", "Views"]];
    const body = sortedPages.map((p) => [(p.title || "").slice(0, 35), p.url.slice(0, 50), p.priority, String(p.views)]);
    autoTable(doc, {
      head,
      body,
      startY: 16,
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 55 }, 2: { cellWidth: 22 }, 3: { cellWidth: 18 } },
    });
    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, sortedPages, issueName]);

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
        style={{ zIndex: DRAWER_Z_PANEL, width: "min(100%, 960px)", maxWidth: "960px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seo-checkpoint-pages-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex flex-wrap align-items-flex-start justify-content-between gap-3">
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
                <h5 className="mb-0 fw-semibold text-body" id="seo-checkpoint-pages-drawer-title">
                  {issueName}
                </h5>
                <p className="text-muted fs-13 mb-0 mt-1">
                  {pageCount.toLocaleString()} pages with this issue
                </p>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <DownloadReportDropdown
                reportBaseName={reportBaseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                className="border border-secondary border-opacity-25 rounded-2"
              />
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
        </div>

        <div className="flex-grow-1 overflow-auto px-4 py-4">
          {/* Quick help */}
          <div className="bg-body-tertiary bg-opacity-50 rounded-2 p-3 mb-4">
            <h6 className="fw-semibold text-body fs-13 mb-2">Quick help</h6>
            {quickHelpLines.map((line, i) => (
              <p key={i} className="text-body fs-13 mb-1">
                {line}
              </p>
            ))}
          </div>

          {/* Compliance */}
          <div className="mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="fs-13 text-body fw-medium">Compliance {complianceDisplay}%</span>
              <div className="d-flex align-items-center gap-3">
                <span className="fs-13 text-muted">
                  {pagesInCompliance} Pages ({complianceDisplay}%) in compliance
                </span>
                <span className="fs-13 text-body fw-medium">
                  {pagesToFix} Pages ({toFixPercent}%) to fix
                </span>
              </div>
            </div>
            <div className="progress rounded-pill" style={{ height: 8 }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${complianceDisplay}%` }}
                aria-valuenow={complianceDisplay}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Compliance"
              />
            </div>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                {isLoading ? (
                  <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
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
                            onClick={() => handleSort("priority")}
                          >
                            Priority
                            {sortBy === "priority" ? (
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
                        <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPages.map((p, idx) => (
                        <tr key={`${p.url}-${idx}`}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column">
                              <span className="text-muted fs-13">{p.title}</span>
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
                          <td className="py-3">
                            <div className="d-flex flex-column gap-1">
                              <span className="fs-13 text-body">{p.views}</span>
                              <div className="bg-secondary bg-opacity-25 rounded" style={{ height: 4, width: 40 }} aria-hidden="true" />
                            </div>
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
                                <i className="isax isax-document-text fs-14 text-primary" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sortedPages.length === 0 && !isLoading && (
                        <tr>
                            <td colSpan="4" className="text-center py-5 text-muted">No pages found for this issue.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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
                    {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount}
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
                        <button
                          type="button"
                          className="page-link rounded-2"
                          onClick={() => setCurrentPage(totalPages)}
                        >
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
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

export default SeoCheckpointPagesDrawer;
