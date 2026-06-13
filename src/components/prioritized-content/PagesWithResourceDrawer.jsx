import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 10;

function getSamplePagesForResource(resourceUrl) {
  if (!resourceUrl) return [];
  const base = resourceUrl.replace(/\/?$/, "");
  return [
    { id: "1", title: "(No title found)", url: base, views: 0 },
    { id: "2", title: "(No title found)", url: `${base}/search`, views: 12 },
    { id: "3", title: "(No title found)", url: `${base}/contact-us`, views: 8 },
  ];
}

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ms-1"
      style={{ verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

export default function PagesWithResourceDrawer({
  open,
  onClose,
  resourceUrl,
  title,
  reportBaseName,
  onOpenPageDetails,
  ariaLabelledBy = "pages-with-resource-drawer-title",
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortViewsAsc, setSortViewsAsc] = useState(true);

  const samplePages = useMemo(
    () => (resourceUrl ? getSamplePagesForResource(resourceUrl) : []),
    [resourceUrl],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return samplePages;
    const q = search.trim().toLowerCase();
    return samplePages.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.url && r.url.toLowerCase().includes(q)),
    );
  }, [samplePages, search]);

  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) =>
        sortViewsAsc ? a.views - b.views : b.views - a.views,
      ),
    [filteredRows, sortViewsAsc],
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportBase = safeFilename(reportBaseName);
  const exportCSV = () => {
    const header = "Title and URL,Views\n";
    const body = sortedRows
      .map(
        (r) =>
          `"${(r.title || "").replace(/"/g, '""')}","${(r.url || "").replace(/"/g, '""')}",${r.views}`,
      )
      .join("\n");
    downloadBlob(
      new Blob([header + body], { type: "text/csv;charset=utf-8;" }),
      `${reportBase}.csv`,
    );
  };
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedRows.map((r) => ({
        "Title and URL": r.title || r.url,
        URL: r.url,
        Views: r.views,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  };
  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Title", "URL", "Views"]],
      body: sortedRows.map((r) => [
        r.title || "",
        r.url || "",
        String(r.views),
      ]),
      startY: 10,
      styles: { fontSize: 8 },
    });
    doc.save(`${reportBase}.pdf`);
  };

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
    <>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: 1050 }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column"
        style={{
          zIndex: 1055,
          width: "min(100%, 1200px)",
          overflow: "visible",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
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
                    aria-hidden
                  />
                </button>
                <h5 id={ariaLabelledBy} className="mb-0 fw-semibold text-body">
                  {title}
                </h5>
              </div>
              {resourceUrl && (
                <a
                  href={resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-decoration-none small ms-4 d-inline-block text-break"
                >
                  {resourceUrl}
                </a>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <DownloadReportDropdown
                reportBaseName={reportBaseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
                dropup
              />
              <div
                className="input-group input-group-sm"
                style={{ width: 200 }}
              >
                <span className="input-group-text bg-transparent border-end-0">
                  <i
                    className="isax isax-search-normal-1 text-muted"
                    aria-hidden
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
            </div>
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto">
          <div className="table-responsive">
            <table className="table table-hover table-borderless mb-0 align-middle">
              <thead className="sticky-top bg-white">
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 fw-semibold text-body fs-13 text-nowrap">
                    Title and URL
                  </th>
                  <th className="py-3 fw-semibold text-body fs-13 text-nowrap text-end">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center text-nowrap"
                      onClick={() => setSortViewsAsc((v) => !v)}
                    >
                      Views{" "}
                      <i
                        className={`isax ms-1 fs-12 ${sortViewsAsc ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                        aria-hidden
                      />
                    </button>
                  </th>
                  <th className="py-3 pe-4" style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <div className="d-flex flex-column">
                        <span className="text-primary small">{row.title}</span>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none small d-inline-flex align-items-center gap-1 mt-1"
                        >
                          {row.url}
                          <ExternalLinkIcon />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 text-body text-end">{row.views}</td>
                    <td className="py-3 pe-4 text-end">
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-primary rounded-2"
                        aria-label="Open page details"
                        title="Open page details"
                        onClick={() =>
                          onOpenPageDetails && onOpenPageDetails(row)
                        }
                      >
                        <i className="isax isax-document-text" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
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
              {Math.min(currentPage * rowsPerPage, sortedRows.length)} of{" "}
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
    </>
  );
  return createPortal(content, document.body);
}
