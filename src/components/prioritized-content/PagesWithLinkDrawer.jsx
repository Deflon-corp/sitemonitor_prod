function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useState, useMemo, useCallback  } from "react";
import { createPortal } from "react-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

 














const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

function getSamplePages() {
  const base = "https://www.bajajfinserv.in/bmall";
  const paths = [
    "/nipha-turbo-thresher-paddy-4-fan-plus-1-red/p/29185",
    "/godrej-343-l-3-star-frost-free-double-door-refrigerator-lush-white-rteon-343-p-33-lush-w-219jlw/p/29185",
    "/samsung-253-l-3-star-frost-free-double-door-refrigerator/p/29184",
    "/lg-260-l-3-star-frost-free-double-door-refrigerator/p/29183",
    "/whirlpool-265-l-3-star-frost-free-double-door-refrigerator/p/29182",
    "/haier-324-l-frost-free-double-door-refrigerator/p/29181",
    "/ifb-279-l-3-star-frost-free-double-door-refrigerator/p/29180",
    "/mitra-230-l-3-star-single-door-refrigerator/p/29179",
    "/kelvinator-192-l-single-door-refrigerator/p/29178",
    "/televisions/bpl-tv",
    "/televisions/amstrad-tv",
    "/televisions/elista-tv",
    "/laptops/16gb-ram-laptops",
    "/search",
    "/washing-machines/front-load",
  ];
  return paths.map((path, i) => ({
    id: `page-${i + 1}`,
    title: "(No title found)",
    url: path.startsWith("http") ? path : `${base}${path}`,
    views: 0,
  }));
}

const SAMPLE_PAGES = getSamplePages();

