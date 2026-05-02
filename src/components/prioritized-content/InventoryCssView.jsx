import React, { useState, useMemo, useCallback } from "react";
import PageDetailsDrawer from "./PageDetailsDrawer";
import PagesWithCssDrawer from "./PagesWithCssDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

 






const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, url: "https://www.bajajfinserv.in/assets/css/main.css", pageCount: 3 },
  { id: 2, url: "https://www.bajajfinserv.in/assets/css/vendor.css", pageCount: 1 },
  { id: 3, url: "https://www.bajajfinserv.in/assets/css/components.css", pageCount: 2 },
  { id: 4, url: "https://www.bajajfinserv.in/assets/css/layout.css", pageCount: 1 },
  { id: 5, url: "https://www.bajajfinserv.in/assets/css/theme.css", pageCount: 1 },
  { id: 6, url: "https://www.bajajfinserv.in/assets/css/print.css", pageCount: 1 },
  { id: 7, url: "https://www.bajajfinserv.in/assets/css/responsive.css", pageCount: 1 },
  { id: 8, url: "https://www.bajajfinserv.in/assets/css/forms.css", pageCount: 1 },
];

const DETAILS_SAMPLE = [
  { id: 1, link: "https://www.bajajfinserv.in/assets/css/main.css", type: "CSS", responseCode: "200" },
  { id: 2, link: "https://www.bajajfinserv.in/assets/css/vendor.css", type: "CSS", responseCode: "200" },
  { id: 3, link: "https://www.bajajfinserv.in/assets/css/components.css", type: "CSS", responseCode: "200" },
  { id: 4, link: "https://www.bajajfinserv.in/assets/css/layout.css", type: "CSS", responseCode: "200" },
  { id: 5, link: "https://www.bajajfinserv.in/assets/css/theme.css", type: "CSS", responseCode: "200" },
  { id: 6, link: "https://www.bajajfinserv.in/assets/css/print.css", type: "CSS", responseCode: "200" },
  { id: 7, link: "https://www.bajajfinserv.in/assets/css/responsive.css", type: "CSS", responseCode: "200" },
  { id: 8, link: "https://www.bajajfinserv.in/assets/css/forms.css", type: "CSS", responseCode: "200" },
];

const TITLE = "CSS";
const ICON = "isax-code";
const REPORT_BASE = "CSS-Report";
const DEFAULT_INVENTORY_SUB_VIEW = "css";

