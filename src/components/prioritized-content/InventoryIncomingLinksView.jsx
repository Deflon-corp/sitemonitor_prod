import React, { useState, useMemo, useCallback  } from "react";
import { downloadBlob, safeFilename } from "@/lib/download";

 








const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, linkUrl: "https://example.com/search", anchorText: "Search", originalUrl: "#", originalText: "", linkType: "Html" },
  { id: 2, linkUrl: "https://example.com/login", anchorText: "Login", originalUrl: "#", originalText: "Login", linkType: "Html" },
  { id: 3, linkUrl: "https://example.com/hindi/search", anchorText: "हिंदी - HI (BETA)", originalUrl: "https://example.com/hindi/search", originalText: "हिंदी - HI (BETA)", linkType: "Html" },
  { id: 4, linkUrl: "https://example.com/search", anchorText: "English - EN", originalUrl: "https://example.com/search", originalText: "English - EN", linkType: "Html" },
  { id: 5, linkUrl: "https://example.com/personal-loans", anchorText: "Personal Loans", originalUrl: "https://example.com/", originalText: "Personal Loans", linkType: "Html" },
  { id: 6, linkUrl: "https://example.com/contact-us", anchorText: "Contact", originalUrl: "https://example.com/about", originalText: "Contact", linkType: "Html" },
];





