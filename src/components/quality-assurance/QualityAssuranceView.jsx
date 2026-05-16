import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import React, { useCallback, useMemo  } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import { getDomainLatestSummaryApi, getDomainByIdApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import ContentWithQAErrorsView from "./ContentWithQAErrorsView";
import ContentWithBrokenLinksView from "./ContentWithBrokenLinksView";
import BrokenLinksView from "./BrokenLinksView";
import BrokenImagesView from "./BrokenImagesView";
import BrokenLinksSitemapView from "./BrokenLinksSitemapView";
import SpellcheckSummaryView from "./SpellcheckSummaryView";
import ReadabilitySummaryView from "./ReadabilitySummaryView";
import ReadabilityCheckerView from "./ReadabilityCheckerView";
import SummaryCategoryView from "./SummaryCategoryView";
import PagesWithMisspellingsView from "./PagesWithMisspellingsView";
import PotentialMisspellingsView from "./PotentialMisspellingsView";
import MisspellingsSectionView from "./MisspellingsSectionView";
import DictionarySectionView from "./DictionarySectionView";
import IgnoredSpellingsSectionView from "./IgnoredSpellingsSectionView";

const LINK_VIEW_KEYS = ["links", "content-broken-links", "broken-links", "broken-images", "broken-links-sitemap"];
const SUMMARY_LINKS_VIEW_KEYS = ["summary-broken-links", "summary-broken-images"];
const SPELLCHECK_VIEW_KEYS = ["spellcheck", "spellcheck-summary", "spellcheck-pages", "spellcheck-misspellings", "spellcheck-potential", "spellcheck-dictionary", "spellcheck-ignored"];
const SUMMARY_SPELLCHECK_VIEW_KEYS = ["summary-potential-misspellings", "summary-misspellings"];
const READABILITY_VIEW_KEYS = ["readability", "readability-summary", "readability-checker"];

const LINKS_SUB_NAV = [
  { key: "content-broken-links", label: "Content with Broken Links", icon: "isax-document-text", href: "/domain/quality-assurance?view=content-broken-links" },
  { key: "broken-links", label: "Broken Links", icon: "isax-link-2", href: "/domain/quality-assurance?view=broken-links" },
  { key: "broken-images", label: "Broken Images", icon: "isax-image", href: "/domain/quality-assurance?view=broken-images" },
  { key: "broken-links-sitemap", label: "Broken Links on Sitemap", icon: "isax-menu", href: "/domain/quality-assurance?view=broken-links-sitemap" },
];

const SPELLCHECK_SUB_NAV = [
  { key: "spellcheck-summary", label: "Spellcheck Summary", icon: "isax-home-2", href: "/domain/quality-assurance?view=spellcheck-summary" },
  { key: "spellcheck-pages", label: "Pages with Misspellings", icon: "isax-document-text", href: "/domain/quality-assurance?view=spellcheck-pages" },
  { key: "spellcheck-misspellings", label: "Misspellings", icon: "isax-edit-2", href: "/domain/quality-assurance?view=spellcheck-misspellings" },
  { key: "spellcheck-potential", label: "Potential Misspellings", icon: "isax-edit-2", href: "/domain/quality-assurance?view=spellcheck-potential" },
  { key: "spellcheck-dictionary", label: "Dictionary", icon: "isax-book-1", href: "/domain/quality-assurance?view=spellcheck-dictionary" },
  { key: "spellcheck-ignored", label: "Ignored Misspellings", icon: "isax-eye-slash", href: "/domain/quality-assurance?view=spellcheck-ignored" },
];

const READABILITY_SUB_NAV = [
  { key: "readability-summary", label: "Summary", icon: "isax-home-2", href: "/domain/quality-assurance?view=readability-summary" },
  { key: "readability-checker", label: "Readability Checker", icon: "isax-discovery", href: "/domain/quality-assurance?view=readability-checker" },
];


const QA_NAV = [
  { key: "summary", label: "Summary", icon: "isax-home-2", href: "/domain/quality-assurance?view=summary" },
  { key: "qa-errors", label: "Content with QA Errors", icon: "isax-document-copy", href: "/domain/quality-assurance?view=qa-errors" },
  { key: "links", label: "Links", icon: "isax-link-2", href: "/domain/quality-assurance?view=content-broken-links", children: LINKS_SUB_NAV },
  { key: "spellcheck", label: "Spellcheck", icon: "isax-edit-2", href: "/domain/quality-assurance?view=spellcheck-summary", children: SPELLCHECK_SUB_NAV },
  { key: "readability", label: "Readability", icon: "isax-book-1", href: "/domain/quality-assurance?view=readability-summary", children: READABILITY_SUB_NAV },
];

/** Sample data – replace with API */
const QA_COMPLIANCE_PERCENT = 0.2;
const INDUSTRY_AVERAGE_PERCENT = 93.52;
const TOTAL_QA_ISSUES = 18;
const TOTAL_QA_ISSUES_CHANGE = -83.87;
const CONTENT_WITH_ISSUES = 499;
const CONTENT_WITH_ISSUES_CHANGE = -0.2;

/** Summary rows for QA Summary download report */
function getQASummaryExportRows() {
  return [
    { category: "Unique broken links", value: "12", detail: "Affects 499 pages" },
    { category: "Potential misspellings", value: "388", detail: "Affects 499 pages" },
    { category: "Broken images", value: "1", detail: "Affects 2 pages" },
    { category: "Misspellings", value: "5", detail: "Affects 498 pages" },
    { category: "QA Compliance", value: `${QA_COMPLIANCE_PERCENT}%`, detail: "Pages compliant with all QA checks" },
    { category: "Industry average", value: `${INDUSTRY_AVERAGE_PERCENT}%`, detail: "Industry benchmark" },
    { category: "Total QA issues", value: String(TOTAL_QA_ISSUES), detail: "Total count of QA issues" },
    { category: "Content with issues", value: String(CONTENT_WITH_ISSUES), detail: "Pages with at least one issue" },
    { category: "Readability (most pages)", value: "8th to 9th grade", detail: "Affects 324 pages" },
  ];
}

function DonutChart({ percent, label, strokeColor = "#0d9488", showInfo = false }) {
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div className="position-relative d-inline-flex flex-column align-items-center">
      <div className="position-relative">
        <svg width="130" height="130" viewBox="0 0 130 130" className="rotate-n90">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="65"
            cy="65"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="d-block fs-5 fw-bold text-body">{percent.toFixed(2)}%</span>
        </div>
      </div>
      <span className="d-flex align-items-center gap-1 mt-2 fs-13 text-muted">
        {label}
        {showInfo && <i className="isax isax-info-circle fs-14 opacity-75" aria-hidden="true" title="Industry benchmark" />}
      </span>
    </div>
  );
}