export default function PagesWithLinkDrawer({ open, onClose, linkUrl, onOpenPageDetails }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortViewsAsc, setSortViewsAsc] = useState(true);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return SAMPLE_PAGES;
    const q = search.trim().toLowerCase();
    return SAMPLE_PAGES.filter((r) => r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [search]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => (sortViewsAsc ? a.views - b.views : b.views - a.views));
  }, [filteredRows, sortViewsAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportBase = safeFilename("Pages-with-Link-Report");
  const exportCSV = useCallback(() => {
    const header = "Title,URL,Views\n";
    const body = sortedRows.map((r) => `"${(r.title || "").replace(/"/g, '""')}","${r.url.replace(/"/g, '""')}",${r.views}`).join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [sortedRows, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(sortedRows.map((r) => ({ Title: r.title, URL: r.url, Views: r.views })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [sortedRows, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Title", "URL", "Views"]],
      body: sortedRows.map((r) => [r.title || "", r.url, String(r.views)]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: "wrap" }, 2: { cellWidth: 20 } },
    });
    doc.save(`${reportBase}.pdf`);
  }, [sortedRows, reportBase]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"      ,
        style: { zIndex: 1050 },
        'aria-hidden': true,
        onClick: onClose}
      )
      , React.createElement('div', {
        className: "bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column"       ,
        style: { zIndex: 1055, width: "min(100%, 1300px)", overflow: "visible" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "pages-with-link-drawer-title"}

        , React.createElement('div', { className: "drawer-header-with-dropdown border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0"      }
          , React.createElement('div', { className: "d-flex align-items-start justify-content-between gap-3"   }
            , React.createElement('div', { className: "min-w-0 flex-grow-1" }
              , React.createElement('div', { className: "d-flex align-items-center gap-2 mb-1"   }
                , React.createElement('button', {
                  type: "button",
                  className: "btn btn-icon btn-sm btn-light border-0"    ,
                  onClick: onClose,
                  'aria-label': "Close"}

                  , React.createElement('i', { className: "isax isax-close-circle fs-20 text-body"   , 'aria-hidden': true} )
                )
                , React.createElement('h5', { id: "pages-with-link-drawer-title", className: "mb-0 fw-semibold text-body"  }, "Pages with this link"

                )
              )
              , React.createElement('p', { className: "text-muted small mb-0 ms-4 text-break"    }, linkUrl)
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2 flex-shrink-0"   }
              , React.createElement(DownloadReportDropdown, {
                reportBaseName: reportBase,
                onExportCSV: exportCSV,
                onExportExcel: exportExcel,
                onExportPDF: exportPDF,
                variant: "icon"}
              )
              , React.createElement('div', { className: "input-group input-group-sm" , style: { width: 200 }}
                , React.createElement('span', { className: "input-group-text bg-transparent border-end-0"  }
                  , React.createElement('i', { className: "isax isax-search-normal-1 text-muted"  , 'aria-hidden': true} )
                )
                , React.createElement('input', {
                  type: "search",
                  className: "form-control border-start-0" ,
                  placeholder: "Search...",
                  value: search,
                  onChange: (e) => { setSearch(e.target.value); setCurrentPage(1); },
                  'aria-label': "Search pages" }
                )
              )
              , React.createElement('button', { type: "button", className: "btn btn-sm btn-light border"   , 'aria-label': "More options" }
                , React.createElement('i', { className: "isax isax-more-2" , 'aria-hidden': true} )
              )
            )
          )
        )

        , React.createElement('div', { className: "flex-grow-1 overflow-auto" }
          , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-hover table-striped table-borderless mb-0 align-middle"     }
              , React.createElement('thead', { className: "sticky-top bg-white" }
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                  , React.createElement('th', { className: "py-3 ps-4 fw-semibold text-body fs-13"    }, "Title and URL"  )
                  , React.createElement('th', { className: "py-3 fw-semibold text-body fs-13"   }
                    , React.createElement('button', {
                      type: "button",
                      className: "btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"       ,
                      onClick: () => setSortViewsAsc((v) => !v)}
, "Views"

                      , React.createElement('i', { className: `isax ms-1 fs-12 ${sortViewsAsc ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 pe-4" , style: { width: 48 }} )
                )
              )
              , React.createElement('tbody', {}
                , paginatedRows.map((row) => (
                  React.createElement('tr', { key: row.id}
                    , React.createElement('td', { className: "py-3 ps-4" }
                      , React.createElement('div', { className: "d-flex flex-column" }
                        , React.createElement('span', { className: "text-muted small" }, row.title)
                        , React.createElement('a', {
                          href: row.url,
                          target: "_blank",
                          rel: "noopener noreferrer" ,
                          className: "text-primary text-decoration-none small d-inline-flex align-items-center mt-1"     }

                          , row.url
                          , React.createElement('span', { className: "ms-1 d-inline-flex" , 'aria-hidden': true}
                            , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-primary"}
                              , React.createElement('path', { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"               } )
                              , React.createElement('path', { d: "M15 3h6v6" } )
                              , React.createElement('path', { d: "M10 14L21 3"  } )
                            )
                          )
                        )
                      )
                    )
                    , React.createElement('td', { className: "py-3 text-body" }, row.views)
                    , React.createElement('td', { className: "py-3 pe-4 text-end"  }
                      , React.createElement('button', {
                        type: "button",
                        className: "btn btn-icon btn-sm btn-primary rounded-2"    ,
                        'aria-label': "Open page details"  ,
                        title: "Open page details"  ,
                        onClick: () => _optionalChain([onOpenPageDetails, 'optionalCall', _2 => _2(row)])}

                        , React.createElement('i', { className: "isax isax-document-text" , 'aria-hidden': true} )
                      )
                    )
                  )
                ))
              )
            )
          )
        )

        , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top flex-shrink-0"        }
          , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
            , React.createElement('span', { className: "text-muted small" }, "Rows per page"  )
            , React.createElement('select', {
              className: "form-select form-select-sm" ,
              style: { width: "auto" },
              value: rowsPerPage,
              onChange: (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}

              , ROWS_PER_PAGE_OPTIONS.map((n) => (
                React.createElement('option', { key: n, value: n}, n)
              ))
            )
            , React.createElement('span', { className: "text-muted small" }
              , (currentPage - 1) * rowsPerPage + 1, "–"
              , Math.min(currentPage * rowsPerPage, sortedRows.length), " of "  , sortedRows.length
            )
          )
          , React.createElement('nav', { 'aria-label': "Pages pagination" }
            , React.createElement('ul', { className: "pagination pagination-sm mb-0 gap-1"   }
              , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1}, "«")
              )
              , Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = currentPage <= 4 ? i + 1 : currentPage - 3 + i;
                if (p > totalPages) return null;
                return (
                  React.createElement('li', { key: p, className: "page-item"}
                    , React.createElement('button', { type: "button", className: `page-link rounded-2 ${currentPage === p ? "active" : ""}`, onClick: () => setCurrentPage(p)}, p)
                  )
                );
              })
              , totalPages > 7 && (
                React.createElement(React.Fragment, null
                  , React.createElement('li', { className: "page-item disabled" }, React.createElement('span', { className: "page-link"}, "..."))
                  , React.createElement('li', { className: "page-item"}
                    , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage(totalPages)}, totalPages)
                  )
                )
              )
              , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages}, "»")
              )
            )
          )
        )
      )
    )
  );

  return createPortal(content, document.body);
}
