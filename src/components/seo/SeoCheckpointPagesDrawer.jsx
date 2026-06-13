import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDomainSeoPagesApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DEFAULT_QUICK_HELP = [
  "This page is missing a title.",
  "We recommend that all your pages has an unique title.",
];

const getFriendlyIssueMessage = (msg) => {
  if (!msg) return "";
  const lower = msg.toLowerCase();
  if (
    lower.includes("incomplete t&c") ||
    lower.includes("incomplete terms") ||
    (lower.includes("t&c") && lower.includes("missing"))
  ) {
    return "Terms & Conditions is missing key legal clauses";
  }
  return msg;
};

const getQuickHelp = (name) => {
  const lower = (name || "").toLowerCase();

  if (lower.includes("broken link") || lower.includes("broken_link")) {
    return [
      "This page contains broken (dead) hyperlinks which can hurt user experience and search engine indexation.",
      "Solution: Update the broken URLs to valid active links, or remove them entirely if they are no longer needed.",
    ];
  }
  if (lower.includes("broken image") || lower.includes("broken_image")) {
    return [
      "This page has one or more broken images that are failing to load.",
      "Solution: Verify the image source links and ensure the image files exist at the specified path, or update them to valid image links.",
    ];
  }
  if (
    lower.includes("meta title") ||
    lower.includes("missing title") ||
    lower.includes("title missing")
  ) {
    return [
      "This page is missing a main title tag or has an empty <title> tag in the head block.",
      "Solution: Add a unique, descriptive <title> tag (ideally 50–60 characters) containing the page's primary target keywords.",
    ];
  }
  if (
    lower.includes("meta description") ||
    lower.includes("description missing") ||
    lower.includes("missing description")
  ) {
    return [
      "This page is missing a meta description, which acts as the preview snippet in search engine results pages.",
      'Solution: Add a descriptive <meta name="description" content="..."> tag (ideally 120–155 characters) to summarize the content.',
    ];
  }
  if (
    lower.includes("description too long") ||
    lower.includes("description length")
  ) {
    return [
      "The page's meta description is too long (exceeds 155 characters) and will get truncated in Google search results.",
      "Solution: Rewrite the meta description to be punchy and fit cleanly within the 120–155 character limit.",
    ];
  }
  if (lower.includes("description too short")) {
    return [
      "The page's meta description is too short (under 30 characters), which provides insufficient context for search engines.",
      "Solution: Expand the description to describe the page's contents clearly and include a compelling call-to-action.",
    ];
  }
  if (
    lower.includes("h1 missing") ||
    lower.includes("h1 tag missing") ||
    lower.includes("missing h1") ||
    lower.includes("no h1")
  ) {
    return [
      "This page is missing an H1 heading tag. The H1 is the single most important heading that tells search engines what the page is about.",
      "Solution: Add exactly one unique, descriptive H1 heading tag at the top of your page content.",
    ];
  }
  if (lower.includes("multiple h1") || lower.includes("more than one h1")) {
    return [
      "This page has multiple H1 tags. We recommend having exactly one H1 tag per page to maintain clear hierarchy.",
      "Solution: Consolidate multiple H1 tags into a single H1, and demote secondary headers to H2 or H3 tags.",
    ];
  }
  if (
    lower.includes("alt text") ||
    lower.includes("missing alt") ||
    lower.includes("images missing alt")
  ) {
    return [
      "Some images on this page are missing alternative text (alt attributes), which harms accessibility and image search optimization.",
      'Solution: Add descriptive alt attributes (e.g. alt="Description of image") to all non-decorative image tags.',
    ];
  }
  if (lower.includes("canonical")) {
    return [
      "This page is missing a canonical link tag, which is critical to define the preferred version of the page and avoid duplicate content penalties.",
      'Solution: Add a <link rel="canonical" href="..."> tag inside the <head> block pointing to the primary URL of the page.',
    ];
  }
  if (lower.includes("lcp") || lower.includes("largest contentful paint")) {
    return [
      "Largest Contentful Paint (LCP) measures how long it takes for the main content block of the page to load. Aim for under 2.5 seconds.",
      "Solution: Compress large images, convert to modern formats like WebP, defer non-critical JS/CSS, and implement server-side caching or a CDN.",
    ];
  }
  if (
    lower.includes("inp") ||
    lower.includes("interaction to next paint") ||
    lower.includes("fid")
  ) {
    return [
      "Interaction to Next Paint (INP) measures the page's responsiveness to user input (like clicks or taps). Poor responsiveness causes user drop-off.",
      "Solution: Optimize JavaScript execution, minimize heavy framework overhead, break up long tasks, and remove unused scripts.",
    ];
  }
  if (lower.includes("fcp") || lower.includes("first contentful paint")) {
    return [
      "First Contentful Paint (FCP) tracks when the first text block or image is visually rendered on the screen. Over 1.8 seconds feels unresponsive.",
      "Solution: Eliminate render-blocking CSS/JS, optimize font delivery (use font-display: swap), and improve initial server response times.",
    ];
  }
  if (lower.includes("cls") || lower.includes("cumulative layout shift")) {
    return [
      "Cumulative Layout Shift (CLS) measures the visual stability of your page by tracking unexpected element movements during load.",
      "Solution: Always include explicit width and height dimensions on images and dynamic iframes, and reserve styled spaces for delayed ads.",
    ];
  }
  if (lower.includes("blocking time") || lower.includes("tbt")) {
    return [
      "Total Blocking Time (TBT) measures the amount of time that the page load was blocked from responding to user inputs (like mouse clicks).",
      "Solution: Split large JS bundles into smaller chunks using code-splitting, defer non-essential scripts, and optimize execution speed.",
    ];
  }
  if (lower.includes("speed index")) {
    return [
      "Speed Index measures how quickly page contents are visually filled in during loading.",
      "Solution: Compress media resources, prioritize the loading of critical above-the-fold content, and implement lazy-loading for off-screen images.",
    ];
  }
  if (lower.includes("render-blocking") || lower.includes("render blocking")) {
    return [
      "Resources (styles or scripts) are blocking the initial visual paint of your page, causing a blank screen load delay.",
      "Solution: Inline critical CSS styles, defer non-critical scripts by adding the async or defer attributes, and optimize script loading orders.",
    ];
  }
  if (
    lower.includes("terms") ||
    lower.includes("compliance") ||
    lower.includes("t&c")
  ) {
    return [
      "This page contains incomplete or missing legal disclosures (like Terms & Conditions, Refund Policies, or Limitation of Liability clauses).",
      "Solution: Update your legal pages to fully specify governing laws, user agreements, refund policies, and user data protections.",
    ];
  }
  if (
    lower.includes("spelling") ||
    lower.includes("misspelling") ||
    lower.includes("typo")
  ) {
    return [
      "One or more words on this page may be misspelled. Correct spelling builds user trust and signals high-quality content to search engines.",
      "Solution: Correct the typos in your page copy, or add them to your ignore list if they are unique brand-specific names.",
    ];
  }

  return [
    "We identified some SEO optimization improvements on this page that are currently holding back its full ranking potential.",
    "Solution: Review the specific checkpoint requirements and update the page source code or content to improve its SEO health.",
  ];
};

