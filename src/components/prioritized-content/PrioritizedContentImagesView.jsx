import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import PagesWithImageDrawer from "./PagesWithImageDrawer";
import PageDetailsMisspellingsDrawer from "./PageDetailsMisspellingsDrawer";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PrioritizedContentImagesView = ({
  title: titleProp = "Images",
  items = [],
  variant,
  defaultInventorySubView = "images",
}) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const openPagesDrawer = (row) => {
    setSelectedImageUrl(row.url);
    setPagesDrawerOpen(true);
  };

  const openPageDetails = useCallback((row) => {
    setSelectedPageForDetails(row);
    setPagesDrawerOpen(false);
    setPageDetailsOpen(true);
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((r) => (r.url || "").toLowerCase().includes(q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const reportBase = safeFilename(`${titleProp.replace(/\s+/g, "-")}-Report`);

  const exportCSV = useCallback(() => {
    const header = "URL,Pages\n";
    const body = filteredRows.map((r) => `"${(r.url || "").replace(/"/g, '""')}",${r.pageCount || 0}`).join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [filteredRows, reportBase]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(filteredRows.map((r) => ({ URL: r.url || "", Pages: r.pageCount || 0 })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, titleProp);
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [filteredRows, reportBase, titleProp]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["URL", "Pages"]],
      body: filteredRows.map((r) => [r.url || "", String(r.pageCount || 0)]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 25 } },
    });
    doc.save(`${reportBase}.pdf`);
  }, [filteredRows, reportBase]);

  if (variant === "details") {
    const detailsFiltered = !search.trim() ? items : items.filter((r) => (r.url || "").toLowerCase().includes(search.trim().toLowerCase()));
    const detailsTotalPages = Math.max(1, Math.ceil(detailsFiltered.length / rowsPerPage));
    const start = (currentPage - 1) * rowsPerPage;
    const detailsPaginated = detailsFiltered.slice(start, start + rowsPerPage);
    
    return (
      <>
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                  <i className="isax isax-image fs-22" aria-hidden="true" />
                </span>
                <div>
                  <h6 className="mb-0 fw-semibold">{titleProp}</h6>
                  <p className="text-muted fs-13 mb-0">{detailsFiltered.length} found</p>
                </div>
              </div>
              <div className="flex-grow-1 flex-md-grow-0" style={{ minWidth: 200, maxWidth: 320 }}>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label={`Search ${titleProp.toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped table-borderless align-middle mb-0">
                <thead>
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Link</th>
                    <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Type</th>
                    <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Response code</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsPaginated.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2">
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none text-break">
                          {row.url}
                        </a>
                      </td>
                      <td className="px-4 py-2">
                        <span className="badge bg-secondary bg-opacity-25 text-body">Image</span>
                      </td>
                      <td className="px-4 py-2 text-body">{row.statusCode || 200}</td>
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
                  {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, detailsFiltered.length)} of {detailsFiltered.length}
                </span>
              </div>
              <nav aria-label={`${titleProp} pagination`}>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
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
                  {Array.from({ length: Math.min(detailsTotalPages, 10) }, (_, i) => {
                    const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                    if (p > detailsTotalPages) return null;
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
                  <li className={`page-item ${currentPage >= detailsTotalPages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage((p) => Math.min(detailsTotalPages, p + 1))}
                      disabled={currentPage >= detailsTotalPages}
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
  }

  return (
    <>
      {/* Title card: Images + results count */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="isax isax-image fs-22" aria-hidden="true" />
            </span>
            <div>
              <h6 className="mb-0 fw-semibold text-body">{titleProp}</h6>
              <p className="text-muted fs-13 mb-0">{filteredRows.length} results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download + Filter + Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <DownloadReportDropdown
                reportBaseName={reportBase}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
              />
              <button type="button" className="btn btn-icon btn-sm btn-light" title="Filter" aria-label="Filter">
                <i className="isax isax-filter text-primary" aria-hidden="true" />
              </button>
              <div className="input-group input-group-sm" style={{ minWidth: 200, maxWidth: 280 }}>
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="isax isax-search-normal-1 text-muted" aria-hidden="true" />
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
                  aria-label={`Search ${titleProp.toLowerCase()}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless mb-0 align-middle">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 fw-semibold text-body fs-13">URL</th>
                  <th className="py-3 pe-4 fw-semibold text-body fs-13 text-end">PAGES</th>
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
                    <td className="py-3 pe-4 text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none"
                        onClick={() => openPagesDrawer(row)}
                      >
                        <span className="text-primary fw-semibold me-1">{row.pageCount}</span>
                        <span className="text-muted"> PAGES</span>
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
                {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
              </span>
            </div>
            <nav aria-label={`${titleProp} pagination`}>
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
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
                <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link rounded-2"
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

      <PagesWithImageDrawer
        open={pagesDrawerOpen}
        onClose={() => {
          setPagesDrawerOpen(false);
          setSelectedImageUrl(null);
        }}
        imageUrl={selectedImageUrl || ""}
        onOpenPageDetails={openPageDetails}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPageForDetails}
        defaultTab="inventory"
        defaultInventorySubView={defaultInventorySubView}
      />
    </>
  );
};

export default PrioritizedContentImagesView;
