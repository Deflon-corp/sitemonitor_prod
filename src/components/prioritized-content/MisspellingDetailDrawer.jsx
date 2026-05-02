function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useState, useMemo  } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsDrawerFromMisspelling from "@/components/prioritized-content/PageDetailsDrawerFromMisspelling";


const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGES = [
  { title: "Compare", url: "https://www.bajajfinserv.in/bmall/compare", language: "English (Australian)", misspellings: 1, potentialMisspellings: 93, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/lenovo-intel-core-i3-6th-gen-4-gb-ram-1-tb-hdd-dos-15-6-inch-laptop-black-rel-491297624-ip310/p/29185", language: "English (Australian)", misspellings: 2, potentialMisspellings: 113, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/hp-15s-dua-3560-intel-core-i3-11th-gen-8-gb-ram-256-gb-ssd-15-6-inch-laptop/p/29186", language: "English (Australian)", misspellings: 2, potentialMisspellings: 115, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/dell-vostro-3520-intel-core-i5-12th-gen-8-gb-ram-512-gb-ssd-15-6-inch-laptop/p/29187", language: "English (Australian)", misspellings: 2, potentialMisspellings: 116, views: 0 },
  { title: "(No title found)", url: "https://www.bajajfinserv.in/bmall/acer-aspire-3-amd-ryzen-5-8-gb-ram-512-gb-ssd-15-6-inch-laptop/p/29188", language: "English (Australian)", misspellings: 2, potentialMisspellings: 117, views: 0 },
];



function formatDateFound(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleString("en", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e2) {
    return dateStr;
  }
}













const DEFAULT_BACKDROP_Z = 1065;
const DEFAULT_PANEL_Z = 1070;

/**
 * Drawer shown when user clicks "Open misspelling page" (e.g. from Page Details >> Misspellings).
 * Shows: header (Misspelling: word, ID, search, G, Action, Copy URL),
 * Issue details (Element, Language, Date found, Snippet, Found on page),
 * and "All pages with this Misspelling" table.
 */
export default function MisspellingDetailDrawer({
  open,
  onClose,
  issue,
  pagesWithMisspelling = DEFAULT_PAGES,
  onOpenPageDetails,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

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

  const handleCopyUrl = () => {
    const url = issue && pagesWithMisspelling.length > 0 ? pagesWithMisspelling[0].url : window.location.href;
    void navigator.clipboard.writeText(url);
  };

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
  const firstPage = pagesWithMisspelling[0];

  const drawerContent = (
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"      ,
        style: { zIndex: backdropZIndex },
        'aria-hidden': true,
        onClick: onClose}
      )
      , React.createElement('div', {
        className: "position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"        ,
        style: { zIndex: panelZIndex, width: "min(100%, 960px)", maxWidth: "960px" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "misspelling-detail-drawer-title"}

        /* Header: X, Misspelling: word, ID, search, G, Action, Copy URL */
        , React.createElement('div', { className: "border-bottom px-4 py-3 flex-shrink-0"   }
          , React.createElement('div', { className: "d-flex align-items-flex-start justify-content-between gap-3"   }
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('button', {
                type: "button",
                className: "btn btn-icon btn-sm btn-light"   ,
                onClick: onClose,
                title: "Close",
                'aria-label': "Close"}

                , React.createElement('i', { className: "isax isax-arrow-left" , 'aria-hidden': true} )
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold" , id: "misspelling-detail-drawer-title"}, "Misspelling: " , issue.word)
                , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, "ID: " , issue.id)
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light"   , title: "Search", 'aria-label': "Search"}
                , React.createElement('i', { className: "isax isax-search-normal-1" , 'aria-hidden': true} )
              )
              , React.createElement('a', { href: googleSearchUrl, target: "_blank", rel: "noopener noreferrer" , className: "btn btn-icon btn-sm btn-light text-primary"    , title: "Lookup in Google"  , 'aria-label': `Lookup ${issue.word} in Google`}
                , React.createElement('span', { className: "fw-bold"}, "G")
              )
              , React.createElement('div', { className: "dropdown"}
                , React.createElement('button', { type: "button", className: "btn btn-sm btn-light dropdown-toggle"   , 'data-bs-toggle': "dropdown", 'aria-expanded': "false"}, "Action "
                   , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 fs-12"   , 'aria-hidden': true} )
                )
                , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                  , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item"}, "Ignore"))
                  , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item"}, "Add to dictionary"  ))
                )
              )
              , React.createElement('button', { type: "button", className: "btn btn-sm btn-light"  , onClick: handleCopyUrl}, "Copy URL"

              )
            )
          )
        )

        , React.createElement('div', { className: "flex-grow-1 overflow-auto px-4 py-3"   }
          , React.createElement('div', { className: "card border-0 shadow-sm mb-3"   }
            , React.createElement('div', { className: "card-body"}
              , React.createElement('h6', { className: "fw-semibold mb-3" }, "Issue details" )
              , React.createElement('dl', { className: "row mb-0 fs-13"  }
                , React.createElement('dt', { className: "col-4 text-muted" }, "Element")
                , React.createElement('dd', { className: "col-8 mb-2" }, "Text")
                , React.createElement('dt', { className: "col-4 text-muted" }, "Language")
                , React.createElement('dd', { className: "col-8 mb-2" }, issue.language)
                , React.createElement('dt', { className: "col-4 text-muted" }, "Date found" )
                , React.createElement('dd', { className: "col-8 mb-2" }, formatDateFound(issue.dateFound))
                , React.createElement('dt', { className: "col-4 text-muted" }, "Snippet")
                , React.createElement('dd', { className: "col-8 mb-2" }
                  , React.createElement('span', { className: "border border-danger rounded px-2 py-1 text-danger small"      }, issue.word)
                )
                , React.createElement('dt', { className: "col-4 text-muted" }, "Found on page"  )
                , React.createElement('dd', { className: "col-8 mb-0" }
                  , React.createElement('div', { className: "d-flex flex-column" }
                    , React.createElement('span', { className: "fw-medium"}, _nullishCoalesce(_optionalChain([firstPage, 'optionalAccess', _2 => _2.title]), () => ( "(No title found)")))
                    , _optionalChain([firstPage, 'optionalAccess', _3 => _3.url]) ? (
                      React.createElement('a', { href: firstPage.url, target: "_blank", rel: "noopener noreferrer" , className: "text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"      }
                        , React.createElement('span', { className: "text-primary"}
                          , React.createElement(ExternalLinkIcon, { size: 12} )
                        )
                        , firstPage.url
                      )
                    ) : null
                  )
                )
              )
            )
          )

          , React.createElement('div', { className: "card border-0 shadow-sm"  }
            , React.createElement('div', { className: "card-body p-0" }
              , React.createElement('div', { className: "d-flex flex-nowrap align-items-center justify-content-between gap-3 px-4 pt-3 pb-2"       }
                , React.createElement('h6', { className: "fw-semibold mb-0 text-body"  }, "All pages with this Misspelling"    )
                , React.createElement('div', { className: "position-relative flex-shrink-0" , style: { width: 220 }}
                  , React.createElement('i', { className: "isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"       , style: { fontSize: "1rem" }, 'aria-hidden': true} )
                  , React.createElement('input', {
                    type: "search",
                    className: "form-control form-control-sm" ,
                    placeholder: "Search...",
                    value: searchQuery,
                    onChange: (e) => { setSearchQuery(e.target.value); setCurrentPage(1); },
                    'aria-label': "Search",
                    style: { paddingLeft: "2rem" }}
                  )
                )
              )
              , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0"     }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                  , React.createElement('th', { className: "py-3 ps-4 text-body fs-13 fw-semibold text-nowrap"     }, "Title")
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }, "Language")
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("misspellings")}, "Misspellings"

                      , sortBy === "misspellings" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("potentialMisspellings")}, "Potential misspellings"

                      , sortBy === "potentialMisspellings" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }
                    , React.createElement('button', { type: "button", className: "btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"          , onClick: () => handleSort("views")}, "Views"

                      , sortBy === "views" ? React.createElement('i', { className: `isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`, 'aria-hidden': true} ) : React.createElement('i', { className: "isax isax-sort fs-12 opacity-50"   , 'aria-hidden': true} )
                    )
                  )
                  , React.createElement('th', { className: "py-3 pe-4 text-nowrap"  , style: { width: 100 }, 'aria-label': "Actions"} )
                )
              )
              , React.createElement('tbody', {}
                , paginatedPages.map((p, idx) => (
                  React.createElement('tr', { key: `${p.url}-${idx}`}
                    , React.createElement('td', { className: "py-2 ps-4" }
                      , React.createElement('div', { className: "d-flex flex-column" }
                        , React.createElement('span', { className: "text-body fs-13" }, p.title)
                        , React.createElement('a', { href: p.url, target: "_blank", rel: "noopener noreferrer" , className: "text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"      }
                          , React.createElement(ExternalLinkIcon, { size: 12} )
                          , p.url
                        )
                      )
                    )
                    , React.createElement('td', { className: "py-2 text-body fs-13"  }, p.language)
                    , React.createElement('td', { className: "py-2 fs-13 text-body"  }, p.misspellings)
                    , React.createElement('td', { className: "py-2 fs-13 text-body"  }, p.potentialMisspellings)
                    , React.createElement('td', { className: "py-2 fs-13 text-body"  }, p.views)
                    , React.createElement('td', { className: "py-2 pe-4" }
                      , React.createElement('div', { className: "d-inline-flex align-items-center gap-1"  }
                        , React.createElement('button', {
                          type: "button",
                          className: "btn btn-icon btn-sm btn-light text-primary"    ,
                          title: "Open page details"  ,
                          onClick: () => {
                            if (onOpenPageDetails) {
                              onOpenPageDetails(p);
                            } else {
                              setSelectedPageForDetails({ page: p, qaSubView: "misspellings" });
                            }
                          },
                          'aria-label': `Open page details for ${p.title}`}

                          , React.createElement('i', { className: "isax isax-document-text fs-14"  , 'aria-hidden': true} )
                        )
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
                style: { width: "auto", minWidth: 60 },
                value: rowsPerPage,
                onChange: (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}

                , ROWS_PER_PAGE_OPTIONS.map((n) => React.createElement('option', { key: n, value: n}, n))
              )
              , React.createElement('span', { className: "text-muted small" }
                , (currentPage - 1) * rowsPerPage + 1, "–", Math.min(currentPage * rowsPerPage, sortedPages.length), " of "  , sortedPages.length
              )
            )
            , React.createElement('nav', { 'aria-label': "Pagination"}
              , React.createElement('ul', { className: "pagination pagination-sm mb-0"  }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(1), disabled: currentPage <= 1, 'aria-label': "First"}, "«")
                )
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous"}, "‹")
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
                      , React.createElement('button', { type: "button", className: `page-link ${currentPage === p ? "active" : ""}`, onClick: () => setCurrentPage(p)}, p)
                    )
                  );
                })
                , totalPages > 7 && currentPage < totalPages - 3 && React.createElement('li', { className: "page-item disabled" }, React.createElement('span', { className: "page-link"}, "…"))
                , totalPages > 7 && React.createElement('li', { className: "page-item"}, React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(totalPages)}, totalPages))
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next"}, "›")
                )
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages, 'aria-label': "Last"}, "»")
                )
              )
            )
          )
            )
          )
        )
      )

      , !onOpenPageDetails && (
        React.createElement(PageDetailsDrawerFromMisspelling, {
          open: selectedPageForDetails != null,
          onClose: () => setSelectedPageForDetails(null),
          page: selectedPageForDetails ? selectedPageForDetails.page : null,
          defaultQaSubView: _nullishCoalesce(_optionalChain([selectedPageForDetails, 'optionalAccess', _4 => _4.qaSubView]), () => ( "misspellings"))}
        )
      )
    )
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
