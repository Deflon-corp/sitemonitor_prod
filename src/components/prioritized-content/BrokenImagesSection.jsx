import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

export const BROKEN_IMAGES_SAMPLE = [
  { id: 1, url: "https://example.com/images/hero-banner.jpg", responseCode: "404", type: "image", dateFound: "2025-01-15" },
  { id: 2, url: "https://example.com/assets/logo.png", responseCode: "404", type: "image", dateFound: "2025-01-14" },
  { id: 3, url: "https://example.com/old/thumbnail.gif", responseCode: "404", type: "image", dateFound: "2025-01-13" },
  { id: 4, url: "https://cdn.example.com/retired/product.webp", responseCode: "410", type: "image", dateFound: "2025-01-12" },
  { id: 5, url: "https://example.com/images/partner-icon.svg", responseCode: "404", type: "image", dateFound: "2025-01-11" },
];

const BrokenImagesSection = ({
  items = BROKEN_IMAGES_SAMPLE,
  onOpenIssue,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, currentPage, rowsPerPage]);

  const reportName = "Broken-Images-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Broken image,Response code,Type,Date found\n";
    const body = items.map((r) => `"${r.url.replace(/"/g, '""')}","${r.responseCode}","${r.type}","${r.dateFound}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [items, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = items.map((r) => ({ "Broken image": r.url, "Response code": r.responseCode, Type: r.type, "Date found": r.dateFound }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Broken Images");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [items, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Broken image", "Response code", "Type", "Date found"]];
    const body = items.map((r) => [r.url, r.responseCode, r.type, r.dateFound]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 28 }, 2: { cellWidth: 20 }, 3: { cellWidth: 24 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [items, baseName]);

  return (
    <>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body pb-0">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
              <i className="isax isax-image fs-22" />
            </span>
            <div>
              <h6 className="mb-0 fw-semibold">Broken Images</h6>
              <p className="text-muted fs-13 mb-0">{items.length} issues found</p>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 border-bottom">
            <div className="nav nav-tabs border-0 gap-4">
              <button type="button" className="nav-link active border-0 px-0 pb-2 border-bottom border-2 border-primary text-primary fw-medium">All</button>
              <button type="button" className="nav-link border-0 px-0 pb-2 text-body">Ignored</button>
              <button type="button" className="nav-link border-0 px-0 pb-2 text-body">Marked as fixed</button>
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <DownloadReportDropdown
                reportBaseName={baseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
              />
              <button type="button" className="btn btn-icon btn-sm btn-light" title="Filter">
                <i className="isax isax-filter" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4" style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input" aria-label="Select all" />
                  </th>
                  <th className="fw-semibold text-body py-3">Broken image</th>
                  <th className="fw-semibold text-body py-3">Response code</th>
                  <th className="fw-semibold text-body py-3">Type</th>
                  <th className="fw-semibold text-body py-3">Open Issue Page</th>
                  <th className="fw-semibold text-body py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td className="ps-4 py-2">
                      <input type="checkbox" className="form-check-input" aria-label={`Select ${row.id}`} />
                    </td>
                    <td className="py-2">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">{row.url}</a>
                    </td>
                    <td className="py-2">{row.responseCode}</td>
                    <td className="py-2">
                      <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">{row.type}</span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-link text-primary p-0 border-0 bg-transparent text-decoration-none"
                        title="Open issue page"
                        onClick={() => onOpenIssue?.(row.id)}
                      >
                        <i className="isax isax-info-circle fs-20" />
                      </button>
                    </td>
                    <td className="py-2">
                      <div className="dropdown d-inline-block ms-1">
                        <button type="button" className="btn btn-icon btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Action">
                          <i className="isax isax-more" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li><button type="button" className="dropdown-item">Ignore</button></li>
                          <li><button type="button" className="dropdown-item">Mark as fixed</button></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
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
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted small">
                {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, items.length)} of {items.length}
              </span>
            </div>
            <nav aria-label="Broken images pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous"
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                    <button type="button" className="page-link" onClick={() => setCurrentPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    aria-label="Next"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrokenImagesSection;
