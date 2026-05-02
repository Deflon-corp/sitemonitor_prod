import React, { useState, useMemo, useCallback } from "react";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const LANGUAGES = [
  { key: "all", label: "All" },
  { key: "id-ID", label: "Indonesian (Indonesia)" },
  { key: "en-AU", label: "English (Australian)" },
];

export const DICTIONARY_SAMPLE = [
  { id: 1, word: "upto", language: "English (Australian)", dateAdded: "2025-01-15", pages: 12 },
  { id: 2, word: "IRDAI", language: "English (Australian)", dateAdded: "2025-01-14", pages: 8 },
  { id: 3, word: "color", language: "English (Australian)", dateAdded: "2025-01-13", pages: 2 },
  { id: 4, word: "labor", language: "English (Australian)", dateAdded: "2025-01-12", pages: 1 },
  { id: 5, word: "customise", language: "English (Australian)", dateAdded: "2025-01-11", pages: 5 },
];

const DictionarySection = ({
  items = DICTIONARY_SAMPLE,
  onOpenIssue,
  variant = "default",
  hideDetailsColumn = false,
}) => {
  const [languageFilter, setLanguageFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filteredItems = useMemo(() => {
    let list = items;
    if (languageFilter !== "all") {
      const langLabel = LANGUAGES.find((l) => l.key === languageFilter)?.label ?? "";
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

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir(key === "word" ? "asc" : "desc"); }
  };

  const wordCountLabel = filteredItems.length === 1 ? "1 word found" : `${filteredItems.length} words found`;
  const languageCount = useCallback((key) => {
    if (key === "all") return items.length;
    const langLabel = LANGUAGES.find((l) => l.key === key)?.label ?? "";
    return items.filter((r) => r.language === langLabel).length;
  }, [items]);

  const baseName = safeFilename("Dictionary-Report");

  const exportCSV = useCallback(() => {
    const header = "Word,Language,Date added,Pages\n";
    const body = items.map((r) => `"${r.word.replace(/"/g, '""')}","${r.language.replace(/"/g, '""')}","${r.dateAdded}",${r.pages}`).join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${baseName}.csv`);
  }, [items, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = items.map((r) => ({ Word: r.word, Language: r.language, "Date added": r.dateAdded, Pages: r.pages }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [items, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, { head: [["Word", "Language", "Date added", "Pages"]], body: items.map((r) => [r.word, r.language, r.dateAdded, String(r.pages)]), startY: 10, styles: { fontSize: 8 } });
    doc.save(`${baseName}.pdf`);
  }, [items, baseName]);

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <h5 className="mb-1 fw-semibold text-body">Dictionary</h5>
        <p className="text-muted fs-13 mb-0">{wordCountLabel}</p>
      </div>

      <div className="d-flex flex-nowrap align-items-center justify-content-between gap-3 mb-4">
        <nav className="nav nav-tabs border-0 gap-2 gap-md-4 mb-0 flex-shrink-0" aria-label="Language filter">
          {LANGUAGES.map((lang) => {
            const isActive = languageFilter === lang.key;
            return (
              <button key={lang.key} type="button"
                className={`nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`}
                onClick={() => { setLanguageFilter(lang.key); setCurrentPage(1); }}
              >
                <i className="isax isax-book-1" aria-hidden="true" />
                {lang.label}
                {lang.key !== "all" && <span className="text-muted">({languageCount(lang.key)})</span>}
              </button>
            );
          })}
        </nav>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <div className="dropdown">
            <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false" title="Download Report">
              <i className="isax isax-document-download text-primary fs-18" aria-hidden="true" /> Download Report
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportCSV}><i className="isax isax-document-text me-2" aria-hidden="true" /> CSV</button></li>
              <li><button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportPDF}><i className="isax isax-document-text me-2" aria-hidden="true" /> PDF</button></li>
              <li><button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportExcel}><i className="isax isax-document-text me-2" aria-hidden="true" /> Excel</button></li>
            </ul>
          </div>
          <div className="position-relative" style={{ width: 240 }}>
            <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" style={{ fontSize: "1rem" }} aria-hidden="true" />
            <input type="search" className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2" placeholder="Search..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} aria-label="Search" style={{ paddingLeft: "2.25rem" }} />
          </div>
        </div>
      </div>

      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fs-13 fw-semibold" style={{ width: 40 }}><input type="checkbox" className="form-check-input" aria-label="Select all" /></th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("word")}>
                    Word {sortBy === "word" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">Lookup in Google</th>
                <th className="py-3 text-body fs-13 fw-semibold">Language</th>
                {variant === "default" && (
                  <>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("pages")}>
                        Pages {sortBy === "pages" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                      </button>
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">Open Issue Page</th>
                    <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} />
                  </>
                )}
                {variant === "page" && (
                  <>
                    <th className="py-3 pe-4 text-body fs-13 fw-semibold text-nowrap text-center" style={{ width: "auto", minWidth: 120 }}>Open issue page</th>
                    <th className="py-3 text-body fs-13 fw-semibold">Action</th>
                    {!hideDetailsColumn && <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 80 }}>Details</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4"><input type="checkbox" className="form-check-input" aria-label={`Select ${row.word}`} /></td>
                  <td className="py-3 fw-medium text-body">{row.word}</td>
                  <td className="py-3">
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(row.word)}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary" title="Lookup in Google" aria-label={`Lookup ${row.word} in Google`}>
                      <span className="fw-bold">G</span>
                    </a>
                  </td>
                  <td className="py-3 text-body">{row.language}</td>
                  {variant === "default" && (
                    <>
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="fw-medium text-primary">{row.pages.toLocaleString()}</span>
                          <span className="text-muted small">{row.pages === 1 ? "PAGE" : "PAGES"}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <button type="button" className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary" title="Open issue page" onClick={() => onOpenIssue?.(row.id)}>
                          <i className="isax isax-info-circle fs-18" aria-hidden="true" />
                        </button>
                      </td>
                    </>
                  )}
                  {variant === "page" && (
                    <td className="py-3 pe-2 text-center align-middle">
                      <button type="button" className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary" title="Open dictionary entry page" onClick={() => onOpenIssue?.(row.id)} aria-label="Open dictionary entry page">
                        <i className="isax isax-info-circle fs-18" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                  <td className="py-3 pe-4">
                    <div className="d-inline-flex align-items-center gap-1">
                      <div className="dropdown d-inline-block">
                        <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle py-1 px-2" data-bs-toggle="dropdown" aria-expanded="false" title="Action">
                          Action <i className="isax isax-arrow-down-1 ms-1" aria-hidden="true" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li><button type="button" className="dropdown-item">Remove from dictionary</button></li>
                        </ul>
                      </div>
                    </div>
                  </td>
                  {variant === "page" && !hideDetailsColumn && (
                    <td className="py-3 pe-4">
                      <button type="button" className="btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary" title="Details" onClick={() => onOpenIssue?.(row.id)} aria-label={`Details for ${row.word}`}>
                        <i className="isax isax-search-normal-1 fs-18" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Rows per page</span>
            <select className="form-select form-select-sm rounded-2" style={{ width: "auto", minWidth: 60 }} value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-muted small">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredItems.length)} of {filteredItems.length}</span>
          </div>
          <nav aria-label="Dictionary pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</button>
              </li>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                if (p > totalPages) return null;
                return <li key={p} className="page-item"><button type="button" className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button></li>;
              })}
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DictionarySection;
