import React, { useState, useMemo, useCallback, useEffect } from "react";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import ContentWithBrokenLinkDrawer from "./ContentWithBrokenLinkDrawer";
import DocumentsWithBrokenLinkDrawer from "./DocumentsWithBrokenLinkDrawer";
import { useQaBrokenLinks } from "../../hooks/useQaBrokenLinks";

const TABS = [
  { key: "all", label: "All broken links", icon: "isax-link-2" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "ignored", label: "Ignored", icon: "isax-eye-slash" },
  { key: "fixed", label: "Marked as fixed", icon: "isax-tick-circle" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

export default function BrokenLinksView() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortByUrl, setSortByUrl] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const apiTab = activeTab === "pages" ? "all" : activeTab;
  const { links, pagination, loading } = useQaBrokenLinks({
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: sortByUrl ? "url" : "pages",
    sortOrder: sortByUrl || "desc",
    tab: apiTab,
  });
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

  const sortedRows = links;
  const paginatedRows = links;
  const totalPages = pagination.pages || 1;
  const totalCount = pagination.total ?? links.length;

  function handleSortUrl() {
    setCurrentPage(1);
    setSortByUrl((prev) =>
      prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
    );
  }

  const reportName = "Broken-Links-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(
    function () {
      const header = "Broken link,Response code,Type,Documents,Pages\n";
      const body = sortedRows
        .map(
          (r) =>
            `"${r.url.replace(/"/g, '""')}","${r.responseCode}","${r.type}",${r.documentsCount},${r.pagesCount}`,
        )
        .join("\n");
      const blob = new Blob([header + body], {
        type: "text/csv;charset=utf-8;",
      });
      downloadBlob(blob, `${baseName}.csv`);
    },
    [sortedRows, baseName],
  );

  const exportExcel = useCallback(
    async function () {
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
      XLSX.utils.book_append_sheet(wb, ws, "Broken Links");
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    },
    [sortedRows, baseName],
  );

  const exportPDF = useCallback(
    async function () {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape" });
      const head = [
        ["Broken link", "Response code", "Type", "Documents", "Pages"],
      ];
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
        columnStyles: {
          0: { cellWidth: "wrap" },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 22 },
          4: { cellWidth: 18 },
        },
      });
      doc.save(`${baseName}.pdf`);
    },
    [sortedRows, baseName],
  );

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i
            className="isax isax-link-2 fs-20 text-primary"
            aria-hidden="true"
          ></i>
          Broken links
        </h5>
        <p className="text-muted fs-13 mb-0">
          {loading ? "Loading…" : `${totalCount} links`}
        </p>
      </div>

      {/* Tabs + Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <nav className="nav nav-tabs border-0 gap-2 gap-md-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${activeTab === tab.key ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
            >
              <i className={`isax ${tab.icon}`} aria-hidden="true"></i>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="d-flex align-items-center gap-2">
          <DownloadReportDropdown
            reportBaseName={baseName}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            className="border border-secondary border-opacity-25 rounded-2"
          />
          <div className="position-relative" style={{ width: 240 }}>
            <i
              className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
              style={{ fontSize: "1rem" }}
              aria-hidden="true"
            ></i>
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

      {activeTab === "pages" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold text-body mb-3">Pages options</h6>
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="btn btn-sm bg-transparent border border-secondary border-opacity-25 text-dark rounded-2 text-start d-flex align-items-center gap-2 py-2"
                onClick={() => openContentDrawer()}
              >
                <i
                  className="isax isax-document-text text-primary fs-18"
                  aria-hidden="true"
                ></i>
                <span>Content with Broken Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {(activeTab === "all" ||
        activeTab === "ignored" ||
        activeTab === "fixed") && (
        <>
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover table-striped table-borderless align-middle mb-0">
                <thead>
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="py-3 ps-4" style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="fw-semibold text-body py-3">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center gap-1"
                        onClick={handleSortUrl}
                      >
                        Broken link URL
                        {sortByUrl != null && (
                          <i
                            className={`isax fs-14 ${sortByUrl === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                            aria-hidden="true"
                          ></i>
                        )}
                        {sortByUrl == null && (
                          <i
                            className="isax isax-sort fs-14 opacity-50"
                            aria-hidden="true"
                          ></i>
                        )}
                      </button>
                    </th>
                    <th className="fw-semibold text-body py-3">HTTP status</th>
                    <th className="fw-semibold text-body py-3">Link type</th>
                    <th className="fw-semibold text-body py-3 text-center">
                      Documents
                    </th>
                    <th className="fw-semibold text-body py-3 text-center">
                      <span className="d-inline-flex align-items-center">
                        Pages affected
                        <i
                          className="isax isax-arrow-down-1 ms-1 fs-12 opacity-75"
                          aria-hidden="true"
                        ></i>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        Loading broken links…
                      </td>
                    </tr>
                  )}
                  {!loading && paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        No broken links found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="ps-4 py-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            aria-label={`Select link ${row.id}`}
                          />
                        </td>
                        <td className="py-3">
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-decoration-none"
                          >
                            {row.url}
                          </a>
                        </td>
                        <td className="py-3">
                          <span className="text-body">{row.responseCode}</span>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-decoration-none"
                            onClick={() => openDocumentsDrawer(row.url)}
                            title="View documents with this broken link"
                          >
                            <span className="text-primary fw-medium">
                              {row.documentsCount}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-decoration-none"
                            onClick={() => openContentDrawer(row.url)}
                            title="View content with this broken link"
                          >
                            <span className="text-primary fw-medium">
                              {row.pagesCount}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 pe-4">
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-sm bg-transparent border border-secondary border-opacity-25 text-dark rounded-2 d-inline-flex align-items-center gap-1"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              Action
                              <i
                                className="isax isax-arrow-down-1 fs-12"
                                aria-hidden="true"
                              ></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button type="button" className="dropdown-item">
                                  Ignore
                                </button>
                              </li>
                              <li>
                                <button type="button" className="dropdown-item">
                                  Mark as fixed
                                </button>
                              </li>
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
              <nav aria-label="Broken links pagination">
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
        </>
      )}

      <ContentWithBrokenLinkDrawer
        open={contentDrawerOpen}
        onClose={() => setContentDrawerOpen(false)}
        sourceUrl={contentDrawerUrl}
      />
      <DocumentsWithBrokenLinkDrawer
        open={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        sourceUrl={documentsDrawerUrl}
      />
    </div>
  );
}
