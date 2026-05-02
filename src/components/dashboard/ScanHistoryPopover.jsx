function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useRef  } from "react";

const SCAN_METRICS = [
  { color: "#374151", label: "Docs", value: "500" },
  { color: "#F38BBB", label: "Policies", value: "0 pages" },
  { color: "#5297FE", label: "QA", value: "500 pages" },
  { color: "#7539FF", label: "Accessibility", value: "500 pages" },
  { color: "#c4956a", label: "SEO", value: "500 pages" },
  { color: "#00D4FF", label: "Pages crawled", value: "500 pages" },
  { color: "#94a3b8", label: "Documents crawled", value: "0 documents" },
  { color: "#67e8f9", label: "Total crawled", value: "500 pages" },
];

export default function ScanHistoryPopover() {
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const contentEl = contentRef.current;
    if (!trigger || !contentEl) return;

    const Bootstrap = typeof window !== "undefined" ? (window ).bootstrap : undefined;
    if (!_optionalChain([Bootstrap, 'optionalAccess', _ => _.Popover])) return;

    const popover = new Bootstrap.Popover(trigger, {
      content: contentEl.innerHTML,
      title: "Dec 09",
      trigger: "hover",
      html: true,
      placement: "bottom",
      container: "body",
    });

    return () => {
      _optionalChain([popover, 'optionalAccess', _2 => _2.dispose, 'call', _3 => _3()]);
    };
  }, []);

  return (
    React.createElement(React.Fragment, null
      , React.createElement('span', {
        ref: triggerRef,
        className: "text-muted cursor-pointer text-decoration-underline text-decoration-underline-dotted"   ,
        style: { cursor: "pointer" },
        tabIndex: 0,
        role: "button",
        'data-bs-toggle': "popover"}
, "Last scan 500 pages and 0 docs"

      )
      , React.createElement('div', { ref: contentRef, className: "d-none", 'aria-hidden': true}
        , React.createElement('ul', { className: "list-unstyled mb-0 fs-13"  }
          , SCAN_METRICS.map(({ color, label, value }) => (
            React.createElement('li', { key: label, className: "d-flex align-items-center gap-2 mb-2"   }
              , React.createElement('span', {
                className: "rounded-circle flex-shrink-0" ,
                style: { backgroundColor: color, width: 6, height: 6 },
                'aria-hidden': true}
              )
              , React.createElement('span', { className: "text-body"}
                , label, ": " , React.createElement('span', { className: "fw-semibold", style: { color: "#E8A838" }}, value)
              )
            )
          ))
        )
      )
    )
  );
}
