import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDomainByIdApi, getDomainLatestSummaryApi, getDomainScanHistoryApi, triggerDomainScanApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import { showToast } from "../common/alerts/ToastAlert";
import AffectedPagesChart from "../audit/AffectedPagesChart";
import SeoCheckpointPagesDrawer from "./SeoCheckpointPagesDrawer";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";

const getFriendlyIssueMessage = (msg) => {
  if (!msg) return "";
  const lower = msg.toLowerCase();
  if (lower.includes("incomplete t&c") || lower.includes("incomplete terms") || (lower.includes("t&c") && lower.includes("missing"))) {
    return "Terms & Conditions is missing key legal clauses";
  }
  return msg;
};

const TEAL = "#14b8a6";

const SmallDonut = ({ percent, label, pages, issues, color }) => {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="position-relative">
        <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="fw-bold text-body" style={{ fontSize: "0.85rem" }}>{percent}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="d-inline-flex align-items-center gap-1 mb-1">
          <span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: color }} aria-hidden="true" />
          <span className="fs-13 text-body">{label}</span>
        </div>
        <p className="fs-12 text-muted mb-0">{pages} page{pages !== 1 ? "s" : ""}</p>
        <p className="fs-12 text-muted mb-0 d-inline-flex align-items-center gap-1">
          <i className="isax isax-document-text" style={{ fontSize: 10 }} aria-hidden="true" />
          {issues} issue{issues !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

const ComplianceDonut = ({ percent, label, size = 120 }) => {
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="position-relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TEAL} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="fw-bold text-body" style={{ fontSize: size < 100 ? "1rem" : "1.35rem" }}>{percent}%</span>
        </div>
      </div>
      <span className="text-muted fs-13 mt-2 text-center">{label}</span>
    </div>
  );
};

const REPORT_BASE = safeFilename("SEO-Summary-Report");

