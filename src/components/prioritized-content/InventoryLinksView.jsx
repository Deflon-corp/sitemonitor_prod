function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import InventoryPageLinksView from "@/components/prioritized-content/InventoryPageLinksView";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Content types that contain links – replace with API */
const CONTENT_TYPES = [
  {
    key: "text-documents",
    label: "Text documents",
    icon: "isax-document-text",
    total: 0,
  },
  { key: "other-files", label: "Other files", icon: "isax-document", total: 0 },
  { key: "pages", label: "Pages", icon: "isax-document-copy", total: 648 },
  {
    key: "pdf-files",
    label: "PDF files",
    icon: "isax-document-text",
    total: 14,
  },
  { key: "slides", label: "Slides", icon: "isax-presention-chart", total: 0 },
  {
    key: "spreadsheets",
    label: "Spreadsheets",
    icon: "isax-document-copy",
    total: 0,
  },
  {
    key: "archive-files",
    label: "Archive files",
    icon: "isax-archive-book",
    total: 0,
  },
];

const LINKS_SUMMARY_REPORT_BASE = "Links-Summary-Report";

function LinksSummaryView({
  contentTypes,
  onSelectType,
  onTotalClick,
  onExportCSV,
  onExportExcel,
  onExportPDF,
}) {
  const totalLinks = contentTypes.reduce((sum, t) => sum + t.total, 0);

  return (
    <React.Fragment>
      {
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-4">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="avatar avatar-50 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="isax isax-link-2 fs-24" aria-hidden={true} />
                </span>
                <div>
                  <h5 className="mb-1 fw-bold text-body">Links</h5>
                  <p className="text-muted mb-0 small">
                    List of content containing links.
                  </p>
                </div>
              </div>
              <DownloadReportDropdown
                reportBaseName={LINKS_SUMMARY_REPORT_BASE}
                onExportCSV={onExportCSV}
                onExportExcel={onExportExcel}
                onExportPDF={onExportPDF}
                className="btn-primary"
              />
            </div>
          </div>
        </div>

        /* Content types – revamped as clickable cards */
      }
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-header bg-body-tertiary bg-opacity-50 border-bottom border-secondary border-opacity-25 py-3 px-4">
          <div className="d-flex align-items-center justify-content-between text-uppercase fs-12 fw-semibold text-body">
            <span className="text-start">Type</span>
            <span className="text-end" style={{ width: 80 }}>
              Total
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {contentTypes.map((item) => (
              <li
                key={item.key}
                className="list-group-item list-group-item-action border-0 border-bottom border-secondary border-opacity-25 py-3 px-4 d-flex align-items-center justify-content-between"
              >
                <button
                  type="button"
                  className="btn btn-link p-0 border-0 text-start text-decoration-none d-flex align-items-center gap-3 min-w-0"
                  onClick={() => onSelectType(item.key)}
                >
                  <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                    <i
                      className={`isax ${item.icon} fs-20`}
                      aria-hidden={true}
                    />
                  </span>
                  <span className="text-body fw-medium text-truncate">
                    {item.label}
                  </span>
                </button>
                <button
                  type="button"
                  className="badge bg-primary bg-opacity-10 text-primary fs-13 fw-semibold flex-shrink-0 border-0 py-2 px-3 rounded-pill text-end"
                  style={{ width: 80 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTotalClick) onTotalClick(item.key);
                    else onSelectType(item.key);
                  }}
                  aria-label={`${item.label}: ${item.total} links`}
                >
                  {item.total.toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-footer bg-body-tertiary bg-opacity-25 border-top border-secondary border-opacity-25 py-2 px-4">
          <p className="text-muted small mb-0">
            <strong>{totalLinks.toLocaleString()}</strong>
            {
              " total links across all content types. Click a type to view its links."
            }
          </p>
        </div>
      </div>
    </React.Fragment>
    /* Header – revamped */
  );
}

const LINKS_DETAIL_REPORT_BASE = "Links-Report";

function LinksDetailView({ title, internalRows, externalRows, onBack }) {
  const [tab, setTab] = useState("internal");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const rows = tab === "internal" ? internalRows : externalRows;
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.link.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const baseName = safeFilename(
    `${LINKS_DETAIL_REPORT_BASE}-${title.replace(/\s+/g, "-")}`,
  );
  const exportCSV = useCallback(() => {
    const header = "Link,Type,Response code\n";
    const body = filteredRows
      .map(
        (r) =>
          `"${r.link.replace(/"/g, '""')}","${r.type}","${r.responseCode}"`,
      )
      .join("\n");
    downloadBlob(
      new Blob([header + body], { type: "text/csv;charset=utf-8;" }),
      `${baseName}.csv`,
    );
  }, [filteredRows, baseName]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      filteredRows.map((r) => ({
        Link: r.link,
        Type: r.type,
        "Response code": r.responseCode,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Links");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [filteredRows, baseName]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Link", "Type", "Response code"]],
      body: filteredRows.map((r) => [r.link, r.type, r.responseCode]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: 25 },
        2: { cellWidth: 28 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [filteredRows, baseName]);

  return (
    <React.Fragment>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border"
                onClick={onBack}
                aria-label="Back to Links summary"
              >
                <i className="isax isax-arrow-left-2" aria-hidden={true} />
              </button>
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="isax isax-link-2 fs-22" aria-hidden={true} />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold text-body">{title}</h6>
                <p className="text-muted fs-13 mb-0">
                  {filteredRows.length}
                  {" results"}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <DownloadReportDropdown
                reportBaseName={baseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
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
                  aria-label="Search links"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 mb-3 border-bottom border-secondary border-opacity-25">
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
                  <th className="py-3 ps-4 fw-semibold text-body fs-13">
                    Link
                  </th>
                  <th className="py-3 fw-semibold text-body fs-13">Type</th>
                  <th className="py-3 pe-4 fw-semibold text-body fs-13 text-end">
                    Response code
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
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
                      <span className="badge bg-secondary bg-opacity-25 text-body">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 pe-4 text-end text-body">
                      {row.responseCode}
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
            <nav aria-label="Links pagination">
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
    </React.Fragment>
  );
}

export default function InventoryLinksView({
  items = [],
  contentTypes: contentTypesProp = CONTENT_TYPES,
}) {
  const internalRows = useMemo(
    () => items.filter((r) => r.type === "Internal"),
    [items],
  );
  const externalRows = useMemo(
    () => items.filter((r) => r.type === "External" || r.type === "Broken"),
    [items],
  );

  const contentTypes = useMemo(() => {
    return CONTENT_TYPES.map((t) => {
      if (t.key === "pages") return { ...t, total: items.length };
      return t;
    });
  }, [items]);
  const [selectedType, setSelectedType] = useState(null);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);

  useEffect(() => {
    if (!pagesDrawerOpen) return;
    document.body.classList.add("links-drawer-open");
    const handleEscape = (e) => {
      if (e.key === "Escape") setPagesDrawerOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.classList.remove("links-drawer-open");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pagesDrawerOpen]);

  const selectedLabel = selectedType
    ? _nullishCoalesce(
        _optionalChain([
          contentTypes,
          "access",
          (_2) => _2.find,
          "call",
          (_3) => _3((t) => t.key === selectedType),
          "optionalAccess",
          (_4) => _4.label,
        ]),
        () => selectedType,
      )
    : null;

  const baseName = safeFilename(LINKS_SUMMARY_REPORT_BASE);
  const exportSummaryCSV = useCallback(() => {
    const header = "Type,Total\n";
    const body = contentTypes
      .map((t) => `"${t.label.replace(/"/g, '""')}",${t.total}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [contentTypes, baseName]);
  const exportSummaryExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = contentTypes.map((t) => ({ Type: t.label, Total: t.total }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Links Summary");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [contentTypes, baseName]);
  const exportSummaryPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const head = [["Type", "Total"]];
    const body = contentTypes.map((t) => [t.label, String(t.total)]);
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 10 } });
    doc.save(`${baseName}.pdf`);
  }, [contentTypes, baseName]);

  const handleTotalClick = (key) => {
    if (key === "pages") setPagesDrawerOpen(true);
    else setSelectedType(key);
  };

  /** Clicking "Pages" row or 648 badge opens the drawer (not in-page view). */
  const handleSelectType = (key) => {
    if (key === "pages") setPagesDrawerOpen(true);
    else setSelectedType(key);
  };

  if (selectedType && selectedLabel) {
    return (
      <LinksDetailView
        title={selectedLabel}
        internalRows={internalRows}
        externalRows={externalRows}
        onBack={() => setSelectedType(null)}
      />
    );
  }

  const drawerContent = pagesDrawerOpen && (
    <React.Fragment>
      <div
        className="links-drawer-backdrop position-fixed top-0 start-0 end-0 bottom-0"
        aria-hidden={true}
        onClick={() => setPagesDrawerOpen(false)}
      />
      <div
        className="links-drawer-panel bg-white position-fixed top-0 end-0 bottom-0 overflow-auto d-flex flex-column"
        role="dialog"
        aria-modal="true"
        aria-label="Page links"
      >
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-icon btn-sm btn-light border"
            onClick={() => setPagesDrawerOpen(false)}
            aria-label="Close"
          >
            <i
              className="isax isax-close-circle fs-20 text-body"
              aria-hidden={true}
            />
          </button>
          <div>
            <h5
              id="page-links-drawer-title"
              className="mb-0 fw-semibold text-body"
            >
              Page links
            </h5>
            <p className="text-muted small mb-0 mt-1">
              {_nullishCoalesce(
                _optionalChain([
                  contentTypes,
                  "access",
                  (_5) => _5.find,
                  "call",
                  (_6) => _6((t) => t.key === "pages"),
                  "optionalAccess",
                  (_7) => _7.total,
                ]),
                () => 0,
              ).toLocaleString()}
              {" results"}
            </p>
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto">
          <InventoryPageLinksView
            onBack={() => setPagesDrawerOpen(false)}
            downloadDropup={true}
          />
        </div>
      </div>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <LinksSummaryView
        contentTypes={contentTypes}
        onSelectType={handleSelectType}
        onTotalClick={handleTotalClick}
        onExportCSV={exportSummaryCSV}
        onExportExcel={exportSummaryExcel}
        onExportPDF={exportSummaryPDF}
      />
      {pagesDrawerOpen && createPortal(drawerContent, document.body)}
    </React.Fragment>
  );
}
