import React, { useState, useMemo  } from "react";

 






const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, link: "https://cms-assets.bajajfinserv.in/docs/terms-and-conditions.txt", type: "Text document", responseCode: "200" },
  { id: 2, link: "https://cms-assets.bajajfinserv.in/docs/privacy-policy.txt", type: "Text document", responseCode: "200" },
  { id: 3, link: "https://cms-assets.bajajfinserv.in/docs/readme.txt", type: "Text document", responseCode: "200" },
  { id: 4, link: "https://cms-assets.bajajfinserv.in/docs/faq.txt", type: "Text document", responseCode: "200" },
  { id: 5, link: "https://cms-assets.bajajfinserv.in/docs/code-of-conduct.txt", type: "Text document", responseCode: "200" },
  { id: 6, link: "https://cms-assets.bajajfinserv.in/docs/whistleblower-policy.txt", type: "Text document", responseCode: "200" },
  { id: 7, link: "https://cms-assets.bajajfinserv.in/docs/notice.txt", type: "Text document", responseCode: "200" },
  { id: 8, link: "https://cms-assets.bajajfinserv.in/docs/accessibility-statement.txt", type: "Text document", responseCode: "200" },
];



export default function InventoryTextDocumentsView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((r) => r.link.toLowerCase().includes(search.trim().toLowerCase()));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  return (
    React.createElement(React.Fragment, null
      , React.createElement('div', { className: "card border-0 shadow-sm mb-3"   }
        , React.createElement('div', { className: "card-body"}
          , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-3"    }
            , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
              , React.createElement('span', { className: "avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"        }
                , React.createElement('i', { className: "isax isax-document fs-22"  , 'aria-hidden': true})
              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold" }, "Text documents" )
                , React.createElement('p', { className: "text-muted fs-13 mb-0"  }, filteredItems.length, " found" )
              )
            )
            , React.createElement('div', { className: "flex-grow-1 flex-md-grow-0" , style: { minWidth: 200, maxWidth: 320 }}
              , React.createElement('input', {
                type: "search",
                className: "form-control form-control-sm" ,
                placeholder: "Search...",
                value: search,
                onChange: (e) => { setSearch(e.target.value); setCurrentPage(1); },
                'aria-label': "Search text documents"  }
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
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Type")
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Response code" )
                )
              )
              , React.createElement('tbody', {}
                , paginatedItems.map((row) => (
                  React.createElement('tr', { key: row.id}
                    , React.createElement('td', { className: "px-4 py-2" }
                      , React.createElement('a', { href: row.link, target: "_blank", rel: "noopener noreferrer" , className: "text-primary text-decoration-none text-break"  }, row.link)
                    )
                    , React.createElement('td', { className: "px-4 py-2" }, React.createElement('span', { className: "badge bg-secondary bg-opacity-25 text-body"   }, row.type))
                    , React.createElement('td', { className: "px-4 py-2 text-body"  }, row.responseCode)
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
              , React.createElement('span', { className: "text-muted small" }, (currentPage - 1) * rowsPerPage + 1, "-", Math.min(currentPage * rowsPerPage, filteredItems.length), " of "  , filteredItems.length)
            )
            , React.createElement('nav', { 'aria-label': "Text documents pagination"  }
              , React.createElement('ul', { className: "pagination pagination-sm mb-0"  }
                , React.createElement('li', { className: `page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage <= 1, 'aria-label': "Previous"}, "Previous")
                )
                , Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  React.createElement('li', { key: p, className: `page-item ${currentPage === p ? "active" : ""}`}, React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage(p)}, p))
                ))
                , React.createElement('li', { className: `page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage >= totalPages, 'aria-label': "Next"}, "Next")
                )
              )
            )
          )
        )
      )
    )
  );
}