const SeoSummaryView = () => {
  const [summary, setSummary] = useState(null);
  const [domain, setDomain] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Issue Detail Drawer State
  const [issueDrawerOpen, setIssueDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Page Detail Drawer State
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedIssueForPage, setSelectedIssueForPage] = useState(null);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async (showLoading = true) => {
    if (!domainId) return;
    if (showLoading) setIsLoading(true);
    try {
      const [latestRes, historyRes, domainRes] = await Promise.all([
        getDomainLatestSummaryApi(domainId),
        getDomainScanHistoryApi(domainId),
        getDomainByIdApi(domainId)
      ]);

      if (latestRes.success) {
        setSummary(latestRes.data);
      }
      if (historyRes.success) {
        setHistory(historyRes.data);
      }
      if (domainRes.success) {
        setDomain(domainRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch SEO data:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Polling for scan status
  useEffect(() => {
    let interval;
    if (domain && (domain.dm_seo_status === 'pending' || domain.dm_seo_status === 'scanning')) {
      interval = setInterval(() => {
        fetchSummary(false);
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [domain, fetchSummary]);

  const handleTriggerScan = async () => {
    if (!domainId) return;
    setIsScanning(true);
    try {
      const response = await triggerDomainScanApi(domainId);
      if (response.success) {
        showToast("Scan triggered successfully. This may take a few minutes.", "success");
        // Update local domain status immediately to trigger polling
        setDomain(prev => prev ? { ...prev, dm_seo_status: 'pending' } : null);
      }
    } catch (error) {
      console.error("Failed to trigger scan:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleIssueClick = (item) => {
    setSelectedIssue(item);
    setIssueDrawerOpen(true);
  };

  const handleOpenPageDetails = (page, issue) => {
    setSelectedPage(page);
    setSelectedIssueForPage(issue);
    setPageDetailsDrawerOpen(true);
  };

  const exportCSV = useCallback(() => {
    if (!summary) return;
    const totalIssues = (summary.issueBreakdown?.high || 0) + (summary.issueBreakdown?.medium || 0) + (summary.issueBreakdown?.low || 0);
    const lines = [
      "Section,Label,Count/Value",
      "Priority Improvements,,",
      ...(summary.topIssues || []).map((o) => `Opportunity,"${getFriendlyIssueMessage(o.message).replace(/"/g, '""')}",${o.count}`),
      "",
      "Affected pages by priority,,,",
      "Priority,Pages,Issues",
      `High,,${summary.issueBreakdown?.high || 0}`,
      `Medium,,${summary.issueBreakdown?.medium || 0}`,
      `Low,,${summary.issueBreakdown?.low || 0}`,
      "",
      "SEO Diagnostics,,,",
      "Metric,Value",
      `SEO Compliance %,${summary.finalSeoScore || 0}`,
      "Industry average %,94",
      `Opportunities to improve,${totalIssues}`,
      `Total Audited Pages,${summary.totalPages || 0}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${REPORT_BASE}.csv`);
  }, [summary]);

  const exportExcel = useCallback(async () => {
    if (!summary) return;
    const XLSX = await import("xlsx");
    const oppSheet = XLSX.utils.json_to_sheet(
      (summary.topIssues || []).map((o) => ({ Improvement: getFriendlyIssueMessage(o.message), Count: o.count }))
    );
    const summarySheet = XLSX.utils.json_to_sheet([
      { Metric: "SEO Compliance %", Value: summary.finalSeoScore || 0 },
      { Metric: "Total Audited Pages", Value: summary.totalPages || 0 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, oppSheet, "Opportunities");
    XLSX.utils.book_append_sheet(wb, summarySheet, "Diagnostics");
    XLSX.writeFile(wb, `${REPORT_BASE}.xlsx`);
  }, [summary]);

  const exportPDF = useCallback(async () => {
    if (!summary) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(14);
    doc.text("SEO Summary Report", 14, 16);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: 22,
      head: [["Improvement", "Occurrences"]],
      body: (summary.topIssues || []).map((o) => [getFriendlyIssueMessage(o.message), String(o.count)]),
      styles: { fontSize: 9 },
    });
    doc.save(`${REPORT_BASE}.pdf`);
  }, [summary]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isActuallyScanning = domain?.dm_seo_status === 'pending' || domain?.dm_seo_status === 'scanning';

  if (!summary) {
    return (
      <div className="text-center p-5">
        <div className="mb-4">
          {isActuallyScanning ? (
            <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} role="status">
              <span className="visually-hidden">Scanning...</span>
            </div>
          ) : (
            <i className="isax isax-chart-215 text-muted" style={{ fontSize: "4rem" }} />
          )}
        </div>
        <h5>{isActuallyScanning ? "SEO Scan in Progress..." : "No SEO Data Available"}</h5>
        <p className="text-muted">
          {isActuallyScanning 
            ? "We are currently scanning your domain. This may take a few minutes depending on the site size." 
            : "Start a scan to see SEO insights for this domain."}
        </p>
        {!isActuallyScanning && (
          <button
            className="btn btn-primary"
            onClick={handleTriggerScan}
            disabled={isScanning}
          >
            {isScanning ? "Triggering..." : "Start SEO Scan"}
          </button>
        )}
      </div>
    );
  }

  const maxCount = summary.topIssues?.length > 0 ? Math.max(...summary.topIssues.map(i => i.count || 0)) : 100;

  return (
    <div className="seo-summary-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <i className="isax isax-chart-215 text-primary fs-22" aria-hidden="true" />
          <h5 className="mb-0 fw-semibold text-body">SEO Performance Overview</h5>
          {isActuallyScanning && (
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center gap-2 py-2 px-3">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="fs-12 fw-medium">Scanning for updates...</span>
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={handleTriggerScan}
            disabled={isScanning}
          >
            {isScanning ? "Scanning..." : "Re-scan"}
          </button>
          <DownloadReportDropdown
            reportBaseName={REPORT_BASE}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            className="border border-secondary border-opacity-25 rounded-2 text-primary"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Left column */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">Priority Improvements</h6>
              <p className="text-muted fs-13 mb-3">Focus on these top 10 improvements to boost your search visibility.</p>
              <div className="d-flex flex-column gap-3">
                {(summary.topIssues || []).slice(0, 10).map((item) => (
                  <div 
                    key={item.message} 
                    className="d-flex align-items-center gap-2 cursor-pointer p-2 rounded hover-bg-light transition-all"
                    onClick={() => handleIssueClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: item.priority === "high" ? "#dc3545" : item.priority === "medium" ? "#fd7e14" : "#0d6efd",
                      }}
                      aria-hidden="true"
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <span className="fs-13 text-body text-truncate">{getFriendlyIssueMessage(item.message)}</span>
                        <span className="fs-13 text-body flex-shrink-0 d-inline-flex align-items-center gap-1">
                          {item.count}
                          <i className="isax isax-arrow-right-3 fs-12 text-muted" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="progress rounded-pill" style={{ height: 8 }}>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                          role="progressbar"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">SEO Issues by Severity</h6>
              <p className="text-muted fs-13 mb-3">Visual breakdown of issues based on their impact on your site's health.</p>
              <AffectedPagesChart 
                chartId="seo-priority-distribution"
                type="bar"
                height={220}
                series={[{
                  name: 'Issues',
                  data: [
                    summary.issueBreakdown?.high || 0,
                    summary.issueBreakdown?.medium || 0,
                    summary.issueBreakdown?.low || 0
                  ]
                }]}
                categories={['High', 'Medium', 'Low']}
                colors={['#dc3545', '#fd7e14', '#0d6efd']}
                yAxisLabel={(val) => Math.round(val)}
                dataLabelsFormatter={(val) => val}
                tooltipLabel="Issues"
              />
              <div className="d-flex justify-content-between mt-2 px-2">
                <div className="text-center">
                  <span className="fs-12 text-muted d-block">High Severity</span>
                  <span className="fw-bold text-danger">{summary.issueBreakdown?.high || 0} issues</span>
                </div>
                <div className="text-center">
                  <span className="fs-12 text-muted d-block">Medium Severity</span>
                  <span className="fw-bold text-warning">{summary.issueBreakdown?.medium || 0} issues</span>
                </div>
                <div className="text-center">
                  <span className="fs-12 text-muted d-block">Low Severity</span>
                  <span className="fw-bold text-primary">{summary.issueBreakdown?.low || 0} issues</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - SEO Diagnostics */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">SEO Health Score</h6>
              <p className="text-muted fs-13 mb-4">Track your website's optimization progress across all audited pages.</p>

              <div className="d-flex flex-wrap align-items-start justify-content-around gap-4 mb-4">
                <ComplianceDonut percent={summary.finalSeoScore || 0} label="SEO Health Score" size={140} />
                <div className="d-flex align-items-center gap-1">
                  <ComplianceDonut percent={94} label="Industry Average (Benchmark)" size={100} />
                  <span className="text-muted ms-1" title="Info">
                    <i className="isax isax-information fs-16" aria-hidden="true" />
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="text-muted fs-13">Total Issues Identified</span>
                  <span className="text-muted" title="Info">
                    <i className="isax isax-information fs-14" aria-hidden="true" />
                  </span>
                </div>
                <p className="fs-4 fw-bold text-body mb-0 d-inline-flex align-items-center gap-2">
                  {(summary.issueBreakdown?.high || 0) + (summary.issueBreakdown?.medium || 0) + (summary.issueBreakdown?.low || 0)}
                </p>
              </div>

              <div className="mb-4">
                <p className="fs-13 text-body mb-0">
                  <span className="text-muted">Total Audited Pages:</span>{" "}
                  <span className="fw-medium">{summary.totalPages || 0}</span>
                </p>
              </div>

              <div className="border border-secondary border-opacity-25 rounded-2 p-3 bg-body-tertiary bg-opacity-25">
                <AffectedPagesChart 
                  chartId="seo-trend-chart"
                  type="line"
                  max={100}
                  height={180}
                  series={[
                    {
                      name: 'SEO Health',
                      data: [...history].reverse().map(h => h.finalSeoScore || 0)
                    },
                    {
                      name: 'Avg Performance',
                      data: [...history].reverse().map(h => h.performanceMetrics?.avgPerformanceScore || 0)
                    }
                  ]}
                  categories={[...history].reverse().map(h => {
                    const d = new Date(h.lastScanDate || h.createdAt || new Date());
                    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                  })}
                  colors={[TEAL, '#94a3b8']}
                  showLegend={true}
                  tooltipLabel="%"
                />
                <Link to="/home/history-center" className="small text-primary text-decoration-none mt-2 d-inline-block">Show history</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SeoCheckpointPagesDrawer
        open={issueDrawerOpen}
        onClose={() => setIssueDrawerOpen(false)}
        issueName={selectedIssue?.issue || selectedIssue?.message || ""}
        pageCount={selectedIssue?.count || 0}
        domainTotalPages={summary?.totalPages || 1}
        onOpenPageDetails={handleOpenPageDetails}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedIssueForPage(null);
        }}
        page={selectedPage}
        defaultTab={
          selectedIssueForPage?.toLowerCase().includes("link") || 
          selectedIssueForPage?.toLowerCase().includes("image") || 
          selectedIssueForPage?.toLowerCase().includes("misspelling") ||
          selectedIssueForPage?.toLowerCase().includes("spelling")
            ? "qa" : "seo"
        }
        defaultQaSubView={
          selectedIssueForPage?.toLowerCase().includes("broken link") ? "broken-links" :
          selectedIssueForPage?.toLowerCase().includes("broken image") ? "broken-images" :
          (selectedIssueForPage?.toLowerCase().includes("misspelling") || selectedIssueForPage?.toLowerCase().includes("spelling")) ? "misspellings" :
          undefined
        }
        backdropZIndex={1075}
        panelZIndex={1080}
      />
    </div>
  );
};

export default SeoSummaryView;
