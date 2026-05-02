import React, { useState, useMemo, useCallback  } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import ContentWithBrokenLinkDrawer from "./ContentWithBrokenLinkDrawer";
import DocumentsWithBrokenLinkDrawer from "./DocumentsWithBrokenLinkDrawer";

const TABS = [
  { key: "all", label: "All broken images", icon: "isax-image" },
  { key: "ignored", label: "Ignored", icon: "isax-eye-slash" },
  { key: "fixed", label: "Marked as fixed", icon: "isax-tick-circle" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE_ROWS_ALL = [
  {
    id: 1,
    url: "https://www.bajajfinserv.in/content/dam/bajajmall-site/images/DefaultImage%20.png",
    responseCode: "404",
    type: "image",
    documentsCount: 0,
    pagesCount: 2,
  },
  {
    id: 2,
    url: "https://cdn.example.com/assets/hero-banner.jpg",
    responseCode: "404",
    type: "image",
    documentsCount: 1,
    pagesCount: 5,
  },
  {
    id: 3,
    url: "https://www.bajajfinserv.in/content/dam/images/legacy-icon.svg",
    responseCode: "404",
    type: "image",
    documentsCount: 0,
    pagesCount: 12,
  },
];

const SAMPLE_ROWS_IGNORED = [
  {
    id: 101,
    url: "https://legacy.bajajfinserv.in/images/old-logo.png",
    responseCode: "404",
    type: "image",
    documentsCount: 0,
    pagesCount: 3,
  },
];

const SAMPLE_ROWS_FIXED = [
  {
    id: 201,
    url: "https://www.bajajfinserv.in/content/dam/fixed-image.png",
    responseCode: "200",
    type: "image",
    documentsCount: 0,
    pagesCount: 8,
  },
];

export default function BrokenImagesView() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortByUrl, setSortByUrl] = useState(null);
  const [contentDrawerOpen, setContentDrawerOpen] = useState(false);
  const [contentDrawerUrl, setContentDrawerUrl] = useState(null);
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [documentsDrawerUrl, setDocumentsDrawerUrl] = useState(null);

  function openContentDrawer(url) {
    setContentDrawerUrl(url ?? null);
    setContentDrawerOpen(true);
  }

  function openDocumentsDrawer(url) {
    setDocumentsDrawerUrl(url ?? null);
    setDocumentsDrawerOpen(true);
  }

  const rowsByTab = useMemo(() => {
    if (activeTab === "ignored") return SAMPLE_ROWS_IGNORED;
    if (activeTab === "fixed") return SAMPLE_ROWS_FIXED;
    return SAMPLE_ROWS_ALL;
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    let rows = rowsByTab;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.url.toLowerCase().includes(q));
    }
    return rows;
  }, [rowsByTab, search]);

  const sortedRows = useMemo(() => {
    if (!sortByUrl) return filteredRows;
    return [...filteredRows].sort((a, b) =>
      sortByUrl === "asc" ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url)
    );
  }, [filteredRows, sortByUrl]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  function handleSortUrl() {
    setCurrentPage(1);
    setSortByUrl((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
  }

  const reportName = "Broken-Images-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(function() {
    const header = "Broken link,Response code,Type,Documents,Pages\n";
    const body = sortedRows
      .map((r) => `"${r.url.replace(/"/g, '""')}","${r.responseCode}","${r.type}",${r.documentsCount},${r.pagesCount}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async function() {
    const XLSX = await import("xlsx");
    const rows = sortedRows.map((r) => ({
      "Broken link": r.url,
      "Response code": r.responseCode,
      Type: r.type,
      Documents: r.documentsCount,
      Pages: r.pagesCount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Broken Images");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async function() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Broken link", "Response code", "Type", "Documents", "Pages"]];
    const body = sortedRows.map((r) => [
      r.url,
      r.responseCode,
      r.type,
      String(r.documentsCount),
      String(r.pagesCount),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 22 }, 4: { cellWidth: 18 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [sortedRows, baseName]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-image fs-20 text-primary" aria-hidden="true"></i>Broken images
        </h5>
        <p className="text-muted fs-13 mb-0">{sortedRows.length} link{sortedRows.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <nav className="nav nav-tabs border-0 gap-2 gap-md-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${activeTab === tab.key ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
            >
              <i className={`isax ${tab.icon}`} aria-hidden="true"></i>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Download Report"
            >
              <i className="isax isax-document-download text-primary fs-18" aria-hidden="true"></i>Download Report
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportCSV}>
                  <i className="isax isax-document-text me-2" aria-hidden="true"></i>CSV
                </button>
              </li>
              <li>
                <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportPDF}>
                  <i className="isax isax-document-text me-2" aria-hidden="true"></i>PDF
                </button>
              </li>
              <li>
                <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportExcel}>
                  <i className="isax isax-document-text me-2" aria-hidden="true"></i>Excel
                </button>
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center"
            title="Filter"
            aria-label="Filter"
          >
            <i className="isax isax-filter text-primary fs-18" aria-hidden="true"></i>
          </button>
          <div className="position-relative" style={{ width: 240 }}>
            <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
            <input
              type="search"
              className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>
        </div>
      </div>

      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4" style={{ width: 40 }}>
                  <input type="checkbox" className="form-check-input" aria-label="Select all" />
                </th>
                <th className="fw-semibold text-body py-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center gap-1"
                    onClick={handleSortUrl}
                  >
                    Broken link
                    {sortByUrl != null && (
                      <i className={`isax fs-14 ${sortByUrl === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
                    )}
                    {sortByUrl == null && <i className="isax isax-sort fs-14 opacity-50" aria-hidden="true"></i>}
                  </button>
                </th>
                <th className="fw-semibold text-body py-3">Response code</th>
                <th className="fw-semibold text-body py-3">Type</th>
                <th className="fw-semibold text-body py-3 text-center">Documents</th>
                <th className="fw-semibold text-body py-3 text-center">
                  <span className="d-inline-flex align-items-center">Pages
                    <i className="isax isax-arrow-down-1 ms-1 fs-12 opacity-75" aria-hidden="true"></i>
                  </span>
                </th>
                <th className="fw-semibold text-body py-3 pe-4" style={{ width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="ps-4 py-3">
                    <input type="checkbox" className="form-check-input" aria-label={`Select link ${row.id}`} />
                  </td>
                  <td className="py-3">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                      {row.url}
                    </a>
                  </td>
                  <td className="py-3">
                    <span className="text-body">{row.responseCode}</span>
                  </td>
                  <td className="py-3">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">{row.type}</span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-decoration-none"
                      onClick={() => openDocumentsDrawer(row.url)}
                      title="View documents with this broken link"
                    >
                      <span className="text-primary fw-medium">{row.documentsCount}</span>
                    </button>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-decoration-none"
                      onClick={() => openContentDrawer(row.url)}
                      title="View content with this broken link"
                    >
                      <span className="text-primary fw-medium">{row.pagesCount}</span>
                    </button>
                  </td>
                  <td className="py-3 pe-4">
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-light d-inline-flex align-items-center gap-1"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Action
                        <i className="isax isax-arrow-down-1 fs-12" aria-hidden="true"></i>
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
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 bg-body-tertiary bg-opacity-50 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Rows per page</span>
            <select
              className="form-select form-select-sm rounded-2"
              style={{ width: "auto", minWidth: 60 }}
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
              {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}
            </span>
          </div>
          <nav aria-label="Broken images pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">
                  Previous
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                if (p > totalPages) return null;
                return (
                  <li key={p} className="page-item">
                    <button type="button" className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  </li>
                );
              })}
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <ContentWithBrokenLinkDrawer
        open={contentDrawerOpen}
        onClose={() => setContentDrawerOpen(false)}
        sourceUrl={contentDrawerUrl}
        title="Content with Broken Images"
      />
      <DocumentsWithBrokenLinkDrawer
        open={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        sourceUrl={documentsDrawerUrl}
        title="Documents with Broken Images"
      />
    </div>
  );
}

