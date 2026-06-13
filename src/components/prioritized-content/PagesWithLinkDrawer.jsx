function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

import inventoryApi from "@/api/inventoryApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

export default function PagesWithLinkDrawer({
  open,
  onClose,
  linkUrl,
  onOpenPageDetails,
}) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortViewsAsc, setSortViewsAsc] = useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (!open || !domainId || !linkUrl) return;
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const res = await inventoryApi.getInventoryDetails(domainId, {
          type: "links",
          search: linkUrl,
          limit: 100,
        });
        if (res.success && res.data?.items) {
          const mapped = res.data.items.map((item, idx) => ({
            id: item._id || idx,
            title: item.anchor_text || "(No anchor text found)",
            url: item.page_url,
            views: 0,
          }));
          setPages(mapped);
        } else {
          setPages([]);
        }
      } catch (err) {
        console.error("Error fetching pages with link:", err);
        setPages([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPages();
  }, [open, domainId, linkUrl]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.trim().toLowerCase();
    return pages.filter(
      (r) =>
        r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
    );
  }, [search, pages]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) =>
      sortViewsAsc ? a.views - b.views : b.views - a.views,
    );
  }, [filteredRows, sortViewsAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportBase = safeFilename("Pages-with-Link-Report");
  const exportCSV = useCallback(() => {
    const header = "Title,URL,Views\n";
    const body = sortedRows
      .map(
        (r) =>
          `"${(r.title || "").replace(/"/g, '""')}","${r.url.replace(/"/g, '""')}",${r.views}`,
      )
      .join("\n");
    downloadBlob(
      new Blob([header + body], { type: "text/csv;charset=utf-8;" }),
      `${reportBase}.csv`,
    );
  }, [sortedRows, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedRows.map((r) => ({ Title: r.title, URL: r.url, Views: r.views })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [sortedRows, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Title", "URL", "Views"]],
      body: sortedRows.map((r) => [r.title || "", r.url, String(r.views)]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: "wrap" },
        2: { cellWidth: 20 },
      },
    });
    doc.save(`${reportBase}.pdf`);
  }, [sortedRows, reportBase]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <React.Fragment>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: 1050 }}
        aria-hidden={true}
        onClick={onClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column"
        style={{
          zIndex: 1055,
          width: "min(100%, 1300px)",
          overflow: "visible",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pages-with-link-drawer-title"
      >
        <div className="drawer-header-with-dropdown border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="min-w-0 flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border-0"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <i
                    className="isax isax-close-circle fs-20 text-body"
                    aria-hidden={true}
                  />
                </button>
                <h5
                  id="pages-with-link-drawer-title"
                  className="mb-0 fw-semibold text-body"
                >
                  Pages with this link
                </h5>
              </div>
              <p className="text-muted small mb-0 ms-4 text-break">{linkUrl}</p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <DownloadReportDropdown
                reportBaseName={reportBase}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
              />
              <div
                className="input-group input-group-sm"
                style={{ width: 200 }}
              >
                <span className="input-group-text bg-transparent border-end-0">
                  <i
                    className="isax isax-search-normal-1 text-muted"
                    aria-hidden={true}
                  />
                </span>
                <input
                  type="search"
                  className="form-control border-start-0"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search pages"
                />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                aria-label="More options"
              >
                <i className="isax isax-more-2" aria-hidden={true} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless mb-0 align-middle">
              <thead className="sticky-top bg-white">
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 fw-semibold text-body fs-13">
                    Title and URL
                  </th>
                  <th className="py-3 fw-semibold text-body fs-13">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                      onClick={() => setSortViewsAsc((v) => !v)}
                    >
                      Views
                      <i
                        className={`isax ms-1 fs-12 ${sortViewsAsc ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                        aria-hidden={true}
                      />
                    </button>
                  </th>
                  <th className="py-3 pe-4" style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-muted">
                      <div
                        className="spinner-border spinner-border-sm text-primary me-2"
                        role="status"
                      />
                      Loading pages...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-muted">
                      No pages found embedding this link.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 ps-4">
                        <div className="d-flex flex-column">
                          <span className="text-muted small">{row.title}</span>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-decoration-none small d-inline-flex align-items-center mt-1"
                          >
                            {row.url}
                            <span
                              className="ms-1 d-inline-flex"
                              aria-hidden={true}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-primary"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <path d="M15 3h6v6" />
                                <path d="M10 14L21 3" />
                              </svg>
                            </span>
                          </a>
                        </div>
                      </td>
                      <td className="py-3 text-body">{row.views}</td>
                      <td className="py-3 pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-primary rounded-2"
                          aria-label="Open page details"
                          title="Open page details"
                          onClick={() =>
                            _optionalChain([
                              onOpenPageDetails,
                              "optionalCall",
                              (_2) => _2(row),
                            ])
                          }
                        >
                          <i
                            className="isax isax-document-text"
                            aria-hidden={true}
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Rows per page</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
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
              {(currentPage - 1) * rowsPerPage + 1}–
              {Math.min(currentPage * rowsPerPage, sortedRows.length)}
              {" of "}
              {sortedRows.length}
            </span>
          </div>
          <nav aria-label="Pages pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link rounded-2"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  «
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = currentPage <= 4 ? i + 1 : currentPage - 3 + i;
                if (p > totalPages) return null;
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
              {totalPages > 7 && (
                <React.Fragment>
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                  <li className="page-item">
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </li>
                </React.Fragment>
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
                >
                  »
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </React.Fragment>
  );

  return createPortal(content, document.body);
}
