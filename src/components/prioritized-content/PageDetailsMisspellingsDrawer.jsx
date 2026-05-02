function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } import React, { useState, useEffect, useCallback, useMemo } from "react";
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

const TABS = [
  { key: "dashboard", label: "Page dashboard", icon: "isax-document-text" },
  { key: "policies", label: "Policies", icon: "isax-shield-tick", badge: 1 },
  { key: "qa", label: "Quality Assurance", icon: "isax-tick-circle", badge: 10 },
  { key: "accessibility", label: "Accessibility", icon: "isax-people5", badge: 43 },
  { key: "seo", label: "SEO", icon: "isax-chart-215", badge: 6 },
  { key: "inventory", label: "Inventory", icon: "isax-book5" },
  { key: "performance", label: "Performance", icon: "isax-chart-215" },
];

const QA_SIDEBAR_ITEMS = [
  { key: "broken-links", label: "Broken Links", icon: "isax-link-2", badge: 6, badgeVariant: "danger" },
  { key: "broken-images", label: "Broken Images", icon: "isax-document-text", badge: 2, badgeVariant: "danger" },
  { key: "misspellings", label: "Misspellings", icon: "isax-edit-2", badge: 2, badgeVariant: "danger" },
  { key: "potential-misspellings", label: "Potential Misspellings", icon: "isax-edit-2", badge: 113, badgeVariant: "primary" },
  { key: "ignored-misspellings", label: "Ignored Misspellings", icon: "isax-edit-2" },
  { key: "dictionary", label: "Dictionary", icon: "isax-book-1" },
  { key: "readability", label: "Readability", icon: "isax-book5" },
  { key: "language", label: "Language Validation", icon: "isax-tick-circle", status: "ok" },
];

/** Sample language validation data for the Page Details >> Language Validation section. */
const LANGUAGE_VALIDATION_PAGE_SAMPLE = {
  declaredLanguage: "Indonesian (Id)",
  detectedLanguage: "English (En)",
  multiLanguageTag: false,
  languageMismatch: true,
};

/** Sample readability data for the Page Details >> Readability section. */
const READABILITY_PAGE_SAMPLE = {
  readabilityScore: 81,
  readabilityLevel: "6th grade",
  wordCount: 238,
};

const BROKEN_LINKS_SAMPLE = [
  { id: 1, url: "https://bflcareers.peoplestrong.com/home", responseCode: "404", type: "link", dateFound: "2025-01-15" },
  { id: 2, url: "https://example.com/missing-page", responseCode: "404", type: "link", dateFound: "2025-01-14" },
  { id: 3, url: "https://example.com/old-link", responseCode: "404", type: "link", dateFound: "2025-01-13" },
];

const BROKEN_LINKS_PAGE_OPTIONS = [10, 50, 100, 500];

const POLICY_FILTERS = ["All", "Unwanted", "Required", "Matches"];


const DEFAULT_BACKDROP_Z = 1050;
const DEFAULT_PANEL_Z = 1055;

/**
 * Page details drawer with QA focus (same behavior as Content with QA error >> Open page details).
 * Header, nav tabs (QA active), QA sidebar with all sections, and each section fully working.
 */
