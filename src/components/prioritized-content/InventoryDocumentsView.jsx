import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

// Sample data imports removed as component now receives dynamic items via props
import DocumentDetailsDrawer from "./DocumentDetailsDrawer";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const TABS = [
  { key: "all", label: "All", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "other", label: "Other Documents", icon: "isax-document-copy" },
];

export default function InventoryDocumentsView({ items = [], variant }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [documentDetailsDrawerOpen, setDocumentDetailsDrawerOpen] =
    useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const tabRows = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "pdf")
      return items.filter((r) => (r.link || "").toLowerCase().endsWith(".pdf"));
    return items.filter((r) => !(r.link || "").toLowerCase().endsWith(".pdf"));
  }, [items, activeTab]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return tabRows;
    const q = search.trim().toLowerCase();
    return tabRows.filter((r) => (r.link || "").toLowerCase().includes(q));
  }, [tabRows, search]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "link") return dir * a.link.localeCompare(b.link);
      if (sortBy === "notifications")
        return dir * (a.notifications - b.notifications);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }) => (
    <i
      className={`isax ms-1 fs-12 ${sortBy === column ? (sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
      style={{ opacity: sortBy === column ? 1 : 0.4 }}
      aria-hidden={true}
    />
  );

  const reportBase = safeFilename("Documents-Report");
  const exportCSV = useCallback(() => {
    const header = "Link,Notifications,Views\n";
    const body = sortedRows
      .map(
        (r) => `"${r.link.replace(/"/g, '""')}",${r.notifications},${r.views}`,
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
      sortedRows.map((r) => ({
        Link: r.link,
        Notifications: r.notifications,
        Views: r.views,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documents");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [sortedRows, reportBase]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Link", "Notifications", "Views"]],
      body: sortedRows.map((r) => [
        r.link,
        String(r.notifications),
        String(r.views),
      ]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
      },
    });
    doc.save(`${reportBase}.pdf`);
  }, [sortedRows, reportBase]);

  if (variant === "details") {
    return (
      <>
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                  <i
                    className="isax isax-document-text fs-22"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h6 className="mb-0 fw-semibold">Documents</h6>
                  <p className="text-muted fs-13 mb-0">
                    {sortedRows.length} found
                  </p>
                </div>
              </div>
              <div
                className="flex-grow-1 flex-md-grow-0"
                style={{ minWidth: 200, maxWidth: 320 }}
              >
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search documents"
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
                    <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                      Link
                    </th>
                    <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                      Notifications
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id || Math.random()}>
                      <td className="px-4 py-2">
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none text-break"
                        >
                          {row.link}
                        </a>
                      </td>
                      <td className="px-4 py-2">
                        <span className="badge bg-secondary bg-opacity-25 text-body">
                          {row.notifications || 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-body">{row.views || 0}</td>
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
                  {(currentPage - 1) * rowsPerPage + 1}-
                  {Math.min(currentPage * rowsPerPage, sortedRows.length)} of{" "}
                  {sortedRows.length}
                </span>
              </div>
              <nav aria-label="Documents pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li
                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  >
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <li
                        key={p}
                        className={`page-item ${currentPage === p ? "active" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    ),
                  )}
                  <li
                    className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link"
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
      </>
    );
  }

  return (
    <React.Fragment>
      {
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-3">
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                <i
                  className="isax isax-document-text fs-22"
                  aria-hidden={true}
                />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold text-body">Documents</h6>
                <p className="text-muted fs-13 mb-0">
                  {filteredRows.length}
                  {" content"}
                </p>
              </div>
            </div>
          </div>
        </div>

        /* Tabs + Download + Filter + Search (same layout as HTML Pages) */
      }
      {
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                {TABS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${activeTab === key ? "btn-primary" : "btn-light"}`}
                    onClick={() => {
                      setActiveTab(key);
                      setCurrentPage(1);
                    }}
                  >
                    <i className={`isax ${icon}`} aria-hidden={true} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="d-flex align-items-center gap-2">
                <DownloadReportDropdown
                  reportBaseName={reportBase}
                  onExportCSV={exportCSV}
                  onExportExcel={exportExcel}
                  onExportPDF={exportPDF}
                  variant="icon"
                />
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light"
                  title="Filter"
                  aria-label="Filter"
                >
                  <i
                    className="isax isax-filter text-primary"
                    aria-hidden={true}
                  />
                </button>
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
                    aria-label="Search documents"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        /* Table */
      }
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          {paginatedRows.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-0">Good job! No issues were found</p>
            </div>
          ) : (
            <React.Fragment>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 fw-semibold text-body fs-13">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("link")}
                        >
                          Link
                          <SortIcon column="link" />
                        </button>
                      </th>
                      <th className="py-3 fw-semibold text-body fs-13">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("notifications")}
                        >
                          Notifications
                          <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="py-3 fw-semibold text-body fs-13">
                        <span className="d-inline-flex align-items-center">
                          Views
                          <span className="ms-1 opacity-75" title="View count">
                            <i
                              className="isax isax-info-circle fs-14"
                              aria-hidden={true}
                            />
                          </span>
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                            onClick={() => handleSort("views")}
                          >
                            <SortIcon column="views" />
                          </button>
                        </span>
                      </th>
                      <th
                        className="py-3 pe-4 fw-semibold text-body fs-13 text-end"
                        style={{ width: "100px" }}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="ps-4 py-3">
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-decoration-none text-break"
                          >
                            {row.link}
                          </a>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                            {row.notifications}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-body">{row.views}</span>
                        </td>
                        <td className="py-3 pe-4 text-end">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-primary rounded-2"
                            title="Open document details"
                            aria-label="Open document details"
                            onClick={() => {
                              setSelectedDocument(row);
                              setDocumentDetailsDrawerOpen(true);
                            }}
                          >
                            <i
                              className="isax isax-document-text"
                              aria-hidden={true}
                            />
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
                    {Math.min(currentPage * rowsPerPage, sortedRows.length)}
                    {" of "}
                    {sortedRows.length}
                  </span>
                </div>
                <nav aria-label="Documents pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from(
                      { length: Math.min(totalPages, 10) },
                      (_, i) => {
                        const p =
                          currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
                      },
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
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
      <DocumentDetailsDrawer
        open={documentDetailsDrawerOpen}
        onClose={() => {
          setDocumentDetailsDrawerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </React.Fragment>
    /* Title card: Documents + content count */
  );
}
