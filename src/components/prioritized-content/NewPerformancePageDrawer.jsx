function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } import React, { useEffect, useState } from "react";
export default function NewPerformancePageDrawer({
  open,
  onClose,
  page = null,
}) {
  const [pageSearch, setPageSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState(page);

  const displayUrl = _nullishCoalesce(_optionalChain([selectedPage, 'optionalAccess', _ => _.url]), () => (""));

  useEffect(() => {
    if (page != null) setSelectedPage(page);
  }, [page]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25",
        style: { zIndex: 1060 },
        'aria-hidden': true,
        onClick: onClose
      }
      )
      , React.createElement('div', {
        className: "bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column overflow-hidden",
        style: { zIndex: 1065, width: "min(100%, 720px)" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "new-performance-page-drawer-title"
      }

        /* Header: X + Title */
        , React.createElement('div', { className: "border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 d-flex align-items-center gap-3" }
          , React.createElement('button', {
            type: "button",
            className: "btn btn-icon btn-sm btn-light border-0",
            onClick: onClose,
            'aria-label': "Close"
          }

            , React.createElement('i', { className: "isax isax-close-circle fs-22 text-body", 'aria-hidden': true })
          )
          , React.createElement('h5', { id: "new-performance-page-drawer-title", className: "mb-0 fw-semibold text-body" }, "New Performance Page"

          )
        )

        /* Body: two columns - Page Details (left) + Summary (right) */
        , React.createElement('div', { className: "flex-grow-1 overflow-auto p-4" }
          , React.createElement('div', { className: "row g-4" }
            /* Left: Page Details */
            , React.createElement('div', { className: "col-12 col-md-7" }
              , React.createElement('div', { className: "card border border-secondary border-opacity-25 shadow-sm h-100" }
                , React.createElement('div', { className: "card-body p-4" }
                  , React.createElement('h6', { className: "fw-semibold text-body mb-3" }, "Page Details")

                  , React.createElement('label', { className: "form-label text-body mb-2" }, "Select Page to scan")
                  , React.createElement('div', { className: "d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white mb-4" }
                    , React.createElement('span', { className: "d-flex align-items-center ps-3 flex-shrink-0 text-muted", 'aria-hidden': true }
                      , React.createElement('i', { className: "isax isax-search-normal-1", style: { fontSize: "1rem" }, 'aria-hidden': true })
                    )
                    , React.createElement('input', {
                      type: "search",
                      className: "form-control form-control-sm border-0 shadow-none py-2",
                      placeholder: "Search for Pages",
                      value: pageSearch,
                      onChange: (e) => setPageSearch(e.target.value),
                      'aria-label': "Search for pages",
                      style: { paddingLeft: "0.25rem" }
                    }
                    )
                  )
                )
              )
            )

            /* Right: Summary */
            , React.createElement('div', { className: "col-12 col-md-5" }
              , React.createElement('div', { className: "card border border-secondary border-opacity-25 shadow-sm h-100" }
                , React.createElement('div', { className: "card-body p-4" }
                  , React.createElement('h6', { className: "fw-semibold text-body mb-3" }, "Summary")
                  , React.createElement('div', { className: "d-flex flex-column gap-3 fs-13" }
                    , React.createElement('div', {}
                      , React.createElement('span', { className: "text-muted" }, "URL: ")
                      , React.createElement('span', { className: "text-body" }, displayUrl || "—")
                    )
                    , React.createElement('div', { className: "d-flex align-items-center gap-2" }
                      , React.createElement('span', { className: "text-muted" }, "Scan frequency: ")
                      , React.createElement('i', { className: "isax isax-timer-1 text-body", style: { fontSize: "1rem" }, 'aria-hidden': true })
                      , React.createElement('span', { className: "text-body" }, "Once a week")
                    )
                  )
                )
              )
            )
          )
        )

        /* Footer: Save */
        , React.createElement('div', { className: "border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25" }
          , React.createElement('div', { className: "d-flex justify-content-end" }
            , React.createElement('button', { type: "button", className: "btn btn-primary rounded-2 px-4" }, "Save"

            )
          )
        )
      )
    )
  );
}
