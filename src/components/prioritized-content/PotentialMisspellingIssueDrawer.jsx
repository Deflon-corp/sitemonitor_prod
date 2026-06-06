function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useState, useMemo, useCallback  } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

 



























const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DEFAULT_DRAWER_Z_BACKDROP = 1070;
const DEFAULT_DRAWER_Z_PANEL = 1075;

export default function PotentialMisspellingIssueDrawer({
  open,
  onClose,
  issue,
  pagesWithMisspelling = [],
  onOpenPageDetails,
  backdropZIndex: backdropZIndexProp,
  panelZIndex: panelZIndexProp,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pagesWithMisspelling;
    const q = searchQuery.toLowerCase();
    return pagesWithMisspelling.filter((p) => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
  }, [pagesWithMisspelling, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "misspellings") return dir * (a.misspellings - b.misspellings);
      if (sortBy === "potentialMisspellings") return dir * (a.potentialMisspellings - b.potentialMisspellings);
      return dir * (a.views - b.views);
    });
  }, [filteredPages, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPages.slice(start, start + rowsPerPage);
  }, [sortedPages, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const baseName = safeFilename(issue ? `Potential-Misspelling-${issue.word}-Pages` : "Potential-Misspellings-Pages-Report");

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Language,Misspellings,Potential Misspellings,Views\n";
    const body = sortedPages
      .map((p) => `"${(p.title || "").replace(/"/g, '""')}","${p.url.replace(/"/g, '""')}","${p.language.replace(/"/g, '""')}",${p.misspellings},${p.potentialMisspellings},${p.views}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, sortedPages]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedPages.map((p) => ({ Title: p.title || "", URL: p.url, Language: p.language, Misspellings: p.misspellings, "Potential Misspellings": p.potentialMisspellings, Views: p.views }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Language", "Misspellings", "Potential", "Views"]];
    const body = sortedPages.map((p) => [(p.title || "").slice(0, 28), p.url.slice(0, 45), p.language.slice(0, 20), String(p.misspellings), String(p.potentialMisspellings), String(p.views)]);
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 7 }, columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 48 }, 2: { cellWidth: 24 }, 3: { cellWidth: 22 }, 4: { cellWidth: 20 }, 5: { cellWidth: 12 } } });
    doc.save(`${baseName}.pdf`);
  }, [baseName, sortedPages]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSearchQuery("");
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !issue) return null;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(issue.word)}`;
  const drawerZBackdrop = _nullishCoalesce(backdropZIndexProp, () => ( DEFAULT_DRAWER_Z_BACKDROP));
  const drawerZPanel = _nullishCoalesce(panelZIndexProp, () => ( DEFAULT_DRAWER_Z_PANEL));

  const drawerContent = (
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"      ,
        style: { zIndex: drawerZBackdrop },
        'aria-hidden': true,
        onClick: onClose}
      )
      , React.createElement('div', {
        className: "position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"        ,
        style: { zIndex: drawerZPanel, width: "min(100%, 960px)", maxWidth: "960px" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "potential-misspelling-issue-drawer-title"}

        /* Header: close (X), title "Pages with misspelling - [word]", subtitle total count */
        , React.createElement('div', { className: "border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25"       }
          , React.createElement('div', { className: "d-flex align-items-flex-start justify-content-between gap-3"   }
            , React.createElement('div', { className: "d-flex align-items-center gap-3"  }
              , React.createElement('button', {
                type: "button",
                className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"       ,
                onClick: onClose,
                title: "Close",
                'aria-label': "Close"}

                , React.createElement('i', { className: "isax isax-close-circle text-body"  , 'aria-hidden': true} )
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold text-body d-flex align-items-center gap-2"     , id: "potential-misspelling-issue-drawer-title"}, "Pages with misspelling - "
                      , issue.word
                  , React.createElement('a', { href: googleSearchUrl, target: "_blank", rel: "noopener noreferrer" , className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"        , title: "Lookup in Google"  , 'aria-label': `Lookup ${issue.word} in Google`}
                    , React.createElement('span', { className: "fw-bold"}, "G")
                  )
                )
                , React.createElement('p', { className: "text-muted fs-13 mb-0 mt-1"   }, "Total pages with misspelling: "    , filteredPages.length)
              )
            )
          )
        )

        /* Toolbar: filter, download, search (right-aligned) */
        , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-end gap-2 px-4 py-3 border-bottom border-secondary border-opacity-25"         }
          , React.createElement('button', { type: "button", className: "btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"      , title: "Filter", 'aria-label': "Filter"}
            , React.createElement('i', { className: "isax isax-filter text-primary fs-18"   , 'aria-hidden': true} )
          )
          , React.createElement(DownloadReportDropdown, {
            reportBaseName: baseName,
            onExportCSV: exportCSV,
            onExportExcel: exportExcel,
            onExportPDF: exportPDF,
            variant: "icon",
            className: "border border-secondary border-opacity-25 rounded-2"   }
          )
          , React.createElement('div', { className: "position-relative", style: { width: 220 }}
            , React.createElement('i', { className: "isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"       , style: { fontSize: "1rem" }, 'aria-hidden': true} )
            , React.createElement('input', {
              type: "search",
              className: "form-control form-control-sm border border-secondary border-opacity-25 rounded-2"     ,
              placeholder: "Search...",
              value: searchQuery,
              onChange: (e) => { setSearchQuery(e.target.value); setCurrentPage(1); },
              'aria-label': "Search",
              style: { paddingLeft: "2rem" }}
            )
          )
        )

        /* Table */
        , React.createElement('div', { className: "flex-grow-1 overflow-auto" }
          , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0"     }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                  , React.createElement('th', { className: "py-3 ps-4 text-body fs-13 fw-semibold"    }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("title")}, "Title"

                      , sortBy === "title" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold"   }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("misspellings")}, "Misspellings"

                      , sortBy === "misspellings" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold"   }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("potentialMisspellings")}, "Potential misspellings"

                      , sortBy === "potentialMisspellings" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold"   }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("views")}, "Views"

                      , React.createElement('span', { className: "ms-1 d-inline-flex" , 'data-bs-toggle': "tooltip", title: "Total page views"  , 'aria-label': "Info"}, React.createElement('i', { className: "isax isax-information text-muted fs-12"   , 'aria-hidden': true} ))
                      , sortBy === "views" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 pe-4" , style: { width: 100 }} )
                )
              )
              , React.createElement('tbody', {}
                , pagesWithMisspelling.length === 0 && React.createElement('tr', null
                  , React.createElement('td', { colSpan: 6, className: "text-center py-5 text-muted fs-13" }, "No pages found for this word.")
                )
                , paginatedPages.map((p, idx) => (
                  React.createElement('tr', { key: `${p.url}-${idx}`}
                    , React.createElement('td', { className: "py-3 ps-4" }
                      , React.createElement('div', { className: "d-flex flex-column" }
                        , React.createElement('span', { className: "text-body fs-13" }, p.title)
                        , React.createElement('a', { href: p.url, target: "_blank", rel: "noopener noreferrer" , className: "text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"      }
                          , React.createElement('span', { className: "flex-shrink-0 d-inline-flex text-primary"  }, React.createElement(ExternalLinkIcon, { size: 12} ))
                          , p.url
                        )
                      )
                    )
                    
                    , React.createElement('td', { className: "py-3"}
                      , React.createElement('button', {
                        type: "button",
                        className: "btn btn-link p-0 border-0 d-inline-flex align-items-center gap-2 text-body text-decoration-none"        ,
                        onClick: () => _optionalChain([onOpenPageDetails, 'optionalCall', _2 => _2(p)]),
                        title: "Open page details (Misspellings)"   ,
                        'aria-label': `Open page details for ${p.title}`}

                        , React.createElement('span', { className: "rounded-circle bg-warning opacity-75"  , style: { width: 8, height: 8 }, 'aria-hidden': true} )
                        , React.createElement('span', { className: "fs-13 fw-medium" }, p.misspellings)
                      )
                    )
                    , React.createElement('td', { className: "py-3"}
                      , React.createElement('button', {
                        type: "button",
                        className: "btn btn-link p-0 border-0 d-inline-flex align-items-center gap-2 text-body text-decoration-none"        ,
                        onClick: () => _optionalChain([onOpenPageDetails, 'optionalCall', _3 => _3(p, "potential-misspellings")]),
                        title: "Open page details (Potential Misspellings)"    ,
                        'aria-label': `Open page details - Potential Misspellings for ${p.title}`}

                        , React.createElement('span', { className: "rounded-circle bg-primary opacity-75"  , style: { width: 8, height: 8 }, 'aria-hidden': true} )
                        , React.createElement('span', { className: "fs-13 fw-medium" }, p.potentialMisspellings)
                      )
                    )
                    
                    , React.createElement('td', { className: "py-3 pe-4" }
                      , React.createElement('div', { className: "d-flex align-items-center gap-1"  }
                        , React.createElement('button', {
                          type: "button",
                          className: "btn btn-icon btn-sm btn-light border-0 rounded-2"     ,
                          title: "Open page details"  ,
                          onClick: () => _optionalChain([onOpenPageDetails, 'optionalCall', _4 => _4(p)]),
                          'aria-label': "Open page details"  }

                          , React.createElement('i', { className: "isax isax-document-text text-primary"  , 'aria-hidden': true} )
                        )
                        , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light border-0 rounded-2"     , title: "Search"}, React.createElement('i', { className: "isax isax-search-normal-1 text-primary"  , 'aria-hidden': true} ))
                      )
                    )
                  )
                ))
              )
            )
          )

          /* Pagination */
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25"         }
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('span', { className: "text-muted small" }, "Rows per page"  )
              , React.createElement('select', {
                className: "form-select form-select-sm rounded-2"  ,
                style: { width: "auto", minWidth: 60 },
                value: rowsPerPage,
                onChange: (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}

                , ROWS_PER_PAGE_OPTIONS.map((n) => React.createElement('option', { key: n, value: n}, n))
              )
              , React.createElement('span', { className: "text-muted small" }
                , (currentPage - 1) * rowsPerPage + 1, "–", Math.min(currentPage * rowsPerPage, sortedPages.length), " of "  , sortedPages.length
              )
            )
            , React.createElement('nav', { 'aria-label': "Pages with misspelling pagination"   }
              , React.createElement('ul', { className: "pagination pagination-sm mb-0 gap-1"   }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage(1), disabled: currentPage <= 1, 'aria-label': "First"}, "«")
                )
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous"}, "‹")
                )
                , Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (currentPage <= 4) p = i + 1;
                  else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                  else p = currentPage - 3 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    React.createElement('li', { key: p, className: "page-item"}
                      , React.createElement('button', { type: "button", className: `page-link rounded-2 ${currentPage === p ? "active" : ""}`, onClick: () => setCurrentPage(p)}, p)
                    )
                  );
                })
                , totalPages > 7 && currentPage < totalPages - 3 && React.createElement('li', { className: "page-item disabled" }, React.createElement('span', { className: "page-link rounded-2" }, "…"))
                , totalPages > 7 && React.createElement('li', { className: "page-item"}, React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage(totalPages)}, totalPages))
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next"}, "›")
                )
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages, 'aria-label': "Last"}, "»")
                )
              )
            )
          )
        )
      )
    )
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
}
