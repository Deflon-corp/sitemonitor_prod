import React from "react";
import { useSearchParams } from "react-router-dom";
import QualityAssuranceView from "@/components/quality-assurance/QualityAssuranceView";
import { QaScanProvider } from "@/contexts/QaScanContext";

const QualityAssurance = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";

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
        <h6 className="mb-0">Quality Assurance</h6>
      </div>

      {showQAView && (
        <QaScanProvider>
          <QualityAssuranceView />
        </QaScanProvider>
      )}
    </div>
  );
};

export default QualityAssurance;
