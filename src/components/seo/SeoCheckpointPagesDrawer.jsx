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

const getQuickHelp = (name) => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("broken link")) {
    return [
      "This page has one or more broken links which can harm SEO and user experience.",
      "Fix these links by updating them to valid URLs or removing them."
    ];
  }
  if (lower.includes("meta title")) {
    return [
      "This page is missing a title or has an empty title tag.",
      "We recommend that all your pages have a unique and descriptive title."
    ];
  }
  if (lower.includes("meta description")) {
    return [
      "This page is missing a meta description.",
      "Descriptions help search engines and users understand the content of your page."
    ];
  }
  if (lower.includes("render-blocking")) {
    return [
      "Resources are blocking the first paint of your page.",
      "Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles."
    ];
  }
  if (lower.includes("spelling") || lower.includes("misspelling")) {
    return [
      "One or more words on this page may be misspelled.",
      "Review the highlighted words and update them if necessary, or add them to your dictionary if they are correct."
    ];
  }
  return DEFAULT_QUICK_HELP;
};

const SeoCheckpointPagesDrawer = ({
  open,
  onClose,
  issueName,
  pageCount,
  domainTotalPages = 1,
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

  // Polling for updates if open
  useEffect(() => {
    let interval;
    if (open) {
      interval = setInterval(() => {
        fetchPages();
      }, 10000); // Poll every 10 seconds while drawer is open
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, fetchPages]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return pages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...pages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.targetedIssueCount - b.targetedIssueCount);
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

  const compliancePercent = Math.round(((Math.max(1, domainTotalPages) - totalCount) / Math.max(1, domainTotalPages)) * 100);
  const pagesInCompliance = Math.max(0, domainTotalPages - totalCount);
  const pagesToFix = totalCount;
  const complianceDisplay = Math.min(100, Math.max(0, compliancePercent));
  const toFixPercent = Math.round((totalCount / Math.max(1, domainTotalPages)) * 100);

  const reportBaseName = safeFilename(`${issueName.replace(/\s+/g, "-")}-Pages-Report`);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Priority,Issues\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
          `"${p.priority}"`,
          p.targetedIssueCount,
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
      Issues: p.targetedIssueCount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
  }, [reportBaseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text("SEO ISSUE REPORT", 105, yPos, { align: "center" });
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Issue Type: ${issueName}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Pages Affected: ${totalCount}`, 20, yPos);
    yPos += 15;

    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Content
    doc.setFontSize(12);
    sortedPages.forEach((p, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. URL: ${p.url.slice(0, 75)}${p.url.length > 75 ? "..." : ""}`, 20, yPos);
      yPos += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`   Issues Found: ${p.targetedIssueCount}`, 20, yPos);
      yPos += 7;
      doc.text(`   Severity: ${p.priority}`, 20, yPos);
      yPos += 10;

      doc.setFont("helvetica", "bold");
      doc.text("   Problem:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const problem = getQuickHelp(issueName)[0];
      const splitProblem = doc.splitTextToSize(`   - ${problem}`, 160);
      doc.text(splitProblem, 20, yPos);
      yPos += (splitProblem.length * 6);

      doc.setFont("helvetica", "bold");
      doc.text("   Recommendation:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const recommendation = getQuickHelp(issueName)[1];
      const splitRec = doc.splitTextToSize(`   - ${recommendation}`, 160);
      doc.text(splitRec, 20, yPos);
      yPos += (splitRec.length * 6) + 10;

      doc.setDrawColor(240, 240, 240);
      doc.line(25, yPos - 5, 185, yPos - 5);
      yPos += 5;
    });

    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, sortedPages, issueName, totalCount]);

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
                <h5 className="mb-1 fw-semibold text-body" id="seo-checkpoint-pages-drawer-title">
                  {issueName || "Issue Details"}
                </h5>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill fs-12 fw-medium px-3 py-2">
                    <i className="isax isax-document-text me-1"></i>
                    {totalCount.toLocaleString()} page{totalCount !== 1 ? "s" : ""} affected
                  </span>
                  <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill fs-12 fw-medium px-3 py-2">
                    <i className="isax isax-danger me-1"></i>
                    Total {pageCount.toLocaleString()} issue{pageCount !== 1 ? "s" : ""}
                  </span>
                </div>
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
            <ul className="text-muted fs-13 mb-0 ps-3">
              {getQuickHelp(issueName).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div className="mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="fs-13 text-body fw-medium">SEO Health Score {complianceDisplay}%</span>
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="fs-13 text-muted">
                  {pagesInCompliance} Page{pagesInCompliance !== 1 ? 's' : ''} ({complianceDisplay}%) Passed
                </span>
                <span className="fs-13 text-body fw-medium">
                  {pagesToFix} Page{pagesToFix !== 1 ? 's' : ''} ({toFixPercent}%) Affected
                </span>
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
                            onClick={() => handleSort("issues")}
                          >
                            Issue Count
                            {sortBy === "issues" ? (
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
                              <span className="text-body fw-medium fs-13">{p.title || "(No title found)"}</span>
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
                            <span className="fs-13 fw-semibold text-danger bg-danger bg-opacity-10 px-2 py-1 rounded-pill">
                              Count {p.targetedIssueCount} issue{p.targetedIssueCount !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3 pe-4">
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                                title="Open page details"
                                aria-label="Open page details"
                                onClick={() => onOpenPageDetails?.(p, issueName)}
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
