function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useState, useMemo  } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import IgnoredSpellingPageDetailsDrawer from "@/components/prioritized-content/IgnoredSpellingPageDetailsDrawer";

 





















const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DEFAULT_PAGES_WITH_IGNORED_SPELLING = [];

export default function IgnoredSpellingIssueDrawer({
  open,
  onClose,
  issue,
  page = null,
  pagesWithIgnoredSpelling = DEFAULT_PAGES_WITH_IGNORED_SPELLING,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const resolvedPagesWithIgnoredSpelling = useMemo(() => {
    if (pagesWithIgnoredSpelling && pagesWithIgnoredSpelling.length > 0) return pagesWithIgnoredSpelling;
    if (page) return [{ title: page.title || "Untitled Page", url: page.url, priority: "Medium", views: 0 }];
    return [];
  }, [pagesWithIgnoredSpelling, page]);

  const totalPages = Math.max(1, Math.ceil(resolvedPagesWithIgnoredSpelling.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return resolvedPagesWithIgnoredSpelling.slice(start, start + rowsPerPage);
  }, [resolvedPagesWithIgnoredSpelling, currentPage, rowsPerPage]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !issue) return null;

  const copyWord = () => {
    _optionalChain([navigator, 'access', _2 => _2.clipboard, 'optionalAccess', _3 => _3.writeText, 'call', _4 => _4(issue.word)]);
  };

  const drawerContent = (
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"      ,
        style: { zIndex: 1060 },
        'aria-hidden': true,
        onClick: onClose}
      )
      , React.createElement('div', {
        className: "position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"        ,
        style: { zIndex: 1065, width: "min(100%, 640px)", maxWidth: "640px" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "ignored-spelling-issue-drawer-title"}

        , React.createElement('div', { className: "border-bottom px-4 py-3 flex-shrink-0"   }
          , React.createElement('div', { className: "d-flex align-items-flex-start justify-content-between gap-3"   }
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('button', {
                type: "button",
                className: "btn btn-icon btn-sm btn-light"   ,
                onClick: onClose,
                title: "Close",
                'aria-label': "Close"}

                , React.createElement('i', { className: "isax isax-arrow-left" })
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold" , id: "ignored-spelling-issue-drawer-title"}, "Ignored spelling" )
                , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, "ID: " , issue.id)
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('div', { className: "dropdown"}
                , React.createElement('button', {
                  type: "button",
                  className: "btn btn-sm btn-light dropdown-toggle"   ,
                  'data-bs-toggle': "dropdown",
                  'aria-expanded': "false"}
, "Action"

                )
                , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                  , React.createElement('li', {}
                    , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      }
                      , React.createElement('i', { className: "isax isax-eye me-2 text-primary"   }), "Remove from ignored"

                    )
                  )
                  , React.createElement('li', {}, React.createElement('hr', { className: "dropdown-divider"} ))
                  , React.createElement('li', {}
                    , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      }
                      , React.createElement('i', { className: "isax isax-book me-2 text-primary"   }), "Add to dictionary"

                    )
                  )
                  , React.createElement('li', {}
                    , React.createElement('button', { type: "button", className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      }
                      , React.createElement('i', { className: "isax isax-book me-2 text-primary"   }), "Add to dictionary for all languages"

                    )
                  )
                )
              )
              , React.createElement('button', { type: "button", className: "btn btn-sm btn-light"  , onClick: copyWord, title: "Copy word" }, "Copy word"

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
                
                , React.createElement('dt', { className: "col-4 text-muted" }, "Date found" )
                , React.createElement('dd', { className: "col-8 mb-2" }, issue.dateFound)
                , React.createElement('dt', { className: "col-4 text-muted" }, "Snippet")
                , React.createElement('dd', { className: "col-8 mb-2" }, React.createElement('span', { className: "border border-danger rounded px-2 py-1 text-danger small"      }, issue.word))
                , React.createElement('dt', { className: "col-4 text-muted" }, "Found on page"  )
                , React.createElement('dd', { className: "col-8 mb-0" }
                  , React.createElement('div', { className: "d-flex flex-column" }
                    , React.createElement('span', { className: "fw-medium"}, _nullishCoalesce(_optionalChain([page, 'optionalAccess', _5 => _5.title]), () => ( "—")))
                    , React.createElement('a', { href: _nullishCoalesce(_optionalChain([page, 'optionalAccess', _6 => _6.url]), () => ( "#")), target: "_blank", rel: "noopener noreferrer" , className: "text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"      }
                      , React.createElement('span', { className: "text-primary"}
                        , React.createElement('svg', { width: "12", height: "12", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2"}
                          , React.createElement('path', { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"               } )
                          , React.createElement('path', { d: "M15 3h6v6" } )
                          , React.createElement('path', { d: "M10 14L21 3"  } )
                        )
                      )
                      , _nullishCoalesce(_optionalChain([page, 'optionalAccess', _7 => _7.url]), () => ( "—"))
                    )
                  )
                )
              )
            )
          )

          , React.createElement('div', { className: "card border-0 shadow-sm"  }
            , React.createElement('div', { className: "card-body p-0" }
              , React.createElement('h6', { className: "fw-semibold mb-0 px-4 pt-3 pb-2 text-body"     }, "All pages with this Ignored Spelling"     )
              , React.createElement('div', { className: "table-responsive"}
                , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0"     }
, React.createElement('thead', {}
                  , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50"    }
                      , React.createElement('th', { className: "fw-semibold text-body py-3"  }, "Title and URL"  )
                      , React.createElement('th', { className: "fw-semibold text-body py-3"  }, "Priority")
                      
                      , React.createElement('th', { className: "py-3 pe-4" , style: { width: 80 }})
                    )
                  )
                  , React.createElement('tbody', {}
                    , paginatedPages.map((p, idx) => (
                      React.createElement('tr', { key: `${p.url}-${idx}`}
                        , React.createElement('td', { className: "py-2"}
                          , React.createElement('div', { className: "d-flex flex-column" }
                            , React.createElement(Link, { to: p.url, className: "text-primary text-decoration-none fw-medium fs-13"   }, p.title)
                            , React.createElement('a', { href: p.url, target: "_blank", rel: "noopener noreferrer" , className: "text-muted text-decoration-none small d-inline-flex align-items-center gap-1 mt-1"      , style: { fontSize: "0.75rem" }}
                              , React.createElement('span', { className: "text-primary"}
                                , React.createElement('svg', { width: "10", height: "10", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", 'aria-hidden': true}
                                  , React.createElement('path', { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"               } )
                                  , React.createElement('path', { d: "M15 3h6v6" } )
                                  , React.createElement('path', { d: "M10 14L21 3"  } )
                                )
                              )
                              , p.url
                            )
                          )
                        )
                        , React.createElement('td', { className: "py-2"}
                          , React.createElement('span', { className: `badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Low" ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}
                            , p.priority
                          )
                        )
                        , React.createElement('td', { className: "py-2"}
                          , React.createElement('input', { type: "text", className: "form-control form-control-sm" , style: { width: 60 }, defaultValue: p.views, readOnly: true} )
                        )
                        , React.createElement('td', { className: "py-2 pe-4" }
                          , React.createElement('button', {
                            type: "button",
                            className: "btn btn-icon btn-sm btn-light"   ,
                            title: "Open page details"  ,
                            onClick: () => setSelectedPageForDetails(p),
                            'aria-label': `Open page details for ${p.title}`}

                            , React.createElement('i', { className: "isax isax-document-text" })
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
                  , React.createElement('select', { className: "form-select form-select-sm" , style: { width: "auto" }, value: rowsPerPage, onChange: (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    , ROWS_PER_PAGE_OPTIONS.map((n) => React.createElement('option', { key: n, value: n}, n))
                  )
                  , React.createElement('span', { className: "text-muted small" }, 
                    resolvedPagesWithIgnoredSpelling.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1, "-", Math.min(currentPage * rowsPerPage, resolvedPagesWithIgnoredSpelling.length), " of "  , resolvedPagesWithIgnoredSpelling.length
                  )
                )
                , React.createElement('nav', { 'aria-label': "Pages with ignored spelling pagination"    }
                  , React.createElement('ul', { className: "pagination pagination-sm mb-0"  }
                    , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                      , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous"}, "Previous")
                    )
                    , Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      React.createElement('li', { key: p, className: `page-item ${currentPage === p ? "active" : ""}`}
                        , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(p)}, p)
                      )
                    ))
                    , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                      , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next"}, "Next")
                    )
                  )
                )
              )
            )
          )

          , React.createElement('div', { className: "card border-0 shadow-sm mt-3"   }
            , React.createElement('div', { className: "card-body p-0" }
              , React.createElement('h6', { className: "fw-semibold mb-0 px-4 pt-3 pb-2 text-body"     }, "All documents with this Ignored Spelling"     )
              , React.createElement('div', { className: "table-responsive"}
                , React.createElement('table', { className: "table table-borderless align-middle mb-0"   }
                  , React.createElement('thead', {}
                    , React.createElement('tr', {}
                      , React.createElement('th', { className: "fw-semibold text-body py-3"  }, "Title and URL "   , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 fs-12"   , 'aria-hidden': true} ))
                      , React.createElement('th', { className: "fw-semibold text-body py-3"  }, "Views " , React.createElement('i', { className: "isax isax-arrow-up-down ms-1 fs-12 opacity-50"    , 'aria-hidden': true} ))
                    )
                  )
                  , React.createElement('tbody', {}
                    , React.createElement('tr', {}
                      , React.createElement('td', { colSpan: 2, className: "py-5 text-center text-muted"  }, "No content was found"   )
                    )
                  )
                )
              )
            )
          )
        )
      )

      , React.createElement(IgnoredSpellingPageDetailsDrawer, {
        open: selectedPageForDetails != null,
        onClose: () => setSelectedPageForDetails(null),
        page: selectedPageForDetails ? { title: selectedPageForDetails.title, url: selectedPageForDetails.url } : null,
        defaultQaSubView: "ignored-misspellings"}
      )
    )
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
