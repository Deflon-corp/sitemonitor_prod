import React, { useState, useMemo, useCallback } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const LANGUAGES = [
  { key: "all", label: "All" },
  { key: "id-ID", label: "Indonesian (Indonesia)" },
  { key: "en-AU", label: "English (Australian)" },
];

export const POTENTIAL_MISSPELLINGS_SAMPLE = [
  { id: 1, word: "drawdown", language: "English (Australian)", dateFound: "2025-01-15", pages: 2 },
  { id: 2, word: "Finserv", language: "English (Australian)", dateFound: "2025-01-14", pages: 499 },
  { id: 3, word: "Flexi", language: "English (Australian)", dateFound: "2025-01-13", pages: 498 },
  { id: 4, word: "Sonalika", language: "English (Australian)", dateFound: "2025-01-12", pages: 497 },
  { id: 5, word: "Swaraj", language: "English (Australian)", dateFound: "2025-01-11", pages: 496 },
  { id: 6, word: "Eicher", language: "English (Australian)", dateFound: "2025-01-10", pages: 495 },
  { id: 7, word: "Kubota", language: "English (Australian)", dateFound: "2025-01-09", pages: 494 },
  { id: 8, word: "Powertrac", language: "English (Australian)", dateFound: "2025-01-08", pages: 493 },
  { id: 9, word: "Farmtrac", language: "English (Australian)", dateFound: "2025-01-07", pages: 492 },
  { id: 10, word: "Robotouch", language: "English (Australian)", dateFound: "2025-01-06", pages: 491 },
  { id: 11, word: "Sparnod", language: "English (Australian)", dateFound: "2025-01-05", pages: 490 },
  { id: 12, word: "Insta", language: "English (Australian)", dateFound: "2025-01-04", pages: 489 },
  { id: 13, word: "Goibibo", language: "English (Australian)", dateFound: "2025-01-03", pages: 488 },
  { id: 14, word: "IRCTC", language: "English (Australian)", dateFound: "2025-01-02", pages: 487 },
  { id: 15, word: "recieve", language: "English (Australian)", dateFound: "2025-01-01", pages: 386 },
];

