import React from "react";
import { useSearchParams } from "react-router-dom";
import QualityAssuranceView from "@/components/quality-assurance/QualityAssuranceView";
import { QaScanProvider, useQaScan } from "@/contexts/QaScanContext";
import { useQaDomainId } from "@/hooks/useQaDomainId";

const QualityAssuranceContent = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";
  const domainId = useQaDomainId();
  const { runQaScan, isScanning } = useQaScan();

  const showQAView =
    currentView === "summary" ||
    currentView === "summary-broken-links" ||
    currentView === "summary-potential-misspellings" ||
    currentView === "summary-broken-images" ||
    currentView === "summary-misspellings" ||
    currentView === "qa-errors" ||
    currentView === "links" ||
    currentView === "content-broken-links" ||
    currentView === "broken-links" ||
    currentView === "broken-images" ||
    currentView === "broken-links-sitemap" ||
    currentView === "spellcheck" ||
    currentView?.startsWith("spellcheck-") ||
    currentView === "readability" ||
    currentView?.startsWith("readability-") ||
    currentView === "language" ||
    currentView?.startsWith("language-");

  return (
    <div className="quality-assurance-page">
      <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <h6 className="mb-0 fs-18 fw-semibold text-body">Quality Assurance</h6>
        {domainId && showQAView && (
          <button
            type="button"
            className="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm"
            disabled={isScanning}
            onClick={() => runQaScan()}
            title="Run QA scan only (broken links, images, spellcheck, readability)"
          >
            {isScanning ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                Scanning...
              </>
            ) : (
              <>
                <i className="isax isax-tick-circle5 fs-16" aria-hidden="true" />
                Scan New Quality Assurance
              </>
            )}
          </button>
        )}
      </div>

      {showQAView && <QualityAssuranceView />}
    </div>
  );
};

const QualityAssurance = () => {
  return (
    <QaScanProvider>
      <QualityAssuranceContent />
    </QaScanProvider>
  );
};

export default QualityAssurance;
