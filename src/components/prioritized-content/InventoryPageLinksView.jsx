function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }import React, { useState, useMemo, useCallback  } from "react";
import PagesWithLinkDrawer, { } from "@/components/prioritized-content/PagesWithLinkDrawer";
import PageDetailsDrawer, { } from "@/components/prioritized-content/PageDetailsDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

 






const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Sample internal page links – replace with API */
const SAMPLE_INTERNAL = [
  { id: "1", url: "https://www.bajajfinserv.in/zomato-gift-card", documents: 0, pages: 499 },
  { id: "2", url: "https://www.bajajfinserv.in/webform/v1/offersModulenew/offer?category=personal-loan", documents: 0, pages: 499 },
  { id: "3", url: "https://www.bajajfinserv.in/webform/v1/offersModulenew/offer?category=home-loan", documents: 0, pages: 499 },
  { id: "4", url: "https://www.bajajfinserv.in/personal-loans", documents: 0, pages: 648 },
  { id: "5", url: "https://www.bajajfinserv.in/home-loans", documents: 0, pages: 648 },
  { id: "6", url: "https://www.bajajfinserv.in/contact-us", documents: 0, pages: 648 },
  { id: "7", url: "https://www.bajajfinserv.in/careers", documents: 0, pages: 648 },
  { id: "8", url: "https://www.bajajfinserv.in/about-us", documents: 0, pages: 648 },
  { id: "9", url: "https://www.bajajfinserv.in/emi-calculator", documents: 0, pages: 648 },
  { id: "10", url: "https://www.bajajfinserv.in/insurance", documents: 0, pages: 648 },
];

/** Sample external page links – replace with API */
const SAMPLE_EXTERNAL = [
  { id: "e1", url: "https://www.linkedin.com/company/bajajfinserv", documents: 0, pages: 12 },
  { id: "e2", url: "https://twitter.com/bajajfinserv", documents: 0, pages: 8 },
  { id: "e3", url: "https://www.facebook.com/bajajfinserv", documents: 0, pages: 5 },
];









