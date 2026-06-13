import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQaPagesList } from "../../hooks/useQaPagesList";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { downloadBlob, safeFilename } from "../../lib/download";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";

const TABS = [
  { key: "all", label: "All", icon: "isax-folder" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "text", label: "Text Documents", icon: "isax-document-text" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

const TAB_PARAM = "tab";

function toPageDetailsPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

export default function ContentWithBrokenLinksView() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get(TAB_PARAM) || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("notifications");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const apiSortBy =
    sortBy === "notifications"
      ? "issues"
      : sortBy === "title"
        ? "title"
        : "url";
  const {
    rows: apiRows,
    pagination,
    loading,
  } = useQaPagesList({
    filter: "broken-links",
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: apiSortBy,
    sortOrder: sortDir,
    enabled: activeTab === "all" || activeTab === "pages",
  });
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  function openPageDetails(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }

  const sortedRows =
    activeTab === "all" || activeTab === "pages" ? apiRows : [];

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ column }) {
    return (
      <i
        className={`isax ms-1 fs-12 ${sortBy === column ? (sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
        style={{ opacity: sortBy === column ? 1 : 0.4 }}
        aria-hidden="true"
      ></i>
    );
  }

  const totalPages =
    activeTab === "all" || activeTab === "pages" ? pagination.pages || 1 : 1;
  const paginatedRows = sortedRows;

  const reportName = "Content-with-Broken-Links-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Issues Found,Priority\n";
    const body = sortedRows
      .map(
        (r) =>
          `"${(r.title || "").replace(/"/g, '""')}","${(r.url || "").replace(/"/g, '""')}",${r.notifications},"${r.priority}",${r.views}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedRows.map((r) => ({
      Title: r.title,
      URL: r.url,
      "Issues Found": r.notifications,
      Priority: r.priority,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Content with Broken Links");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Issues Found", "Priority"]];
    const body = sortedRows.map((r) => [
      r.title || "",
      r.url || "",
      String(r.notifications),
      r.priority,
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: "wrap" },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [sortedRows, baseName]);

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i
            className="isax isax-document-copy fs-20 text-primary"
            aria-hidden="true"
          ></i>{" "}
          Content with Broken Links
        </h5>
        <p className="text-muted fs-13 mb-0">
          {activeTab === "all"
            ? loading
              ? "Loading…"
              : `${pagination.total ?? sortedRows.length} pages`
            : "—"}
        </p>
      </div>

      {/* Tabs + Download Report + Search in one row */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <nav
          className="nav nav-tabs border-0 gap-2 gap-md-4 mb-0"
          aria-label="Content type filter"
        >
          {TABS.map(({ key, label, icon }) => {
            const isActive = activeTab === key;
            return (
              <Link
                key={key}
                to={`/domain/quality-assurance?view=content-broken-links&${TAB_PARAM}=${key}`}
                className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
              >
                <i className={`isax ${icon}`} aria-hidden="true"></i>
                {label}
              </Link>
            );
          })}
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
              <i
                className="isax isax-document-download text-primary fs-18"
                aria-hidden="true"
              ></i>{" "}
              Download Report
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportCSV}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  ></i>{" "}
                  CSV
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportPDF}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  ></i>{" "}
                  PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                  onClick={exportExcel}
                >
                  <i
                    className="isax isax-document-text me-2"
                    aria-hidden="true"
                  ></i>{" "}
                  Excel
                </button>
              </li>
            </ul>
          </div>
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

      {(activeTab === "pdf" || activeTab === "text") && (
        <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm p-5 text-center text-muted">
          No {activeTab === "pdf" ? "PDF" : "text"} documents with broken links
          in this scan.
        </div>
      )}
      {(activeTab === "all" || activeTab === "pages") && (
        <>
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("title")}
                        >
                          Title and URL
                          <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("notifications")}
                        >
                          Issues Found
                          <SortIcon column="notifications" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body">
                        <span className="d-inline-flex align-items-center">
                          Priority
                          <span
                            className="ms-1 opacity-75"
                            title="Priority level"
                          >
                            <i
                              className="isax isax-info-circle fs-14"
                              aria-hidden="true"
                            ></i>
                          </span>
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                            onClick={() => handleSort("priority")}
                          >
                            <SortIcon column="priority" />
                          </button>
                        </span>
                      </th>
                      <th
                        className="fw-semibold text-body text-end"
                        style={{ width: "100px" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 ps-4">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-primary">
                              {row.title}
                            </span>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted small text-decoration-none d-inline-flex align-items-center mt-1"
                              title="Open in new tab"
                            >
                              <span
                                className="d-inline-flex align-items-center me-1"
                                aria-hidden="true"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-primary"
                                >
                                  <path
                                    d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M15 3h6v6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M10 14L21 3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              {row.url}
                            </a>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                            {row.notifications}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`badge rounded-pill ${row.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : row.priority === "Medium" ? "bg-warning bg-opacity-25 text-dark" : "bg-secondary bg-opacity-10 text-secondary"}`}
                          >
                            {row.priority}
                          </span>
                        </td>

                        <td className="py-3 pe-4 text-end">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2 text-dark"
                            title="Open page details"
                            onClick={() => openPageDetails(row)}
                          >
                            <i
                              className="isax isax-document-text text-primary"
                              aria-hidden="true"
                            ></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2 text-dark ms-1"
                            title="Search"
                          >
                            <i
                              className="isax isax-search-normal-1 text-primary"
                              aria-hidden="true"
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <nav aria-label="Content with broken links pagination">
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

      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toPageDetailsPage(selectedPage) : null}
        defaultTab="qa"
      />
    </div>
  );
}
