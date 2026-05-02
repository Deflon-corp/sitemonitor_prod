import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import SeoCheckpointPagesDrawer, { } from "@/components/seo/SeoCheckpointPagesDrawer";
import PageDetailsMisspellingsDrawer, { } from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const TEAL = "#14b8a6";











const HIGH_PRIORITY = [
  { id: "hp1", issue: "Missing title", showInfoIcon: true, status: "error", compliancePercent: 0.6, pagesLabel: "497 PAGES", pagesHref: "#" },
  { id: "hp2", issue: "Missing H1", showInfoIcon: true, status: "error", compliancePercent: 99.6, pagesLabel: "2 PAGES", pagesHref: "#" },
  { id: "hp3", issue: "Title found on more than one page", status: "ok", compliancePercent: 100, pagesLabel: "No issues found" },
];

const MEDIUM_PRIORITY = [
  { id: "mp1", issue: "Multiple H1 on page", status: "error", compliancePercent: 9, pagesLabel: "455 PAGES", pagesHref: "#" },
  { id: "mp2", issue: "H1 found on more than one page", status: "error", compliancePercent: 9, pagesLabel: "455 PAGES", pagesHref: "#" },
  { id: "mp3", issue: "Images missing ALT", status: "error", compliancePercent: 99.6, pagesLabel: "2 PAGES", pagesHref: "#" },
  { id: "mp4", issue: "Missing sub headings", showInfoIcon: true, status: "error", compliancePercent: 99.8, pagesLabel: "1 PAGE", pagesHref: "#" },
];

const ComplianceRing = ({ percent, status }) => {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent)) / 100 * circumference;
  const color = status === "ok" ? "#22c55e" : percent >= 99 ? TEAL : "#e5e7eb";
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

/** Parse "497 PAGES" -> 497, "1 PAGE" -> 1. Returns 0 for "No issues found" or invalid. */
function parsePageCount(pagesLabel) {
  const m = pagesLabel.match(/^(\d+)\s*(?:PAGE|PAGES)$/i);
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
                <th className="py-2 ps-0 text-body fs-13 fw-semibold">Issue</th>
                <th className="py-2 text-body fs-13 fw-semibold">Compliance</th>
                <th className="py-2 pe-0 text-body fs-13 fw-semibold">Pages</th>
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
                      <span className="fs-13 text-body">{row.issue}</span>
                      {row.showInfoIcon && (
                        <span className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: 18, height: 18 }}>
                          <i className="isax isax-information text-primary" style={{ fontSize: 10 }} aria-hidden="true" />
                        </span>
                      )}
                      <Link to="#" className="fs-13 text-primary text-decoration-none">Ignore</Link>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-13 text-body fw-medium">{row.compliancePercent}% COMPLIANCE</span>
                      <ComplianceRing percent={row.compliancePercent} status={row.status} />
                    </div>
                  </td>
                  <td className="py-3 pe-0">
                    {row.pagesHref && onPagesClick ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 fs-13 text-primary text-decoration-none fw-medium"
                        onClick={() => onPagesClick(row)}
                      >
                        {row.pagesLabel}
                      </button>
                    ) : row.pagesHref ? (
                      <Link to={row.pagesHref} className="fs-13 text-primary text-decoration-none fw-medium">
                        {row.pagesLabel}
                      </Link>
                    ) : (
                      <span className="fs-13 text-muted">{row.pagesLabel}</span>
                    )}
                  </td>
                </tr>
              ))}
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

  const openCheckpointPagesDrawer = useCallback((row) => {
    if (parsePageCount(row.pagesLabel) <= 0) return;
    setCheckpointDrawerIssue(row);
    setCheckpointDrawerOpen(true);
  }, []);

  const openPageDetails = useCallback((page) => {
    setSelectedPageForDetails({ id: 0, title: page.title, url: page.url });
    setPageDetailsDrawerOpen(true);
  }, []);

  const allRows = [...HIGH_PRIORITY.map((r) => ({ ...r, priority: "High" })), ...MEDIUM_PRIORITY.map((r) => ({ ...r, priority: "Medium" }))];

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

  return (
    <div className="seo-checkpoints-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <h5 className="mb-0 fw-semibold text-body d-flex align-items-center gap-2">
          <i className="isax isax-tick-circle text-primary fs-22" aria-hidden="true" />
          SEO Checkpoints
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
        title="High priority"
        iconClass="isax-chart-2 text-danger"
        description="These alerts can make it difficult for search engines to crawl, index and rank pages."
        rows={HIGH_PRIORITY}
        onPagesClick={openCheckpointPagesDrawer}
      />

      <CheckpointSection
        title="Medium priority"
        iconClass="isax-chart-2 text-warning"
        description="These warnings can have a negative effect on search engine rankings."
        rows={MEDIUM_PRIORITY}
        onPagesClick={openCheckpointPagesDrawer}
      />

      <SeoCheckpointPagesDrawer
        open={checkpointDrawerOpen}
        onClose={() => {
          setCheckpointDrawerOpen(false);
          setCheckpointDrawerIssue(null);
        }}
        issueName={checkpointDrawerIssue?.issue ?? ""}
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
        }}
        page={selectedPageForDetails}
        defaultTab="seo"
        backdropZIndex={1075}
        panelZIndex={1080}
      />
    </div>
  );
};

export default SeoCheckpointsView;