export default function InventoryIncomingLinksView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [activeTab, setActiveTab] = useState("own");

  const filteredItems = useMemo(() => {
    let list = items;
    if (activeTab === "other") {
      list = items.filter((r) => r.originalUrl !== "#" && !r.originalUrl.startsWith("https://example.com"));
    } else {
      list = items.filter((r) => r.originalUrl === "#" || r.originalUrl.startsWith("https://example.com"));
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.linkUrl.toLowerCase().includes(q) ||
        r.anchorText.toLowerCase().includes(q) ||
        r.originalUrl.toLowerCase().includes(q) ||
        r.originalText.toLowerCase().includes(q)
    );
  }, [items, search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  const ownDomainCount = useMemo(() => items.filter((r) => r.originalUrl === "#" || r.originalUrl.startsWith("https://example.com")).length, [items]);
  const otherDomainCount = useMemo(() => items.filter((r) => r.originalUrl !== "#" && !r.originalUrl.startsWith("https://example.com")).length, [items]);

  const handleDownload = useCallback(() => {
    const header = "Link URL,Anchor Text,Original URL,Original Text,Link Type\n";
    const body = filteredItems
      .map(
        (r) =>
          `"${r.linkUrl.replace(/"/g, '""')}","${r.anchorText.replace(/"/g, '""')}","${r.originalUrl.replace(/"/g, '""')}","${r.originalText.replace(/"/g, '""')}","${r.linkType}"`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${safeFilename("Incoming-Links-Report")}.csv`);
  }, [filteredItems]);

  return (
    React.createElement(React.Fragment, null
      , React.createElement('div', { className: "card border-0 shadow-sm mb-3"   }
        , React.createElement('div', { className: "card-body pb-0" }
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2 mb-3"    }
            , React.createElement('span', { className: "avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"        }
              , React.createElement('i', { className: "isax isax-link-square fs-22"  , 'aria-hidden': true})
            )
            , React.createElement('div', {}
              , React.createElement('h6', { className: "mb-0 fw-semibold" }, "Incoming links" )
              , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, filteredItems.length, " found" )
            )
          )

          , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2 gap-md-3 border-bottom"     }
            , React.createElement('div', { className: "nav nav-tabs border-0 gap-2 gap-md-4"    }
              , React.createElement('button', {
                type: "button",
                className: `nav-link border-0 px-0 pb-2 fw-medium ${activeTab === "own" ? "border-bottom border-2 border-primary text-primary" : "text-body"}`,
                onClick: () => { setActiveTab("own"); setCurrentPage(1); }}
, "Links from own domain ("
                    , ownDomainCount, ")"
              )
              , React.createElement('button', {
                type: "button",
                className: `nav-link border-0 px-0 pb-2 fw-medium ${activeTab === "other" ? "border-bottom border-2 border-primary text-primary" : "text-body"}`,
                onClick: () => { setActiveTab("other"); setCurrentPage(1); }}
, "Links from other account domains"
                    , otherDomainCount > 0 ? ` (${otherDomainCount})` : ""
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2 ms-auto"   }
              , React.createElement('button', {
                type: "button",
                className: "btn btn-sm btn-light d-inline-flex align-items-center gap-2"     ,
                onClick: handleDownload,
                title: "Download"}

                , React.createElement('i', { className: "isax isax-document-download" , 'aria-hidden': true})
                , React.createElement('span', { className: "d-none d-md-inline" }, "Download")
              )
              , React.createElement('div', { className: "position-relative", style: { minWidth: 180, maxWidth: 280 }}
                , React.createElement('i', { className: "isax isax-search-normal-1 position-absolute top-50 start-2 translate-middle-y text-muted fs-14"       , 'aria-hidden': true})
                , React.createElement('input', {
                  type: "search",
                  className: "form-control form-control-sm ps-4"  ,
                  placeholder: "Search...",
                  value: search,
                  onChange: (e) => { setSearch(e.target.value); setCurrentPage(1); },
                  'aria-label': "Search incoming links"  }
                )
              )
            )
          )
        )
      )

      , React.createElement('div', { className: "card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden"      }
        , React.createElement('div', { className: "card-body p-0" }
          , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0"     }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Link")
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Original Data" )
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Link Type" )
                )
              )
              , React.createElement('tbody', {}
                , paginatedItems.map((row) => (
                  React.createElement('tr', { key: row.id}
                    , React.createElement('td', { className: "px-4 py-3 align-top"  }
                      , React.createElement('div', { className: "d-flex flex-column gap-1"  }
                        , React.createElement('a', {
                          href: row.linkUrl,
                          target: "_blank",
                          rel: "noopener noreferrer" ,
                          className: "text-primary text-decoration-none fw-medium"  }

                          , row.anchorText || row.linkUrl
                        )
                        , React.createElement('a', {
                          href: row.linkUrl,
                          target: "_blank",
                          rel: "noopener noreferrer" ,
                          className: "text-primary text-decoration-none text-break d-inline-flex align-items-center gap-1 fs-13"      }

                          , React.createElement('i', { className: "isax isax-arrow-right-1 flex-shrink-0 mt-1"   , style: { fontSize: "0.65rem" }, 'aria-hidden': true})
                          , React.createElement('span', { className: "text-break"}, row.linkUrl)
                        )
                      )
                    )
                    , React.createElement('td', { className: "px-4 py-3 align-top"  }
                      , React.createElement('div', { className: "d-flex flex-column gap-1 fs-13"   }
                        , React.createElement('div', {}
                          , React.createElement('span', { className: "text-muted"}, "URL: " )
                          , React.createElement('span', { className: "text-body"}, row.originalUrl || "—")
                        )
                        , React.createElement('div', {}
                          , React.createElement('span', { className: "text-muted"}, "Text: " )
                          , React.createElement('span', { className: "text-body"}, row.originalText || "—")
                        )
                      )
                    )
                    , React.createElement('td', { className: "px-4 py-3 align-top"  }
                      , React.createElement('span', { className: "badge bg-secondary bg-opacity-25 text-body"   }, row.linkType)
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
                , (currentPage - 1) * rowsPerPage + 1, "-", Math.min(currentPage * rowsPerPage, filteredItems.length), " of "  , filteredItems.length
              )
            )
            , React.createElement('nav', { 'aria-label': "Incoming links pagination"  }
              , React.createElement('ul', { className: "pagination pagination-sm mb-0"  }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', {
                    type: "button",
                    className: "page-link",
                    onClick: () => setCurrentPage((p) => Math.max(1, p - 1)),
                    disabled: currentPage <= 1,
                    'aria-label': "Previous"}
, "Previous"

                  )
                )
                , Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  React.createElement('li', { key: p, className: `page-item ${currentPage === p ? "active" : ""}`}
                    , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(p)}
                      , p
                    )
                  )
                ))
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', {
                    type: "button",
                    className: "page-link",
                    onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
                    disabled: currentPage >= totalPages,
                    'aria-label': "Next"}
, "Next"

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
