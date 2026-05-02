import React, { useState, useMemo  } from "react";

 





const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, headerType: "h1", text: "Product specifications" },
  { id: 2, headerType: "h1", text: "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS)" },
  { id: 3, headerType: "h2", text: "Frequently asked questions" },
  { id: 4, headerType: "h2", text: "Choose a store you wish to shop from" },
  { id: 5, headerType: "h3", text: "Our Companies" },
  { id: 6, headerType: "h3", text: "Corporate Identity Number (CIN)" },
  { id: 7, headerType: "h3", text: "Bajaj Finserv Limited Regd. Office" },
  { id: 8, headerType: "h3", text: "URN - WEB/BFL/23-24/1/V1" },
  { id: 9, headerType: "h3", text: "IRDAI Corporate Agency (Composite) Regn No." },
  { id: 10, headerType: "h3", text: "Corporate Identity Number (CIN)" },
  { id: 11, headerType: "h2", text: "Related products" },
  { id: 12, headerType: "h3", text: "Delivery & returns" },
  { id: 13, headerType: "h3", text: "Warranty information" },
  { id: 14, headerType: "h4", text: "Technical details" },
  { id: 15, headerType: "h4", text: "Payment options" },
  { id: 16, headerType: "h2", text: "Customer reviews" },
  { id: 17, headerType: "h3", text: "Terms and conditions" },
  { id: 18, headerType: "h3", text: "Privacy policy" },
  { id: 19, headerType: "h4", text: "Contact us" },
  { id: 20, headerType: "h1", text: "Home" },
  { id: 21, headerType: "h2", text: "Featured categories" },
  { id: 22, headerType: "h3", text: "Electronics" },
  { id: 23, headerType: "h3", text: "Personal loans" },
  { id: 24, headerType: "h4", text: "Eligibility criteria" },
  { id: 25, headerType: "h2", text: "Quick links" },
];



export default function InventoryHeadersView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((r) => r.headerType.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
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
              , React.createElement('span', { className: "avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold fs-5"          }, "H"

              )
              , React.createElement('div', {}
                , React.createElement('h6', { className: "mb-0 fw-semibold" }, "Headers")
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
                'aria-label': "Search headers" }
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
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Header type" )
                  , React.createElement('th', { className: "text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4"      }, "Text")
                )
              )
              , React.createElement('tbody', {}
                , paginatedItems.map((row) => (
                  React.createElement('tr', { key: row.id, className: "border-bottom border-secondary border-opacity-25"  }
                    , React.createElement('td', { className: "px-4 py-3 text-body align-top"   , style: { minWidth: 100 }}
                      , React.createElement('code', { className: "fs-13 bg-light px-2 py-1 rounded"    }, row.headerType)
                    )
                    , React.createElement('td', { className: "px-4 py-3 text-body text-break"   , style: { wordBreak: "break-word" }}
                      , row.text
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
            , React.createElement('nav', { 'aria-label': "Headers pagination" }
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
