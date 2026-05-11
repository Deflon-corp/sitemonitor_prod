import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import BrokenLinkIssueDrawer from "./BrokenLinkIssueDrawer";
import BrokenImageIssueDrawer from "./BrokenImageIssueDrawer";
import BrokenImagesSection, { BROKEN_IMAGES_SAMPLE } from "./BrokenImagesSection";
import MisspellingsSection, { MISSPELLINGS_SAMPLE } from "./MisspellingsSection";
import MisspellingDetailDrawer from "./MisspellingDetailDrawer";

import PotentialMisspellingsSectionPageDetails from "./PotentialMisspellingsSectionPageDetails";
import { POTENTIAL_MISSPELLINGS_SAMPLE } from "./PotentialMisspellingsSection";
import PotentialMisspellingIssueDrawer from "./PotentialMisspellingIssueDrawer";

import IgnoredSpellingsSection, { IGNORED_SPELLINGS_SAMPLE } from "./IgnoredSpellingsSection";
import IgnoredSpellingDetailDrawer from "./IgnoredSpellingDetailDrawer";

import DictionarySection, { DICTIONARY_SAMPLE } from "./DictionarySection";
import DictionaryDetailDrawer from "./DictionaryDetailDrawer";

import AccessibilitySection from "./AccessibilitySection";
import SeoSection from "./SeoSection";
import InventorySection from "./InventorySection";
import PerformanceSection from "./PerformanceSection";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const BROKEN_LINKS_PAGE_OPTIONS = [10, 50, 100, 500];
const POLICY_FILTERS = ["All", "Unwanted", "Required", "Matches"];
const DEFAULT_BACKDROP_Z = 1050;
const DEFAULT_PANEL_Z = 1055;

