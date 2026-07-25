import React, { useCallback, useEffect, useState } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import { getDarkPatternSummaryApi } from "../../api/darkPatternApi";
import { getDomainByIdApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const DarkPatternSummaryView = () => {
  const [summary, setSummary] = useState(null);
  const [domain, setDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const domainRes = await getDomainByIdApi(domainId);
      if (domainRes.success && domainRes.data) {
        setDomain(domainRes.data);
        const dmName = domainRes.data.dm_name || domainRes.data.dm_url;
        const summaryRes = await getDarkPatternSummaryApi(dmName);
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Dark Pattern summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totalPages = summary?.totalPagesScanned || 0;
  const totalIssues = summary?.totalDarkPatternsFound || 0;
  const highSev = summary?.issuesBySeverity?.high || 0;
  const medSev = summary?.issuesBySeverity?.medium || 0;

  const stats = [
    { label: "Total Pages Scanned", value: totalPages },
    { label: "Dark Patterns Found", value: totalIssues },
    { label: "High Severity", value: highSev, color: "text-danger" },
    { label: "Medium Severity", value: medSev, color: "text-warning" },
  ];

  const defaultColors = ["bg-danger", "bg-warning", "bg-primary", "bg-info", "bg-secondary", "bg-success", "bg-dark"];
  
  const darkPatternDistributions = (summary?.distributions || []).map((d, i) => ({
    id: i + 1,
    type: d.type,
    percentage: d.percentage,
    colorClass: defaultColors[i % defaultColors.length]
  }));

  const totalDarkPatterns = totalIssues;

  // Process history for chart
  const historyData = summary?.history || [];
  const maxHistoryIssues = Math.max(...historyData.map(h => h.totalDarkPatternsFound || 0), 1); // fallback to 1 to avoid div by zero
  
  const formatChartDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const chartData = historyData.map(h => {
    const count = h.totalDarkPatternsFound || 0;
    // ensure a small visible bar (e.g. 2%) if 0 issues
    const heightPercent = count === 0 ? 2 : Math.max(5, (count / maxHistoryIssues) * 100);
    return {
      date: formatChartDate(h.scanDate),
      count: count,
      height: `${heightPercent}%`
    };
  });

  const reportBaseName = "dark-pattern-summary";

  const exportCSV = useCallback(() => {
    try {
      const csvRows = [];
      csvRows.push("Dark Pattern Audit Summary");
      csvRows.push("");
      csvRows.push("Metrics");
      stats.forEach(s => {
        csvRows.push(`"${s.label}","${s.value}"`);
      });
      csvRows.push("");
      csvRows.push("Distribution");
      csvRows.push("Pattern Type,Percentage");
      darkPatternDistributions.forEach(d => {
        csvRows.push(`"${d.type}","${d.percentage}%"`);
      });
      
      const csvContent = csvRows.join("\n");
      downloadBlob(
        new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
        `${reportBaseName}.csv`
      );
    } catch (err) {
      console.error("CSV Export failed:", err);
    }
  }, [stats, darkPatternDistributions]);

  const exportExcel = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");
      
      const statsRows = stats.map(s => ({ Metric: s.label, Value: s.value }));
      const distRows = darkPatternDistributions.map(d => ({
        "Pattern Type": d.type,
        "Percentage (%)": d.percentage
      }));

      const statsSheet = XLSX.utils.json_to_sheet(statsRows);
      const distSheet = XLSX.utils.json_to_sheet(distRows);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, statsSheet, "Metrics");
      XLSX.utils.book_append_sheet(wb, distSheet, "Distribution");
      
      XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
    } catch (err) {
      console.error("Excel Export failed:", err);
    }
  }, [stats, darkPatternDistributions]);

  const exportPDF = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "portrait" });
      
      doc.setFontSize(16);
      doc.text("Dark Pattern Audit Summary", 14, 20);
      
      autoTable(doc, {
        startY: 30,
        head: [["Metric", "Value"]],
        body: stats.map(s => [s.label, s.value]),
        headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], fontStyle: "bold" }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Pattern Type", "Percentage (%)"]],
        body: darkPatternDistributions.map(d => [d.type, d.percentage]),
        headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], fontStyle: "bold" }
      });
      
      doc.save(`${reportBaseName}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  }, [stats, darkPatternDistributions]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate audit health (simple mock based on issue percentage)
  const healthPercent = totalPages > 0 ? Math.max(0, 100 - Math.round((totalDarkPatterns / totalPages) * 100)) : 100;
  const healthOffset = 439.8 - (439.8 * healthPercent) / 100;

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-start">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
            <i className="isax isax-shield-tick fs-20 text-primary" />
            Dark Pattern Audit Summary
          </h5>
          <p className="text-muted fs-13 mb-0">
            Review potential deceptive design patterns found across your domain.
          </p>
        </div>
        <DownloadReportDropdown
          reportBaseName={reportBaseName}
          onExportCSV={exportCSV}
          onExportExcel={exportExcel}
          onExportPDF={exportPDF}
        />
      </div>

      <div className="row g-3 mb-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="fs-13 text-muted mb-2">{stat.label}</div>
                <div className={`fs-24 fw-bold ${stat.color || 'text-body'}`}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h6 className="mb-0 fs-15 fw-semibold">Dark Pattern Distribution</h6>
            </div>
            <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {darkPatternDistributions.map((item, index) => (
                <div className={`mb-${index === darkPatternDistributions.length - 1 ? '0' : '4'}`} key={item.id}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-13 text-body fw-medium">{item.type}</span>
                    <span className="fs-13 text-muted">{item.percentage}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className={`progress-bar ${item.colorClass}`} 
                      role="progressbar" 
                      style={{ width: `${item.percentage}%` }} 
                      aria-valuenow={item.percentage} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h6 className="mb-0 fs-15 fw-semibold">Audit Health</h6>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <div className="position-relative mb-3">
                <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="439.8" strokeDashoffset={healthOffset} strokeLinecap="round" />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <span className="fs-24 fw-bold text-body d-block">{healthPercent}%</span>
                  <span className="fs-12 text-muted">Clean Pages</span>
                </div>
              </div>
              <p className="fs-13 text-center text-muted mb-0 px-4">
                {100 - healthPercent}% of scanned pages contain one or more dark patterns that may degrade user experience and trust.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
          <h6 className="mb-0 fs-15 fw-semibold">Scan History (Issues Detected)</h6>
          <p className="text-muted fs-13 mt-1 mb-0">
            {totalDarkPatterns === 0 
              ? "Great news! No dark patterns were detected during recent scans. Your website is safe and providing a transparent user experience." 
              : "Track the number of dark patterns detected during recent scans, along with their exact scanning times."}
          </p>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-end justify-content-between px-2 mt-3" style={{ height: "200px" }}>
            {chartData.length > 0 ? (
              chartData.map((scan, i) => (
                <div key={i} className="d-flex flex-column align-items-center h-100 justify-content-end" style={{ width: '95px' }}>
                  <span className="fs-12 fw-medium text-body mb-2">{scan.count}</span>
                  <div 
                    className="bg-primary rounded-top transition-all" 
                    style={{ height: scan.height, opacity: 0.85, width: '36px' }}
                  ></div>
                  <span className="fs-11 text-muted mt-2 text-center" style={{ maxWidth: '80px', lineHeight: '1.2' }}>{scan.date}</span>
                </div>
              ))
            ) : (
              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted fs-14">
                No scan history available yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DarkPatternSummaryView;
