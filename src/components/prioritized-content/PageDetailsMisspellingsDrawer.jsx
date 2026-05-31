import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import BrokenLinkIssueDrawer from "./BrokenLinkIssueDrawer";
import BrokenImageIssueDrawer from "./BrokenImageIssueDrawer";
import BrokenImagesSection from "./BrokenImagesSection";
import MisspellingsSection from "./MisspellingsSection";
import MisspellingDetailDrawer from "./MisspellingDetailDrawer";
import PotentialMisspellingsSectionPageDetails from "./PotentialMisspellingsSectionPageDetails";
import PotentialMisspellingIssueDrawer from "./PotentialMisspellingIssueDrawer";
import IgnoredSpellingsSection from "./IgnoredSpellingsSection";
import IgnoredSpellingDetailDrawer from "./IgnoredSpellingDetailDrawer";
import DictionarySection from "./DictionarySection";
import DictionaryDetailDrawer from "./DictionaryDetailDrawer";
import AccessibilitySection from "./AccessibilitySection";
import SeoSection from "./SeoSection";
import InventorySection from "./InventorySection";
import PerformanceSection from "./PerformanceSection";
import PageDashboardContent from "./PageDashboardContent";
import { downloadBlob, safeFilename } from "@/lib/download";
import { usePageDetails } from "@/hooks/usePageDetails";
import { useQaDomainId } from "@/hooks/useQaDomainId";

const BROKEN_LINKS_PAGE_OPTIONS = [10, 50, 100, 500];
const POLICY_FILTERS = ["All", "Unwanted", "Required", "Matches"];
const DEFAULT_BACKDROP_Z = 1050;
const DEFAULT_PANEL_Z = 1055;

