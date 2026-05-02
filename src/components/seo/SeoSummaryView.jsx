import React, { useCallback  } from "react";
import { Link } from "react-router-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const TEAL = "#14b8a6";

const OPPORTUNITIES = [
  { label: "Too many internal links", count: 499, dot: "blue"  },
  { label: "Missing title", count: 497, dot: "red"  },
  { label: "Too long META description", count: 475, dot: "blue"  },
  { label: "H1 found on more than one page", count: 455, dot: "orange"  },
  { label: "Multiple H1 on page", count: 455, dot: "orange"  },
  { label: "Missing H1", count: 2, dot: "red"  },
  { label: "Images missing ALT", count: 2, dot: "orange"  },
];

const MAX_OPP_COUNT = Math.max(...OPPORTUNITIES.map((o) => o.count), 1);

const PRIORITY_DONUTS = [
  { label: "High priority", percent: 0.2, pages: 1, issues: 499, color: "#dc3545" },
  { label: "Medium priority", percent: 8.8, pages: 44, issues: 456, color: "#fd7e14" },
  { label: "Low priority", percent: 0, pages: 0, issues: 500, color: "#0d6efd" },
  { label: "Technical SEO Issues", percent: 100, pages: 500, issues: 0, color: TEAL },
];

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
  const exportCSV = useCallback(() => {
    const lines = [
      "Section,Label,Count/Value",
      "Most common opportunities found,,",
      ...OPPORTUNITIES.map((o) => `Opportunity,"${o.label.replace(/"/g, '""')}",${o.count}`),
      "",
      "Affected pages by priority,,,",
      "Priority,Percent,Pages,Issues",
      ...PRIORITY_DONUTS.map((p) => `"${p.label}",${p.percent},${p.pages},${p.issues}`),
      "",
      "SEO Diagnostics,,,",
      "Metric,Value",
      "SEO Compliance %,63.26",
      "Industry average %,94.16",
      "SEO opportunities found,2388",
      "Pages with SEO opportunities,500",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${REPORT_BASE}.csv`);
  }, []);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const oppSheet = XLSX.utils.json_to_sheet(
      OPPORTUNITIES.map((o) => ({ Opportunity: o.label, Count: o.count }))
    );
    const prioritySheet = XLSX.utils.json_to_sheet(
      PRIORITY_DONUTS.map((p) => ({ Priority: p.label, "Percent %": p.percent, Pages: p.pages, Issues: p.issues }))
    );
    const summarySheet = XLSX.utils.json_to_sheet([
      { Metric: "SEO Compliance %", Value: 63.26 },
      { Metric: "Industry average %", Value: 94.16 },
      { Metric: "SEO opportunities found", Value: 2388 },
      { Metric: "Pages with SEO opportunities", Value: 500 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, oppSheet, "Opportunities");
    XLSX.utils.book_append_sheet(wb, prioritySheet, "By Priority");
    XLSX.utils.book_append_sheet(wb, summarySheet, "Diagnostics");
    XLSX.writeFile(wb, `${REPORT_BASE}.xlsx`);
  }, []);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(14);
    doc.text("SEO Summary Report", 14, 16);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: 22,
      head: [["Opportunity", "Count"]],
      body: OPPORTUNITIES.map((o) => [o.label, String(o.count)]),
      styles: { fontSize: 9 },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Priority", "Percent %", "Pages", "Issues"]],
      body: PRIORITY_DONUTS.map((p) => [p.label, String(p.percent), String(p.pages), String(p.issues)]),
      styles: { fontSize: 9 },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text("SEO Compliance: 63.26%  |  Industry average: 94.16%  |  SEO opportunities: 2,388  |  Pages with opportunities: 500", 14, finalY + 6);
    doc.save(`${REPORT_BASE}.pdf`);
  }, []);

  return (
    <div className="seo-summary-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <i className="isax isax-chart-215 text-primary fs-22" aria-hidden="true" />
          <h5 className="mb-0 fw-semibold text-body">Search Engine Optimization</h5>
        </div>
        <div className="d-flex align-items-center gap-2">
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
              <p className="text-muted fs-13 mb-3">You have 7 to dos</p>
              <div className="d-flex flex-column gap-3">
                {OPPORTUNITIES.map((item) => (
                  <div key={item.label} className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: item.dot === "red" ? "#dc3545" : item.dot === "orange" ? "#fd7e14" : "#0d6efd",
                      }}
                      aria-hidden="true"
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <span className="fs-13 text-body text-truncate">{item.label}</span>
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
                {PRIORITY_DONUTS.map((d) => (
                  <div key={d.label} className="col-6">
                    <SmallDonut percent={d.percent} label={d.label} pages={d.pages} issues={d.issues} color={d.color} />
                  </div>
                ))}
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
                <ComplianceDonut percent={63.26} label="SEO Compliance" size={140} />
                <div className="d-flex align-items-center gap-1">
                  <ComplianceDonut percent={94.16} label="Industry average" size={100} />
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
                  2,388
                  <span className="badge bg-danger bg-opacity-10 text-danger fs-13 fw-normal d-inline-flex align-items-center gap-1">
                    <i className="isax isax-arrow-up-1" aria-hidden="true" /> 52.97%
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <p className="fs-13 text-body mb-0">
                  <span className="text-muted">Pages with SEO opportunities:</span>{" "}
                  <span className="fw-medium">500</span>
                  <span className="ms-1">0%</span>
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
                  <text x="20" y="85" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>500</text>
                  <text x="20" y="140" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>0</text>
                  <text x="100" y="155" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>Dec 10</text>
                  <text x="460" y="155" textAnchor="middle" fill="#6b7280" style={{ fontSize: 9 }}>Feb 14</text>
                </svg>
                <div className="d-flex flex-wrap gap-3 mt-2 fs-12 text-muted justify-content-center">
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#dc3545" }} /> High</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#fd7e14" }} /> Medium</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#0d6efd" }} /> Low</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: TEAL }} /> Technical</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#c4956a" }} /> Pages with issues</span>
                  <span className="d-inline-flex align-items-center gap-1"><span className="rounded-circle d-block" style={{ width: 8, height: 8, backgroundColor: "#93c5fd" }} /> Scanned pages</span>
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