export default function InventoryCssView({ items = SAMPLE, variant }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("internal");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [selectedResourceUrl, setSelectedResourceUrl] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((r) => (r.url || "").toLowerCase().includes(search.trim().toLowerCase()));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  const reportBase = safeFilename(REPORT_BASE);
  const exportCSV = useCallback(() => {
    const header = "URL,PAGE\n";
    const body = filteredItems.map((r) => `"${(r.url || "").replace(/"/g, '""')}",${r.pageCount ?? ""}`).join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [filteredItems, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(filteredItems.map((r) => ({ URL: r.url || "", PAGE: r.pageCount ?? "" })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, TITLE);
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [filteredItems, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, { head: [["URL", "PAGE"]], body: filteredItems.map((r) => [r.url || "", String(r.pageCount ?? "")]), startY: 10, styles: { fontSize: 8 } });
    doc.save(`${reportBase}.pdf`);
  }, [filteredItems, reportBase]);

  if (variant === "details") {
    const detailsFiltered = !search.trim() ? DETAILS_SAMPLE : DETAILS_SAMPLE.filter((r) => (r.link || "").toLowerCase().includes(search.trim().toLowerCase()));
    const detailsTotalPages = Math.max(1, Math.ceil(detailsFiltered.length / rowsPerPage));
    const start = (currentPage - 1) * rowsPerPage;
    const detailsPaginated = detailsFiltered.slice(start, start + rowsPerPage);
    return (
      <>
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"><i className={`isax ${ICON} fs-22`} aria-hidden /></span>
                <div><h6 className="mb-0 fw-semibold">{TITLE}</h6><p className="text-muted fs-13 mb-0">{detailsFiltered.length} found</p></div>
              </div>
              <div className="flex-grow-1 flex-md-grow-0" style={{ minWidth: 200, maxWidth: 320 }}><input type="search" className="form-control form-control-sm" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} aria-label={`Search ${TITLE.toLowerCase()}`} /></div>
            </div>
          </div>
        </div>
        <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped table-borderless align-middle mb-0">
                <thead><tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"><th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Link</th><th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Type</th><th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">Response code</th></tr></thead>
                <tbody>{detailsPaginated.map((row) => (<tr key={row.id}><td className="px-4 py-2"><a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none text-break">{row.link}</a></td><td className="px-4 py-2"><span className="badge bg-secondary bg-opacity-25 text-body">{row.type}</span></td><td className="px-4 py-2 text-body">{row.responseCode}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
              <div className="d-flex align-items-center gap-2"><span className="text-muted small">Rows per page</span><select className="form-select form-select-sm" style={{ width: "auto" }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>{ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}</select><span className="text-muted small">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, detailsFiltered.length)} of {detailsFiltered.length}</span></div>
              <nav aria-label={`${TITLE} pagination`}><ul className="pagination pagination-sm mb-0"><li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}><button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">Previous</button></li>{Array.from({ length: detailsTotalPages }, (_, i) => i + 1).map((p) => <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}><button type="button" className="page-link" onClick={() => setCurrentPage(p)}>{p}</button></li>)}<li className={`page-item ${currentPage >= detailsTotalPages ? "disabled" : ""}`}><button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.min(detailsTotalPages, p + 1))} disabled={currentPage >= detailsTotalPages} aria-label="Next">Next</button></li></ul></nav>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4"><div className="d-flex align-items-center gap-2 mb-1"><span className="avatar avatar-40 rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ minWidth: 40, height: 40 }}><i className={`isax ${ICON} fs-4`} aria-hidden /></span><h5 className="mb-0 fw-bold text-body">{TITLE}</h5></div><p className="text-muted small mb-0">{filteredItems.length} results</p></div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <nav className="nav nav-tabs border-0 gap-2 gap-md-4" aria-label={`${TITLE} scope`}><button type="button" className={`nav-link border-0 p-0 pb-2 rounded-0 bg-transparent ${tab === "internal" ? "fw-semibold text-primary border-bottom border-2 border-primary" : "text-muted"}`} style={{ borderBottom: tab === "internal" ? "2px solid var(--bs-primary)" : "2px solid transparent" }} onClick={() => setTab("internal")}>Internal</button><button type="button" className={`nav-link border-0 p-0 pb-2 rounded-0 bg-transparent ${tab === "external" ? "fw-semibold text-primary border-bottom border-2 border-primary" : "text-muted"}`} style={{ borderBottom: tab === "external" ? "2px solid var(--bs-primary)" : "2px solid transparent" }} onClick={() => setTab("external")}>External</button></nav>
        <div className="d-flex align-items-center gap-2 forms-download-report-btn"><DownloadReportDropdown reportBaseName={reportBase} onExportCSV={exportCSV} onExportExcel={exportExcel} onExportPDF={exportPDF} buttonLabel="Download Report" className="btn btn-sm btn-outline-primary rounded-2" /><div className="position-relative" style={{ minWidth: 200, maxWidth: 280 }}><input type="search" className="form-control form-control-sm ps-3 pe-4" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} aria-label={`Search ${TITLE.toLowerCase()}`} /><span className="position-absolute end-0 top-50 translate-middle-y me-2 text-muted" style={{ pointerEvents: "none" }}><i className="isax isax-search-normal small" aria-hidden /></span></div></div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th className="border-0 ps-4 py-3 fw-semibold text-body text-uppercase small">URL</th><th className="border-0 pe-4 py-3 text-end fw-semibold text-body text-uppercase small" style={{ width: 80 }}>PAGE</th></tr></thead><tbody>{paginatedItems.map((row) => (<tr key={row.id}><td className="ps-4 py-3"><a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none text-break">{row.url}</a></td><td className="pe-4 py-3 text-end"><button type="button" className="btn btn-link p-0 border-0 d-flex flex-column align-items-end text-decoration-none" onClick={() => { setSelectedResourceUrl(row.url); setPagesDrawerOpen(true); }} aria-label={`Pages with this CSS (${row.pageCount} page${row.pageCount !== 1 ? "s" : ""})`}><span className="fw-semibold text-primary" style={{ fontSize: "1.125rem" }}>{row.pageCount}</span><span className="text-muted text-uppercase small" style={{ fontSize: "0.7rem" }}>PAGE</span></button></td></tr>))}</tbody></table></div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top"><div className="d-flex align-items-center gap-2"><span className="text-muted small">Rows per page</span><select className="form-select form-select-sm" style={{ width: "auto" }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>{ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}</select></div><span className="text-muted small">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredItems.length)} of {filteredItems.length}</span></div>
        </div>
      </div>
      <PagesWithCssDrawer open={pagesDrawerOpen} onClose={() => { setPagesDrawerOpen(false); setSelectedResourceUrl(null); }} resourceUrl={selectedResourceUrl} onOpenPageDetails={(row) => { setSelectedPageForDetails(row); setPagesDrawerOpen(false); setPageDetailsOpen(true); }} />
      <PageDetailsDrawer open={pageDetailsOpen} onClose={() => { setPageDetailsOpen(false); setSelectedPageForDetails(null); }} page={selectedPageForDetails} defaultTab="inventory" defaultInventorySubView={DEFAULT_INVENTORY_SUB_VIEW} backdropZIndex={1070} panelZIndex={1075} />
    </>
  );
}
