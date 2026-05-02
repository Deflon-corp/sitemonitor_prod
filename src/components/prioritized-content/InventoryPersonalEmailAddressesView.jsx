import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import PagesThatContainEmailDrawer from "./PagesThatContainEmailDrawer";
import PagesThatContainEmailPagesDrawer from "./PagesThatContainEmailPagesDrawer";
import PageDetailsDrawer from "./PageDetailsDrawer";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const TITLE = "Email addresses";
const ICON = "isax-sms";
const REPORT_BASE = "Email-Addresses-Report";

/** Site-wide Personal inventory: email, documents count, pages count */
const SAMPLE = [
  { id: 1, email: "investors@bajajfinserv.in", documents: 0, pages: 498 },
  { id: 2, email: "investor.service@bajajfinserv.in", documents: 0, pages: 12 },
  { id: 3, email: "support@bajajfinserv.in", documents: 2, pages: 156 },
  { id: 4, email: "contact@bajajfinserv.in", documents: 0, pages: 89 },
  { id: 5, email: "careers@bajajfinserv.in", documents: 1, pages: 34 },
  { id: 6, email: "compliance@bajajfinserv.in", documents: 5, pages: 22 },
  { id: 7, email: "feedback@bajajfinserv.in", documents: 0, pages: 8 },
  { id: 8, email: "privacy@bajajfinserv.in", documents: 0, pages: 201 },
];

export default function InventoryPersonalEmailAddressesView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortEmailAsc, setSortEmailAsc] = useState(true);
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [selectedEmailForDocuments, setSelectedEmailForDocuments] = useState(null);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [selectedEmailForPages, setSelectedEmailForPages] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  /** Inventory sub-view when Page Details opens (documents drawer → Documents; pages drawer → Email addresses). */
  const [pageDetailsInventorySubView, setPageDetailsInventorySubView] = useState("email-addresses");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((r) => (r.email || "").toLowerCase().includes(q));
  }, [items, search]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const cmp = (a.email || "").localeCompare(b.email || "", undefined, { sensitivity: "base" });
      return sortEmailAsc ? cmp : -cmp;
    });
  }, [filteredItems, sortEmailAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, currentPage, rowsPerPage]);

  const reportBase = safeFilename(REPORT_BASE);
  const exportCSV = useCallback(() => {
    const header = "Email,Documents,Pages\n";
    const body = sortedItems
      .map((r) => `"${(r.email || "").replace(/"/g, '""')}",${r.documents ?? 0},${r.pages ?? 0}`)
      .join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [sortedItems, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedItems.map((r) => ({ Email: r.email || "", Documents: r.documents ?? 0, Pages: r.pages ?? 0 }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emails");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [sortedItems, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Email", "Documents", "Pages"]],
      body: sortedItems.map((r) => [r.email || "", String(r.documents ?? 0), String(r.pages ?? 0)]),
      startY: 10,
      styles: { fontSize: 8 },
    });
    doc.save(`${reportBase}.pdf`);
  }, [sortedItems, reportBase]);

  return (
    <>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            className="avatar avatar-40 rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
            style={{ minWidth: 40, height: 40 }}
          >
            <i className={`isax ${ICON} fs-4`} aria-hidden />
          </span>
          <h5 className="mb-0 fw-bold text-body">{TITLE}</h5>
        </div>
        <p className="text-muted small mb-0">{filteredItems.length} results</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3 forms-download-report-btn">
        <DownloadReportDropdown
          reportBaseName={reportBase}
          onExportCSV={exportCSV}
          onExportExcel={exportExcel}
          onExportPDF={exportPDF}
          variant="icon"
        />
        <div className="position-relative" style={{ minWidth: 200, maxWidth: 280 }}>
          <input
            type="search"
            className="form-control form-control-sm ps-3 pe-4"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search email addresses"
          />
          <span className="position-absolute end-0 top-50 translate-middle-y me-2 text-muted" style={{ pointerEvents: "none" }}>
            <i className="isax isax-search-normal small" aria-hidden />
          </span>
        </div>
      </div>

      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 ps-4 py-3 fw-semibold text-body text-uppercase small">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center gap-1 text-uppercase small fw-semibold"
                      onClick={() => setSortEmailAsc((v) => !v)}
                    >
                      Email
                      <i className={`isax fs-12 ${sortEmailAsc ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden />
                    </button>
                  </th>
                  <th className="border-0 py-3 pe-2 text-end fw-semibold text-body text-uppercase small" style={{ width: 120 }} scope="col">
                    <span className="visually-hidden">Documents</span>
                  </th>
                  <th className="border-0 pe-4 py-3 text-end fw-semibold text-body text-uppercase small" style={{ width: 120 }} scope="col">
                    <span className="visually-hidden">Pages</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td className="ps-4 py-3">
                      <a href={`mailto:${row.email}`} className="text-primary text-decoration-none text-break">
                        {row.email}
                      </a>
                    </td>
                    <td className="py-3 text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none d-flex flex-column align-items-end w-100 text-end"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEmailForDocuments(row.email);
                          setDocumentsDrawerOpen(true);
                        }}
                        aria-label={`Open pages for documents containing ${row.email} (${row.documents} documents)`}
                      >
                        <span className="fw-semibold text-primary" style={{ fontSize: "1.125rem" }}>
                          {row.documents}
                        </span>
                        <span className="text-body text-uppercase small" style={{ fontSize: "0.7rem" }}>
                          documents
                        </span>
                      </button>
                    </td>
                    <td className="pe-4 py-3 text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none d-flex flex-column align-items-end w-100 text-end"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedEmailForPages(row.email);
                          setPagesDrawerOpen(true);
                        }}
                        aria-label={`Open list of pages containing ${row.email} (${row.pages} pages)`}
                      >
                        <span className="fw-semibold text-primary" style={{ fontSize: "1.125rem" }}>
                          {row.pages}
                        </span>
                        <span className="text-body text-uppercase small" style={{ fontSize: "0.7rem" }}>
                          pages
                        </span>
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
            </div>
            <span className="text-muted small">
              {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, sortedItems.length)} of {sortedItems.length}
            </span>
            <nav aria-label="Email addresses pagination">
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

      <PagesThatContainEmailDrawer
        open={documentsDrawerOpen}
        onClose={() => {
          setDocumentsDrawerOpen(false);
          setSelectedEmailForDocuments(null);
        }}
        email={selectedEmailForDocuments}
        pages={[]}
        reportBaseName="Pages-Email-Documents-Report"
        onOpenPageDetails={(row) => {
          setSelectedPageForDetails({
            title: row.title || "(No title found)",
            url: row.url,
          });
          setPageDetailsInventorySubView("documents");
          setDocumentsDrawerOpen(false);
          setPageDetailsOpen(true);
        }}
      />
      <PagesThatContainEmailPagesDrawer
        open={pagesDrawerOpen}
        onClose={() => {
          setPagesDrawerOpen(false);
          setSelectedEmailForPages(null);
        }}
        email={selectedEmailForPages}
        pages={[]}
        onOpenPageDetails={(row) => {
          setSelectedPageForDetails({
            title: row.title || "(No title found)",
            url: row.url,
          });
          /* PAGES drawer → Page Details must always open Inventory → Email addresses (not Documents). */
          setPageDetailsInventorySubView("email-addresses");
          setPagesDrawerOpen(false);
          setPageDetailsOpen(true);
        }}
      />
      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => {
          setPageDetailsOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={selectedPageForDetails}
        defaultTab="inventory"
        defaultInventorySubView={pageDetailsInventorySubView}
        backdropZIndex={1080}
        panelZIndex={1085}
      />
    </>
  );
}
