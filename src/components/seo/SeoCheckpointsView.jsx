import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import SeoCheckpointPagesDrawer from "@/components/seo/SeoCheckpointPagesDrawer";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import { getDomainByIdApi, getDomainSeoCheckpointsApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const getFriendlyIssueMessage = (msg) => {
  if (!msg) return "";
  const lower = msg.toLowerCase();
  if (lower.includes("incomplete t&c") || lower.includes("incomplete terms") || (lower.includes("t&c") && lower.includes("missing"))) {
    return "Terms & Conditions is missing key legal clauses";
  }
  return msg;
};

const TEAL = "#14b8a6";

const ComplianceRing = ({ percent, status }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent)) / 100 * circumference;

  let color = "#e5e7eb"; // Default gray
  if (status === "ok" || percent === 100) {
    color = "#22c55e"; // Green
  } else if (percent >= 70) {
    color = TEAL; // Teal
  } else if (percent >= 40) {
    color = "#fd7e14"; // Orange
  } else if (percent > 0) {
    color = "#dc3545"; // Red
  }

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
      <svg width={44} height={44} viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
      </svg>
      {status === "ok" && percent >= 100 ? (
        <i className="isax isax-tick-circle position-absolute text-success fs-18" aria-hidden="true" />
      ) : (
        <span className="position-absolute fw-semibold text-body" style={{ fontSize: "0.65rem" }}>{percent}%</span>
      )}
    </div>
  );
};