export default function PageDetailsMisspellingsDrawer({
  open,
  onClose,
  page: pageProp,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
  defaultQaSubView = "misspellings",
  defaultTab,
}) {
  const domainId = useQaDomainId();
  const pageUrl = pageProp?.url || "";
  const { page: fetchedPage, loading: pageLoading, refetch } = usePageDetails(domainId, pageUrl, open && !!pageUrl);

  const [activeTab, setActiveTab] = useState(defaultTab || "dashboard");
  const [policyFilterTab, setPolicyFilterTab] = useState("All");
  const [qaSubView, setQaSubView] = useState(defaultQaSubView);
  const [selectedBrokenLinkId, setSelectedBrokenLinkId] = useState(null);
  const [selectedBrokenImageId, setSelectedBrokenImageId] = useState(null);
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const [selectedPotentialMisspellingId, setSelectedPotentialMisspellingId] = useState(null);
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] = useState(null);
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(null);
  const [brokenLinksPage, setBrokenLinksPage] = useState(1);
  const [brokenLinksRowsPerPage, setBrokenLinksRowsPerPage] = useState(10);

  const effectivePage = fetchedPage || pageProp || {};

  const brokenLinksCount = effectivePage.brokenLinks?.length || 0;
  const brokenImagesCount = effectivePage.brokenImages?.length || 0;
  const misspellingsCount = effectivePage.misspellings?.length || 0;
  const potentialCount = effectivePage.potentialMisspellings?.length || 0;
  const seoIssuesCount = effectivePage.seoOpportunitiesCount ?? effectivePage.seoImprovements?.length ?? 0;
  const accessibilityScore = effectivePage.lighthouseAccessibilityScore ?? effectivePage.accessibility?.score ?? 0;
  const seoScore = effectivePage.seoScore ?? effectivePage.lighthouseSeoScore ?? 0;

  const tabs = useMemo(
    () => [
      { key: "dashboard", label: "Page dashboard", icon: "isax-document-text" },
      {
        key: "policies",
        label: "Policies",
        icon: "isax-shield-tick",
        badge: effectivePage.policies?.length || undefined,
      },
      {
        key: "qa",
        label: "Quality Assurance",
        icon: "isax-tick-circle",
        badge: effectivePage.qaIssueCount || undefined,
      },
      { key: "accessibility", label: "Accessibility", icon: "isax-people5" },
      { key: "seo", label: "SEO", icon: "isax-chart-215", badge: seoIssuesCount || undefined },
      { key: "inventory", label: "Inventory", icon: "isax-book5" },
      { key: "performance", label: "Performance", icon: "isax-chart-215" },
    ],
    [effectivePage.policies, effectivePage.qaIssueCount, seoIssuesCount]
  );

  const qaSidebarItems = useMemo(
    () => [
      { key: "broken-links", label: "Broken Links", icon: "isax-link-2", badge: brokenLinksCount, badgeVariant: "danger" },
      { key: "broken-images", label: "Broken Images", icon: "isax-document-text", badge: brokenImagesCount, badgeVariant: "danger" },
      { key: "misspellings", label: "Misspellings", icon: "isax-edit-2", badge: misspellingsCount, badgeVariant: "danger" },
      { key: "potential-misspellings", label: "Potential Misspellings", icon: "isax-edit-2", badge: potentialCount, badgeVariant: "primary" },
      { key: "ignored-misspellings", label: "Ignored Misspellings", icon: "isax-edit-2" },
      { key: "dictionary", label: "Dictionary", icon: "isax-book-1" },
      { key: "readability", label: "Readability", icon: "isax-book5" },
      { key: "language", label: "Language Validation", icon: "isax-tick-circle", status: "ok" },
    ],
    [brokenLinksCount, brokenImagesCount, misspellingsCount, potentialCount]
  );

  const filteredPolicies = useMemo(() => {
    const list = effectivePage.policies || [];
    if (policyFilterTab === "All") return list;
    const key = policyFilterTab.toLowerCase();
    return list.filter((p) => String(p.category || "").toLowerCase() === key);
  }, [effectivePage.policies, policyFilterTab]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const brokenLinksList = effectivePage.brokenLinks || [];
  const brokenLinksTotalPages = Math.max(1, Math.ceil(brokenLinksList.length / brokenLinksRowsPerPage));
  const brokenLinksPaginated = useMemo(() => {
    const start = (brokenLinksPage - 1) * brokenLinksRowsPerPage;
    return brokenLinksList.slice(start, start + brokenLinksRowsPerPage);
  }, [brokenLinksPage, brokenLinksRowsPerPage, brokenLinksList]);

  const pagesWithMisspellingForDrawer = useMemo(() => {
    if (!effectivePage.url) return [];
    return [
      {
        title: effectivePage.title,
        url: effectivePage.url,
        language: "English",
        misspellings: misspellingsCount,
        potentialMisspellings: potentialCount,
        views: 0,
      },
    ];
  }, [effectivePage.title, effectivePage.url, misspellingsCount, potentialCount]);

  const baseName = safeFilename("Broken-Links-Report");

  const exportBrokenLinksCSV = useCallback(() => {
    const header = "Broken link,Response code,Type\n";
    const body = brokenLinksList
      .map((r) => `"${(r.url || "").replace(/"/g, '""')}","${r.responseCode || ""}","${r.type || ""}"`)
      .join("\n");
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
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start gap-3 justify-content-between">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light flex-shrink-0"
              title="Close"
              onClick={handleClose}
              aria-label="Close drawer"
            >
              <i className="isax isax-close-circle fs-20" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-grow-1 text-start">
              <h5 id="page-details-drawer-title" className="mb-1 text-truncate fw-semibold text-body">
                {effectivePage.title || "(No title found)"}
              </h5>
              {effectivePage.url && (
                <a
                  href={effectivePage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                >
                  <i className="isax isax-export-3 text-primary" aria-hidden="true" />
                  {effectivePage.url}
                </a>
              )}
            </div>
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light flex-shrink-0"
              title="Refresh page data"
              onClick={() => refetch()}
              disabled={pageLoading}
            >
              <i className={`isax isax-refresh-25 ${pageLoading ? "spin" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>

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
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="badge bg-danger bg-opacity-10 text-danger ms-1">{tab.badge}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 flex-grow-1 overflow-auto">
          {pageLoading && activeTab !== "dashboard" && (
            <p className="text-muted py-3">Loading page data…</p>
          )}

          {activeTab === "dashboard" && (
            <PageDashboardContent
              page={effectivePage}
              loading={pageLoading}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "policies" && (
            <div className="row g-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                      <h6 className="mb-0 fw-semibold">Content policies</h6>
                      <span className="text-primary fw-semibold">
                        {effectivePage.policyCompliancePercent ?? 100}% compliance
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {POLICY_FILTERS.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`btn btn-sm ${policyFilterTab === tab ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setPolicyFilterTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPolicies.map((p) => (
                            <tr key={p.id}>
                              <td>{p.name}</td>
                              <td className="text-capitalize">{p.category || "—"}</td>
                              <td>
                                {p.isHit ? (
                                  <span className="badge bg-danger bg-opacity-10 text-danger">Violation</span>
                                ) : (
                                  <span className="badge bg-success bg-opacity-10 text-success">Passed</span>
                                )}
                              </td>
                              <td>{p.priority || "—"}</td>
                            </tr>
                          ))}
                          {filteredPolicies.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-muted">
                                No policy results for this page.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "qa" && !pageLoading && (
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
                            <i className={`isax ${item.icon} fs-18`} aria-hidden="true" />
                            <span>{item.label}</span>
                          </span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`badge rounded-pill bg-${item.badgeVariant || "secondary"} bg-opacity-10 text-${item.badgeVariant || "secondary"}`}>
                              {item.badge}
                            </span>
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
                      <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Broken Links</h6>
                          <p className="text-muted small mb-0">{brokenLinksList.length} issues found</p>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={exportBrokenLinksCSV}>
                          Export CSV
                        </button>
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
                            {brokenLinksPaginated.map((row) => (
                              <tr key={row.id}>
                                <td className="ps-4 small text-break">
                                  <a href={row.url} target="_blank" rel="noreferrer" className="text-primary">
                                    {row.url}
                                  </a>
                                </td>
                                <td>{row.responseCode}</td>
                                <td>
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary">{row.type}</span>
                                </td>
                                <td className="text-end pe-4">
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-light"
                                    onClick={() => setSelectedBrokenLinkId(row.id)}
                                  >
                                    <i className="isax isax-info-circle" aria-hidden="true" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {brokenLinksList.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-4 text-muted">
                                  No broken links on this page.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {brokenLinksTotalPages > 1 && (
                        <div className="p-3 border-top d-flex align-items-center gap-2">
                          <span className="text-muted fs-13">Rows per page</span>
                          <select
                            className="form-select form-select-sm w-auto"
                            value={brokenLinksRowsPerPage}
                            onChange={(e) => {
                              setBrokenLinksRowsPerPage(Number(e.target.value));
                              setBrokenLinksPage(1);
                            }}
                          >
                            {BROKEN_LINKS_PAGE_OPTIONS.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            disabled={brokenLinksPage <= 1}
                            onClick={() => setBrokenLinksPage((p) => p - 1)}
                          >
                            Prev
                          </button>
                          <span className="fs-13 text-muted">
                            {brokenLinksPage} / {brokenLinksTotalPages}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            disabled={brokenLinksPage >= brokenLinksTotalPages}
                            onClick={() => setBrokenLinksPage((p) => p + 1)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {qaSubView === "broken-images" && (
                  <BrokenImagesSection
                    items={effectivePage.brokenImages || []}
                    onOpenIssue={setSelectedBrokenImageId}
                  />
                )}
                {qaSubView === "misspellings" && (
                  <MisspellingsSection
                    variant="page"
                    hideDetailsColumn
                    showLanguage={false}
                    items={effectivePage.misspellings || []}
                    onOpenIssue={setSelectedMisspellingId}
                  />
                )}
                {qaSubView === "potential-misspellings" && (
                  <PotentialMisspellingsSectionPageDetails
                    items={effectivePage.potentialMisspellings || []}
                    onOpenIssue={setSelectedPotentialMisspellingId}
                  />
                )}
                {qaSubView === "readability" && (
                  <div className="card border shadow-sm">
                    <div className="card-body">
                      <h6 className="fw-semibold mb-2">Readability</h6>
                      <p className="mb-1">
                        Level: <strong>{effectivePage.readabilityLevel || "—"}</strong>
                      </p>
                      <p className="mb-0 text-muted fs-13">
                        Score (grade): {effectivePage.readabilityScore ?? "—"}
                      </p>
                    </div>
                  </div>
                )}
                {(qaSubView === "ignored-misspellings" || qaSubView === "dictionary" || qaSubView === "language") && (
                  <div className="card border shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                      <p className="mb-0 fs-13">
                        {qaSubView === "language"
                          ? "Language validation is not available for this page yet."
                          : "No items for this section on this page."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "seo" && !pageLoading && (
            <SeoSection issues={effectivePage.seoImprovements || []} score={seoScore} />
          )}

          {activeTab === "accessibility" && !pageLoading && (
            <AccessibilitySection data={effectivePage.accessibility} score={accessibilityScore} />
          )}

          {activeTab === "inventory" && !pageLoading && (
            <InventorySection page={effectivePage} embeddedInDrawer />
          )}

          {activeTab === "performance" && !pageLoading && (
            <PerformanceSection page={effectivePage} embeddedInDrawer />
          )}
        </div>
      </div>

      <BrokenLinkIssueDrawer
        open={selectedBrokenLinkId != null}
        onClose={() => setSelectedBrokenLinkId(null)}
        issue={brokenLinksList.find((r) => r.id === selectedBrokenLinkId)}
        page={{ title: effectivePage.title, url: effectivePage.url }}
      />
      <BrokenImageIssueDrawer
        open={selectedBrokenImageId != null}
        onClose={() => setSelectedBrokenImageId(null)}
        image={(effectivePage.brokenImages || []).find((img) => img.id === selectedBrokenImageId)}
      />
      <MisspellingDetailDrawer
        open={selectedMisspellingId != null}
        onClose={() => setSelectedMisspellingId(null)}
        misspelling={(effectivePage.misspellings || []).find((m) => m.id === selectedMisspellingId)}
        pagesWithMisspelling={pagesWithMisspellingForDrawer}
      />
      <PotentialMisspellingIssueDrawer
        open={selectedPotentialMisspellingId != null}
        onClose={() => setSelectedPotentialMisspellingId(null)}
        item={(effectivePage.potentialMisspellings || []).find((m) => m.id === selectedPotentialMisspellingId)}
        pagesWithMisspelling={pagesWithMisspellingForDrawer}
      />
    </>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