export default function PageDetailsMisspellingsDrawer({
  open,
  onClose,
  page,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
  defaultQaSubView = "misspellings",
  defaultTab,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || "qa");
  const [policyFilterTab, setPolicyFilterTab] = useState("All");
  const [qaSubView, setQaSubView] = useState(defaultQaSubView);
  const [selectedBrokenLinkId, setSelectedBrokenLinkId] = useState(null);
  const [selectedBrokenImageId, setSelectedBrokenImageId] = useState(null);
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const [selectedPotentialMisspellingId, setSelectedPotentialMisspellingId] = useState(null);
  const [overridePage, setOverridePage] = useState(null);
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] = useState(null);
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(null);
  const [brokenLinksPage, setBrokenLinksPage] = useState(1);
  const [brokenLinksRowsPerPage, setBrokenLinksRowsPerPage] = useState(10);

  const effectivePage = overridePage || page || {};

  // Extract counts safely
  const brokenLinksCount = effectivePage.brokenLinks?.length || 0;
  const brokenImagesCount = effectivePage.brokenImages?.length || 0;
  const misspellingsCount = effectivePage.misspellings?.length || 0;
  const seoIssuesCount = (effectivePage.seo?.length || 0) || (effectivePage.seoImprovements?.length || 0);
  const accessibilityScore = effectivePage.accessibility?.score || 0;
  const performanceScore = effectivePage.performance?.score || 0;
  const seoScore = effectivePage.seoScore || 0;

  const tabs = useMemo(() => [
    { key: "dashboard", label: "Page dashboard", icon: "isax-document-text" },
    { key: "policies", label: "Policies", icon: "isax-shield-tick", badge: effectivePage.policies?.length || undefined },
    { key: "qa", label: "Quality Assurance", icon: "isax-tick-circle", badge: (brokenLinksCount + brokenImagesCount + misspellingsCount) || undefined },
    { key: "accessibility", label: "Accessibility", icon: "isax-people5", badge: undefined },
    { key: "seo", label: "SEO", icon: "isax-chart-215", badge: seoIssuesCount || undefined },
    { key: "inventory", label: "Inventory", icon: "isax-book5" },
    { key: "performance", label: "Performance", icon: "isax-chart-215" },
  ], [brokenLinksCount, brokenImagesCount, misspellingsCount, seoIssuesCount, effectivePage.policies]);

  const qaSidebarItems = useMemo(() => [
    { key: "broken-links", label: "Broken Links", icon: "isax-link-2", badge: brokenLinksCount, badgeVariant: "danger" },
    { key: "broken-images", label: "Broken Images", icon: "isax-document-text", badge: brokenImagesCount, badgeVariant: "danger" },
    { key: "misspellings", label: "Misspellings", icon: "isax-edit-2", badge: misspellingsCount, badgeVariant: "danger" },
    { key: "potential-misspellings", label: "Potential Misspellings", icon: "isax-edit-2", badge: 0, badgeVariant: "primary" },
    { key: "ignored-misspellings", label: "Ignored Misspellings", icon: "isax-edit-2" },
    { key: "dictionary", label: "Dictionary", icon: "isax-book-1" },
    { key: "readability", label: "Readability", icon: "isax-book5" },
    { key: "language", label: "Language Validation", icon: "isax-tick-circle", status: "ok" },
  ], [brokenLinksCount, brokenImagesCount, misspellingsCount]);

  const handleClose = useCallback(() => {
    setOverridePage(null);
    onClose();
  }, [onClose]);

  const brokenLinksList = effectivePage.brokenLinks || [];
  const brokenLinksTotalPages = Math.max(1, Math.ceil(brokenLinksList.length / brokenLinksRowsPerPage));
  const brokenLinksPaginated = useMemo(() => {
    const start = (brokenLinksPage - 1) * brokenLinksRowsPerPage;
    return brokenLinksList.slice(start, start + brokenLinksRowsPerPage);
  }, [brokenLinksPage, brokenLinksRowsPerPage, brokenLinksList]);

  const pagesWithMisspellingForDrawer = useMemo(() => {
    if (!effectivePage.url) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, language: "English (Australian)", misspellings: 2, potentialMisspellings: 113, views: 0 },
    ];
  }, [effectivePage.title, effectivePage.url]);

  const pagesWithDictionaryEntryForDrawer = useMemo(() => {
    if (!effectivePage.url) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, language: "English (Australian)", pages: 2, views: 0 },
    ];
  }, [effectivePage.title, effectivePage.url]);

  const pagesWithIgnoredSpellingForDrawer = useMemo(() => {
    if (!effectivePage.url) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, priority: "High", views: 0 },
    ];
  }, [effectivePage.title, effectivePage.url]);

  const baseName = safeFilename("Broken-Links-Report");

  const exportBrokenLinksCSV = useCallback(() => {
    const header = "Broken link,Response code,Type\n";
    const body = brokenLinksList.map((r) => `"${(r.url || "").replace(/"/g, '""')}","${r.responseCode || ""}","${r.type || ""}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, brokenLinksList]);

  useEffect(() => {
    if (open) {
      if (defaultTab) setActiveTab(defaultTab);
      if (defaultQaSubView) setQaSubView(defaultQaSubView);
    }
  }, [open, defaultQaSubView, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  if (!open) return null;

  const drawerContent = (
    <>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: backdropZIndex }}
        aria-hidden="true"
        onClick={handleClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow overflow-hidden d-flex flex-column"
        style={{ zIndex: panelZIndex, width: "min(100%, 1400px)", maxWidth: "1400px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-details-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start gap-3 justify-content-between">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light flex-shrink-0 order-first align-self-center"
              title="Close"
              onClick={handleClose}
              aria-label="Close drawer"
            >
              <i className="isax isax-close-circle fs-20" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-grow-1 order-2 text-start">
              <h5 id="page-details-drawer-title" className="mb-1 text-truncate fw-semibold text-body">
                {effectivePage.title || "(No title found)"}
              </h5>
              {effectivePage.url && (
                <span className="d-inline-flex align-items-center gap-1 mt-1">
                  <a
                    href={effectivePage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                    title="Open in new tab"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary flex-shrink-0" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-truncate d-inline-block" style={{ maxWidth: "100%" }}>{effectivePage.url}</span>
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <div className="border-bottom bg-white px-4">
          <div className="row g-2 py-2">
            {tabs.map((tab) => (
              <div key={tab.key} className="col-6 col-md-3">
                <button
                  type="button"
                  className={`btn btn-sm w-100 d-inline-flex align-items-center justify-content-center justify-content-md-start ${activeTab === tab.key ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={`isax ${tab.icon} me-1 fs-14 flex-shrink-0`} aria-hidden="true" />
                  <span className="text-truncate">{tab.label}</span>
                  {tab.badge !== undefined && <span className="ms-1 opacity-75">{tab.badge}</span>}
                  {activeTab === tab.key && <i className="isax isax-tick-circle ms-1 fs-14 flex-shrink-0" aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow-1 overflow-auto">
          {activeTab === "dashboard" && (
            <div className="row g-4">
              <div className="col-md-6 d-flex">
                <div className="card flex-fill border shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <i className="isax isax-people5 text-primary fs-18" /> Accessibility
                      </h6>
                      <button className="btn btn-link btn-sm p-0" onClick={() => setActiveTab("accessibility")}>
                         <i className="isax isax-arrow-right-1" />
                      </button>
                    </div>
                    <div className="row align-items-center g-3">
                      <div className="col-5">
                         <div className="position-relative d-inline-flex align-items-center justify-content-center">
                            <svg width="100" height="100" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                              <circle cx="70" cy="70" r="62" fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(accessibilityScore / 100) * 389} 389`} transform="rotate(-90 70 70)" />
                            </svg>
                            <span className="position-absolute fw-bold">{accessibilityScore}%</span>
                         </div>
                      </div>
                      <div className="col-7">
                        <p className="fs-13 text-muted mb-0">Overall accessibility compliance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-flex">
                <div className="card flex-fill border shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <i className="isax isax-chart-215 text-primary fs-18" /> SEO
                      </h6>
                      <button className="btn btn-link btn-sm p-0" onClick={() => setActiveTab("seo")}>
                         <i className="isax isax-arrow-right-1" />
                      </button>
                    </div>
                    <div className="row align-items-center g-3">
                      <div className="col-5">
                         <div className="position-relative d-inline-flex align-items-center justify-content-center">
                            <svg width="100" height="100" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                              <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(seoScore / 100) * 389} 389`} transform="rotate(-90 70 70)" />
                            </svg>
                            <span className="position-absolute fw-bold">{seoScore}%</span>
                         </div>
                      </div>
                      <div className="col-7">
                        <p className="fw-semibold fs-13 mb-1">SEO opportunities</p>
                        <p className="fs-4 fw-bold mb-0">{seoIssuesCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "qa" && (
            <div className="row g-3">
              <div className="col-md-3">
                <div className="card border shadow-sm h-100">
                  <div className="card-body py-3">
                    <nav className="nav flex-column gap-1">
                      {qaSidebarItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setQaSubView(item.key)}
                          className={`nav-link border-0 text-start d-flex align-items-center justify-content-between py-2 px-3 rounded w-100 ${qaSubView === item.key ? "bg-primary bg-opacity-10 text-primary fw-medium" : "text-body bg-transparent"}`}
                        >
                          <span className="d-flex align-items-center gap-2">
                            <i className={`isax ${item.icon} fs-18`} />
                            <span>{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span className={`badge rounded-pill bg-${item.badgeVariant || "secondary"} bg-opacity-10 text-${item.badgeVariant || "secondary"}`}>{item.badge}</span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
              <div className="col-md-9">
                {qaSubView === "broken-links" && (
                  <div className="card border shadow-sm">
                    <div className="card-body p-0">
                      <div className="p-4 border-bottom">
                         <h6 className="mb-1">Broken Links</h6>
                         <p className="text-muted small mb-0">{brokenLinksList.length} issues found</p>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="ps-4">Broken link</th>
                              <th>Code</th>
                              <th>Type</th>
                              <th className="text-end pe-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {brokenLinksPaginated.map((row, idx) => (
                              <tr key={`bl-${idx}`}>
                                <td className="ps-4 small text-break"><a href={row.url} target="_blank" rel="noreferrer" className="text-primary">{row.url}</a></td>
                                <td>{row.responseCode}</td>
                                <td><span className="badge bg-secondary bg-opacity-10 text-secondary">{row.type}</span></td>
                                <td className="text-end pe-4">
                                   <button className="btn btn-icon btn-sm btn-light" onClick={() => setSelectedBrokenLinkId(idx)}><i className="isax isax-info-circle" /></button>
                                </td>
                              </tr>
                            ))}
                            {brokenLinksList.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-muted">No broken links found.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {qaSubView === "broken-images" && <BrokenImagesSection items={effectivePage.brokenImages || []} onOpenIssue={setSelectedBrokenImageId} />}
                {qaSubView === "misspellings" && <MisspellingsSection variant="page" hideDetailsColumn items={effectivePage.misspellings || []} onOpenIssue={setSelectedMisspellingId} />}
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <SeoSection issues={effectivePage.seoImprovements} score={effectivePage.seoScore} />
          )}

          {activeTab === "accessibility" && <AccessibilitySection />}
          {activeTab === "inventory" && <InventorySection />}
          {activeTab === "performance" && <PerformanceSection page={effectivePage} />}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
