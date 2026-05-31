function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useState, useMemo  } from "react";
import { createPortal } from "react-dom";
import IgnoredSpellingPageDetailsDrawer from "@/components/prioritized-content/IgnoredSpellingPageDetailsDrawer";


const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGES = [];

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
 * Drawer shown when user clicks "Open issue page" from Page Details >> Ignored Misspellings.
 * Shows: header (Ignored spelling: word, ID, Action, Copy URL), Issue details, and "All pages with this Ignored Spelling" table.
 */
export default function IgnoredSpellingDetailDrawer({
  open,
  onClose,
  issue,
  page,
  pagesWithIgnoredSpelling = DEFAULT_PAGES,
  onOpenPageDetails,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const resolvedPagesWithIgnoredSpelling = useMemo(() => {
    if (pagesWithIgnoredSpelling && pagesWithIgnoredSpelling.length > 0) return pagesWithIgnoredSpelling;
    if (page) return [{ title: page.title || "Untitled Page", url: page.url, priority: "Medium", views: 0 }];
    return [];
  }, [pagesWithIgnoredSpelling, page]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return resolvedPagesWithIgnoredSpelling;
    const q = searchQuery.toLowerCase();
    return resolvedPagesWithIgnoredSpelling.filter((p) => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
  }, [resolvedPagesWithIgnoredSpelling, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPages.slice(start, start + rowsPerPage);
  }, [filteredPages, currentPage, rowsPerPage]);

  const handleCopyUrl = () => {
    const url = issue && resolvedPagesWithIgnoredSpelling.length > 0 ? resolvedPagesWithIgnoredSpelling[0].url : window.location.href;
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

  const firstPage = resolvedPagesWithIgnoredSpelling[0];

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
        'aria-labelledby': "ignored-spelling-detail-drawer-title"}

        , React.createElement('div', { className: "border-bottom px-4 py-3 flex-shrink-0"   }
          , React.createElement('div', { className: "d-flex align-items-flex-start justify-content-between gap-3"   }
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light"   , onClick: onClose, title: "Close", 'aria-label': "Close"}
                , React.createElement('i', { className: "isax isax-arrow-left" , 'aria-hidden': true} )
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold" , id: "ignored-spelling-detail-drawer-title"}, "Ignored spelling: "  , issue.word)
                , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, "ID: " , issue.id)
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('a', { href: `https://www.google.com/search?q=${encodeURIComponent(issue.word)}`, target: "_blank", rel: "noopener noreferrer" , className: "btn btn-icon btn-sm btn-light text-primary"    , title: "Lookup in Google"  }
                , React.createElement('span', { className: "fw-bold"}, "G")
              )
              , React.createElement('div', { className: "dropdown"}
                , React.createElement('button', { type: "button", className: "btn btn-sm btn-light dropdown-toggle"   , 'data-bs-toggle': "dropdown", 'aria-expanded': "false"}, "Action "
                   , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 fs-12"   , 'aria-hidden': true} )
                )
                , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                  , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item"}, "Remove from ignored"  ))
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
                , React.createElement('dt', { className: "col-4 text-muted" }, "Word")
                , React.createElement('dd', { className: "col-8 mb-2 fw-medium"  }, issue.word)
                , React.createElement('dt', { className: "col-4 text-muted" }, "Language")
                , React.createElement('dd', { className: "col-8 mb-2" }, issue.language)
                , React.createElement('dt', { className: "col-4 text-muted" }, "Date found" )
                , React.createElement('dd', { className: "col-8 mb-2" }, formatDateFound(issue.dateFound))
                , React.createElement('dt', { className: "col-4 text-muted" }, "Found on page"  )
                , React.createElement('dd', { className: "col-8 mb-0" }
                  , React.createElement('div', { className: "d-flex flex-column" }
                    , React.createElement('span', { className: "fw-medium"}, _nullishCoalesce(_optionalChain([firstPage, 'optionalAccess', _2 => _2.title]), () => ( "(No title found)")))
                    , _optionalChain([firstPage, 'optionalAccess', _3 => _3.url]) ? (
                      React.createElement('a', { href: firstPage.url, target: "_blank", rel: "noopener noreferrer" , className: "text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"      }
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
                , React.createElement('h6', { className: "fw-semibold mb-0 text-body"  }, "All pages with this Ignored Spelling"     )
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
                      , React.createElement('th', { className: "py-3 ps-4 text-body fs-13 fw-semibold text-nowrap"     }, "Title and URL"  )
                      , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }, "Priority")
                      , React.createElement('th', { className: "py-3 text-body fs-13 fw-semibold text-nowrap"    }, "Views")
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
                              , p.url
                            )
                          )
                        )
                        , React.createElement('td', { className: "py-2"}
                          , React.createElement('span', { className: `badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Low" ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}
                            , p.priority
                          )
                        )
                        , React.createElement('td', { className: "py-2 fs-13 text-body"  }, p.views)
                        , React.createElement('td', { className: "py-2 pe-4" }
                          , React.createElement('button', {
                            type: "button",
                            className: "btn btn-icon btn-sm btn-light text-primary"    ,
                            title: "Open page details"  ,
                            onClick: () => {
                              if (onOpenPageDetails) {
                                onOpenPageDetails(p);
                              } else {
                                setSelectedPageForDetails(p);
                              }
                            },
                            'aria-label': `Open page details for ${p.title}`}

                            , React.createElement('i', { className: "isax isax-document-text fs-14"  , 'aria-hidden': true} )
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
                  , React.createElement('select', { className: "form-select form-select-sm" , style: { width: "auto", minWidth: 60 }, value: rowsPerPage, onChange: (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    , ROWS_PER_PAGE_OPTIONS.map((n) => React.createElement('option', { key: n, value: n}, n))
                  )
                  , React.createElement('span', { className: "text-muted small" },
                    resolvedPagesWithIgnoredSpelling.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1, "–", Math.min(currentPage * rowsPerPage, resolvedPagesWithIgnoredSpelling.length), " of "  , resolvedPagesWithIgnoredSpelling.length
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
        React.createElement(IgnoredSpellingPageDetailsDrawer, {
          open: selectedPageForDetails != null,
          onClose: () => setSelectedPageForDetails(null),
          page: selectedPageForDetails ? { title: selectedPageForDetails.title, url: selectedPageForDetails.url } : null,
          defaultQaSubView: "ignored-misspellings"}
        )
      )
    )
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