const PotentialMisspellingsSection = ({
  items = POTENTIAL_MISSPELLINGS_SAMPLE,
  onOpenIssue,
  onOpenPageDetails,
  onConfirmMisspelling,
}) => {
  const [languageFilter, setLanguageFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [confirmMisspellingId, setConfirmMisspellingId] = useState(null);

  const languageCount = useCallback(
    (key) => {
      if (key === "all") return items.length;
      const langLabel = LANGUAGES.find((l) => l.key === key)?.label || "";
      return items.filter((r) => r.language === langLabel).length;
    },
    [items]
  );

  const filteredItems = useMemo(() => {
    let list = items;
    if (languageFilter !== "all") {
      const langLabel = LANGUAGES.find((l) => l.key === languageFilter)?.label || "";
      list = list.filter((r) => r.language === langLabel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.word.toLowerCase().includes(q));
    }
    return list;
  }, [items, languageFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredItems].sort((a, b) => {
      if (sortBy === "word") return dir * (a.word.localeCompare(b.word) || a.id - b.id);
      return dir * (a.pages - b.pages);
    });
  }, [filteredItems, sortBy, sortDir]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "word" ? "asc" : "desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, currentPage, rowsPerPage]);

  const wordCountLabel = filteredItems.length === 1 ? "1 word found" : `${filteredItems.length} words found`;

  const reportName = "Potential-Misspellings-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Word,Language,Date found,Pages\n";
    const body = items
      .map((r) => `"${r.word.replace(/"/g, '""')}","${r.language.replace(/"/g, '""')}","${r.dateFound}",${r.pages}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [items, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = items.map((r) => ({ Word: r.word, Language: r.language, "Date found": r.dateFound, Pages: r.pages }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Potential Misspellings");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [items, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Word", "Language", "Date found", "Pages"]];
    const body = items.map((r) => [r.word, r.language, r.dateFound, String(r.pages)]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: "wrap" }, 2: { cellWidth: 24 }, 3: { cellWidth: 18 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [items, baseName]);

  return (
    <>
      <div className="d-flex flex-column h-100">
        <div className="mb-3">
          <h5 className="mb-1 fw-semibold text-body">Potential Misspellings</h5>
          <p className="text-muted fs-13 mb-0">{wordCountLabel}</p>
        </div>

        {/* Tabs + Download Report + Search in one line only */}
        <div className="d-flex flex-nowrap align-items-center justify-content-between gap-3 mb-4">
          <nav className="nav nav-tabs border-0 gap-2 gap-md-4 mb-0 flex-shrink-0" aria-label="Language filter">
            {LANGUAGES.map((lang) => {
              const isActive = languageFilter === lang.key;
              const count = languageCount(lang.key);
              return (
                <button
                  key={lang.key}
                  type="button"
                  className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${
                    isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"
                  }`}
                  onClick={() => {
                    setLanguageFilter(lang.key);
                    setCurrentPage(1);
                  }}
                >
                  <i className="isax isax-edit-2" aria-hidden="true" />
                  {lang.label}
                  {lang.key !== "all" && <span className="text-muted">({count})</span>}
                </button>
              );
            })}
          </nav>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Download Report"
              >
                <i className="isax isax-document-download text-primary fs-18" aria-hidden="true" />
                Download Report
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                    onClick={exportCSV}
                  >
                    <i className="isax isax-document-text me-2" aria-hidden="true" />
                    CSV
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                    onClick={exportPDF}
                  >
                    <i className="isax isax-document-text me-2" aria-hidden="true" />
                    PDF
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                    onClick={exportExcel}
                  >
                    <i className="isax isax-document-text me-2" aria-hidden="true" />
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
              />
              <input
                type="search"
                className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
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
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold text-nowrap" style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input" aria-label="Select all" />
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("word")}
                    >
                      Word
                      {sortBy === "word" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">Lookup in Google</th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">Language</th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">Confirm</th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("pages")}
                    >
                      Pages
                      {sortBy === "pages" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold text-nowrap">Open page details</th>
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold text-end text-nowrap" style={{ width: 100 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <input type="checkbox" className="form-check-input" aria-label={`Select ${row.word}`} />
                    </td>
                    <td className="py-3 fw-medium text-body">{row.word}</td>
                    <td className="py-3">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(row.word)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                        title="Lookup in Google"
                        aria-label={`Lookup ${row.word} in Google`}
                      >
                        <span className="fw-bold">G</span>
                      </a>
                    </td>
                    <td className="py-3 text-body fs-13">{row.language}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 border-0 bg-transparent text-primary text-decoration-none"
                        onClick={() => setConfirmMisspellingId(row.id)}
                      >
                        Confirm misspelling
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-primary">{row.pages.toLocaleString()}</span>
                        <span className="text-muted small">{row.pages === 1 ? "PAGE" : "PAGES"}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary"
                        title="Open page details"
                        onClick={() => onOpenPageDetails?.()}
                        aria-label="Open page details"
                      >
                        <i className="isax isax-document-text fs-18" aria-hidden="true" />
                      </button>
                    </td>
                    <td className="py-3 pe-4 text-end">
                      <div className="dropdown d-inline-block">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle py-1 px-2"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title="Action"
                        >
                          Action <i className="isax isax-arrow-down-1 ms-1 fs-12" aria-hidden="true" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button type="button" className="dropdown-item">
                              Ignore
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
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
                {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedItems.length)} of{" "}
                {sortedItems.length}
              </span>
            </div>
            <nav aria-label="Potential misspellings pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
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
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {confirmMisspellingId != null && (
        <>
          <div
            className="position-fixed top-0 start-0 end-0 bottom-0 opacity-75"
            style={{ backgroundColor: "#000", zIndex: 1040 }}
            aria-hidden="true"
            onClick={() => setConfirmMisspellingId(null)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-misspelling-modal-title"
            style={{ backgroundColor: "transparent", zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
              <div className="modal-content border-0 rounded-3 shadow-lg overflow-hidden position-relative">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light rounded-circle position-absolute end-0 p-1 mt-2 me-3"
                  style={{ zIndex: 1, top: 0 }}
                  aria-label="Close"
                  onClick={() => setConfirmMisspellingId(null)}
                >
                  <i className="isax isax-close-circle fs-20 text-muted" />
                </button>
                <div className="modal-header border-0 pt-4 px-4 pb-0 pe-5">
                  <p
                    className="modal-title mb-0 text-body fw-medium lh-base"
                    id="confirm-misspelling-modal-title"
                    style={{ lineHeight: "1.5", fontSize: "1.125rem" }}
                  >
                    Are you sure you want to confirm this misspelling?
                  </p>
                </div>
                <hr className="mx-4 mt-3 mb-0 text-muted opacity-25" />
                <div className="modal-footer border-0 pt-3 pb-4 px-4 justify-content-end gap-2 bg-transparent">
                  <button
                    type="button"
                    className="btn btn-light border px-3 py-2 rounded-2"
                    onClick={() => setConfirmMisspellingId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-2 rounded-2"
                    onClick={() => {
                      onConfirmMisspelling?.(confirmMisspellingId);
                      setConfirmMisspellingId(null);
                    }}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PotentialMisspellingsSection;
