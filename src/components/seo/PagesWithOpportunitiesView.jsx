function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
import React, { useState, useMemo, useCallback, useEffect } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDomainByIdApi, getDomainSeoPagesApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PagesWithOpportunitiesView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [pages, setPages] = useState([]);
  const [domain, setDomain] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchPages = useCallback(
    async (showLoading = true) => {
      if (!domainId) return;
      if (showLoading) setIsLoading(true);
      try {
        const [pagesRes, domRes] = await Promise.all([
          getDomainSeoPagesApi(domainId, currentPage, rowsPerPage, searchQuery),
          getDomainByIdApi(domainId),
        ]);
        if (pagesRes.success) {
          setPages(pagesRes.data.pages);
          setTotalCount(pagesRes.data.pagination.total);
        }
        if (domRes.success) {
          setDomain(domRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch SEO pages:", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [domainId, currentPage, rowsPerPage, searchQuery],
  );

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    let interval;
    if (
      domain &&
      (domain.dm_seo_status === "pending" ||
        domain.dm_seo_status === "scanning")
    ) {
      interval = setInterval(() => {
        fetchPages(false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [domain, fetchPages]);

  const openPageDetails = (p, index) => {
    setSelectedPageForDetails(p);
    setPageDetailsDrawerOpen(true);
  };

  const sortedPages = useMemo(() => {
    if (!sortBy) return pages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...pages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "issues") return dir * (a.notifications - b.notifications);
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return (
          dir *
          (_nullishCoalesce(order[a.priority], () => 0) -
            _nullishCoalesce(order[b.priority], () => 0))
        );
      }
      return 0;
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

  const reportBaseName = safeFilename("Pages-With-Opportunities-Report");

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Issues,Priority\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
          p.notifications,
          `"${p.priority}"`,
        ].join(","),
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
      Issues: p.notifications,
      Priority: p.priority,
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
    const head = [["Title", "URL", "Issues", "Priority"]];
    const body = sortedPages.map((p) => [
      (p.title || "").slice(0, 35),
      p.url.slice(0, 50),
      String(p.notifications),
      p.priority,
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
      },
    });
    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, sortedPages]);

  return (
    <div className="pages-with-opportunities-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i
              className="isax isax-document-copy text-primary fs-22"
              aria-hidden="true"
            />
            Pages Needing Attention
          </h5>
          <p className="text-muted fs-13 mb-0 d-flex align-items-center gap-2">
            We've identified {totalCount} pages that could rank higher with some
            SEO improvements.
            {domain?.dm_seo_status === "scanning" ||
              domain?.dm_seo_status === "pending" ? (
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center gap-2 py-1 px-2">
                <span
                  className="spinner-border spinner-border-sm"
                  style={{ width: 10, height: 10 }}
                  role="status"
                  aria-hidden="true"
                ></span>
                <span style={{ fontSize: 10 }}>Scanning for updates...</span>
              </span>
            ) : null}
          </p>
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
            <span
              className="d-flex align-items-center ps-3 flex-shrink-0 text-muted"
              aria-hidden="true"
            >
              <i
                className="isax isax-search-normal-1"
                style={{ fontSize: "1rem" }}
                aria-hidden="true"
              />
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

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            {isLoading ? (
              <div className="d-flex justify-content-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (domain?.dm_seo_status === "pending" ||
              domain?.dm_seo_status === "scanning") &&
              pages.length === 0 ? (
              <div className="text-center p-5">
                <div className="mb-4">
                  <div
                    className="spinner-border text-primary"
                    style={{ width: "3rem", height: "3rem" }}
                    role="status"
                  >
                    <span className="visually-hidden">Scanning...</span>
                  </div>
                </div>
                <h5>SEO Scan in Progress...</h5>
                <p className="text-muted">Analyzing pages for opportunities.</p>
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
                        Page Title & URL
                        {sortBy === "title" ? (
                          <i
                            className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <i
                            className="isax isax-sort fs-12 opacity-50"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                        onClick={() => handleSort("issues")}
                      >
                        Issues
                        {sortBy === "issues" ? (
                          <i
                            className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <i
                            className="isax isax-sort fs-12 opacity-50"
                            aria-hidden="true"
                          />
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
                        <span
                          className="ms-1 d-inline-flex"
                          title="Priority level"
                          aria-label="Info"
                        >
                          <i
                            className="isax isax-information text-muted fs-12"
                            aria-hidden="true"
                          />
                        </span>
                        {sortBy === "priority" ? (
                          <i
                            className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <i
                            className="isax isax-sort fs-12 opacity-50"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                    <th
                      className="py-3 pe-4 text-body fs-13 fw-semibold"
                      style={{ width: 120 }}
                      aria-label="Actions"
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPages.map((p, idx) => (
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
                      <td className="py-3 fs-13 text-body">
                        {p.notifications}
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge rounded-pill ${p.priority === "High"
                              ? "bg-danger bg-opacity-10 text-danger"
                              : p.priority === "Medium"
                                ? "bg-warning bg-opacity-10 text-warning"
                                : "bg-secondary bg-opacity-10 text-secondary"
                            }`}
                        >
                          {p.priority}
                        </span>
                      </td>
                      <td className="py-3 pe-4">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                            title="Open page details"
                            aria-label="Open page details"
                            onClick={() => openPageDetails(p, idx)}
                          >
                            <i
                              className="isax isax-document-text fs-14"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && sortedPages.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        No pages found.
                      </td>
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
                {(currentPage - 1) * rowsPerPage + 1}-
                {Math.min(currentPage * rowsPerPage, totalCount)} of{" "}
                {totalCount}
              </span>
            </div>
            <nav aria-label="Pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
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
                  else if (currentPage >= totalPages - 3)
                    p = totalPages - 6 + i;
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
                <li
                  className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
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

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={selectedPageForDetails}
        defaultTab="seo"
      />
    </div>
  );
};

export default PagesWithOpportunitiesView;
