function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } import React, { useState, useMemo, useCallback } from "react";
import { downloadBlob, safeFilename } from "@/lib/download";

import { POTENTIAL_MISSPELLINGS_SAMPLE } from "@/components/prioritized-content/PotentialMisspellingsSection";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const LANGUAGES = [
  { key: "all", label: "All" },
  { key: "id-ID", label: "Indonesian (Indonesia)" },
  { key: "en-AU", label: "English (Australian)" },
];
/**
 * Potential Misspellings section for the Page Details drawer.
 * Table: Checkbox, Word, Lookup in Google, Language, Confirm, Action (info + dropdown + details).
 * All options working: language tabs, download, search, confirm modal, pagination (10/25/50).
 */
export default function PotentialMisspellingsSectionPageDetails({
  items = POTENTIAL_MISSPELLINGS_SAMPLE,
  onOpenIssue,
  onConfirmMisspelling,
}) {
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
      const langLabel = _nullishCoalesce(_optionalChain([LANGUAGES, 'access', _2 => _2.find, 'call', _3 => _3((l) => l.key === key), 'optionalAccess', _4 => _4.label]), () => (""));
      return items.filter((r) => r.language === langLabel).length;
    },
    [items]
  );

  const filteredItems = useMemo(() => {
    let list = items;
    if (languageFilter !== "all") {
      const langLabel = _nullishCoalesce(_optionalChain([LANGUAGES, 'access', _5 => _5.find, 'call', _6 => _6((l) => l.key === languageFilter), 'optionalAccess', _7 => _7.label]), () => (""));
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
    return [...filteredItems].sort((a, b) => dir * (a.word.localeCompare(b.word) || a.id - b.id));
  }, [filteredItems, sortBy, sortDir]);

  const handleSortWord = () => {
    setCurrentPage(1);
    if (sortBy === "word") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy("word");
      setSortDir("asc");
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
    const body = items.map((r) => `"${r.word.replace(/"/g, '""')}","${r.language.replace(/"/g, '""')}","${r.dateFound}",${r.pages}`).join("\n");
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
    React.createElement(React.Fragment, null
      , React.createElement('div', { className: "d-flex flex-column h-100" }
        , React.createElement('div', { className: "mb-3" }
          , React.createElement('h5', { className: "mb-1 fw-semibold text-body" }, "Potential Misspellings")
          , React.createElement('p', { className: "text-muted fs-13 mb-0" }, wordCountLabel)
        )

        , React.createElement('div', { className: "d-flex flex-nowrap align-items-center justify-content-between gap-3 mb-4" }
          , React.createElement('nav', { className: "nav nav-tabs border-0 gap-2 gap-md-4 mb-0 flex-shrink-0", 'aria-label': "Language filter" }
            , LANGUAGES.map((lang) => {
              const isActive = languageFilter === lang.key;
              const count = languageCount(lang.key);
              return (
                React.createElement('button', {
                  key: lang.key,
                  type: "button",
                  className: `nav-link border-0 px-0 pb-2 d-inline-flex align-items-center gap-2 text-decoration-none ${isActive ? "border-bottom border-2 border-primary text-primary fw-medium" : "text-body"}`,
                  onClick: () => {
                    setLanguageFilter(lang.key);
                    setCurrentPage(1);
                  }
                }

                  , React.createElement('i', { className: "isax isax-edit-2", 'aria-hidden': true })
                  , lang.label
                  , lang.key !== "all" && React.createElement('span', { className: "text-muted" }, "(", count, ")")
                )
              );
            })
          )
          , React.createElement('div', { className: "d-flex align-items-center gap-2 flex-shrink-0" }
            , React.createElement('div', { className: "dropdown" }
              , React.createElement('button', {
                type: "button",
                className: "btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2",
                'data-bs-toggle': "dropdown",
                'aria-expanded': "false",
                title: "Download Report"
              }

                , React.createElement('i', { className: "isax isax-document-download text-primary fs-18", 'aria-hidden': true }), "Download Report"

              )
              , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                , React.createElement('li', {}
                  , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start", onClick: exportCSV }
                    , React.createElement('i', { className: "isax isax-document-text me-2", 'aria-hidden': true }), "CSV"
                  )
                )
                , React.createElement('li', {}
                  , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start", onClick: exportPDF }
                    , React.createElement('i', { className: "isax isax-document-text me-2", 'aria-hidden': true }), "PDF"
                  )
                )
                , React.createElement('li', {}
                  , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start", onClick: exportExcel }
                    , React.createElement('i', { className: "isax isax-document-text me-2", 'aria-hidden': true }), "Excel"
                  )
                )
              )
            )
            , React.createElement('div', { className: "position-relative", style: { width: 240 } }
              , React.createElement('i', { className: "isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3", style: { fontSize: "1rem" }, 'aria-hidden': true })
              , React.createElement('input', {
                type: "search",
                className: "form-control form-control-sm border border-secondary border-opacity-25 rounded-2",
                placeholder: "Search...",
                value: searchQuery,
                onChange: (e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                },
                'aria-label': "Search",
                style: { paddingLeft: "2.25rem" }
              }
              )
            )
          )
        )

        , React.createElement('div', { className: "card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden" }
          , React.createElement('div', { className: "table-responsive flex-grow-1" }
            , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0" }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50" }
                  , React.createElement('th', { className: "py-3 ps-4 text-body fs-13 fw-semibold", style: { width: 40 } }
                    , React.createElement('input', { type: "checkbox", className: "form-check-input", 'aria-label': "Select all" })
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold" }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1", onClick: handleSortWord }, "Word"

                      , sortBy === "word" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true }) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50", 'aria-hidden': true })
                    )
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold" }, "Lookup in Google")
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold" }, "Language")
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold" }, "Confirm")
                  , React.createElement('th', { className: "py-3 pe-4 text-body fs-13 fw-semibold", style: { width: 140 } }, "Action")
                )
              )
              , React.createElement('tbody', {}
                , paginatedItems.map((row) => (
                  React.createElement('tr', { key: row.id }
                    , React.createElement('td', { className: "py-3 ps-4" }
                      , React.createElement('input', { type: "checkbox", className: "form-check-input", 'aria-label': `Select ${row.word}` })
                    )
                    , React.createElement('td', { className: "py-3 fw-medium text-body" }, row.word)
                    , React.createElement('td', { className: "py-3" }
                      , React.createElement('a', {
                        href: `https://www.google.com/search?q=${encodeURIComponent(row.word)}`,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary",
                        title: "Lookup in Google",
                        'aria-label': `Lookup ${row.word} in Google`
                      }

                        , React.createElement('span', { className: "fw-bold" }, "G")
                      )
                    )
                    , React.createElement('td', { className: "py-3 text-body fs-13" }, row.language)
                    , React.createElement('td', { className: "py-3" }
                      , React.createElement('button', {
                        type: "button",
                        className: "btn btn-link btn-sm p-0 border-0 bg-transparent text-primary text-decoration-none",
                        onClick: () => setConfirmMisspellingId(row.id)
                      }
                        , "Confirm misspelling"

                      )
                    )
                    , React.createElement('td', { className: "py-3 pe-4" }
                      , React.createElement('div', { className: "d-inline-flex align-items-center gap-1" }
                        , React.createElement('div', { className: "dropdown d-inline-block" }
                          , React.createElement('button', { type: "button", className: "btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle py-1 px-2", 'data-bs-toggle': "dropdown", 'aria-expanded': "false", title: "Action" }, "Action "
                            , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 fs-12", 'aria-hidden': true })
                          )
                          , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                            , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Ignore"))
                            , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Add to dictionary"))
                          )
                        )
                        , React.createElement('button', {
                          type: "button",
                          className: "btn btn-icon btn-sm btn-light border-0 rounded-2 text-primary",
                          title: "Open potential misspelling page",
                          onClick: () => _optionalChain([onOpenIssue, 'optionalCall', _8 => _8(row.id)]),
                          'aria-label': "Open potential misspelling page"
                        }

                          , React.createElement('i', { className: "isax isax-info-circle fs-18", 'aria-hidden': true })
                        )
                      )
                    )
                  )
                ))
              )
            )
          )
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25" }
            , React.createElement('div', { className: "d-flex align-items-center gap-2" }
              , React.createElement('span', { className: "text-muted small" }, "Rows per page")
              , React.createElement('select', {
                className: "form-select form-select-sm rounded-2",
                style: { width: "auto", minWidth: 60 },
                value: rowsPerPage,
                onChange: (e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }
              }

                , ROWS_PER_PAGE_OPTIONS.map((n) => (
                  React.createElement('option', { key: n, value: n }, n)
                ))
              )
              , React.createElement('span', { className: "text-muted small" }
                , (currentPage - 1) * rowsPerPage + 1, "–", Math.min(currentPage * rowsPerPage, sortedItems.length), " of ", sortedItems.length
              )
            )
            , React.createElement('nav', { 'aria-label': "Potential misspellings pagination" }
              , React.createElement('ul', { className: "pagination pagination-sm mb-0 gap-1" }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}` }
                  , React.createElement('button', { type: "button", className: "page-link rounded-2", onClick: () => setCurrentPage(1), disabled: currentPage <= 1, 'aria-label': "First" }, "«")
                )
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}` }
                  , React.createElement('button', { type: "button", className: "page-link rounded-2", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous" }, "‹")
                )
                , Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (currentPage <= 4) p = i + 1;
                  else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                  else p = currentPage - 3 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    React.createElement('li', { key: p, className: "page-item" }
                      , React.createElement('button', { type: "button", className: `page-link rounded-2 ${currentPage === p ? "active" : ""}`, onClick: () => setCurrentPage(p) }, p)
                    )
                  );
                })
                , totalPages > 7 && currentPage < totalPages - 3 && React.createElement('li', { className: "page-item disabled" }, React.createElement('span', { className: "page-link rounded-2" }, "…"))
                , totalPages > 7 && React.createElement('li', { className: "page-item" }, React.createElement('button', { type: "button", className: "page-link rounded-2", onClick: () => setCurrentPage(totalPages) }, totalPages))
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}` }
                  , React.createElement('button', { type: "button", className: "page-link rounded-2", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next" }, "›")
                )
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}` }
                  , React.createElement('button', { type: "button", className: "page-link rounded-2", onClick: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages, 'aria-label': "Last" }, "»")
                )
              )
            )
          )
        )
      )

      , confirmMisspellingId != null && (
        React.createElement(React.Fragment, null
          , React.createElement('div', {
            className: "position-fixed top-0 start-0 end-0 bottom-0 opacity-75",
            style: { backgroundColor: "#000", zIndex: 1040 },
            'aria-hidden': true,
            onClick: () => setConfirmMisspellingId(null)
          }
          )
          , React.createElement('div', {
            className: "modal show d-block",
            tabIndex: -1,
            role: "dialog",
            'aria-modal': "true",
            'aria-labelledby': "confirm-misspelling-pagedetails-modal-title",
            style: { backgroundColor: "transparent", zIndex: 1050 }
          }

            , React.createElement('div', { className: "modal-dialog modal-dialog-centered", role: "document", onClick: (e) => e.stopPropagation(), style: { maxWidth: "420px" } }
              , React.createElement('div', { className: "modal-content border-0 rounded-3 shadow-lg overflow-hidden position-relative" }
                , React.createElement('button', {
                  type: "button",
                  className: "btn btn-icon btn-sm btn-light rounded-circle position-absolute end-0 p-1 mt-2 me-3",
                  style: { zIndex: 1, top: 0 },
                  'aria-label': "Close",
                  onClick: () => setConfirmMisspellingId(null)
                }

                  , React.createElement('i', { className: "isax isax-close-circle fs-20 text-muted", 'aria-hidden': true })
                )
                , React.createElement('div', { className: "modal-header border-0 pt-4 px-4 pb-0 pe-5" }
                  , React.createElement('p', { className: "modal-title mb-0 text-body fw-medium lh-base", id: "confirm-misspelling-pagedetails-modal-title", style: { lineHeight: "1.5", fontSize: "1.125rem" } }, "Are you sure you want to confirm this misspelling?"

                  )
                )
                , React.createElement('hr', { className: "mx-4 mt-3 mb-0 text-muted opacity-25" })
                , React.createElement('div', { className: "modal-footer border-0 pt-3 pb-4 px-4 justify-content-end gap-2 bg-transparent" }
                  , React.createElement('button', { type: "button", className: "btn btn-light border px-3 py-2 rounded-2", onClick: () => setConfirmMisspellingId(null) }, "Cancel"

                  )
                  , React.createElement('button', {
                    type: "button",
                    className: "btn btn-primary px-3 py-2 rounded-2",
                    onClick: () => {
                      _optionalChain([onConfirmMisspelling, 'optionalCall', _9 => _9(confirmMisspellingId)]);
                      setConfirmMisspellingId(null);
                    }
                  }
                    , "Ok"

                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
