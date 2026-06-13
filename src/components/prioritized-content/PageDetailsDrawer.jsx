function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import BrokenLinkIssueDrawer from "./BrokenLinkIssueDrawer";
import BrokenImageIssueDrawer from "./BrokenImageIssueDrawer";
import BrokenImagesSection, {
  BROKEN_IMAGES_SAMPLE,
} from "./BrokenImagesSection";
import MisspellingsSection, {
  MISSPELLINGS_SAMPLE,
} from "./MisspellingsSection";
import MisspellingIssueDrawer from "./MisspellingIssueDrawer";
import PotentialMisspellingsSectionPageDetails from "./PotentialMisspellingsSectionPageDetails";
import PotentialMisspellingIssueDrawer from "./PotentialMisspellingIssueDrawer";
import IgnoredSpellingsSection, {
  IGNORED_SPELLINGS_SAMPLE,
} from "./IgnoredSpellingsSection";
import IgnoredSpellingIssueDrawer from "./IgnoredSpellingIssueDrawer";
import AccessibilitySection from "./AccessibilitySection";
import SeoSection from "./SeoSection";
import InventorySection from "./InventorySection";
import PerformanceSection from "./PerformanceSection";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import PageDashboardContent from "./PageDashboardContent";
import { usePageDetails } from "../../hooks/usePageDetails";
import { useQaDomainId } from "../../hooks/useQaDomainId";
const TABS = [
  { key: "dashboard", label: "Page dashboard", icon: "isax-document-text" },
  { key: "policies", label: "Policies", icon: "isax-shield-tick" },
  { key: "qa", label: "Quality Assurance", icon: "isax-tick-circle" },
  { key: "accessibility", label: "Accessibility", icon: "isax-people5" },
  { key: "seo", label: "SEO Audit", icon: "isax-chart-215" },
  { key: "inventory", label: "Inventory", icon: "isax-book5" },
  { key: "performance", label: "Performance", icon: "isax-chart-215" },
];

const POLICY_FILTERS = ["All", "Unwanted", "Required", "Matches"];

function PolicyComplianceDonut({ percent }) {
  const size = 48;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div
      className="position-relative flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden={true}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
    </div>
  );
}

const DEFAULT_BACKDROP_Z = 1050;
const DEFAULT_PANEL_Z = 1055;

