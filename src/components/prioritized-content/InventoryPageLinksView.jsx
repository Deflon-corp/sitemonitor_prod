function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
import React, { useState, useMemo, useCallback } from "react";
import PagesWithLinkDrawer from "@/components/prioritized-content/PagesWithLinkDrawer";
import PageDetailsDrawer from "@/components/prioritized-content/PageDetailsDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

export default function InventoryPageLinksView({
  onBack,
  downloadDropup,
  internalRows = [],
  externalRows = [],
}) {
  const [tab, setTab] = useState("internal");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [selectedLinkUrl, setSelectedLinkUrl] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const rows = tab === "internal" ? internalRows : externalRows;
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.url.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const openPagesDrawer = (row) => {
    setSelectedLinkUrl(row.url);
    setPagesDrawerOpen(true);
  };

  const openPageDetails = useCallback((row) => {
    const id = Number.parseInt(row.id.replace(/\D/g, ""), 10) || 0;
    setSelectedPageForDetails({ id, title: row.title, url: row.url });
    setPagesDrawerOpen(false);
    setPageDetailsOpen(true);
  }, []);

  const reportBase = safeFilename("Page-Links-Report");
  const exportCSV = useCallback(() => {
    const header = "URL,Documents,Pages\n";
    const body = filteredRows
      .map((r) => `"${r.url.replace(/"/g, '""')}",${r.documents},${r.pages}`)
      .join("\n");
    downloadBlob(
      new Blob([header + body], { type: "text/csv;charset=utf-8;" }),
      `${reportBase}.csv`,
    );
  }, [filteredRows, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      filteredRows.map((r) => ({
        URL: r.url,
        Documents: r.documents,
        Pages: r.pages,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Page Links");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [filteredRows, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["URL", "Documents", "Pages"]],
      body: filteredRows.map((r) => [
        r.url,
        String(r.documents),
        String(r.pages),
      ]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
      },
    });
    doc.save(`${reportBase}.pdf`);
  }, [filteredRows, reportBase]);

  return (
    <React.Fragment>
      <div
        className={`card border-0 shadow-sm mb-3 ${downloadDropup ? "drawer-header-with-dropdown" : ""}`}
      >
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border"
                  onClick={onBack}
                  aria-label="Back to Links summary"
                >
                  <i className="isax isax-arrow-left-2" aria-hidden={true} />
                </button>
              )}
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="isax isax-link-2 fs-22" aria-hidden={true} />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold text-body">Page links</h6>
                <p className="text-muted fs-13 mb-0">
                  {filteredRows.length}
                  {" results"}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <DownloadReportDropdown
                reportBaseName={reportBase}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
                dropup={downloadDropup}
              />
              <div
                className="input-group input-group-sm"
                style={{ minWidth: 200, maxWidth: 280 }}
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
                  aria-label="Search page links"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 mb-3 border-bottom border-secondary border-opacity-25 ps-3">
        <button
          type="button"
          className={`btn btn-link p-0 border-0 text-decoration-none py-2 px-0 me-3 rounded-0 border-bottom border-2 ${tab === "internal" ? "border-primary text-primary fw-medium" : "text-body border-transparent"}`}
          onClick={() => {
            setTab("internal");
            setCurrentPage(1);
          }}
        >
          Internal
        </button>
        <button
          type="button"
          className={`btn btn-link p-0 border-0 text-decoration-none py-2 px-0 rounded-0 border-bottom border-2 ${tab === "external" ? "border-primary text-primary fw-medium" : "text-body border-transparent"}`}
          onClick={() => {
            setTab("external");
            setCurrentPage(1);
          }}
        >
          External
        </button>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless mb-0 align-middle">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 fw-semibold text-body fs-13 text-start">
                    URL
                  </th>
                  <th
                    className="py-3 ps-3 pe-2 fw-semibold text-body fs-13 text-uppercase text-end"
                    style={{ minWidth: 100 }}
                  >
                    DOCUMENTS
                  </th>
                  <th
                    className="py-3 ps-3 pe-4 fw-semibold text-body fs-13 text-uppercase text-end"
                    style={{ width: 120, minWidth: 120 }}
                  >
                    PAGES
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none text-break"
                      >
                        {row.url}
                      </a>
                    </td>
                    <td className="py-3 ps-3 pe-2 text-end">
                      <div className="d-flex flex-column align-items-end">
                        <span className="text-primary fw-semibold">
                          {row.documents.toLocaleString()}
                        </span>
                        <span className="text-muted small">DOCUMENTS</span>
                      </div>
                    </td>
                    <td
                      className="py-3 ps-3 pe-4 text-end"
                      style={{ width: 120, minWidth: 120 }}
                    >
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none d-flex flex-column align-items-end w-100"
                        onClick={() => openPagesDrawer(row)}
                      >
                        <span className="text-primary fw-semibold">
                          {row.pages.toLocaleString()}
                        </span>
                        <span className="text-muted small">PAGES</span>
                      </button>
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
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-muted small">
                {(currentPage - 1) * rowsPerPage + 1}–
                {Math.min(currentPage * rowsPerPage, filteredRows.length)}
                {" of "}
                {filteredRows.length}
              </span>
            </div>
            <nav aria-label="Page links pagination">
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
                    Previous
                  </button>
                </li>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
      <PagesWithLinkDrawer
        open={pagesDrawerOpen}
        onClose={() => {
          setPagesDrawerOpen(false);
          setSelectedLinkUrl(null);
        }}
        linkUrl={_nullishCoalesce(selectedLinkUrl, () => "")}
        onOpenPageDetails={openPageDetails}
      />
      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPageForDetails}
        defaultTab="inventory"
        defaultInventorySubView="html-pages"
      />
    </React.Fragment>
  );
}