export default function InventoryPageLinksView({
  onBack,
  downloadDropup,
  internalRows = SAMPLE_INTERNAL,
  externalRows = SAMPLE_EXTERNAL,
}) {
  const [tab, setTab] = useState("internal");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [selectedLinkUrl, setSelectedLinkUrl] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const rows = tab === "internal" ? internalRows : externalRows;
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.url.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const openPagesDrawer = (row) => {
    setSelectedLinkUrl(row.url);
    setPagesDrawerOpen(true);
  };

  const openPageDetails = useCallback((row) => {
    const id = Number.parseInt(row.id.replace(/\D/g, ""), 10) || 0;
    setSelectedPageForDetails({ id, title: row.title, url: row.url });
    setPagesDrawerOpen(false);
    setPageDetailsOpen(true);
  }, []);

  const reportBase = safeFilename("Page-Links-Report");
  const exportCSV = useCallback(() => {
    const header = "URL,Documents,Pages\n";
    const body = filteredRows.map((r) => `"${r.url.replace(/"/g, '""')}",${r.documents},${r.pages}`).join("\n");
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [filteredRows, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(filteredRows.map((r) => ({ URL: r.url, Documents: r.documents, Pages: r.pages })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Page Links");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [filteredRows, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["URL", "Documents", "Pages"]],
      body: filteredRows.map((r) => [r.url, String(r.documents), String(r.pages)]),
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 25 }, 2: { cellWidth: 20 } },
    });
    doc.save(`${reportBase}.pdf`);
  }, [filteredRows, reportBase]);

  return (
    React.createElement(React.Fragment, null
      , React.createElement('div', { className: `card border-0 shadow-sm mb-3 ${downloadDropup ? "drawer-header-with-dropdown" : ""}`}
        , React.createElement('div', { className: "card-body"}
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-3"    }
            , React.createElement('div', { className: "d-flex align-items-center gap-3"  }
              , onBack && (
                React.createElement('button', {
                  type: "button",
                  className: "btn btn-icon btn-sm btn-light border"    ,
                  onClick: onBack,
                  'aria-label': "Back to Links summary"   }

                  , React.createElement('i', { className: "isax isax-arrow-left-2" , 'aria-hidden': true} )
                )
              )
              , React.createElement('span', { className: "avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0"         }
                , React.createElement('i', { className: "isax isax-link-2 fs-22"  , 'aria-hidden': true} )
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold text-body"  }, "Page links" )
                , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, filteredRows.length, " results" )
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement(DownloadReportDropdown, {
                reportBaseName: reportBase,
                onExportCSV: exportCSV,
                onExportExcel: exportExcel,
                onExportPDF: exportPDF,
                variant: "icon",
                dropup: downloadDropup}
              )
              , React.createElement('div', { className: "input-group input-group-sm" , style: { minWidth: 200, maxWidth: 280 }}
                , React.createElement('span', { className: "input-group-text bg-transparent border-end-0"  }
                  , React.createElement('i', { className: "isax isax-search-normal-1 text-muted"  , 'aria-hidden': true} )
                )
                , React.createElement('input', {
                  type: "search",
                  className: "form-control border-start-0" ,
                  placeholder: "Search...",
                  value: search,
                  onChange: (e) => { setSearch(e.target.value); setCurrentPage(1); },
                  'aria-label': "Search page links"  }
                )
              )
            )
          )
        )
      )

      , React.createElement('div', { className: "d-flex align-items-center gap-2 mb-3 border-bottom border-secondary border-opacity-25 ps-3"       }
        , React.createElement('button', {
          type: "button",
          className: `btn btn-link p-0 border-0 text-decoration-none py-2 px-0 me-3 rounded-0 border-bottom border-2 ${tab === "internal" ? "border-primary text-primary fw-medium" : "text-body border-transparent"}`,
          onClick: () => { setTab("internal"); setCurrentPage(1); }}
, "Internal"

        )
        , React.createElement('button', {
          type: "button",
          className: `btn btn-link p-0 border-0 text-decoration-none py-2 px-0 rounded-0 border-bottom border-2 ${tab === "external" ? "border-primary text-primary fw-medium" : "text-body border-transparent"}`,
          onClick: () => { setTab("external"); setCurrentPage(1); }}
, "External"

        )
      )

      , React.createElement('div', { className: "card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden"      }
        , React.createElement('div', { className: "card-body p-0" }
          , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-hover table-striped table-borderless mb-0 align-middle"     }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                  , React.createElement('th', { className: "py-3 ps-4 fw-semibold text-body fs-13 text-start"     }, "URL")
                  , React.createElement('th', { className: "py-3 ps-3 pe-2 fw-semibold text-body fs-13 text-uppercase text-end"       , style: { minWidth: 100 }}, "DOCUMENTS")
                  , React.createElement('th', { className: "py-3 ps-3 pe-4 fw-semibold text-body fs-13 text-uppercase text-end"       , style: { width: 120, minWidth: 120 }}, "PAGES")
                )
              )
              , React.createElement('tbody', {}
                , paginatedRows.map((row) => (
                  React.createElement('tr', { key: row.id}
                    , React.createElement('td', { className: "py-3 ps-4" }
                      , React.createElement('a', {
                        href: row.url,
                        target: "_blank",
                        rel: "noopener noreferrer" ,
                        className: "text-primary text-decoration-none text-break"  }

                        , row.url
                      )
                    )
                    , React.createElement('td', { className: "py-3 ps-3 pe-2 text-end"   }
                      , React.createElement('div', { className: "d-flex flex-column align-items-end"  }
                        , React.createElement('span', { className: "text-primary fw-semibold" }, row.documents.toLocaleString())
                        , React.createElement('span', { className: "text-muted small" }, "DOCUMENTS")
                      )
                    )
                    , React.createElement('td', { className: "py-3 ps-3 pe-4 text-end"   , style: { width: 120, minWidth: 120 }}
                      , React.createElement('button', {
                        type: "button",
                        className: "btn btn-link p-0 border-0 text-decoration-none d-flex flex-column align-items-end w-100"        ,
                        onClick: () => openPagesDrawer(row)}

                        , React.createElement('span', { className: "text-primary fw-semibold" }, row.pages.toLocaleString())
                        , React.createElement('span', { className: "text-muted small" }, "PAGES")
                      )
                    )
                  )
                ))
              )
            )
          )
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top"       }
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
                , Math.min(currentPage * rowsPerPage, filteredRows.length), " of "  , filteredRows.length
              )
            )
            , React.createElement('nav', { 'aria-label': "Page links pagination"  }
              , React.createElement('ul', { className: "pagination pagination-sm mb-0 gap-1"   }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous"}, "Previous")
                )
                , Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                  if (p > totalPages) return null;
                  return (
                    React.createElement('li', { key: p, className: "page-item"}
                      , React.createElement('button', { type: "button", className: `page-link rounded-2 ${currentPage === p ? "active" : ""}`, onClick: () => setCurrentPage(p)}, p)
                    )
                  );
                })
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link rounded-2" , onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next"}, "Next")
                )
              )
            )
          )
        )
      )

      , React.createElement(PagesWithLinkDrawer, {
        open: pagesDrawerOpen,
        onClose: () => { setPagesDrawerOpen(false); setSelectedLinkUrl(null); },
        linkUrl: _nullishCoalesce(selectedLinkUrl, () => ( "")),
        onOpenPageDetails: openPageDetails}
      )

      , React.createElement(PageDetailsDrawer, {
        open: pageDetailsOpen,
        onClose: () => setPageDetailsOpen(false),
        page: selectedPageForDetails,
        defaultTab: "inventory",
        defaultInventorySubView: "html-pages"}
      )
    )
  );
}