const SeoCheckpointPagesDrawer = ({
  open,
  onClose,
  issueName: rawIssueName,
  pageCount,
  domainTotalPages = 1,
  quickHelpLines = DEFAULT_QUICK_HELP,
  onOpenPageDetails,
}) => {
  const issueName = getFriendlyIssueMessage(rawIssueName);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedPageUrl, setExpandedPageUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchPages = useCallback(async () => {
    if (!domainId || !rawIssueName || !open) return;
    setIsLoading(true);
    try {
      const response = await getDomainSeoPagesApi(
        domainId,
        currentPage,
        rowsPerPage,
        searchQuery,
        rawIssueName,
      );
      if (response.success) {
        setPages(response.data.pages);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch issue pages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId, rawIssueName, currentPage, rowsPerPage, searchQuery, open]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Polling for updates if open
  useEffect(() => {
    let interval;
    if (open) {
      interval = setInterval(() => {
        fetchPages();
      }, 10000); // Poll every 10 seconds while drawer is open
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, fetchPages]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return pages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...pages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0));
      }
      return dir * (a.targetedIssueCount - b.targetedIssueCount);
    });
  }, [pages, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const reportBaseName = safeFilename(
    `${issueName.replace(/\s+/g, "-")}-Pages-Report`,
  );

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Priority,Issues\n";
    const body = sortedPages
      .map((p) =>
        [
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.url.replace(/"/g, '""')}"`,
          `"${p.priority}"`,
          p.targetedIssueCount,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${reportBaseName}.csv`);
  }, [reportBaseName, sortedPages]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedPages.map((p) => ({
      Title: p.title || "",
      URL: p.url,
      Priority: p.priority,
      Issues: p.targetedIssueCount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
  }, [reportBaseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text("SEO ISSUE REPORT", 105, yPos, { align: "center" });
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Issue Type: ${issueName}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Pages Affected: ${totalCount}`, 20, yPos);
    yPos += 15;

    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Content
    doc.setFontSize(12);
    sortedPages.forEach((p, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(
        `${index + 1}. URL: ${p.url.slice(0, 75)}${p.url.length > 75 ? "..." : ""}`,
        20,
        yPos,
      );
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`   Issues Found: ${p.targetedIssueCount}`, 20, yPos);
      yPos += 7;
      doc.text(`   Severity: ${p.priority}`, 20, yPos);
      yPos += 10;

      doc.setFont("helvetica", "bold");
      doc.text("   Problem:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const problem = getQuickHelp(issueName)[0];
      const splitProblem = doc.splitTextToSize(`   - ${problem}`, 160);
      doc.text(splitProblem, 20, yPos);
      yPos += splitProblem.length * 6;

      doc.setFont("helvetica", "bold");
      doc.text("   Recommendation:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const recommendation = getQuickHelp(issueName)[1];
      const splitRec = doc.splitTextToSize(`   - ${recommendation}`, 160);
      doc.text(splitRec, 20, yPos);
      yPos += splitRec.length * 6 + 10;

      doc.setDrawColor(240, 240, 240);
      doc.line(25, yPos - 5, 185, yPos - 5);
      yPos += 5;
    });

    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, sortedPages, issueName, totalCount]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSearchQuery("");
    setExpandedPageUrl(null);
    setPreviewImageUrl(null);
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
        style={{
          zIndex: DRAWER_Z_PANEL,
          width: "min(100%, 960px)",
          maxWidth: "960px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seo-checkpoint-pages-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex flex-wrap align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle text-body"
                  aria-hidden="true"
                />
              </button>
              <div>
                <h5
                  className="mb-1 fw-semibold text-body"
                  id="seo-checkpoint-pages-drawer-title"
                >
                  {issueName || "Issue Details"}
                </h5>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill fs-12 fw-medium px-3 py-2">
                    <i className="isax isax-document-text me-1"></i>
                    {totalCount.toLocaleString()} Page
                    {totalCount !== 1 ? "s" : ""} Needing Fix
                  </span>
                  <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill fs-12 fw-medium px-3 py-2">
                    <i className="isax isax-danger me-1"></i>
                    Total {pageCount.toLocaleString()} SEO Issue
                    {pageCount !== 1 ? "s" : ""} Found
                  </span>
                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <DownloadReportDropdown
                reportBaseName={reportBaseName}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                className="border border-secondary border-opacity-25 rounded-2"
              />
              <div
                className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
                style={{ width: 220 }}
              >
                <span
                  className="d-flex align-items-center ps-3 flex-shrink-0 text-muted"
                  aria-hidden="true"
                >
                  <i
                    className="isax isax-search-normal-1"
                    style={{ fontSize: "1rem" }}
                    aria-hidden="true"
                  />
                </span>
                <input
                  type="search"
                  className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search"
                  style={{ paddingLeft: "0.5rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto px-4 py-4">
          {/* Quick help */}
          <div className="bg-body-tertiary bg-opacity-50 rounded-2 p-3 mb-4">
            <h6 className="fw-semibold text-body fs-13 mb-2">Quick help</h6>
            <ul className="text-muted fs-13 mb-0 ps-3">
              {getQuickHelp(issueName).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                {isLoading ? (
                  <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <table className="table table-hover table-striped table-borderless align-middle mb-0">
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                        <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                            onClick={() => handleSort("title")}
                          >
                            Page Title & Address
                            {sortBy === "title" ? (
                              <i
                                className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <i
                                className="isax isax-sort fs-12 opacity-50"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </th>
                        <th className="py-3 text-body fs-13 fw-semibold">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                            onClick={() => handleSort("priority")}
                          >
                            Priority
                            {sortBy === "priority" ? (
                              <i
                                className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <i
                                className="isax isax-sort fs-12 opacity-50"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPages.map((p, idx) => {
                        const lowerName = issueName.toLowerCase();
                        const isLargeImages =
                          lowerName.includes("large image") ||
                          lowerName.includes("images detected") ||
                          lowerName.includes("kb");
                        const isSpelling =
                          lowerName.includes("spelling") ||
                          lowerName.includes("typo") ||
                          lowerName.includes("misspell");

                        const isLCP =
                          lowerName.includes("lcp") ||
                          lowerName.includes("largest contentful paint");
                        const isFCP =
                          lowerName.includes("fcp") ||
                          lowerName.includes("first contentful paint");
                        const isINP =
                          lowerName.includes("inp") ||
                          lowerName.includes("interaction to next paint");
                        const isCLS =
                          lowerName.includes("cls") ||
                          lowerName.includes("cumulative layout shift");
                        const isTBT =
                          lowerName.includes("tbt") ||
                          lowerName.includes("blocking time");
                        const isSpeedIndex = lowerName.includes("speed index");
                        const isWebVital =
                          isLCP ||
                          isFCP ||
                          isINP ||
                          isCLS ||
                          isTBT ||
                          isSpeedIndex;

                        const isBrokenLinks =
                          lowerName.includes("broken link") ||
                          lowerName.includes("links");
                        const isBrokenImages =
                          lowerName.includes("broken image");

                        const hasCollapse = true; // Every single row in the drawer is expandable!
                        const isExpanded = expandedPageUrl === p.url;

                        // Find the exact seoImprovement matching the drawer's issue (using type/metric comparison for robust match)
                        const matchingImprovement = (
                          p.seoImprovements || []
                        ).find((imp) => {
                          const m = (imp.message || "").toLowerCase();

                          if (
                            isLCP &&
                            (m.includes("lcp") ||
                              m.includes("largest contentful paint"))
                          )
                            return true;
                          if (
                            isFCP &&
                            (m.includes("fcp") ||
                              m.includes("first contentful paint"))
                          )
                            return true;
                          if (
                            isINP &&
                            (m.includes("inp") ||
                              m.includes("interaction to next paint"))
                          )
                            return true;
                          if (
                            isCLS &&
                            (m.includes("cls") || m.includes("layout shift"))
                          )
                            return true;
                          if (
                            isTBT &&
                            (m.includes("tbt") || m.includes("blocking time"))
                          )
                            return true;
                          if (isSpeedIndex && m.includes("speed index"))
                            return true;
                          if (
                            isBrokenLinks &&
                            (m.includes("broken link") ||
                              m.includes("links") ||
                              imp.type === "broken-links")
                          )
                            return true;
                          if (
                            isBrokenImages &&
                            (m.includes("broken image") ||
                              imp.type === "broken-images")
                          )
                            return true;
                          if (
                            isLargeImages &&
                            (m.includes("large image") ||
                              m.includes("kb") ||
                              imp.type === "images")
                          )
                            return true;
                          if (
                            isSpelling &&
                            (m.includes("spelling") ||
                              m.includes("typo") ||
                              imp.type === "spelling")
                          )
                            return true;

                          const nm = getFriendlyIssueMessage(m).toLowerCase();
                          const rawFriendlyMapped =
                            getFriendlyIssueMessage(rawIssueName).toLowerCase();
                          return (
                            m.includes(rawFriendlyMapped) ||
                            nm.includes(rawFriendlyMapped) ||
                            rawFriendlyMapped.includes(m) ||
                            rawFriendlyMapped.includes(nm)
                          );
                        });

                        let currentValue = null;
                        let requiredValue = "";
                        let metricLabel = "";
                        let unit = "";

                        if (isWebVital && matchingImprovement) {
                          const details = matchingImprovement.details || {};
                          if (isLCP) {
                            currentValue =
                              details.LCP ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 2.50s";
                            metricLabel = "Largest Contentful Paint (LCP)";
                            unit = "s";
                          } else if (isFCP) {
                            currentValue =
                              details.FCP ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 1.80s";
                            metricLabel = "First Contentful Paint (FCP)";
                            unit = "s";
                          } else if (isINP) {
                            currentValue =
                              details.INP ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 0.20s";
                            metricLabel = "Interaction to Next Paint (INP)";
                            unit = "s";
                          } else if (isCLS) {
                            currentValue =
                              details.CLS ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 0.100";
                            metricLabel = "Cumulative Layout Shift (CLS)";
                            unit = "";
                          } else if (isTBT) {
                            currentValue =
                              details.TBT ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 0.200s";
                            metricLabel = "Total Blocking Time (TBT)";
                            unit = "s";
                          } else if (isSpeedIndex) {
                            currentValue =
                              details.SpeedIndex ||
                              parseFloat(
                                matchingImprovement.message.match(
                                  /(\d+\.\d+)/,
                                )?.[1],
                              );
                            requiredValue = "< 3.40s";
                            metricLabel = "Speed Index";
                            unit = "s";
                          }
                        }

                        return (
                          <React.Fragment key={`${p.url}-${idx}`}>
                            <tr
                              className={`align-middle border-bottom border-secondary border-opacity-10 ${hasCollapse ? "cursor-pointer hover-bg-light" : ""}`}
                              onClick={() => {
                                if (hasCollapse) {
                                  setExpandedPageUrl(isExpanded ? null : p.url);
                                }
                              }}
                            >
                              <td className="py-3 ps-4">
                                <div className="d-flex align-items-center gap-2">
                                  {hasCollapse && (
                                    <span
                                      className="text-muted flex-shrink-0"
                                      style={{ width: 16 }}
                                    >
                                      <i
                                        className={`isax ${isExpanded ? "isax-arrow-up-1" : "isax-arrow-down-1"} fs-14`}
                                      ></i>
                                    </span>
                                  )}
                                  <div className="d-flex flex-column min-w-0">
                                    <span className="text-body fw-medium fs-13 text-truncate">
                                      {p.title || "(No title found)"}
                                    </span>
                                    <a
                                      href={p.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break hover-underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="flex-shrink-0 d-inline-flex text-primary">
                                        <ExternalLinkIcon size={12} />
                                      </span>
                                      {p.url}
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`badge rounded-pill ${
                                    p.priority === "High"
                                      ? "bg-danger bg-opacity-10 text-danger"
                                      : p.priority === "Medium"
                                        ? "bg-warning bg-opacity-10 text-warning"
                                        : "bg-secondary bg-opacity-10 text-secondary"
                                  }`}
                                >
                                  {p.priority}
                                </span>
                              </td>
                            </tr>

                            {hasCollapse && isExpanded && (
                              <tr className="bg-body-tertiary bg-opacity-25">
                                <td colSpan="2" className="py-2 border-0">
                                  {isLargeImages && (
                                    <div className="bg-light bg-opacity-50 border border-secondary border-opacity-10 rounded-2 p-3 my-2 ms-4 me-4 shadow-sm">
                                      <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                                        <i className="isax isax-image fs-16"></i>
                                        <h6 className="fs-12 fw-semibold mb-0">
                                          Detected Large Images (Above 150KB):
                                        </h6>
                                      </div>
                                      {p.largeImages &&
                                      p.largeImages.length > 0 ? (
                                        <div className="d-flex flex-column gap-2 mt-2">
                                          {p.largeImages.map((img, i) => (
                                            <div
                                              key={i}
                                              className="d-flex align-items-center justify-content-between gap-3 p-2 bg-white rounded border border-secondary border-opacity-10 fs-12"
                                            >
                                              <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                                                <button
                                                  type="button"
                                                  className="btn btn-icon btn-sm btn-light border-0 rounded-2 p-1 flex-shrink-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewImageUrl(img.url);
                                                  }}
                                                  title="Preview Image"
                                                >
                                                  <i
                                                    className="isax isax-eye text-primary fs-16"
                                                    aria-hidden="true"
                                                  />
                                                </button>
                                                <a
                                                  href={img.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-primary text-truncate text-decoration-none hover-underline"
                                                  style={{ maxWidth: "85%" }}
                                                >
                                                  {img.url}
                                                </a>
                                              </div>
                                              <span className="badge bg-warning bg-opacity-10 text-warning fw-semibold px-2 py-1 flex-shrink-0">
                                                {img.size ||
                                                  (img.sizeBytes
                                                    ? (
                                                        img.sizeBytes / 1024
                                                      ).toFixed(1) + " KB"
                                                    : "Unknown Size")}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-muted fs-12 py-1">
                                          No large images details found on this
                                          page.
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {isSpelling && (
                                    <div className="bg-light bg-opacity-50 border border-secondary border-opacity-10 rounded-2 p-3 my-2 ms-4 me-4 shadow-sm">
                                      <div className="d-flex align-items-center gap-2 mb-2 text-danger">
                                        <i className="isax isax-edit fs-16"></i>
                                        <h6 className="fs-12 fw-semibold mb-0">
                                          Misspelled Words & Suggestions:
                                        </h6>
                                      </div>
                                      {p.misspellings &&
                                      p.misspellings.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                          {p.misspellings.map((spell, i) => {
                                            const wordStr =
                                              typeof spell === "string"
                                                ? spell
                                                : spell.word;
                                            const suggestionsList =
                                              spell.suggestions || [];
                                            return (
                                              <div
                                                key={i}
                                                className="d-flex flex-column p-2 bg-white rounded border border-secondary border-opacity-10 fs-12"
                                                style={{ minWidth: 140 }}
                                              >
                                                <span className="fw-semibold text-danger">
                                                  {wordStr}
                                                </span>
                                                {suggestionsList.length > 0 && (
                                                  <span className="text-muted fs-11 mt-1">
                                                    Suggestions:{" "}
                                                    {suggestionsList
                                                      .slice(0, 3)
                                                      .join(", ")}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="text-muted fs-12 py-1">
                                          No spelling mistakes details found on
                                          this page.
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {isBrokenLinks && (
                                    <div className="bg-light bg-opacity-50 border border-secondary border-opacity-10 rounded-2 p-3 my-2 ms-4 me-4 shadow-sm">
                                      <div className="d-flex align-items-center gap-2 mb-2 text-danger">
                                        <i className="isax isax-link fs-16"></i>
                                        <h6 className="fs-12 fw-semibold mb-0">
                                          Broken Links:
                                        </h6>
                                      </div>
                                      {(p.brokenLinks &&
                                      p.brokenLinks.length > 0
                                        ? p.brokenLinks
                                        : p.broken_links &&
                                            p.broken_links.length > 0
                                          ? p.broken_links
                                          : p.links &&
                                              p.links.broken &&
                                              p.links.broken.length > 0
                                            ? p.links.broken
                                            : []
                                      ).length > 0 ? (
                                        <div className="d-flex flex-column gap-2 mt-2">
                                          {(
                                            p.brokenLinks ||
                                            p.broken_links ||
                                            (p.links && p.links.broken) ||
                                            []
                                          ).map((link, i) => (
                                            <div
                                              key={i}
                                              className="d-flex align-items-center gap-2 min-w-0 flex-grow-1"
                                            >
                                              <ExternalLinkIcon size={12} />
                                              <a
                                                href={link.url || link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-truncate text-decoration-none hover-underline"
                                                style={{ maxWidth: "85%" }}
                                              >
                                                {link.url || link}
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-muted fs-12 py-1">
                                          No broken links found on this page.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {isWebVital && (
                                    <div className="bg-light bg-opacity-50 border border-secondary border-opacity-10 rounded-2 p-3 my-2 ms-4 me-4 shadow-sm">
                                      <div className="d-flex align-items-center gap-2 mb-3 text-warning">
                                        <i className="isax isax-flash fs-16"></i>
                                        <h6 className="fs-12 fw-semibold mb-0">
                                          Core Web Vital Diagnostics:
                                        </h6>
                                      </div>

                                      <div className="row g-3">
                                        <div className="col-sm-6">
                                          <div className="p-3 bg-white rounded border border-secondary border-opacity-10 text-center">
                                            <div className="fs-11 text-muted text-uppercase fw-semibold mb-1">
                                              Current {metricLabel}
                                            </div>
                                            <div className="fs-18 fw-bold text-danger">
                                              {currentValue !== null &&
                                              !isNaN(currentValue)
                                                ? `${Number(currentValue).toFixed(2)}${unit}`
                                                : "N/A"}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="col-sm-6">
                                          <div className="p-3 bg-white rounded border border-secondary border-opacity-10 text-center">
                                            <div className="fs-11 text-muted text-uppercase fw-semibold mb-1">
                                              Required Target
                                            </div>
                                            <div className="fs-18 fw-bold text-success">
                                              {requiredValue}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-3 fs-12 text-muted p-2 bg-white rounded border border-secondary border-opacity-10">
                                        <strong>
                                          Diagnostic Recommendation:{" "}
                                        </strong>
                                        {matchingImprovement?.wisdom ||
                                          "Optimize page resources and execution to meet Core Web Vitals target."}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {sortedPages.length === 0 && !isLoading && (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-5 text-muted"
                          >
                            No pages found for this issue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Rows per page</span>
                  <select
                    className="form-select form-select-sm rounded-2"
                    style={{ width: "auto", minWidth: 60 }}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Rows per page"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted small">
                    {(currentPage - 1) * rowsPerPage + 1}–
                    {Math.min(currentPage * rowsPerPage, totalCount)} of{" "}
                    {totalCount}
                  </span>
                </div>
                <nav aria-label="Pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        «
                      </button>
                    </li>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= 7) p = i + 1;
                      else if (currentPage <= 4) p = i + 1;
                      else if (currentPage >= totalPages - 3)
                        p = totalPages - 6 + i;
                      else p = currentPage - 3 + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <li key={p} className="page-item">
                          <button
                            type="button"
                            className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    })}
                    {totalPages > 7 && currentPage < totalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link rounded-2">…</span>
                      </li>
                    )}
                    {totalPages > 7 && (
                      <li className="page-item">
                        <button
                          type="button"
                          className="page-link rounded-2"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </li>
                    )}
                    <li
                      className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Next"
                      >
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1100 }}
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="position-relative bg-white rounded-3 p-3 max-vh-75 d-flex flex-column shadow-lg border border-secondary border-opacity-10"
            style={{ width: "min(90vw, 640px)", maxWidth: "640px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-semibold text-body fs-14">
                Image Preview
              </h6>
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border-0 rounded-circle"
                onClick={() => setPreviewImageUrl(null)}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle text-body fs-20"
                  aria-hidden="true"
                />
              </button>
            </div>
            <div
              className="d-flex align-items-center justify-content-center border border-secondary border-opacity-10 rounded-2 p-2 bg-body-tertiary overflow-auto"
              style={{ maxHeight: "50vh" }}
            >
              <img
                src={previewImageUrl}
                alt="Large Image Resource Preview"
                className="img-fluid rounded object-fit-contain"
                style={{ maxHeight: "48vh" }}
              />
            </div>
            <div className="mt-3 bg-light rounded-2 p-2 text-muted fs-11 text-break word-wrap">
              <strong>URL: </strong>
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-decoration-none hover-underline"
              >
                {previewImageUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};

export default SeoCheckpointPagesDrawer;
