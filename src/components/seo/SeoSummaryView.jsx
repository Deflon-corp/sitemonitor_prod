import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDomainLatestSummaryApi, triggerDomainScanApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import { showToast } from "../common/alerts/ToastAlert";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const response = await getDomainLatestSummaryApi(domainId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch SEO summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTriggerScan = async () => {
    if (!domainId) return;
    setIsScanning(true);
    try {
      const response = await triggerDomainScanApi(domainId);
      if (response.success) {
        showToast("Scan triggered successfully. This may take a few minutes.", "success");
      }
    } catch (error) {
      console.error("Failed to trigger scan:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const exportCSV = useCallback(() => {
    if (!summary) return;
    const totalIssues = (summary.issueBreakdown?.high || 0) + (summary.issueBreakdown?.medium || 0) + (summary.issueBreakdown?.low || 0);
    const lines = [
      "Section,Label,Count/Value",
      "Most common opportunities found,,",
      ...(summary.topIssues || []).map((o) => `Opportunity,"${o.message.replace(/"/g, '""')}",${o.count}`),
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
      `SEO opportunities found,${totalIssues}`,
      `Pages with SEO opportunities,${summary.totalPages || 0}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${REPORT_BASE}.csv`);
  }, [summary]);

  const exportExcel = useCallback(async () => {
    if (!summary) return;
    const XLSX = await import("xlsx");
    const oppSheet = XLSX.utils.json_to_sheet(
      (summary.topIssues || []).map((o) => ({ Opportunity: o.message, Count: o.count }))
    );
    const summarySheet = XLSX.utils.json_to_sheet([
      { Metric: "SEO Compliance %", Value: summary.finalSeoScore || 0 },
      { Metric: "Pages with SEO opportunities", Value: summary.totalPages || 0 },
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
      head: [["Opportunity", "Count"]],
      body: (summary.topIssues || []).map((o) => [o.message, String(o.count)]),
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

  if (!summary) {
    return (
      <div className="text-center p-5">
        <div className="mb-4">
          <i className="isax isax-chart-215 text-muted" style={{ fontSize: "4rem" }} />
        </div>
        <h5>No SEO Data Available</h5>
        <p className="text-muted">Start a scan to see SEO insights for this domain.</p>
        <button 
          className="btn btn-primary" 
          onClick={handleTriggerScan}
          disabled={isScanning}
        >
          {isScanning ? "Triggering..." : "Start SEO Scan"}
        </button>
      </div>
    );
  }

  const MAX_OPP_COUNT = Math.max(...(summary.topIssues || []).map((o) => o.count), 1);

  return (
    <div className="seo-summary-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <i className="isax isax-chart-215 text-primary fs-22" aria-hidden="true" />
          <h5 className="mb-0 fw-semibold text-body">Search Engine Optimization</h5>
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
              <h6 className="fw-semibold text-body mb-1">Most common opportunities found</h6>
              <p className="text-muted fs-13 mb-3">You have {(summary.topIssues || []).length} to dos</p>
              <div className="d-flex flex-column gap-3">
                {(summary.topIssues || []).map((item) => (
                  <div key={item.message} className="d-flex align-items-center gap-2">
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
                        <span className="fs-13 text-body text-truncate">{item.message}</span>
                        <span className="fs-13 text-body flex-shrink-0 d-inline-flex align-items-center gap-1">
                          {item.count}
                          <i className="isax isax-arrow-down-1 fs-12 text-muted" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="progress rounded-pill" style={{ height: 8 }}>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${(item.count / MAX_OPP_COUNT) * 100}%` }}
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
              <h6 className="fw-semibold text-body mb-1">Affected pages by priority</h6>
              <p className="text-muted fs-13 mb-3">Distribution of SEO levels</p>
              <div className="row g-3">
                  <div className="col-6">
                    <SmallDonut 
                        percent={summary.issueBreakdown?.high > 0 ? Math.round((summary.issueBreakdown?.high / (summary.issueBreakdown?.high + summary.issueBreakdown?.medium + summary.issueBreakdown?.low)) * 100) : 0} 
                        label="High priority" 
                        pages={summary.issueBreakdown?.high || 0} 
                        issues={summary.issueBreakdown?.high || 0} 
                        color="#dc3545" 
                    />
                  </div>
                  <div className="col-6">
                    <SmallDonut 
                        percent={summary.issueBreakdown?.medium > 0 ? Math.round((summary.issueBreakdown?.medium / (summary.issueBreakdown?.high + summary.issueBreakdown?.medium + summary.issueBreakdown?.low)) * 100) : 0} 
                        label="Medium priority" 
                        pages={summary.issueBreakdown?.medium || 0} 
                        issues={summary.issueBreakdown?.medium || 0} 
                        color="#fd7e14" 
                    />
                  </div>
                  <div className="col-6">
                    <SmallDonut 
                        percent={summary.issueBreakdown?.low > 0 ? Math.round((summary.issueBreakdown?.low / (summary.issueBreakdown?.high + summary.issueBreakdown?.medium + summary.issueBreakdown?.low)) * 100) : 0} 
                        label="Low priority" 
                        pages={summary.issueBreakdown?.low || 0} 
                        issues={summary.issueBreakdown?.low || 0} 
                        color="#0d6efd" 
                    />
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - SEO Diagnostics */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">SEO Diagnostics</h6>
              <p className="text-muted fs-13 mb-4">Percentage shows number of pages that are compliant with all SEO checks</p>

              <div className="d-flex flex-wrap align-items-start justify-content-around gap-4 mb-4">
                <ComplianceDonut percent={summary.finalSeoScore || 0} label="SEO Compliance" size={140} />
                <div className="d-flex align-items-center gap-1">
                  <ComplianceDonut percent={94} label="Industry average" size={100} />
                  <span className="text-muted ms-1" title="Info">
                    <i className="isax isax-information fs-16" aria-hidden="true" />
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="text-muted fs-13">SEO opportunities found</span>
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
                  <span className="text-muted">Pages with SEO opportunities:</span>{" "}
                  <span className="fw-medium">{summary.totalPages || 0}</span>
                </p>
              </div>

              <div className="border border-secondary border-opacity-25 rounded-2 p-3 bg-body-tertiary bg-opacity-25">
                <svg width="100%" viewBox="0 0 500 180" style={{ maxHeight: 200 }} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <defs>
                    <linearGradient id="seoTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TEAL} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <line x1="40" y1="20" x2="40" y2="140" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#e5e7eb" strokeWidth="1" />
                  <polyline points="60,120 120,80 180,100 240,60 300,70 360,50 420,40 460,45" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="60,130 120,125 180,128 240,122 300,125 360,120 420,118 460,120" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="20" y="85" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>100</text>
                  <text x="20" y="140" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>0</text>
                  <text x="100" y="155" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>Latest Scan</text>
                </svg>
                <div className="d-flex flex-wrap gap-3 mt-2 fs-12 text-muted justify-content-center">
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#dc3545" }} /> High</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#fd7e14" }} /> Medium</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#0d6efd" }} /> Low</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: TEAL }} /> Technical</span>
                </div>
                <Link to="#" className="small text-primary text-decoration-none mt-2 d-inline-block">Show history</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoSummaryView;
