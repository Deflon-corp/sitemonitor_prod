import React, { useEffect, useRef } from "react";

export default function ScanHistoryPopover({ latestSummary }) {
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const totalPages = latestSummary?.totalPages || 0;
  const lastScanDate = latestSummary?.lastScanDate
    ? new Date(latestSummary.lastScanDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const SCAN_METRICS = [
    {
      color: "#ef4444",
      label: "High Priority",
      value: latestSummary?.issueBreakdown?.high || 0,
    },
    {
      color: "#f59e0b",
      label: "Medium Priority",
      value: latestSummary?.issueBreakdown?.medium || 0,
    },
    {
      color: "#3b82f6",
      label: "Low Priority",
      value: latestSummary?.issueBreakdown?.low || 0,
    },
    {
      color: "#10b981",
      label: "SEO Score",
      value: (latestSummary?.finalSeoScore || 0) + "%",
    },
    { color: "#8b5cf6", label: "Pages Crawled", value: totalPages },
  ];

  useEffect(() => {
    const trigger = triggerRef.current;
    const contentEl = contentRef.current;
    if (!trigger || !contentEl) return;

    const Bootstrap =
      typeof window !== "undefined" ? window.bootstrap : undefined;
    if (!Bootstrap?.Popover) return;

    const popover = new Bootstrap.Popover(trigger, {
      content: contentEl.innerHTML,
      title: `Scan Summary - ${lastScanDate}`,
      trigger: "hover",
      html: true,
      placement: "bottom",
      container: "body",
    });

    return () => {
      popover?.dispose();
    };
  }, [latestSummary, lastScanDate]);

  return (
    <>
      <span
        ref={triggerRef}
        className="text-muted cursor-pointer text-decoration-underline text-decoration-underline-dotted fs-13"
        style={{ cursor: "pointer" }}
        tabIndex={0}
        role="button"
        data-bs-toggle="popover"
      >
        Last scan: {totalPages} pages
      </span>

      <div ref={contentRef} className="d-none" aria-hidden="true">
        <ul className="list-unstyled mb-0 fs-13">
          {SCAN_METRICS.map(({ color, label, value }) => (
            <li key={label} className="d-flex align-items-center gap-2 mb-2">
              <span
                className="rounded-circle flex-shrink-0"
                style={{ backgroundColor: color, width: 8, height: 8 }}
                aria-hidden="true"
              ></span>
              <span className="text-body" style={{ fontSize: "12px" }}>
                {label}:{" "}
                <span className="fw-semibold text-primary">{value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
