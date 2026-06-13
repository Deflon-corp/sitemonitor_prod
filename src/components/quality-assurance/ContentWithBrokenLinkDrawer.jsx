import React, { useState, useMemo, useEffect, useCallback } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import { getQaBrokenLinkPagesApi } from "../../api/qaApi";
import { useQaDomainId } from "../../hooks/useQaDomainId";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

export default function ContentWithBrokenLinkDrawer({
  open,
  onClose,
  sourceUrl = null,
  title: titleProp,
}) {
  const [search, setSearch] = useState("");
  const drawerTitle = titleProp ?? "Content with Broken Link";
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const domainId = useQaDomainId();
  const [rows, setRows] = useState([]);
  const displayUrl = sourceUrl ?? "";

  useEffect(() => {
    if (!open || !domainId || !sourceUrl) {
      setRows([]);
      return;
    }
    getQaBrokenLinkPagesApi(domainId, sourceUrl).then((res) => {
      if (res.success) {
        setRows(
          (res.data?.pages || []).map((p, i) => ({
            id: p.id || String(i + 1),
            title: p.title,
            url: p.url,
            priority: p.priority || "Medium",
            views: p.views || 0,
          })),
        );
      }
    });
  }, [open, domainId, sourceUrl]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
    );
  }, [search, rows]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir * (a.title.localeCompare(b.title) || a.url.localeCompare(b.url))
        );
      if (sortBy === "priority")
        return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  const reportName = "Content-with-Broken-Link-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(
    function () {
      const header = "Title,URL,Priority\n";
      const body = sortedRows
        .map(
          (r) =>
            `"${r.title.replace(/"/g, '""')}","${r.url.replace(/"/g, '""')}","${r.priority}",${r.views}`,
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
        Title: r.title,
        URL: r.url,
        Priority: r.priority,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Content");
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    },
    [sortedRows, baseName],
  );

  const exportPDF = useCallback(
    async function () {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape" });
      const head = [["Title", "URL", "Priority"]];
      const body = sortedRows.map((r) => [r.title, r.url, r.priority]);
      autoTable(doc, {
        head,
        body,
        startY: 10,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: "wrap" },
          1: { cellWidth: "wrap" },
          2: { cellWidth: 22 },
          3: { cellWidth: 18 },
        },
      });
      doc.save(`${baseName}.pdf`);
    },
    [sortedRows, baseName],
  );

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSearch("");
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  function SortIcon({ column }) {
    return (
      <i
        className={`isax ms-1 fs-12 ${sortBy === column ? (sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1") : "isax-arrow-down-1"}`}
        style={{ opacity: sortBy === column ? 1 : 0.5 }}
        aria-hidden="true"
      ></i>
    );
  }

  return (
    <>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: 1050 }}
        aria-hidden="true"
        onClick={onClose}
      ></div>
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow overflow-hidden d-flex flex-column"
        style={{ zIndex: 1055, width: "min(100%, 900px)", maxWidth: "900px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-with-broken-link-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start gap-3 justify-content-between flex-wrap">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light flex-shrink-0"
                title="Close"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <i
                  className="isax isax-close-square fs-20"
                  aria-hidden="true"
                ></i>
              </button>
              <div className="min-w-0">
                <h5
                  id="content-with-broken-link-drawer-title"
                  className="mb-1 fw-semibold text-body"
                >
                  {drawerTitle}
                </h5>
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                  title="Open in new tab"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary flex-shrink-0"
                    aria-hidden="true"
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
                  <span
                    className="text-truncate d-inline-block"
                    style={{ maxWidth: "100%" }}
                  >
                    {displayUrl}
                  </span>
                </a>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
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
                  ></i>
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
                      ></i>
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
                      ></i>
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
                      ></i>
                      Excel
                    </button>
                  </li>
                </ul>
              </div>
              <div className="position-relative" style={{ width: 200 }}>
                <i
                  className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
                  style={{ fontSize: "0.875rem" }}
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
                  style={{ paddingLeft: "2rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-grow-1 overflow-auto p-4">
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-3 ps-4">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("title")}
                        >
                          Title and URL <SortIcon column="title" />
                        </button>
                      </th>
                      <th className="fw-semibold text-body py-3">
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                          onClick={() => handleSort("priority")}
                        >
                          Priority <SortIcon column="priority" />
                        </button>
                      </th>
                      <th
                        className="fw-semibold text-body py-3 pe-4"
                        style={{ width: 100 }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 ps-4">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-body">
                              {row.title}
                            </span>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mt-1"
                              title="Open in new tab"
                            >
                              <span
                                className="d-inline-flex text-primary"
                                aria-hidden="true"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
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
                          <span
                            className={`badge rounded-pill ${
                              row.priority === "High"
                                ? "bg-danger bg-opacity-10 text-danger"
                                : row.priority === "Medium"
                                  ? "bg-warning bg-opacity-25 text-dark"
                                  : "bg-primary bg-opacity-10 text-primary"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>

                        <td className="py-3 pe-4">
                          <div className="d-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light"
                              title="Open page details"
                            >
                              <i
                                className="isax isax-document-text text-primary"
                                aria-hidden="true"
                              ></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light"
                              title="Search"
                            >
                              <i
                                className="isax isax-search-normal-1 text-primary"
                                aria-hidden="true"
                              ></i>
                            </button>
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
                <nav aria-label="Content with broken link pagination">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
