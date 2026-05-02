import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";

const DRAWER_TABS = [
  { key: "dashboard", label: "Document Dashboard", icon: "isax-document-text" },
  { key: "policies", label: "Policies", icon: "isax-scroll", badge: 57 },
  { key: "qa", label: "Quality Assurance", icon: "isax-tick-circle", badge: 15 },
  { key: "accessibility", label: "Accessibility", icon: "isax-people5", badge: 12 },
  { key: "privacy", label: "Data Privacy", icon: "isax-lock" },
  { key: "inventory", label: "Inventory", icon: "isax-building" },
];

const ACCESSIBILITY_CHECKS = [
  "Timing Adjustable",
  "Three Flashes or Below Threshold",
  "THead, TBody and TFoot",
  "Tabs Key",
  "Table Rows",
  "Table Cells",
  "Table",
  "Summary attribute",
  "Server-side image maps",
  "Scope attribute",
  "RP, RT and RB - Valid Parent",
  "Reading Order",
  "Redundant Entry",
  "Reflow",
  "Required attribute",
  "Resize text",
  "Role attribute",
  "Row and column headers",
  "Same functionality for all",
  "Sensory characteristics",
];

const PdfAccessibilityDrawer = ({ open, onClose, pdf }) => {
  useEffect(() => {
    if (!open) return;
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

  if (!open) return null;

  const DRAWER_Z_BACKDROP = 1065;
  const DRAWER_Z_PANEL = 1070;
  const title = pdf?.title ?? "PDF";
  const url = pdf?.url ?? "";

  const drawerContent = (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{ zIndex: DRAWER_Z_PANEL, width: "min(100%, 1200px)", maxWidth: "1200px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-accessibility-drawer-title"
      >
        {/* Header: close, title, url */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex align-items-start gap-3">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <i className="isax isax-close-circle text-body" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-grow-1">
              <h6 className="mb-1 fw-semibold text-body" id="pdf-accessibility-drawer-title">
                {title}
              </h6>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                >
                  <ExternalLinkIcon size={12} />
                  {url}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-2 flex-shrink-0 bg-white">
          <div className="d-flex flex-wrap gap-1">
            {DRAWER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm rounded-2 border-0 d-inline-flex align-items-center gap-1 py-2 px-3 ${
                  tab.key === "accessibility" ? "bg-primary text-white" : "text-body bg-light"
                }`}
              >
                <i className={`isax ${tab.icon} fs-14`} aria-hidden="true" />
                <span className="fs-13">{tab.label}</span>
                {"badge" in tab && tab.badge != null && (
                  <span className={`badge rounded-pill ms-1 ${tab.key === "accessibility" ? "bg-white bg-opacity-25 text-white" : "bg-secondary bg-opacity-25 text-body"}`} style={{ fontSize: "0.7rem" }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Demo data banner */}
        <div className="flex-shrink-0 px-4 py-2 bg-info bg-opacity-10 border-0 border-bottom border-info border-opacity-25">
          <p className="mb-0 fs-13 text-body">
            You are currently using Demo Data, certain features will be unavailable.
          </p>
        </div>

        {/* Main content */}
        <div className="flex-grow-1 overflow-auto px-4 py-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <h6 className="mb-0 fw-semibold text-body d-flex align-items-center gap-2">
              <i className="isax isax-people5 text-primary fs-20" aria-hidden="true" /> Accessibility Compliance Scan
            </h6>
            <button type="button" className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-1">
              <i className="isax isax-document-download fs-14" aria-hidden="true" /> Start PDF accessibility scan
            </button>
          </div>

          <div className="alert alert-info border-0 bg-info bg-opacity-10 mb-4 py-2 px-3">
            <p className="mb-0 fs-13">
              Please perform a PDF scan to see the results for the checks below.
            </p>
          </div>

          <div className="card border border-secondary border-opacity-25 rounded-2">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold">Check name</th>
                      <th className="py-3 pe-4 text-body fs-13 fw-semibold text-end">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCESSIBILITY_CHECKS.map((checkName) => (
                      <tr key={checkName}>
                        <td className="py-2 ps-4">
                          <span className="d-inline-flex align-items-center gap-2 fs-13 text-body">
                            <i className="isax isax-document-text text-muted fs-14" aria-hidden="true" />
                            {checkName}
                          </span>
                        </td>
                        <td className="py-2 pe-4 text-end fs-13 text-body">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

export default PdfAccessibilityDrawer;