function parsePageCount(pagesLabel) {
  if (!pagesLabel) return 0;
  if (typeof pagesLabel === "number") return pagesLabel;
  const m = String(pagesLabel).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

const CheckpointSection = ({
  title,
  iconClass,
  description,
  rows,
  onPagesClick,
}) => {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-semibold text-body mb-1 d-flex align-items-center gap-2">
          <i className={`isax ${iconClass} fs-18`} aria-hidden="true" />
          {title}
        </h6>
        <p className="text-muted fs-13 mb-4">{description}</p>
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25">
                <th className="py-2 ps-0 text-body fs-13 fw-semibold">Audit Checkpoint</th>
                <th className="py-2 pe-0 text-body fs-13 fw-semibold">Affected Pages List</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-bottom border-secondary border-opacity-10">
                  <td className="py-3 ps-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="flex-shrink-0">
                        {row.status === "ok" ? (
                          <i className="isax isax-tick-circle text-success fs-18" aria-hidden="true" />
                        ) : (
                          <i className="isax isax-danger text-danger fs-18" aria-hidden="true" />
                        )}
                      </span>
                      <span 
                        className="fs-13 text-body hover-text-primary" 
                        style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
                        onClick={() => onPagesClick?.(row)}
                        title="Click to view affected pages"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onPagesClick?.(row); } }}
                      >
                        {getFriendlyIssueMessage(row.issue)}
                      </span>
                      {row.showInfoIcon && (
                        <span className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 18, height: 18 }}>
                          <i className="isax isax-information text-primary" style={{ fontSize: 10 }} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pe-0">
                    {(() => {
                      const count = parsePageCount(row.pagesLabel);
                      const displayLabel = count === 0 ? "0 Pages Affected (Passed)" : `${count} Page${count !== 1 ? 's' : ''} Affected`;
                      
                      return row.pagesHref && onPagesClick ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 fs-13 text-primary text-decoration-none fw-medium"
                          onClick={() => onPagesClick(row)}
                        >
                          {displayLabel}
                        </button>
                      ) : row.pagesHref ? (
                        <Link to={row.pagesHref} className="fs-13 text-primary text-decoration-none fw-medium">
                          {displayLabel}
                        </Link>
                      ) : (
                        <span className="fs-13 text-muted">{displayLabel}</span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-3 text-muted fs-13">No issues found in this category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const REPORT_BASE = safeFilename("SEO-Checkpoints-Report");

const QUICK_HELP_BY_ISSUE = {
  "Missing title": ["This page is missing a title.", "We recommend that all your pages has an unique title."],
  "Missing H1": ["This page is missing an H1 heading.", "We recommend that every page has exactly one H1."],
  "Title found on more than one page": ["The same title is used on multiple pages.", "Each page should have a unique title for better SEO."],
  "Multiple H1 on page": ["This page has more than one H1.", "We recommend a single H1 per page."],
  "H1 found on more than one page": ["The same H1 is used on multiple pages.", "Consider using unique H1s per page."],
  "Images missing ALT": ["Some images on this page are missing alt text.", "Add descriptive alt text for accessibility and SEO."],
  "Missing sub headings": ["This page has no sub headings (H2–H6).", "Sub headings help structure content and improve readability."],
};

const SeoCheckpointsView = () => {
  const [checkpointDrawerOpen, setCheckpointDrawerOpen] = useState(false);
  const [checkpointDrawerIssue, setCheckpointDrawerIssue] = useState(null);
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [selectedIssueForPage, setSelectedIssueForPage] = useState(null);
  const [checkpoints, setCheckpoints] = useState({ high: [], medium: [], low: [] });
  const [domain, setDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchCheckpoints = useCallback(async (showLoading = true) => {
    if (!domainId) return;
    if (showLoading) setIsLoading(true);
    try {
      const [cpRes, domRes] = await Promise.all([
        getDomainSeoCheckpointsApi(domainId),
        getDomainByIdApi(domainId)
      ]);
      if (cpRes.success) {
        setCheckpoints(cpRes.data);
      }
      if (domRes.success) {
        setDomain(domRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch SEO checkpoints:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  useEffect(() => {
    let interval;
    if (domain && (domain.dm_seo_status === 'pending' || domain.dm_seo_status === 'scanning')) {
      interval = setInterval(() => {
        fetchCheckpoints(false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [domain, fetchCheckpoints]);

  const openCheckpointPagesDrawer = useCallback((row) => {
    if (parsePageCount(row.pagesLabel) <= 0) return;
    setCheckpointDrawerIssue(row);
    setCheckpointDrawerOpen(true);
  }, []);

  const openPageDetails = useCallback((page, issue) => {
    setSelectedPageForDetails(page);
    setSelectedIssueForPage(issue);
    setPageDetailsDrawerOpen(true);
  }, []);

  const allRows = [
    ...checkpoints.high.map((r) => ({ ...r, priority: "High", issue: getFriendlyIssueMessage(r.issue) })),
    ...checkpoints.medium.map((r) => ({ ...r, priority: "Medium", issue: getFriendlyIssueMessage(r.issue) })),
    ...checkpoints.low.map((r) => ({ ...r, priority: "Low", issue: getFriendlyIssueMessage(r.issue) }))
  ];

  const exportCSV = useCallback(() => {
    const header = "Priority,Issue,Compliance %,Pages\n";
    const body = allRows
      .map((r) => `"${r.priority}","${r.issue.replace(/"/g, '""')}",${r.compliancePercent},"${r.pagesLabel.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${REPORT_BASE}.csv`);
  }, [allRows]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = allRows.map((r) => ({ Priority: r.priority, Issue: r.issue, "Compliance %": r.compliancePercent, Pages: r.pagesLabel }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Checkpoints");
    XLSX.writeFile(wb, `${REPORT_BASE}.xlsx`);
  }, [allRows]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(14);
    doc.text("SEO Checkpoints Report", 14, 16);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: 22,
      head: [["Priority", "Issue", "Compliance %", "Pages"]],
      body: allRows.map((r) => [r.priority, r.issue, String(r.compliancePercent), r.pagesLabel]),
      styles: { fontSize: 9 },
    });
    doc.save(`${REPORT_BASE}.pdf`);
  }, [allRows]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isActuallyScanning = domain?.dm_seo_status === 'pending' || domain?.dm_seo_status === 'scanning';
  const hasData = checkpoints.high.length > 0 || checkpoints.medium.length > 0 || checkpoints.low.length > 0;

  if (isActuallyScanning && !hasData) {
    return (
      <div className="text-center p-5">
        <div className="mb-4">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Scanning...</span>
          </div>
        </div>
        <h5>SEO Scan in Progress...</h5>
        <p className="text-muted">Please wait while we analyze your checkpoints.</p>
      </div>
    );
  }

  return (
    <div className="seo-checkpoints-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <h5 className="mb-0 fw-semibold text-body d-flex align-items-center gap-2">
          <i className="isax isax-tick-circle text-primary fs-22" aria-hidden="true" />
          SEO Audit Checklist
          {isActuallyScanning && (
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center gap-2 py-2 px-3 ms-2">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="fs-12 fw-medium">Scanning for updates...</span>
            </span>
          )}
        </h5>
        <div className="d-flex align-items-center gap-2">
          <DownloadReportDropdown
            reportBaseName={REPORT_BASE}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            className="border border-secondary border-opacity-25 rounded-2"
          />
        </div>
      </div>

      <CheckpointSection
        title="High Impact Issues (Must Fix)"
        iconClass="isax-chart-2 text-danger"
        description="Fix these immediately to ensure your site can be properly indexed and ranked by search engines."
        rows={checkpoints.high}
        onPagesClick={openCheckpointPagesDrawer}
      />

      <CheckpointSection
        title="Medium Impact Issues (Recommended)"
        iconClass="isax-chart-2 text-warning"
        description="Addressing these issues will help improve your overall search visibility and user experience."
        rows={checkpoints.medium}
        onPagesClick={openCheckpointPagesDrawer}
      />

      <CheckpointSection
        title="Low Impact Issues (Good to Have)"
        iconClass="isax-chart-2 text-primary"
        description="These smaller adjustments will further polish your site's SEO performance."
        rows={checkpoints.low}
        onPagesClick={openCheckpointPagesDrawer}
      />

      <SeoCheckpointPagesDrawer
        open={checkpointDrawerOpen}
        onClose={() => {
          setCheckpointDrawerOpen(false);
          setCheckpointDrawerIssue(null);
        }}
        issueName={checkpointDrawerIssue?.issue || checkpointDrawerIssue?.message || ""}
        pageCount={checkpointDrawerIssue ? parsePageCount(checkpointDrawerIssue.pagesLabel) : 0}
        compliancePercent={checkpointDrawerIssue?.compliancePercent ?? 0}
        quickHelpLines={checkpointDrawerIssue ? QUICK_HELP_BY_ISSUE[checkpointDrawerIssue.issue] : undefined}
        onOpenPageDetails={openPageDetails}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedPageForDetails(null);
          setSelectedIssueForPage(null);
        }}
        page={selectedPageForDetails}
        defaultTab={
          selectedIssueForPage?.toLowerCase().includes("link") || 
          selectedIssueForPage?.toLowerCase().includes("image") || 
          selectedIssueForPage?.toLowerCase().includes("misspelling") 
            ? "qa" : "seo"
        }
        defaultQaSubView={
          selectedIssueForPage?.toLowerCase().includes("link") ? "broken-links" :
          selectedIssueForPage?.toLowerCase().includes("image") ? "broken-images" :
          selectedIssueForPage?.toLowerCase().includes("misspelling") ? "misspellings" : "misspellings"
        }
        backdropZIndex={1075}
        panelZIndex={1080}
      />
    </div>
  );
};

export default SeoCheckpointsView;
