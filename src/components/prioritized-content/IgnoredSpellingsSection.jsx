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
import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const LANGUAGES = [
  { key: "all", label: "All" },
  { key: "id-ID", label: "Indonesian (Indonesia)" },
  { key: "en-AU", label: "English (Australian)" },
];

export const IGNORED_SPELLINGS_SAMPLE = [
  {
    id: 1,
    word: "teh",
    language: "English (Australian)",
    dateFound: "2025-01-14",
  },
  {
    id: 2,
    word: "recieve",
    language: "English (Australian)",
    dateFound: "2025-01-13",
  },
  {
    id: 3,
    word: "occured",
    language: "Indonesian (Indonesia)",
    dateFound: "2025-01-12",
  },
];

export default function IgnoredSpellingsSection({
  items = IGNORED_SPELLINGS_SAMPLE,
  onOpenIssue,
  variant = "default",
  hideDetailsColumn = false,
}) {
  const [languageFilter, setLanguageFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (languageFilter === "all") return items;
    const langLabel = _nullishCoalesce(
      _optionalChain([
        LANGUAGES,
        "access",
        (_2) => _2.find,
        "call",
        (_3) => _3((l) => l.key === languageFilter),
        "optionalAccess",
        (_4) => _4.label,
      ]),
      () => "",
    );
    return items.filter((r) => r.language === langLabel);
  }, [items, languageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  const wordCountLabel =
    filteredItems.length === 1
      ? "1 word found"
      : `${filteredItems.length} words found`;

  const reportName = "Ignored-Spellings-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Word,Language,Date found\n";
    const body = items
      .map(
        (r) =>
          `"${r.word.replace(/"/g, '""')}","${r.language.replace(/"/g, '""')}","${r.dateFound}"`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [items, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = items.map((r) => ({
      Word: r.word,
      Language: r.language,
      "Date found": r.dateFound,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ignored Spellings");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [items, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Word", "Language", "Date found"]];
    const body = items.map((r) => [r.word, r.language, r.dateFound]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: "wrap" },
        2: { cellWidth: 24 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [items, baseName]);

  return (
    <React.Fragment>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body pb-0">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
              <i className="isax isax-edit-2 fs-22" />
            </span>
            <div>
              <h6 className="mb-0 fw-semibold">Ignored spellings</h6>
              <p className="text-muted fs-13 mb-0">{wordCountLabel}</p>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 border-bottom">
            <div className="nav nav-tabs border-0 gap-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  className={`nav-link border-0 px-0 pb-2 border-bottom border-2 fw-medium d-inline-flex align-items-center gap-1 ${
                    languageFilter === lang.key
                      ? "border-primary text-primary"
                      : "border-transparent text-body"
                  }`}
                  onClick={() => setLanguageFilter(lang.key)}
                >
                  <i className="isax isax-edit-2 fs-16" />
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <DownloadReportDropdown
                reportBaseName={baseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
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
                  <th className="fw-semibold text-body py-3">Word</th>
                  <th className="fw-semibold text-body py-3">
                    Lookup in Google
                  </th>
                  {variant === "default" && (
                    <React.Fragment>
                      <th
                        className="fw-semibold text-body py-3 text-center"
                        style={{ width: 100 }}
                      >
                        Details
                      </th>
                      <th className="py-3 pe-4" style={{ width: 120 }} />
                    </React.Fragment>
                  )}
                  {variant === "page" && (
                    <React.Fragment>
                      <th
                        className="fw-semibold text-body py-3 text-nowrap text-center"
                        style={{ width: "auto", minWidth: 120 }}
                      >
                        Open issue page
                      </th>
                      {!hideDetailsColumn && (
                        <th
                          className="py-3 pe-4 fw-semibold text-body"
                          style={{ width: 80 }}
                        >
                          Details
                        </th>
                      )}
                    </React.Fragment>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td className="ps-4 py-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-label={`Select ${row.word}`}
                      />
                    </td>
                    <td className="py-2 fw-medium">{row.word}</td>
                    <td className="py-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(row.word)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon btn-sm btn-light text-primary"
                        title="Lookup in Google"
                        aria-label={`Lookup ${row.word} in Google`}
                      >
                        <span className="fw-bold">G</span>
                      </a>
                    </td>
                    {variant === "default" && (
                      <React.Fragment>
                        <td className="py-2">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-link text-primary p-0 border-0 bg-transparent text-decoration-none"
                            title="Open issue page"
                            onClick={() =>
                              _optionalChain([
                                onOpenIssue,
                                "optionalCall",
                                (_5) => _5(row.id),
                              ])
                            }
                          >
                            <i className="isax isax-info-circle fs-20" />
                          </button>
                        </td>
                        <td className="py-2 pe-4">
                          <div className="dropdown d-inline-block">
                            <button
                              type="button"
                              className="btn btn-sm btn-light dropdown-toggle py-1"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title="Action"
                            >
                              {"Action "}
                              <i className="isax isax-arrow-down-1 ms-1" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button type="button" className="dropdown-item">
                                  Remove from ignored
                                </button>
                              </li>
                              <li>
                                <button type="button" className="dropdown-item">
                                  Add to dictionary
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </React.Fragment>
                    )}
                    {variant === "page" && (
                      <React.Fragment>
                        <td className="py-2 pe-2 text-center align-middle">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary"
                            title="Open ignored spelling page"
                            onClick={() =>
                              _optionalChain([
                                onOpenIssue,
                                "optionalCall",
                                (_6) => _6(row.id),
                              ])
                            }
                            aria-label="Open ignored spelling page"
                          >
                            <i className="isax isax-info-circle fs-18" />
                          </button>
                        </td>
                        <td className="py-2 pe-4">
                          <div className="dropdown d-inline-block">
                            <button
                              type="button"
                              className="btn btn-sm btn-light dropdown-toggle py-1"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title="Action"
                            >
                              {"Action "}
                              <i className="isax isax-arrow-down-1 ms-1" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button type="button" className="dropdown-item">
                                  Remove from ignored
                                </button>
                              </li>
                              <li>
                                <button type="button" className="dropdown-item">
                                  Add to dictionary
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                        {!hideDetailsColumn && (
                          <td className="py-2 pe-4">
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary"
                              title="Details"
                              onClick={() =>
                                _optionalChain([
                                  onOpenIssue,
                                  "optionalCall",
                                  (_7) => _7(row.id),
                                ])
                              }
                              aria-label={`Details for ${row.word}`}
                            >
                              <i className="isax isax-search-normal-1 fs-18" />
                            </button>
                          </td>
                        )}
                      </React.Fragment>
                    )}
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
                {Math.min(currentPage * rowsPerPage, filteredItems.length)}
                {" of "}
                {filteredItems.length}
              </span>
            </div>
            <nav aria-label="Ignored spellings pagination">
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
    </React.Fragment>
  );
}
