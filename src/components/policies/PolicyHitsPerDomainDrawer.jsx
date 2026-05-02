import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import ContentWithPolicyMatchesDrawer from "./ContentWithPolicyMatchesDrawer";

const DRAWER_Z_BACKDROP = 1065;
const DRAWER_Z_PANEL = 1070;

const PolicyHitsPerDomainDrawer = ({
  open,
  onClose,
  policyTitle,
  domainHits = [],
}) => {
  const [contentMatchesOpen, setContentMatchesOpen] = useState(false);
  const [contentMatchesDomain, setContentMatchesDomain] = useState(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setContentMatchesOpen(false);
      setContentMatchesDomain(null);
    }
  }, [open]);

  const handleDownload = () => {
    // Export as CSV or similar – placeholder
  };

  const openContentMatches = (d) => {
    setContentMatchesDomain(d);
    setContentMatchesOpen(true);
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow d-flex flex-column overflow-hidden"
        style={{ zIndex: DRAWER_Z_PANEL, width: "min(100%, 640px)", maxWidth: "640px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-hits-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <i className="isax isax-close-circle fs-22 text-body" aria-hidden="true" />
            </button>
            <h2 id="policy-hits-drawer-title" className="mb-0 fw-semibold text-body fs-5 flex-grow-1 text-center">Policy hits per domain</h2>
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"
              onClick={handleDownload}
              title="Download"
              aria-label="Download"
            >
              <i className="isax isax-document-download fs-20 text-body" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto p-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold">Domain</th>
                      <th className="py-3 pe-4 text-body fs-13 fw-semibold">Hits on domain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainHits.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-muted">No domain hits for this policy.</td>
                      </tr>
                    ) : (
                      domainHits.map((d) => (
                        <tr key={d.domainId}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column gap-1">
                              <span className="fw-medium text-primary">{d.domainName}</span>
                              <a
                                href={d.domainUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1"
                              >
                                <ExternalLinkIcon size={12} className="flex-shrink-0 text-primary" />
                                {d.domainUrl}
                              </a>
                            </div>
                          </td>
                          <td className="py-3 pe-4">
                            <div className="d-flex align-items-center justify-content-between gap-3">
                              <span className="badge bg-primary rounded-2 px-2 py-1 fs-13">
                                {d.hits}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm rounded-2 flex-shrink-0"
                                onClick={() => openContentMatches(d)}
                              >
                                Open domain policy
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContentWithPolicyMatchesDrawer
        open={contentMatchesOpen}
        onClose={() => setContentMatchesOpen(false)}
        domainName={contentMatchesDomain?.domainName}
        domainUrl={contentMatchesDomain?.domainUrl}
        pagesToFix={contentMatchesDomain?.hits}
      />
    </>
  );
};

export default PolicyHitsPerDomainDrawer;