export default function PageDetailsDrawer({
  open,
  onClose,
  page,
  defaultTab,
  defaultQaSubView,
  defaultInventorySubView,
  performanceSectionEmbedded,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
}) {
  const [activeTab, setActiveTab] = useState(
    _nullishCoalesce(defaultTab, () => "dashboard"),
  );
  const [policyFilterTab, setPolicyFilterTab] = useState("All");
  const [runPolicyAgainConfirmOpen, setRunPolicyAgainConfirmOpen] =
    useState(false);
  const [qaSubView, setQaSubView] = useState(
    _nullishCoalesce(defaultQaSubView, () => "broken-links"),
  );
  const [selectedBrokenLinkId, setSelectedBrokenLinkId] = useState(null);
  const [selectedBrokenImageId, setSelectedBrokenImageId] = useState(null);
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const [selectedPotentialMisspellingId, setSelectedPotentialMisspellingId] =
    useState(null);
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] =
    useState(null);
  const [brokenLinksPage, setBrokenLinksPage] = useState(1);
  const [brokenLinksRowsPerPage, setBrokenLinksRowsPerPage] = useState(10);

  const domainId = useQaDomainId();
  const pageUrl = _optionalChain([page, "optionalAccess", (_u) => _u.url]);
  const { page: fetchedPage, loading: pageLoading } = usePageDetails(
    domainId,
    pageUrl,
    open && !!pageUrl,
  );
  const effectivePage = fetchedPage || page || {};

  const brokenLinksList = effectivePage.brokenLinks || [];
  const brokenLinksCount = brokenLinksList.length;
  const brokenImagesCount = (effectivePage.brokenImages || []).length;
  const misspellingsCount = (effectivePage.misspellings || []).length;
  const potentialCount = (effectivePage.potentialMisspellings || []).length;

  const filteredPolicies = useMemo(() => {
    const list = effectivePage.policies || [];
    if (policyFilterTab === "All") return list;
    const key = policyFilterTab.toLowerCase();
    return list.filter((p) => String(p.category || "").toLowerCase() === key);
  }, [effectivePage.policies, policyFilterTab]);

  const policyCompliancePct = effectivePage.policyCompliancePercent ?? 100;

  const qaSidebarItems = useMemo(
    () => [
      {
        key: "broken-links",
        label: "Broken Links",
        icon: "isax-link-2",
        badge: brokenLinksCount,
        badgeVariant: "danger",
      },
      {
        key: "broken-images",
        label: "Broken Images",
        icon: "isax-document-text",
        badge: brokenImagesCount,
        badgeVariant: "danger",
      },
      {
        key: "misspellings",
        label: "Misspellings",
        icon: "isax-edit-2",
        badge: misspellingsCount,
        badgeVariant: "danger",
      },
      {
        key: "potential-misspellings",
        label: "Potential Misspellings",
        icon: "isax-edit-2",
        badge: potentialCount,
        badgeVariant: "primary",
      },
      { key: "readability", label: "Readability", icon: "isax-book5" },
    ],
    [brokenLinksCount, brokenImagesCount, misspellingsCount, potentialCount],
  );

  const BROKEN_LINKS_PAGE_OPTIONS = [10, 50, 100, 500];
  const brokenLinksTotalPages = Math.max(
    1,
    Math.ceil(brokenLinksList.length / brokenLinksRowsPerPage),
  );
  const brokenLinksPaginated = useMemo(() => {
    const start = (brokenLinksPage - 1) * brokenLinksRowsPerPage;
    return brokenLinksList.slice(start, start + brokenLinksRowsPerPage);
  }, [brokenLinksPage, brokenLinksRowsPerPage, brokenLinksList]);

  const brokenLinksReportName = "Broken-Links-Report";
  const baseName = safeFilename(brokenLinksReportName);

  const exportBrokenLinksCSV = useCallback(() => {
    const header = "Broken link,Response code,Type\n";
    const body = brokenLinksList
      .map(
        (r) =>
          `"${(r.url || "").replace(/"/g, '""')}","${r.responseCode || ""}","${r.type || ""}"`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, brokenLinksList]);

  const exportBrokenLinksExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = brokenLinksList.map((r) => ({
      "Broken link": r.url,
      "Response code": r.responseCode,
      Type: r.type,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Broken Links");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, brokenLinksList]);

  const exportBrokenLinksPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Broken link", "Response code", "Type"]];
    const body = brokenLinksList.map((r) => [r.url, r.responseCode, r.type]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName, brokenLinksList]);

  useEffect(() => {
    if (open && defaultTab) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (open && defaultQaSubView) setQaSubView(defaultQaSubView);
  }, [open, defaultQaSubView]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <React.Fragment>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: backdropZIndex }}
        aria-hidden={true}
        onClick={onClose}
      />
      {
        <div
          className="bg-white position-fixed top-0 end-0 bottom-0 shadow overflow-hidden d-flex flex-column"
          style={{
            zIndex: panelZIndex,
            width: "min(100%, 1400px)",
            maxWidth: "1400px",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="page-details-drawer-title"
        >
          {
            <div className="border-bottom px-4 py-3 flex-shrink-0">
              <div className="d-flex align-items-flex-start gap-3 justify-content-between">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light flex-shrink-0 order-first align-self-center"
                  title="Close"
                  onClick={onClose}
                  aria-label="Close drawer"
                >
                  <i className="isax isax-close-circle fs-20" />
                </button>
                <div className="min-w-0 flex-grow-1 order-2 text-start">
                  <h5
                    id="page-details-drawer-title"
                    className="mb-1 text-truncate fw-semibold"
                  >
                    {_nullishCoalesce(
                      _optionalChain([
                        page,
                        "optionalAccess",
                        (_2) => _2.title,
                      ]),
                      () => "Page details",
                    )}
                  </h5>
                  {_optionalChain([page, "optionalAccess", (_3) => _3.url]) && (
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mt-1"
                      title="Open in new tab"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary flex-shrink-0"
                        aria-hidden={true}
                      >
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15 3h6v6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 14L21 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: "100%" }}
                      >
                        {page.url}
                      </span>
                    </a>
                  )}
                </div>
                <div className="d-flex align-items-center gap-1 flex-shrink-0 order-last">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    title="CMS"
                  >
                    CMS
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-light"
                    title="Search"
                  >
                    <i className="isax isax-search-normal-1" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-light"
                    title="Refresh"
                  >
                    <i className="isax isax-refresh-25" />
                  </button>
                </div>
              </div>
            </div>

            /* Tabs - 4 per row */
          }
          {
            <div className="border-bottom bg-white px-4">
              <div className="row g-2 py-2">
                {TABS.map((tab) => (
                  <div key={tab.key} className="col-6 col-md-3">
                    <button
                      type="button"
                      className={`btn btn-sm w-100 d-inline-flex align-items-center justify-content-center justify-content-md-start ${activeTab === tab.key ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <i
                        className={`isax ${tab.icon} me-1 fs-14 flex-shrink-0`}
                      />
                      <span className="text-truncate">{tab.label}</span>
                      {(() => {
                        let badge = undefined;
                        if (tab.key === "policies")
                          badge = effectivePage.policies?.length;
                        if (tab.key === "qa")
                          badge = effectivePage.qaIssueCount;
                        if (tab.key === "seo")
                          badge =
                            effectivePage.seoOpportunitiesCount ??
                            effectivePage.seoImprovements?.length;
                        if (tab.key === "accessibility")
                          badge = page?.failingChecks;
                        return badge != null && badge > 0 ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger ms-1">
                            {badge}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            /* Content */
          }
          <div className="p-4 flex-grow-1 overflow-auto">
            {activeTab === "dashboard" && (
              <PageDashboardContent
                page={effectivePage}
                loading={pageLoading}
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === "policies" && (
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                      <div className="border-bottom px-4 pt-3 pb-3">
                        {
                          <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                              <div className="d-flex align-items-center gap-2">
                                <i
                                  className="isax isax-hammer fs-4 text-primary"
                                  aria-hidden={true}
                                />
                                <span className="h5 fw-bold">
                                  Content policies
                                </span>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                <div className="d-flex flex-column align-items-end">
                                  <span className="text-primary fw-semibold fs-5">
                                    {`${policyCompliancePct}%`}
                                  </span>
                                  <span className="text-muted small">
                                    Overall policy compliance for this page
                                  </span>
                                </div>
                                <PolicyComplianceDonut
                                  percent={policyCompliancePct}
                                />
                              </div>
                            </div>
                            <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 policy-filters-row">
                              {POLICY_FILTERS.map((tab) => {
                                const isActive = policyFilterTab === tab;
                                return (
                                  <button
                                    key={tab}
                                    type="button"
                                    className={`policy-filter-btn btn btn-sm d-inline-flex align-items-center ${isActive ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`}
                                    onClick={() => setPolicyFilterTab(tab)}
                                  >
                                    <span className="text-truncate">{tab}</span>
                                  </button>
                                );
                              })}
                              <span
                                className="vr d-none d-md-inline-block opacity-25"
                                aria-hidden={true}
                              />
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-primary"
                                title="Filter"
                              >
                                <i
                                  className="isax isax-filter fs-18"
                                  aria-hidden={true}
                                />
                              </button>
                              <Link to="#" className="text-primary fs-13">
                                Ignored policies
                              </Link>
                              <div className="form-check form-check-inline mb-0 ms-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="passedPolicyChecks"
                                  defaultChecked={true}
                                />
                                <label
                                  className="form-check-label fs-13"
                                  htmlFor="passedPolicyChecks"
                                >
                                  Passed policy checks
                                </label>
                              </div>
                            </div>
                          </div>
                          /* Content policies header: title + compliance % and donut */
                        }
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover table-striped table-borderless mb-0 align-middle">
                          <thead>
                            <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                              <th
                                className="fw-semibold text-body py-3 ps-4"
                                style={{ width: "40px" }}
                              />
                              <th className="fw-semibold text-body py-3">
                                Name
                              </th>
                              <th className="fw-semibold text-body py-3">
                                Note
                              </th>
                              <th className="fw-semibold text-body py-3 pe-4">
                                Priority
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPolicies.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="text-center py-4 text-muted"
                                >
                                  No policy results for this page.
                                </td>
                              </tr>
                            ) : (
                              filteredPolicies.map((p) => (
                                <tr
                                  key={p.id || p.name}
                                  className={
                                    p.isHit
                                      ? "table-danger table-danger-opacity"
                                      : ""
                                  }
                                >
                                  <td className="ps-4 py-2 align-middle">
                                    <i
                                      className={`isax ${p.isHit ? "isax-close-circle text-danger" : "isax-tick-circle text-success"} fs-24`}
                                    />
                                  </td>
                                  <td className="py-2 align-middle">
                                    {p.name || "Policy"}
                                  </td>
                                  <td className="py-2 align-middle text-muted">
                                    {p.note || "—"}
                                  </td>
                                  <td className="pe-4 py-2 align-middle">
                                    <span
                                      className={`badge ${p.isHit ? "bg-danger" : "bg-success"} bg-opacity-10 text-${p.isHit ? "danger" : "success"} rounded-pill`}
                                    >
                                      {p.priority ||
                                        (p.isHit ? "Violation" : "Passed")}
                                    </span>
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
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i className="isax isax-tick-circle text-success me-2 fs-18" />
                          Text
                        </h6>
                        <div className="d-flex align-items-center gap-1">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-light dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              Action
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                  onClick={() =>
                                    setRunPolicyAgainConfirmOpen(true)
                                  }
                                >
                                  <i
                                    className="isax isax-refresh-25"
                                    aria-hidden={true}
                                  />
                                  Run policy again
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                >
                                  <i
                                    className="isax isax-eye-slash"
                                    aria-hidden={true}
                                  />
                                  Ignore
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                >
                                  <i
                                    className="isax isax-tick-circle"
                                    aria-hidden={true}
                                  />
                                  Mark as fixed
                                </button>
                              </li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light"
                            title="Search"
                          >
                            <i className="isax isax-search-normal-1" />
                          </button>
                        </div>
                      </div>
                      <div className="border-bottom pb-3 mb-3">
                        <button
                          type="button"
                          className="btn btn-sm rounded-0 border-0 border-bottom border-2 border-primary px-0 pb-1"
                        >
                          Information
                        </button>
                      </div>
                      <div className="mb-3">
                        <p className="fs-13 text-muted mb-1 d-flex align-items-center gap-1">
                          <i className="isax isax-info-circle fs-14" />
                          Created Dec 9, 2025
                        </p>
                        <p className="fs-13 text-muted mb-1 d-flex align-items-center gap-1">
                          <i className="isax isax-clock fs-14" />
                          Last run
                        </p>
                        <p className="fs-13 text-muted mb-1 d-flex align-items-center gap-1">
                          <i className="isax isax-clock fs-14" />
                          This policy is scheduled
                        </p>
                        <p className="fs-13 text-muted mb-0 d-flex align-items-center gap-1">
                          <i className="isax isax-note-2 fs-14" />
                          Policy note
                        </p>
                        <p className="fs-13 text-muted mb-0 ps-4">
                          No note has been added
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "qa" && (
              <div className="row g-3">
                {
                  <div className="col-12 col-md-4 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <nav className="nav flex-column gap-1">
                          {qaSidebarItems.map((item) => {
                            const isActive = qaSubView === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setQaSubView(item.key)}
                                className={`nav-link border-0 text-start d-flex align-items-center justify-content-between py-2 px-3 rounded w-100 ${isActive ? "bg-primary bg-opacity-10 text-primary fw-medium border-start border-3 border-primary" : "text-body bg-transparent"}`}
                              >
                                <span className="d-flex align-items-center gap-2">
                                  <i
                                    className={`isax ${item.icon} fs-18`}
                                    aria-hidden={true}
                                  />
                                  <span>{item.label}</span>
                                </span>
                                {"badge" in item && item.badge != null && (
                                  <span
                                    className={`badge rounded-pill bg-${item.badgeVariant} bg-opacity-10 text-${item.badgeVariant}`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {"status" in item && item.status === "ok" && (
                                  <i
                                    className="isax isax-tick-circle text-success fs-18"
                                    aria-hidden={true}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                  /* Main content - Broken Links (or other report) */
                }
                <div className="col-12 col-md-8 col-lg-9">
                  {qaSubView === "broken-links" && (
                    <React.Fragment>
                      <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body pb-0">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                              <i className="isax isax-link-2 fs-22" />
                            </span>
                            <div>
                              <h6 className="mb-0 fw-semibold">Broken Links</h6>
                              <p className="text-muted fs-13 mb-0">
                                {brokenLinksCount}
                                {" issues found"}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 border-bottom">
                            <div className="nav nav-tabs border-0 gap-4">
                              <button
                                type="button"
                                className="nav-link active border-0 px-0 pb-2 border-bottom border-2 border-primary text-primary fw-medium"
                              >
                                All
                              </button>
                              <button
                                type="button"
                                className="nav-link border-0 px-0 pb-2 text-body"
                              >
                                Ignored
                              </button>
                              <button
                                type="button"
                                className="nav-link border-0 px-0 pb-2 text-body"
                              >
                                Marked as fixed
                              </button>
                            </div>
                            <div className="d-flex align-items-center gap-2 ms-auto">
                              <DownloadReportDropdown
                                reportBaseName={baseName}
                                onExportCSV={exportBrokenLinksCSV}
                                onExportExcel={exportBrokenLinksExcel}
                                onExportPDF={exportBrokenLinksPDF}
                              />
                              <button
                                type="button"
                                className="btn btn-icon btn-sm btn-light"
                                title="Filter"
                              >
                                <i className="isax isax-filter" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                          <div className="table-responsive">
                            <table className="table table-hover table-striped table-borderless align-middle mb-0">
                              <thead>
                                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                                  <th
                                    className="py-3 ps-4"
                                    style={{ width: 40 }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      aria-label="Select all"
                                    />
                                  </th>
                                  <th className="fw-semibold text-body py-3">
                                    Broken link
                                  </th>
                                  <th className="fw-semibold text-body py-3">
                                    Response code
                                  </th>
                                  <th className="fw-semibold text-body py-3">
                                    Type
                                  </th>
                                  <th
                                    className="fw-semibold text-body py-3 text-center"
                                    style={{ width: 100 }}
                                  >
                                    Details
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {brokenLinksPaginated.map((row) => (
                                  <tr key={row.id}>
                                    <td className="ps-4 py-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        aria-label={`Select ${row.id}`}
                                      />
                                    </td>
                                    <td className="py-2">
                                      <a
                                        href={row.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-decoration-none"
                                      >
                                        {row.url}
                                      </a>
                                    </td>
                                    <td className="py-2">{row.responseCode}</td>
                                    <td className="py-2">
                                      <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                                        {row.type}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      <button
                                        type="button"
                                        className="btn btn-icon btn-sm btn-link text-primary p-0 border-0 bg-transparent text-decoration-none"
                                        title="View details"
                                        onClick={() => onOpenIssue?.(row.id)}
                                      >
                                        <i className="isax isax-document-text fs-20" />
                                      </button>
                                    </td>
                                    <td className="py-2">
                                      <div className="dropdown d-inline-block ms-1">
                                        <button
                                          type="button"
                                          className="btn btn-icon btn-sm btn-light dropdown-toggle"
                                          data-bs-toggle="dropdown"
                                          aria-expanded="false"
                                          title="Action"
                                        >
                                          <i className="isax isax-more" />
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                          <li>
                                            <button
                                              type="button"
                                              className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                            >
                                              <i
                                                className="isax isax-eye-slash"
                                                aria-hidden={true}
                                              />
                                              Ignore
                                            </button>
                                          </li>
                                          <li>
                                            <button
                                              type="button"
                                              className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                            >
                                              <i
                                                className="isax isax-tick-circle"
                                                aria-hidden={true}
                                              />
                                              Mark as fixed
                                            </button>
                                          </li>
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted small">
                                Rows per page
                              </span>
                              <select
                                className="form-select form-select-sm"
                                style={{ width: "auto" }}
                                value={brokenLinksRowsPerPage}
                                onChange={(e) => {
                                  setBrokenLinksRowsPerPage(
                                    Number(e.target.value),
                                  );
                                  setBrokenLinksPage(1);
                                }}
                              >
                                {BROKEN_LINKS_PAGE_OPTIONS.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                              <span className="text-muted small">
                                {(brokenLinksPage - 1) *
                                  brokenLinksRowsPerPage +
                                  1}
                                -
                                {Math.min(
                                  brokenLinksPage * brokenLinksRowsPerPage,
                                  brokenLinksCount,
                                )}
                                {" of "}
                                {brokenLinksCount}
                              </span>
                            </div>
                            <nav aria-label="Broken links pagination">
                              <ul className="pagination pagination-sm mb-0">
                                <li
                                  className={`page-item ${brokenLinksPage <= 1 ? "disabled" : ""}`}
                                >
                                  <button
                                    type="button"
                                    className="page-link"
                                    onClick={() =>
                                      setBrokenLinksPage((p) =>
                                        Math.max(1, p - 1),
                                      )
                                    }
                                    disabled={brokenLinksPage <= 1}
                                    aria-label="Previous"
                                  >
                                    Previous
                                  </button>
                                </li>
                                {Array.from(
                                  { length: brokenLinksTotalPages },
                                  (_, i) => i + 1,
                                ).map((p) => (
                                  <li
                                    key={p}
                                    className={`page-item ${brokenLinksPage === p ? "active" : ""}`}
                                  >
                                    <button
                                      type="button"
                                      className="page-link"
                                      onClick={() => setBrokenLinksPage(p)}
                                    >
                                      {p}
                                    </button>
                                  </li>
                                ))}
                                <li
                                  className={`page-item ${brokenLinksPage >= brokenLinksTotalPages ? "disabled" : ""}`}
                                >
                                  <button
                                    type="button"
                                    className="page-link"
                                    onClick={() =>
                                      setBrokenLinksPage((p) =>
                                        Math.min(brokenLinksTotalPages, p + 1),
                                      )
                                    }
                                    disabled={
                                      brokenLinksPage >= brokenLinksTotalPages
                                    }
                                    aria-label="Next"
                                  >
                                    Next
                                  </button>
                                </li>
                              </ul>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
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
                  {qaSubView === "ignored-misspellings" && (
                    <IgnoredSpellingsSection
                      items={IGNORED_SPELLINGS_SAMPLE}
                      onOpenIssue={setSelectedIgnoredSpellingId}
                    />
                  )}
                  {qaSubView !== "broken-links" &&
                    qaSubView !== "broken-images" &&
                    qaSubView !== "misspellings" &&
                    qaSubView !== "potential-misspellings" &&
                    qaSubView !== "ignored-misspellings" && (
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <h6 className="mb-2">
                            {_nullishCoalesce(
                              _optionalChain([
                                qaSidebarItems,
                                "access",
                                (_6) => _6.find,
                                "call",
                                (_7) => _7((i) => i.key === qaSubView),
                                "optionalAccess",
                                (_8) => _8.label,
                              ]),
                              () => "Report",
                            )}
                          </h6>
                          <p className="text-muted fs-13 mb-0">
                            Report content for this page.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              /* Left sidebar - QA report types */
            )}
            {activeTab === "accessibility" && (
              <AccessibilitySection
                data={effectivePage.accessibility}
                score={effectivePage.lighthouseAccessibilityScore || 0}
                domainId={domainId}
                pageUrl={pageUrl}
              />
            )}
            {activeTab === "seo" && (
              <SeoSection
                issues={effectivePage.seoImprovements || []}
                score={
                  effectivePage.seoScore ||
                  effectivePage.lighthouseSeoScore ||
                  0
                }
              />
            )}
            {activeTab === "inventory" && (
              <InventorySection
                page={effectivePage}
                defaultView={defaultInventorySubView}
                embeddedInDrawer={true}
                domainId={domainId}
              />
            )}
            {activeTab === "performance" && (
              <PerformanceSection
                page={effectivePage}
                embeddedInDrawer={_nullishCoalesce(
                  performanceSectionEmbedded,
                  () => true,
                )}
              />
            )}
          </div>
        </div>

        /* Header */
      }
      <BrokenLinkIssueDrawer
        open={selectedBrokenLinkId != null}
        onClose={() => setSelectedBrokenLinkId(null)}
        issue={
          selectedBrokenLinkId != null
            ? _nullishCoalesce(
                brokenLinksList.find((r) => r.id === selectedBrokenLinkId),
                () => null,
              )
            : null
        }
        page={
          effectivePage
            ? { title: effectivePage.title, url: effectivePage.url }
            : undefined
        }
      />
      <BrokenImageIssueDrawer
        open={selectedBrokenImageId != null}
        onClose={() => setSelectedBrokenImageId(null)}
        issue={
          selectedBrokenImageId != null
            ? _nullishCoalesce(
                (effectivePage.brokenImages || []).find(
                  (r) => r.id === selectedBrokenImageId,
                ),
                () => null,
              )
            : null
        }
        page={
          effectivePage
            ? { title: effectivePage.title, url: effectivePage.url }
            : undefined
        }
      />
      <MisspellingIssueDrawer
        open={selectedMisspellingId != null}
        onClose={() => setSelectedMisspellingId(null)}
        issue={
          selectedMisspellingId != null
            ? _nullishCoalesce(
                (effectivePage.misspellings || []).find(
                  (r) => r.id === selectedMisspellingId,
                ),
                () => null,
              )
            : null
        }
      />
      <PotentialMisspellingIssueDrawer
        open={selectedPotentialMisspellingId != null}
        onClose={() => setSelectedPotentialMisspellingId(null)}
        issue={
          selectedPotentialMisspellingId != null
            ? _nullishCoalesce(
                (effectivePage.potentialMisspellings || []).find(
                  (r) => r.id === selectedPotentialMisspellingId,
                ),
                () => null,
              )
            : null
        }
      />
      {
        <IgnoredSpellingIssueDrawer
          open={selectedIgnoredSpellingId != null}
          onClose={() => setSelectedIgnoredSpellingId(null)}
          issue={
            selectedIgnoredSpellingId != null
              ? _nullishCoalesce(
                  IGNORED_SPELLINGS_SAMPLE.find(
                    (r) => r.id === selectedIgnoredSpellingId,
                  ),
                  () => null,
                )
              : null
          }
          page={page ? { title: page.title, url: page.url } : undefined}
        />

        /* Run policy again â€“ confirm modal (same pattern as app/page.tsx start-scan confirm) */
      }
      {runPolicyAgainConfirmOpen && (
        <React.Fragment>
          <div
            className="position-fixed top-0 start-0 end-0 bottom-0 opacity-75"
            style={{ backgroundColor: "#000", zIndex: 1100 }}
            aria-hidden={true}
            onClick={() => setRunPolicyAgainConfirmOpen(false)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-policy-again-confirm-title"
            style={{ backgroundColor: "transparent", zIndex: 1105 }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "420px" }}
            >
              <div className="modal-content border-0 rounded-3 shadow-lg overflow-hidden position-relative">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light rounded-circle position-absolute end-0 p-1 mt-2 me-3"
                  style={{ zIndex: 1, top: 0 }}
                  aria-label="Close"
                  onClick={() => setRunPolicyAgainConfirmOpen(false)}
                >
                  <i
                    className="isax isax-close-circle fs-20 text-muted"
                    aria-hidden={true}
                  />
                </button>
                <div className="modal-header border-0 pt-4 px-4 pb-0 pe-5">
                  <p
                    className="modal-title mb-0 text-body fw-medium lh-base"
                    id="run-policy-again-confirm-title"
                    style={{ lineHeight: "1.5", fontSize: "1.125rem" }}
                  >
                    Are you sure you want to run this policy again?
                  </p>
                </div>
                <hr className="mx-4 mt-3 mb-0 text-muted opacity-25" />
                <div className="modal-footer border-0 pt-3 pb-4 px-4 justify-content-end gap-2 bg-transparent">
                  <button
                    type="button"
                    className="btn btn-light border px-3 py-2 rounded-2"
                    onClick={() => setRunPolicyAgainConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-2 rounded-2"
                    onClick={() => setRunPolicyAgainConfirmOpen(false)}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