function QATrendChart() {
  const w = 280;
  const h = 100;
  const pts = "0 70 35 65 70 55 105 48 140 42 175 38 210 35 245 32 280 28";
  const pts2 = "0 85 35 80 70 72 105 65 140 58 175 52 210 48 245 44 280 40";
  const areaPath = `M${pts} L280,${h} L0,${h} Z`;
  const areaPath2 = `M${pts2} L280,${h} L0,${h} Z`;
  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-100" style={{ height: 90 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="qaTrendGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="qaTrendGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path fill="url(#qaTrendGrad1)" d={areaPath} />
        <path d={`M${pts}`} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="url(#qaTrendGrad2)" d={areaPath2} />
        <path d={`M${pts2}`} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
      </svg>
      <div className="d-flex flex-wrap gap-3 mt-1 fs-12 text-muted">
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-danger" style={{ width: 8, height: 8 }} /> Broken links
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#7c3aed" }} /> Broken images
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-warning" style={{ width: 8, height: 8 }} /> Misspellings
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#d97706" }} /> Content with issues
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-secondary bg-opacity-50" style={{ width: 8, height: 8 }} /> Scanned content
        </span>
      </div>
    </div>
  );
}

export default function QualityAssuranceView() {
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = React.useState(null);
  const [domain, setDomain] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = React.useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const [summaryRes, domainRes] = await Promise.all([
        getDomainLatestSummaryApi(domainId),
        getDomainByIdApi(domainId)
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (domainRes.success) setDomain(domainRes.data);
    } catch (error) {
      console.error("Failed to fetch QA summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const currentView = searchParams.get("view") || "summary";
  const isLinksView =
    LINK_VIEW_KEYS.includes(currentView) ||
    SUMMARY_LINKS_VIEW_KEYS.includes(currentView);
  const isSpellcheckView =
    SPELLCHECK_VIEW_KEYS.includes(currentView) ||
    SUMMARY_SPELLCHECK_VIEW_KEYS.includes(currentView);
  const isReadabilityView = READABILITY_VIEW_KEYS.includes(currentView);

  const qaSummaryExportRows = useMemo(() => getQASummaryExportRows(), []);
  const qaSummaryReportName = "Quality-Assurance-Summary-Report";
  const qaSummaryBaseName = safeFilename(qaSummaryReportName);

  const exportQASummaryCSV = useCallback(() => {
    const header = "Category,Value,Detail\n";
    const body = qaSummaryExportRows
      .map((r) => `"${r.category.replace(/"/g, '""')}","${r.value.replace(/"/g, '""')}","${(r.detail ?? "").replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${qaSummaryBaseName}.csv`);
  }, [qaSummaryBaseName, qaSummaryExportRows]);

  const exportQASummaryExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = qaSummaryExportRows.map((r) => ({ Category: r.category, Value: r.value, Detail: r.detail ?? "" }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QA Summary");
    XLSX.writeFile(wb, `${qaSummaryBaseName}.xlsx`);
  }, [qaSummaryBaseName, qaSummaryExportRows]);

  const exportQASummaryPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Category", "Value", "Detail"]];
    const body = qaSummaryExportRows.map((r) => [r.category, r.value, r.detail ?? ""]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 28 }, 2: { cellWidth: "wrap" } },
    });
    doc.save(`${qaSummaryBaseName}.pdf`);
  }, [qaSummaryBaseName, qaSummaryExportRows]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const qaScore = summary?.performanceMetrics?.avgPerformanceScore || 0;
  const totalIssues = (summary?.issueBreakdown?.high || 0) + (summary?.issueBreakdown?.medium || 0) + (summary?.issueBreakdown?.low || 0);

  return (
    <div>
      {/* Horizontal nav – same pattern as Accessibility */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <nav className="d-flex flex-wrap gap-1 gap-md-4 align-items-center" aria-label="Quality Assurance navigation">
            {QA_NAV.map((item) => {
              const hasChildren = "children" in item && item.children;
              const isActive =
                item.key === "links"
                  ? isLinksView
                  : item.key === "spellcheck"
                    ? isSpellcheckView
                    : item.key === "readability"
                      ? isReadabilityView
                        : currentView === item.key;

              if (hasChildren && item.children) {
                return (
                  <div key={item.key} className="dropdown">
                    <button
                      type="button"
                      className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded border-0 bg-transparent ${isActive ? "bg-light text-primary" : "text-body"}`}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-haspopup="true"
                      id={`qa-nav-${item.key}`}
                    >
                      <i className={`isax ${item.icon} me-2`} aria-hidden="true"></i>
                      <span>{item.label}</span>
                      <i className="isax isax-arrow-down-1 ms-1 fs-12" aria-hidden="true"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-start" aria-labelledby={`qa-nav-${item.key}`}>
                      {item.children.map((sub) => {
                        const isSubActive =
                          currentView === sub.key ||
                          (item.key === "links" && currentView === "summary-broken-links" && sub.key === "broken-links") ||
                          (item.key === "links" && currentView === "summary-broken-images" && sub.key === "broken-images") ||
                          (item.key === "spellcheck" && currentView === "summary-potential-misspellings" && sub.key === "spellcheck-potential") ||
                          (item.key === "spellcheck" && currentView === "summary-misspellings" && sub.key === "spellcheck-misspellings");
                        return (
                          <li key={sub.key}>
                            <Link
                              to={sub.href}
                              className={`dropdown-item d-flex align-items-center ${isSubActive ? "active" : ""}`}
                            >
                              <i className={`isax ${sub.icon} me-2`} aria-hidden="true"></i>
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded ${isActive ? "bg-light text-primary" : "text-body"}`}
                >
                  <i className={`isax ${item.icon} me-2`} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
        {currentView === "summary" ? (
          <React.Fragment>
            {/* Header */}
            <div className="mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <h5 className="mb-1 d-flex align-items-center gap-2 text-body fw-semibold">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary" style={{ width: 40, height: 40 }}>
                      <i className="isax isax-tick-circle fs-22" aria-hidden="true"></i>
                    </span>
                    Quality Assurance
                  </h5>
                  <p className="text-muted fs-13 mb-0 mt-1" style={{ maxWidth: 520 }}>
                    Check and fix content issues across your website (e.g. Misspellings, Broken links, Readability and other issues).
                  </p>
                </div>
                <DownloadReportDropdown
                  reportBaseName={qaSummaryBaseName}
                  onExportCSV={exportQASummaryCSV}
                  onExportExcel={exportQASummaryExcel}
                  onExportPDF={exportQASummaryPDF}
                  className="border border-secondary border-opacity-25 rounded-2"
                />
              </div>
            </div>

            <div className="row g-4">
              {/* Left column */}
              <div className="col-lg-6">
                {/* Quality Assurance Check - 2x2 grid */}
                <div className="card border-0 shadow-sm rounded-3 mb-4">
                  <div className="card-body p-4">
                    <h6 className="fw-semibold text-body mb-3">Quality Assurance Check</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <Link to="/domain/quality-assurance?view=broken-links" className="text-decoration-none text-body d-block h-100">
                          <div className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="d-inline-flex align-items-center justify-content-center rounded-2 bg-primary bg-opacity-10 text-primary" style={{ width: 32, height: 32 }}>
                                <i className="isax isax-link-2 fs-16" aria-hidden="true"></i>
                              </span>
                              <span className="fs-13 text-body">Unique broken links</span>
                            </div>
                            <div className="fs-4 fw-bold text-body">{summary?.issueBreakdown?.high || 0}</div>
                            <span className="fs-12 text-muted">Affects {summary?.issueBreakdown?.highPages || 0} pages</span>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/domain/quality-assurance?view=summary-potential-misspellings" className="text-decoration-none text-body d-block h-100">
                          <div className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="d-inline-flex align-items-center justify-content-center rounded-2 bg-warning bg-opacity-10 text-warning" style={{ width: 32, height: 32 }}>
                                <i className="isax isax-text fs-16" aria-hidden="true"></i>
                              </span>
                              <span className="fs-13 text-body">Potential misspellings</span>
                            </div>
                            <div className="fs-4 fw-bold text-body">{summary?.issueBreakdown?.medium || 0}</div>
                            <span className="fs-12 text-muted">Affects {summary?.issueBreakdown?.mediumPages || 0} pages</span>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/domain/quality-assurance?view=broken-images" className="text-decoration-none text-body d-block h-100">
                          <div className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="d-inline-flex align-items-center justify-content-center rounded-2 bg-info bg-opacity-10 text-info" style={{ width: 32, height: 32 }}>
                                <i className="isax isax-image fs-16" aria-hidden="true"></i>
                              </span>
                              <span className="fs-13 text-body">Broken images</span>
                            </div>
                            <div className="fs-4 fw-bold text-body">{summary?.issueBreakdown?.low || 0}</div>
                            <span className="fs-12 text-muted">Affects {summary?.issueBreakdown?.lowPages || 0} pages</span>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/domain/quality-assurance?view=summary-misspellings" className="text-decoration-none text-body d-block h-100">
                          <div className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="d-inline-flex align-items-center justify-content-center rounded-2 bg-danger bg-opacity-10 text-danger" style={{ width: 32, height: 32 }}>
                                <i className="isax isax-edit-2 fs-16" aria-hidden="true"></i>
                              </span>
                              <span className="fs-13 text-body">Misspellings</span>
                            </div>
                            <div className="fs-4 fw-bold text-body">0</div>
                            <span className="fs-12 text-muted">Affects 0 pages</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Highlights */}
                <div className="card border-0 shadow-sm rounded-3 mb-4">
                  <div className="card-body p-4">
                    <h6 className="fw-semibold text-body mb-3">Important Highlights</h6>
                    <div className="d-flex flex-column gap-0">
                      <div className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                        <span className="d-flex align-items-center justify-content-center rounded-2 bg-danger bg-opacity-10 text-danger flex-shrink-0" style={{ width: 40, height: 40 }}>
                          <i className="isax isax-edit-2 fs-18" aria-hidden="true"></i>
                        </span>
                        <div className="min-w-0 flex-grow-1">
                          <p className="fs-13 text-muted mb-1">Misspelling affecting the most content</p>
                          <span className="d-inline-block fs-13 fw-semibold text-body bg-danger bg-opacity-10 rounded-2 px-2 py-1 me-2">upto</span>
                          <span className="d-inline-block rounded-2 bg-primary bg-opacity-15" style={{ width: 120, height: 6 }} title="Severity" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                        <span className="d-flex align-items-center justify-content-center rounded-2 bg-warning bg-opacity-10 text-warning flex-shrink-0" style={{ width: 40, height: 40 }}>
                          <i className="isax isax-text fs-18" aria-hidden="true"></i>
                        </span>
                        <div>
                          <p className="fs-13 text-muted mb-0">Potential misspellings</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                        <span className="d-flex align-items-center justify-content-center rounded-2 bg-primary bg-opacity-10 text-primary flex-shrink-0" style={{ width: 40, height: 40 }}>
                          <i className="isax isax-link-2 fs-18" aria-hidden="true"></i>
                        </span>
                        <div className="min-w-0 flex-grow-1">
                          <p className="fs-13 text-muted mb-1">Broken link affecting most content</p>
                          <a href="https://bflcareers.peoplestrong.com/home" target="_blank" rel="noopener noreferrer" className="fs-13 text-body text-decoration-none d-inline-flex align-items-center gap-1 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-2 px-2 py-1 text-break">
                            <ExternalLinkIcon size={12} className="text-primary flex-shrink-0" /> https://bflcareers.peoplestrong.com/home
                          </a>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-3 py-3">
                        <span className="d-flex align-items-center justify-content-center rounded-2 bg-info bg-opacity-10 text-info flex-shrink-0" style={{ width: 40, height: 40 }}>
                          <i className="isax isax-image fs-18" aria-hidden="true"></i>
                        </span>
                        <div className="min-w-0 flex-grow-1">
                          <p className="fs-13 text-muted mb-1">Broken image affecting most content</p>
                          <a href="https://www.bajajfinserv.in/content/dam/bajajmall-site/images/DefaultImage%20.png" target="_blank" rel="noopener noreferrer" className="fs-13 text-body text-decoration-none d-inline-flex align-items-center gap-1 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-2 px-2 py-1 text-break">
                            <ExternalLinkIcon size={12} className="text-primary flex-shrink-0" /> https://www.bajajfinserv.in/content/dam/bajajmall-site/images/DefaultImage%20.png
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Readability */}
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-body p-4">
                    <h6 className="fw-semibold text-body mb-2">Readability</h6>
                    <p className="fs-13 text-muted mb-3">Most of your pages have the readability level</p>
                    <div className="d-flex align-items-center gap-3 rounded-3 border border-primary border-opacity-25 bg-white bg-opacity-80 p-3">
                      <span className="fw-semibold text-body">8th to 9th grade</span>
                      <span className="text-muted fs-13">Affects 324 pages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - QA Diagnostics */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-body p-3">
                    <h6 className="fw-semibold text-body mb-1">Quality Assurance Diagnostics</h6>
                    <p className="fs-13 text-muted mb-3">Percentage shows number of pages that are compliant with all QA checks.</p>

                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                      <DonutChart percent={qaScore} label="QA Compliance" strokeColor="#6366f1" />
                      <DonutChart percent={93.52} label="Industry average" strokeColor="#0d9488" showInfo={true} />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="rounded-3 border border-secondary border-opacity-25 p-2">
                          <p className="fs-13 fw-semibold text-body mb-0 d-flex align-items-center gap-1">
                            Total QA issues
                            <i className="isax isax-info-circle fs-12 text-muted opacity-75" aria-hidden="true" title="Total count of QA issues" />
                          </p>
                          <p className="fs-3 fw-bold text-body mb-0 mt-1">{totalIssues}</p>
                          <span className="d-inline-flex align-items-center gap-1 text-success fs-12">
                            <i className="isax isax-arrow-down-1" aria-hidden="true" />
                            0%
                            <i className="isax isax-arrow-down-1 fs-10 opacity-75" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="rounded-3 border border-secondary border-opacity-25 p-2">
                          <p className="fs-13 fw-semibold text-body mb-0 d-flex align-items-center gap-1">
                            Content with issues
                            <i className="isax isax-info-circle fs-12 text-muted opacity-75" aria-hidden="true" title="Pages with at least one issue" />
                          </p>
                          <p className="fs-3 fw-bold text-body mb-0 mt-1">{summary?.totalPages || 0}</p>
                          <span className="d-inline-flex align-items-center gap-1 text-success fs-12">
                            <i className="isax isax-arrow-down-1" aria-hidden="true" />
                            0%
                            <i className="isax isax-arrow-down-1 fs-10 opacity-75" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <QATrendChart />
                    <div className="d-flex justify-content-end mt-2 pt-2 border-top border-secondary border-opacity-25">
                      <Link to="/home/history-center" className="btn btn-sm btn-link text-primary text-decoration-none d-inline-flex align-items-center gap-1 p-0">
                        Show history
                        <i className="isax isax-arrow-right-1 fs-14" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ) : currentView === "qa-errors" ? (
          <ContentWithQAErrorsView />
        ) : currentView === "content-broken-links" ? (
          <ContentWithBrokenLinksView />
        ) : currentView === "broken-links" ? (
          <BrokenLinksView />
        ) : currentView === "broken-images" ? (
          <BrokenImagesView />
        ) : currentView === "broken-links-sitemap" ? (
          <BrokenLinksSitemapView />
        ) : currentView === "spellcheck-summary" ? (
          <SpellcheckSummaryView />
        ) : currentView === "spellcheck-pages" ? (
          <PagesWithMisspellingsView />
        ) : currentView === "spellcheck-misspellings" ? (
          <MisspellingsSectionView />
        ) : currentView === "spellcheck-potential" ? (
          <PotentialMisspellingsView />
        ) : currentView === "spellcheck-dictionary" ? (
          <DictionarySectionView />
        ) : currentView === "spellcheck-ignored" ? (
          <IgnoredSpellingsSectionView />
        ) : currentView === "readability-summary" ? (
          <ReadabilitySummaryView />
        ) : currentView === "readability-checker" ? (
          <ReadabilityCheckerView />
        ) : currentView === "summary-broken-links" ? (
          <SummaryCategoryView title="Unique broken links" viewKey="summary-broken-links" defaultQaSubView="broken-links" icon="isax-link-2" />
        ) : currentView === "summary-potential-misspellings" ? (
          <SummaryCategoryView title="Potential misspellings" viewKey="summary-potential-misspellings" defaultQaSubView="potential-misspellings" icon="isax-text" />
        ) : currentView === "summary-broken-images" ? (
          <SummaryCategoryView title="Broken images" viewKey="summary-broken-images" defaultQaSubView="broken-images" icon="isax-image" />
        ) : currentView === "summary-misspellings" ? (
          <SummaryCategoryView title="Misspellings" viewKey="summary-misspellings" defaultQaSubView="misspellings" icon="isax-edit-2" />
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-body py-5">
              <p className="text-muted mb-0 text-center">
                {currentView === "links" && "Links."}
                {(currentView === "spellcheck" || currentView?.startsWith?.("spellcheck-")) && "Spellcheck."}
                {(currentView === "readability" || currentView?.startsWith?.("readability-")) && "Readability."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