export default function PageDetailsMisspellingsDrawer({
  open,
  onClose,
  page,
  backdropZIndex = DEFAULT_BACKDROP_Z,
  panelZIndex = DEFAULT_PANEL_Z,
  defaultQaSubView = "misspellings",
  defaultTab,
}) {
  const [activeTab, setActiveTab] = useState(_nullishCoalesce(defaultTab, () => ("qa")));
  const [policyFilterTab, setPolicyFilterTab] = useState("All");
  const [qaSubView, setQaSubView] = useState(defaultQaSubView);
  const [selectedBrokenLinkId, setSelectedBrokenLinkId] = useState(null);
  const [selectedBrokenImageId, setSelectedBrokenImageId] = useState(null);
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const [selectedPotentialMisspellingId, setSelectedPotentialMisspellingId] = useState(null);
  /** When user clicks "Open page details" in MisspellingDetailDrawer or PotentialMisspellingIssueDrawer, redirect this drawer to that page (fall back with latest URL and details). */
  const [overridePage, setOverridePage] = useState(null);
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] = useState(null);
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(null);
  const [brokenLinksPage, setBrokenLinksPage] = useState(1);

  const effectivePage = _nullishCoalesce(overridePage, () => (page));

  const handleClose = useCallback(() => {
    setOverridePage(null);
    onClose();
  }, [onClose]);
  const [brokenLinksRowsPerPage, setBrokenLinksRowsPerPage] = useState(10);

  const brokenLinksTotalPages = Math.max(1, Math.ceil(BROKEN_LINKS_SAMPLE.length / brokenLinksRowsPerPage));
  const brokenLinksPaginated = useMemo(() => {
    const start = (brokenLinksPage - 1) * brokenLinksRowsPerPage;
    return BROKEN_LINKS_SAMPLE.slice(start, start + brokenLinksRowsPerPage);
  }, [brokenLinksPage, brokenLinksRowsPerPage]);

  const pagesWithMisspellingForDrawer = useMemo(() => {
    if (!effectivePage) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, language: "English (Australian)", misspellings: 2, potentialMisspellings: 113, views: 0 },
    ];
  }, [effectivePage]);

  const pagesWithDictionaryEntryForDrawer = useMemo(() => {
    if (!effectivePage) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, language: "English (Australian)", pages: 2, views: 0 },
    ];
  }, [effectivePage]);

  const pagesWithIgnoredSpellingForDrawer = useMemo(() => {
    if (!effectivePage) return undefined;
    return [
      { title: effectivePage.title, url: effectivePage.url, priority: "High", views: 0 },
    ];
  }, [effectivePage]);

  const brokenLinksReportName = "Broken-Links-Report";
  const baseName = safeFilename(brokenLinksReportName);

  const exportBrokenLinksCSV = useCallback(() => {
    const header = "Broken link,Response code,Type\n";
    const body = BROKEN_LINKS_SAMPLE.map((r) => `"${r.url.replace(/"/g, '""')}","${r.responseCode}","${r.type}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName]);

  const exportBrokenLinksExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = BROKEN_LINKS_SAMPLE.map((r) => ({ "Broken link": r.url, "Response code": r.responseCode, Type: r.type }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Broken Links");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName]);

  const exportBrokenLinksPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Broken link", "Response code", "Type"]];
    const body = BROKEN_LINKS_SAMPLE.map((r) => [r.url, r.responseCode, r.type]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 28 }, 2: { cellWidth: 20 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName]);

  useEffect(() => {
    if (open) {
      setActiveTab(_nullishCoalesce(defaultTab, () => ("qa")));
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
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0",
        style: { zIndex: backdropZIndex },
        'aria-hidden': true,
        onClick: handleClose
      }
      )
      , React.createElement('div', {
        className: "bg-white position-fixed top-0 end-0 bottom-0 shadow overflow-hidden d-flex flex-column",
        style: { zIndex: panelZIndex, width: "min(100%, 1400px)", maxWidth: "1400px" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "page-details-misspellings-drawer-title"
      }

        /* Header: X, page title, URL, CMS, search, refresh */
        , React.createElement('div', { className: "border-bottom px-4 py-3 flex-shrink-0" }
          , React.createElement('div', { className: "d-flex align-items-flex-start gap-3 justify-content-between" }
            , React.createElement('button', {
              type: "button",
              className: "btn btn-icon btn-sm btn-light flex-shrink-0 order-first align-self-center",
              title: "Close",
              onClick: handleClose,
              'aria-label': "Close drawer"
            }

              , React.createElement('i', { className: "isax isax-close-circle fs-20", 'aria-hidden': true })
            )
            , React.createElement('div', { className: "min-w-0 flex-grow-1 order-2 text-start" }
              , React.createElement('h5', { id: "page-details-misspellings-drawer-title", className: "mb-1 text-truncate fw-semibold text-body" }
                , _nullishCoalesce(_optionalChain([effectivePage, 'optionalAccess', _2 => _2.title]), () => ("(No title found)"))
              )
              , _optionalChain([effectivePage, 'optionalAccess', _3 => _3.url]) && (
                React.createElement('span', { className: "d-inline-flex align-items-center gap-1 mt-1" }
                  , React.createElement('a', {
                    href: effectivePage.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-muted small text-decoration-none d-inline-flex align-items-center gap-1 text-break",
                    title: "Open in new tab"
                  }

                    , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: "text-primary flex-shrink-0", 'aria-hidden': true }
                      , React.createElement('path', { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                      , React.createElement('path', { d: "M15 3h6v6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                      , React.createElement('path', { d: "M10 14L21 3", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                    )
                    , React.createElement('span', { className: "text-truncate d-inline-block", style: { maxWidth: "100%" } }, effectivePage.url)
                  )
                  , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light border-0 p-0 ms-1", title: "Bookmark", 'aria-label': "Bookmark" }, React.createElement('i', { className: "isax isax-bookmark-2 text-primary fs-16", 'aria-hidden': true }))
                )
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-1 flex-shrink-0 order-last" }
              , React.createElement('button', { type: "button", className: "btn btn-sm btn-light", title: "CMS" }, "CMS")
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light", title: "Search", 'aria-label': "Search" }, React.createElement('i', { className: "isax isax-search-normal-1", 'aria-hidden': true }))
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light", title: "Refresh", 'aria-label': "Refresh" }, React.createElement('i', { className: "isax isax-refresh-25", 'aria-hidden': true }))
            )
          )
        )

        /* Global nav tabs - all clickable */
        , React.createElement('div', { className: "border-bottom bg-white px-4" }
          , React.createElement('div', { className: "row g-2 py-2" }
            , TABS.map((tab) => (
              React.createElement('div', { key: tab.key, className: "col-6 col-md-3" }
                , React.createElement('button', {
                  type: "button",
                  className: `btn btn-sm w-100 d-inline-flex align-items-center justify-content-center justify-content-md-start ${activeTab === tab.key ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`,
                  onClick: () => setActiveTab(tab.key)
                }

                  , React.createElement('i', { className: `isax ${tab.icon} me-1 fs-14 flex-shrink-0`, 'aria-hidden': true })
                  , React.createElement('span', { className: "text-truncate" }, tab.label)
                  , "badge" in tab && tab.badge != null && React.createElement('span', { className: "ms-1 opacity-75" }, tab.badge)
                  , activeTab === tab.key && React.createElement('i', { className: "isax isax-tick-circle ms-1 fs-14 flex-shrink-0", 'aria-hidden': true })
                )
              )
            ))
          )
        )

        /* Content - switch by activeTab */
        , React.createElement('div', { className: "p-4 flex-grow-1 overflow-auto" }
          , activeTab === "dashboard" && (
            React.createElement('div', { className: "row g-4 page-details-drawer-dashboard" }
              , React.createElement('div', { className: "col-md-6 d-flex" }
                , React.createElement('div', { className: "card flex-fill dashboard-metric-card" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-tick-circle5 dashboard-metric-icon fs-18", 'aria-hidden': true }), "Content Policies"

                      )
                      , React.createElement(Link, { to: "#" }, React.createElement('i', { className: "isax isax-arrow-right-1", 'aria-hidden': true }))
                    )
                    , React.createElement('div', { className: "row align-items-center g-3" }
                      , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1" }
                        , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center" }
                          , React.createElement('svg', { className: "content-policies-ring", width: "120", height: "120", viewBox: "0 0 140 140", 'aria-hidden': true }
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12" })
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "384 389", transform: "rotate(-90 70 70)" })
                          )
                          , React.createElement('div', { className: "position-absolute text-center px-1", style: { maxWidth: 70, lineHeight: 1.2 } }
                            , React.createElement('span', { className: "d-block fs-4 fw-bold text-body" }, "98.6 %")
                            , React.createElement('span', { className: "d-block text-muted", style: { fontSize: "0.65rem" } }, "overall compliance")
                          )
                        )
                      )
                      , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0" }
                        , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1" }, "Policies with violations")
                        , React.createElement('p', { className: "fs-2 fw-bold text-body mb-2" }, "1")
                        , React.createElement('div', { className: "d-flex flex-wrap gap-3" }
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-muted fs-13" }, React.createElement('i', { className: "isax isax-close-circle fs-18", 'aria-hidden': true }), React.createElement('span', {}, "0"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-muted fs-13" }, React.createElement('i', { className: "isax isax-danger fs-18", 'aria-hidden': true }), React.createElement('span', {}, "0"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-muted fs-13" }, React.createElement('i', { className: "isax isax-search-normal-1 fs-18", 'aria-hidden': true }), React.createElement('span', {}, "1"))
                        )
                      )
                    )
                    , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top" }
                      , React.createElement(Link, { to: "#", className: "show-history-link d-inline-flex align-items-center" }, "Show history", React.createElement('i', { className: "isax isax-arrow-right-1 ms-1", 'aria-hidden': true }))
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-md-6 d-flex" }
                , React.createElement('div', { className: "card flex-fill dashboard-metric-card" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-document-text5 dashboard-metric-icon fs-18", 'aria-hidden': true }), "Quality Assurance"

                      )
                      , React.createElement(Link, { to: "#" }, React.createElement('i', { className: "isax isax-arrow-right-1", 'aria-hidden': true }))
                    )
                    , React.createElement('div', { className: "row align-items-center g-3" }
                      , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1" }
                        , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center" }
                          , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140", 'aria-hidden': true }
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12" })
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "1 389", transform: "rotate(-90 70 70)" })
                          )
                          , React.createElement('div', { className: "position-absolute text-center px-1", style: { maxWidth: 70, lineHeight: 1.2 } }
                            , React.createElement('span', { className: "d-block fs-4 fw-bold text-body" }, "0 %")
                            , React.createElement('span', { className: "d-block text-muted", style: { fontSize: "0.65rem" } }, "overall compliance")
                          )
                        )
                      )
                      , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0" }
                        , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1" }, "QA Issues")
                        , React.createElement('p', { className: "fs-2 fw-bold text-body mb-1" }, "45")
                        , React.createElement('p', { className: "fs-13 text-muted mb-2" }, "Affects ", React.createElement('strong', { className: "text-body" }, "500"), " pages and ", React.createElement('strong', { className: "text-body" }, "0"), " documents")
                        , React.createElement('div', { className: "d-flex flex-wrap gap-3" }
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-danger fs-13" }, React.createElement('i', { className: "isax isax-danger fs-18", 'aria-hidden': true }), React.createElement('span', {}, "37"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-muted fs-13" }, React.createElement('i', { className: "isax isax-document-text fs-18", 'aria-hidden': true }), React.createElement('span', {}, "8"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-danger fs-13" }, React.createElement('i', { className: "isax isax-text fs-18", 'aria-hidden': true }), React.createElement('span', {}, "0"))
                        )
                      )
                    )
                    , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top" }
                      , React.createElement(Link, { to: "#", className: "show-history-link d-inline-flex align-items-center" }, "Show history", React.createElement('i', { className: "isax isax-arrow-right-1 ms-1", 'aria-hidden': true }))
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-md-6 d-flex" }
                , React.createElement('div', { className: "card flex-fill dashboard-metric-card" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-people5 dashboard-metric-icon fs-18", 'aria-hidden': true }), "Accessibility"

                      )
                      , React.createElement(Link, { to: "#" }, React.createElement('i', { className: "isax isax-arrow-right-1", 'aria-hidden': true }))
                    )
                    , React.createElement('div', { className: "row align-items-center g-3" }
                      , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1" }
                        , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center" }
                          , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140", 'aria-hidden': true }
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12" })
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#7c3aed", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "240 389", transform: "rotate(-90 70 70)" })
                          )
                          , React.createElement('div', { className: "position-absolute text-center px-1", style: { maxWidth: 70, lineHeight: 1.2 } }
                            , React.createElement('span', { className: "d-block fs-4 fw-bold text-body" }, "61.75 %")
                            , React.createElement('span', { className: "d-block text-muted", style: { fontSize: "0.65rem" } }, "Overall compliance")
                          )
                        )
                      )
                      , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0" }
                        , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1" }, "Failing accessibility checks")
                        , React.createElement('p', { className: "fs-2 fw-bold text-body mb-0" }, "51")
                      )
                    )
                    , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top" }
                      , React.createElement(Link, { to: "#", className: "show-history-link d-inline-flex align-items-center" }, "Show history", React.createElement('i', { className: "isax isax-arrow-right-1 ms-1", 'aria-hidden': true }))
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-md-6 d-flex" }
                , React.createElement('div', { className: "card flex-fill dashboard-metric-card" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-chart-215 dashboard-metric-icon fs-18", 'aria-hidden': true }), "Search Engine Optimization (SEO)"

                      )
                      , React.createElement(Link, { to: "#" }, React.createElement('i', { className: "isax isax-arrow-right-1", 'aria-hidden': true }))
                    )
                    , React.createElement('div', { className: "row align-items-center g-3" }
                      , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1" }
                        , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center" }
                          , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140", 'aria-hidden': true }
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12" })
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "306 389", transform: "rotate(-90 70 70)" })
                          )
                          , React.createElement('div', { className: "position-absolute text-center px-1", style: { maxWidth: 70, lineHeight: 1.2 } }
                            , React.createElement('span', { className: "d-block fs-4 fw-bold text-body" }, "78.63 %")
                            , React.createElement('span', { className: "d-block text-muted", style: { fontSize: "0.65rem" } }, "Overall compliance")
                          )
                        )
                      )
                      , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0" }
                        , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1 d-flex align-items-center gap-1" }, "SEO opportunities"

                          , React.createElement('i', { className: "isax isax-info-circle text-muted fs-14", title: "More information", 'aria-hidden': true })
                        )
                        , React.createElement('p', { className: "fs-2 fw-bold text-body mb-2" }, "1,389")
                        , React.createElement('div', { className: "d-flex flex-wrap gap-3" }
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-danger fs-13" }, React.createElement('i', { className: "isax isax-chart-2 fs-18", 'aria-hidden': true }), React.createElement('span', {}, "13"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 fs-13", style: { color: "#ea580c" } }, React.createElement('i', { className: "isax isax-chart-2 fs-18", 'aria-hidden': true }), React.createElement('span', {}, "515"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 fs-13", style: { color: "#7c3aed" } }, React.createElement('i', { className: "isax isax-chart-2 fs-18", 'aria-hidden': true }), React.createElement('span', {}, "861"))
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 text-muted fs-13" }, React.createElement('i', { className: "isax isax-chart-2 fs-18", 'aria-hidden': true }), React.createElement('span', {}, "0"))
                        )
                      )
                    )
                    , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top" }
                      , React.createElement(Link, { to: "#", className: "show-history-link d-inline-flex align-items-center" }, "Show history", React.createElement('i', { className: "isax isax-arrow-right-1 ms-1", 'aria-hidden': true }))
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-12" }
                , React.createElement('div', { className: "card dashboard-metric-card" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-heart5 dashboard-metric-icon fs-18", 'aria-hidden': true }), "Heartbeat"

                      )
                      , React.createElement(Link, { to: "#" }, React.createElement('i', { className: "isax isax-arrow-right-1", 'aria-hidden': true }))
                    )
                    , React.createElement('div', { className: "row align-items-center g-3" }
                      , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1" }
                        , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center" }
                          , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140", 'aria-hidden': true }
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12" })
                            , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "385 389", transform: "rotate(-90 70 70)" })
                          )
                          , React.createElement('div', { className: "position-absolute text-center px-1", style: { maxWidth: 70, lineHeight: 1.2 } }
                            , React.createElement('span', { className: "d-block fs-4 fw-bold text-body" }, "98.76 %")
                            , React.createElement('span', { className: "d-block text-muted", style: { fontSize: "0.65rem" } }, "Uptime last 30 days")
                          )
                        )
                      )
                      , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0" }
                        , React.createElement('p', { className: "fs-13 text-muted mb-1" }
                          , React.createElement('span', { className: "text-body" }, "Checkpoint:"), " "
                          , React.createElement(Link, { to: _nullishCoalesce(_optionalChain([effectivePage, 'optionalAccess', _4 => _4.url]), () => ("#")), target: "_blank", rel: "noopener noreferrer", className: "text-primary text-break" }, _nullishCoalesce(_optionalChain([effectivePage, 'optionalAccess', _5 => _5.url]), () => ("—")))
                        )
                        , React.createElement('p', { className: "fs-13 text-muted mb-0 d-flex align-items-center gap-2" }
                          , React.createElement('span', { className: "text-body" }, "Current status")
                          , React.createElement('span', { className: "d-inline-flex align-items-center gap-1 text-success" }
                            , React.createElement('i', { className: "isax isax-tick-circle fs-16", 'aria-hidden': true }), React.createElement('span', {}, "0")
                          )
                        )
                      )
                    )
                    , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top" }
                      , React.createElement(Link, { to: "#", className: "show-history-link d-inline-flex align-items-center" }, "Show history", React.createElement('i', { className: "isax isax-arrow-right-1 ms-1", 'aria-hidden': true }))
                    )
                  )
                )
              )
            )
          )
          , activeTab === "policies" && (
            React.createElement('div', { className: "row g-4" }
              , React.createElement('div', { className: "col-lg-8" }
                , React.createElement('div', { className: "card border-0 shadow-sm" }
                  , React.createElement('div', { className: "card-body p-0" }
                    , React.createElement('div', { className: "border-bottom px-4 pt-3 pb-3" }
                      , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2 gap-md-3 policy-filters-row" }
                        , POLICY_FILTERS.map((tab) => {
                          const isActive = policyFilterTab === tab;
                          return (
                            React.createElement('button', {
                              key: tab,
                              type: "button",
                              className: `policy-filter-btn btn btn-sm d-inline-flex align-items-center ${isActive ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`,
                              onClick: () => setPolicyFilterTab(tab)
                            }

                              , React.createElement('span', { className: "text-truncate" }, tab)
                            )
                          );
                        })
                        , React.createElement('span', { className: "vr d-none d-md-inline-block opacity-25", 'aria-hidden': true })
                        , React.createElement('button', { type: "button", className: "btn btn-link btn-sm p-0 text-primary", title: "Filter" }, React.createElement('i', { className: "isax isax-filter fs-18", 'aria-hidden': true }))
                        , React.createElement(Link, { to: "#", className: "text-primary fs-13" }, "Ignored policies")
                        , React.createElement('div', { className: "form-check form-check-inline mb-0 ms-0" }
                          , React.createElement('input', { className: "form-check-input", type: "checkbox", id: "passedPolicyChecksMisspellings", defaultChecked: true })
                          , React.createElement('label', { className: "form-check-label fs-13", htmlFor: "passedPolicyChecksMisspellings" }, "Passed policy checks")
                        )
                      )
                    )
                    , React.createElement('div', { className: "table-responsive" }
                      , React.createElement('table', { className: "table table-hover table-striped table-borderless mb-0 align-middle" }
                        , React.createElement('thead', {}
                          , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50" }
                            , React.createElement('th', { className: "fw-semibold text-body py-3 ps-4", style: { width: "40px" } })
                            , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Name")
                            , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Note")
                            , React.createElement('th', { className: "fw-semibold text-body py-3 pe-4" }, "Priority")
                          )
                        )
                        , React.createElement('tbody', {}
                          , React.createElement('tr', { className: "bg-primary bg-opacity-10" }
                            , React.createElement('td', { className: "ps-4 py-2 align-middle" }, React.createElement('i', { className: "isax isax-tick-circle text-success fs-24", 'aria-hidden': true }))
                            , React.createElement('td', { className: "py-2 align-middle" }, "Text")
                            , React.createElement('td', { className: "py-2 align-middle text-muted" }, "—")
                            , React.createElement('td', { className: "pe-4 py-2 align-middle" }, React.createElement('span', { className: "badge bg-danger bg-opacity-10 text-danger rounded-pill" }, "High"))
                          )
                          , React.createElement('tr', {}
                            , React.createElement('td', { className: "ps-4 py-2 align-middle" }, React.createElement('i', { className: "isax isax-tick-circle text-success fs-24", 'aria-hidden': true }))
                            , React.createElement('td', { className: "py-2 align-middle" }, "Text that starts with Lorem ipsum")
                            , React.createElement('td', { className: "py-2 align-middle text-muted" }, "—")
                            , React.createElement('td', { className: "pe-4 py-2 align-middle" }, React.createElement('span', { className: "badge bg-danger bg-opacity-10 text-danger rounded-pill" }, "High"))
                          )
                        )
                      )
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-lg-4" }
                , React.createElement('div', { className: "card border-0 shadow-sm" }
                  , React.createElement('div', { className: "card-body" }
                    , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                      , React.createElement('h6', { className: "mb-0 d-flex align-items-center" }
                        , React.createElement('i', { className: "isax isax-tick-circle text-success me-2 fs-18", 'aria-hidden': true }), "Text"
                      )
                      , React.createElement('div', { className: "d-flex align-items-center gap-1" }
                        , React.createElement('div', { className: "dropdown" }
                          , React.createElement('button', { className: "btn btn-sm btn-light dropdown-toggle", type: "button", 'data-bs-toggle': "dropdown", 'aria-expanded': "false" }, "Action")
                          , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                            , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Edit"))
                            , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Ignore"))
                          )
                        )
                        , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light", title: "Search" }, React.createElement('i', { className: "isax isax-search-normal-1", 'aria-hidden': true }))
                      )
                    )
                    , React.createElement('div', { className: "border-bottom pb-3 mb-3" }
                      , React.createElement('button', { type: "button", className: "btn btn-sm rounded-0 border-0 border-bottom border-2 border-primary px-0 pb-1" }, "Information")
                    )
                    , React.createElement('div', { className: "mb-3" }
                      , React.createElement('p', { className: "fs-13 text-muted mb-1 d-flex align-items-center gap-1" }, React.createElement('i', { className: "isax isax-info-circle fs-14", 'aria-hidden': true }), "Created Dec 9, 2025")
                      , React.createElement('p', { className: "fs-13 text-muted mb-1 d-flex align-items-center gap-1" }, React.createElement('i', { className: "isax isax-clock fs-14", 'aria-hidden': true }), "Last run")
                      , React.createElement('p', { className: "fs-13 text-muted mb-1 d-flex align-items-center gap-1" }, React.createElement('i', { className: "isax isax-clock fs-14", 'aria-hidden': true }), "This policy is scheduled")
                      , React.createElement('p', { className: "fs-13 text-muted mb-0 d-flex align-items-center gap-1" }, React.createElement('i', { className: "isax isax-note-2 fs-14", 'aria-hidden': true }), "Policy note")
                      , React.createElement('p', { className: "fs-13 text-muted mb-0 ps-4" }, "No note has been added")
                    )
                  )
                )
              )
            )
          )
          , activeTab === "qa" && (
            React.createElement('div', { className: "row g-3" }
              , React.createElement('div', { className: "col-12 col-md-4 col-lg-3" }
                , React.createElement('div', { className: "card border-0 shadow-sm h-100" }
                  , React.createElement('div', { className: "card-body py-3" }
                    , React.createElement('nav', { className: "nav flex-column gap-1" }
                      , QA_SIDEBAR_ITEMS.map((item) => {
                        const isActive = qaSubView === item.key;
                        return (
                          React.createElement('button', {
                            key: item.key,
                            type: "button",
                            onClick: () => setQaSubView(item.key),
                            className: `nav-link border-0 text-start d-flex align-items-center justify-content-between py-2 px-3 rounded w-100 ${isActive ? "bg-primary bg-opacity-10 text-primary fw-medium border-start border-3 border-primary" : "text-body bg-transparent"}`
                          }

                            , React.createElement('span', { className: "d-flex align-items-center gap-2" }
                              , React.createElement('i', { className: `isax ${item.icon} fs-18`, 'aria-hidden': true })
                              , React.createElement('span', {}, item.label)
                            )
                            , "badge" in item && item.badge != null && (
                              React.createElement('span', { className: `badge rounded-pill bg-${item.badgeVariant} bg-opacity-10 text-${item.badgeVariant}` }, item.badge)
                            )
                            , "status" in item && item.status === "ok" && (
                              React.createElement('i', { className: "isax isax-tick-circle text-success fs-18", 'aria-hidden': true })
                            )
                          )
                        );
                      })
                    )
                  )
                )
              )
              , React.createElement('div', { className: "col-12 col-md-8 col-lg-9" }
                , qaSubView === "broken-links" && (
                  React.createElement(React.Fragment, null
                    , React.createElement('div', { className: "card border-0 shadow-sm mb-3" }
                      , React.createElement('div', { className: "card-body pb-0" }
                        , React.createElement('div', { className: "d-flex align-items-center gap-2 mb-2" }
                          , React.createElement('span', { className: "avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" }
                            , React.createElement('i', { className: "isax isax-link-2 fs-22", 'aria-hidden': true })
                          )
                          , React.createElement('div', {}
                            , React.createElement('h6', { className: "mb-0 fw-semibold" }, "Broken Links")
                            , React.createElement('p', { className: "text-muted fs-13 mb-0" }, BROKEN_LINKS_SAMPLE.length, " issues found")
                          )
                        )
                        , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2 gap-md-3 border-bottom" }
                          , React.createElement('div', { className: "nav nav-tabs border-0 gap-4" }
                            , React.createElement('button', { type: "button", className: "nav-link active border-0 px-0 pb-2 border-bottom border-2 border-primary text-primary fw-medium" }, "All")
                            , React.createElement('button', { type: "button", className: "nav-link border-0 px-0 pb-2 text-body" }, "Ignored")
                            , React.createElement('button', { type: "button", className: "nav-link border-0 px-0 pb-2 text-body" }, "Marked as fixed")
                          )
                          , React.createElement('div', { className: "d-flex align-items-center gap-2 ms-auto" }
                            , React.createElement(DownloadReportDropdown, {
                              reportBaseName: baseName,
                              onExportCSV: exportBrokenLinksCSV,
                              onExportExcel: exportBrokenLinksExcel,
                              onExportPDF: exportBrokenLinksPDF
                            }
                            )
                            , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light", title: "Filter" }, React.createElement('i', { className: "isax isax-filter", 'aria-hidden': true }))
                          )
                        )
                      )
                    )
                    , React.createElement('div', { className: "card border-0 shadow-sm" }
                      , React.createElement('div', { className: "card-body p-0" }
                        , React.createElement('div', { className: "table-responsive" }
                          , React.createElement('table', { className: "table table-hover table-striped table-borderless align-middle mb-0" }
                            , React.createElement('thead', {}
                              , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50" }
                                , React.createElement('th', { className: "py-3 ps-4", style: { width: 40 } }, React.createElement('input', { type: "checkbox", className: "form-check-input", 'aria-label': "Select all" }))
                                , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Broken link")
                                , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Response code")
                                , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Type")
                                , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Open Issue Page")
                                , React.createElement('th', { className: "fw-semibold text-body py-3" }, "Action")
                              )
                            )
                            , React.createElement('tbody', {}
                              , brokenLinksPaginated.map((row) => (
                                React.createElement('tr', { key: row.id }
                                  , React.createElement('td', { className: "ps-4 py-2" }, React.createElement('input', { type: "checkbox", className: "form-check-input", 'aria-label': `Select ${row.id}` }))
                                  , React.createElement('td', { className: "py-2" }, React.createElement('a', { href: row.url, target: "_blank", rel: "noopener noreferrer", className: "text-primary text-decoration-none" }, row.url))
                                  , React.createElement('td', { className: "py-2" }, row.responseCode)
                                  , React.createElement('td', { className: "py-2" }, React.createElement('span', { className: "badge bg-secondary bg-opacity-10 text-secondary rounded-pill" }, row.type))
                                  , React.createElement('td', { className: "py-2" }
                                    , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-link text-primary p-0 border-0 bg-transparent text-decoration-none", title: "Open issue page", onClick: () => setSelectedBrokenLinkId(row.id) }, React.createElement('i', { className: "isax isax-info-circle fs-20", 'aria-hidden': true }))
                                  )
                                  , React.createElement('td', { className: "py-2" }
                                    , React.createElement('div', { className: "dropdown d-inline-block ms-1" }
                                      , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light dropdown-toggle", 'data-bs-toggle': "dropdown", 'aria-expanded': "false", title: "Action" }, React.createElement('i', { className: "isax isax-more", 'aria-hidden': true }))
                                      , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
                                        , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Ignore"))
                                        , React.createElement('li', {}, React.createElement('button', { type: "button", className: "dropdown-item" }, "Mark as fixed"))
                                      )
                                    )
                                  )
                                )
                              ))
                            )
                          )
                        )
                        , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top" }
                          , React.createElement('div', { className: "d-flex align-items-center gap-2" }
                            , React.createElement('span', { className: "text-muted small" }, "Rows per page")
                            , React.createElement('select', { className: "form-select form-select-sm", style: { width: "auto" }, value: brokenLinksRowsPerPage, onChange: (e) => { setBrokenLinksRowsPerPage(Number(e.target.value)); setBrokenLinksPage(1); } }
                              , BROKEN_LINKS_PAGE_OPTIONS.map((n) => React.createElement('option', { key: n, value: n }, n))
                            )
                            , React.createElement('span', { className: "text-muted small" }, (brokenLinksPage - 1) * brokenLinksRowsPerPage + 1, "-", Math.min(brokenLinksPage * brokenLinksRowsPerPage, BROKEN_LINKS_SAMPLE.length), " of ", BROKEN_LINKS_SAMPLE.length)
                          )
                          , React.createElement('nav', { 'aria-label': "Broken links pagination" }
                            , React.createElement('ul', { className: "pagination pagination-sm mb-0" }
                              , React.createElement('li', { className: `page-item ${brokenLinksPage <= 1 ? "disabled" : ""}` }
                                , React.createElement('button', { type: "button", className: "page-link", onClick: () => setBrokenLinksPage((p) => Math.max(1, p - 1)), disabled: brokenLinksPage <= 1, 'aria-label': "Previous" }, "Previous")
                              )
                              , Array.from({ length: brokenLinksTotalPages }, (_, i) => i + 1).map((p) => (
                                React.createElement('li', { key: p, className: `page-item ${brokenLinksPage === p ? "active" : ""}` }
                                  , React.createElement('button', { type: "button", className: "page-link", onClick: () => setBrokenLinksPage(p) }, p)
                                )
                              ))
                              , React.createElement('li', { className: `page-item ${brokenLinksPage >= brokenLinksTotalPages ? "disabled" : ""}` }
                                , React.createElement('button', { type: "button", className: "page-link", onClick: () => setBrokenLinksPage((p) => Math.min(brokenLinksTotalPages, p + 1)), disabled: brokenLinksPage >= brokenLinksTotalPages, 'aria-label': "Next" }, "Next")
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
                , qaSubView === "broken-images" && React.createElement(BrokenImagesSection, { items: BROKEN_IMAGES_SAMPLE, onOpenIssue: setSelectedBrokenImageId })
                , qaSubView === "misspellings" && (
                  React.createElement(MisspellingsSection, { variant: "page", hideDetailsColumn: true, items: MISSPELLINGS_SAMPLE, onOpenIssue: setSelectedMisspellingId })
                )
                , qaSubView === "potential-misspellings" && (
                  React.createElement(PotentialMisspellingsSectionPageDetails, { items: POTENTIAL_MISSPELLINGS_SAMPLE, onOpenIssue: setSelectedPotentialMisspellingId })
                )
                , qaSubView === "ignored-misspellings" && (
                  React.createElement(IgnoredSpellingsSection, { variant: "page", hideDetailsColumn: true, items: IGNORED_SPELLINGS_SAMPLE, onOpenIssue: setSelectedIgnoredSpellingId })
                )
                , qaSubView === "dictionary" && (
                  React.createElement(DictionarySection, { variant: "page", hideDetailsColumn: true, items: DICTIONARY_SAMPLE, onOpenIssue: setSelectedDictionaryId })
                )
                , qaSubView === "readability" && (
                  React.createElement('div', { className: "card border-0 shadow-sm" }
                    , React.createElement('div', { className: "card-body" }
                      , React.createElement('h6', { className: "mb-3 fw-semibold text-body d-flex align-items-center gap-2" }
                        , React.createElement('i', { className: "isax isax-eye text-primary fs-18", 'aria-hidden': true }), "Readability"

                      )
                      , React.createElement('div', { className: "d-flex flex-column" }
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-2 border-top border-bottom border-secondary border-opacity-25" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-1 text-body" }
                            , React.createElement('i', { className: "isax isax-eye text-primary fs-18", 'aria-hidden': true }), "Readability Score"

                          )
                          , React.createElement('span', { className: "fw-medium text-body" }
                            , READABILITY_PAGE_SAMPLE.readabilityScore, " ", READABILITY_PAGE_SAMPLE.readabilityLevel
                          )
                        )
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-3" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-2 text-body" }
                            , React.createElement('i', { className: "isax isax-document-text text-primary fs-18", 'aria-hidden': true }), "Word Count"

                          )
                          , React.createElement('span', { className: "fw-medium text-body" }, READABILITY_PAGE_SAMPLE.wordCount)
                        )
                      )
                    )
                  )
                )
                , qaSubView === "language" && (
                  React.createElement('div', { className: "card border-0 shadow-sm" }
                    , React.createElement('div', { className: "card-body" }
                      , React.createElement('h6', { className: "mb-3 fw-semibold text-body d-flex align-items-center gap-2" }
                        , React.createElement('span', { className: "d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary fw-bold", style: { width: 32, height: 32, fontSize: "0.75rem" }, 'aria-hidden': true }, "AB"), "Language Validation"

                      )
                      , React.createElement('div', { className: "d-flex flex-column" }
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-3 border-top border-secondary border-opacity-25" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-1 text-body" }
                            , React.createElement('i', { className: "isax isax-text-block text-primary fs-18", 'aria-hidden': true }), "Declared language"

                          )
                          , React.createElement('span', { className: "fw-medium text-body" }, LANGUAGE_VALIDATION_PAGE_SAMPLE.declaredLanguage)
                        )
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-3 border-top border-secondary border-opacity-25" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-1 text-body" }
                            , React.createElement('i', { className: "isax isax-search-normal-1 text-primary fs-18", 'aria-hidden': true }), "Detected Languages"

                          )
                          , React.createElement('span', { className: "fw-medium text-body" }, LANGUAGE_VALIDATION_PAGE_SAMPLE.detectedLanguage)
                        )
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-3 border-top border-secondary border-opacity-25" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-1 text-body" }
                            , React.createElement('i', { className: "isax isax-tag text-primary fs-18", 'aria-hidden': true }), "Multi-language tag"

                          )
                          , React.createElement('span', { className: "fw-medium text-body d-flex align-items-center gap-1" }
                            , LANGUAGE_VALIDATION_PAGE_SAMPLE.multiLanguageTag ? "Yes" : "No"
                            , !LANGUAGE_VALIDATION_PAGE_SAMPLE.multiLanguageTag && React.createElement('i', { className: "isax isax-close-circle text-danger fs-18", 'aria-hidden': true })
                          )
                        )
                        , React.createElement('div', { className: "d-flex align-items-center justify-content-between py-3 border-top border-secondary border-opacity-25" }
                          , React.createElement('span', { className: "d-flex align-items-center gap-2 text-body" }
                            , React.createElement('i', { className: "isax isax-info-circle text-primary fs-18", 'aria-hidden': true }), "Language mismatch"

                          )
                          , React.createElement('span', { className: `fw-medium d-flex align-items-center gap-1 ${LANGUAGE_VALIDATION_PAGE_SAMPLE.languageMismatch ? "text-warning" : "text-body"}` }
                            , LANGUAGE_VALIDATION_PAGE_SAMPLE.languageMismatch && React.createElement('i', { className: "isax isax-danger fs-18", 'aria-hidden': true })
                            , LANGUAGE_VALIDATION_PAGE_SAMPLE.languageMismatch ? "Mismatch detected" : "No mismatch"
                          )
                        )
                      )
                    )
                  )
                )
                , !["broken-links", "broken-images", "misspellings", "potential-misspellings", "ignored-misspellings", "dictionary", "readability", "language"].includes(qaSubView) && (
                  React.createElement('div', { className: "card border-0 shadow-sm" }
                    , React.createElement('div', { className: "card-body" }
                      , React.createElement('h6', { className: "mb-2" }, _nullishCoalesce(_optionalChain([QA_SIDEBAR_ITEMS, 'access', _6 => _6.find, 'call', _7 => _7((i) => i.key === qaSubView), 'optionalAccess', _8 => _8.label]), () => ("Report")))
                      , React.createElement('p', { className: "text-muted fs-13 mb-0" }, "Report content for this page.")
                    )
                  )
                )
              )
            )
          )
          , activeTab === "accessibility" && React.createElement(AccessibilitySection, {})
          , activeTab === "seo" && React.createElement(SeoSection, {})
          , activeTab === "inventory" && React.createElement(InventorySection, {})
          , activeTab === "performance" && React.createElement(PerformanceSection, { page: effectivePage ? { title: effectivePage.title, url: effectivePage.url } : null })
        )
      )

      , React.createElement(BrokenLinkIssueDrawer, {
        open: selectedBrokenLinkId != null,
        onClose: () => setSelectedBrokenLinkId(null),
        issue: selectedBrokenLinkId != null ? _nullishCoalesce(BROKEN_LINKS_SAMPLE.find((r) => r.id === selectedBrokenLinkId), () => (null)) : null,
        page: effectivePage ? { title: effectivePage.title, url: effectivePage.url } : undefined
      }
      )
      , React.createElement(BrokenImageIssueDrawer, {
        open: selectedBrokenImageId != null,
        onClose: () => setSelectedBrokenImageId(null),
        issue: selectedBrokenImageId != null ? _nullishCoalesce(BROKEN_IMAGES_SAMPLE.find((r) => r.id === selectedBrokenImageId), () => (null)) : null,
        page: effectivePage ? { title: effectivePage.title, url: effectivePage.url } : undefined
      }
      )
      , React.createElement(MisspellingDetailDrawer, {
        key: _nullishCoalesce(selectedMisspellingId, () => ("closed")),
        open: selectedMisspellingId != null,
        onClose: () => setSelectedMisspellingId(null),
        issue:
          selectedMisspellingId != null
            ? (() => {
              const row = MISSPELLINGS_SAMPLE.find((r) => r.id === selectedMisspellingId);
              return row ? { id: row.id, word: row.word, language: row.language, dateFound: row.dateFound } : null;
            })()
            : null
        ,
        pagesWithMisspelling: pagesWithMisspellingForDrawer,
        onOpenPageDetails: (p) => {
          setOverridePage({ id: 0, title: p.title, url: p.url });
          setQaSubView("misspellings");
          setSelectedMisspellingId(null);
        },
        backdropZIndex: panelZIndex + 5,
        panelZIndex: panelZIndex + 10
      }
      )
      , React.createElement(PotentialMisspellingIssueDrawer, {
        key: _nullishCoalesce(selectedPotentialMisspellingId, () => ("closed")),
        open: selectedPotentialMisspellingId != null,
        onClose: () => setSelectedPotentialMisspellingId(null),
        issue: selectedPotentialMisspellingId != null ? _nullishCoalesce(POTENTIAL_MISSPELLINGS_SAMPLE.find((r) => r.id === selectedPotentialMisspellingId), () => (null)) : null,
        onOpenPageDetails: (p, qaSubView) => {
          setOverridePage({ id: 0, title: p.title, url: p.url });
          setQaSubView(_nullishCoalesce(qaSubView, () => ("potential-misspellings")));
          setSelectedPotentialMisspellingId(null);
        },
        backdropZIndex: panelZIndex + 5,
        panelZIndex: panelZIndex + 10
      }
      )
      , React.createElement(IgnoredSpellingDetailDrawer, {
        key: _nullishCoalesce(selectedIgnoredSpellingId, () => ("closed")),
        open: selectedIgnoredSpellingId != null,
        onClose: () => setSelectedIgnoredSpellingId(null),
        issue:
          selectedIgnoredSpellingId != null
            ? _nullishCoalesce(IGNORED_SPELLINGS_SAMPLE.find((r) => r.id === selectedIgnoredSpellingId), () => (null))
            : null
        ,
        pagesWithIgnoredSpelling: pagesWithIgnoredSpellingForDrawer,
        onOpenPageDetails: (p) => {
          setOverridePage({ id: 0, title: p.title, url: p.url });
          setQaSubView("ignored-misspellings");
          setSelectedIgnoredSpellingId(null);
        },
        backdropZIndex: panelZIndex + 5,
        panelZIndex: panelZIndex + 10
      }
      )
      , React.createElement(DictionaryDetailDrawer, {
        key: _nullishCoalesce(selectedDictionaryId, () => ("closed")),
        open: selectedDictionaryId != null,
        onClose: () => setSelectedDictionaryId(null),
        issue:
          selectedDictionaryId != null
            ? (() => {
              const row = DICTIONARY_SAMPLE.find((r) => r.id === selectedDictionaryId);
              return row ? { id: row.id, word: row.word, language: row.language, dateAdded: row.dateAdded } : null;
            })()
            : null
        ,
        pagesWithEntry: pagesWithDictionaryEntryForDrawer,
        onOpenPageDetails: (p) => {
          setOverridePage({ id: 0, title: p.title, url: p.url });
          setQaSubView("dictionary");
          setSelectedDictionaryId(null);
        },
        backdropZIndex: panelZIndex + 5,
        panelZIndex: panelZIndex + 10
      }
      )
    )
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
}
