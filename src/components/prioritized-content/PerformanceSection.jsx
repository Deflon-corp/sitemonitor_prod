import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import NewPerformancePageDrawer from "./NewPerformancePageDrawer";
import PerformanceHistoryView from "./PerformanceHistoryView";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import { useQaDomainId } from "../../hooks/useQaDomainId";

const CONFIG_OPTIONS = [
  {
    key: "profile",
    label: "Viewing as Profile",
    value: "Desktop cable",
    icon: "isax-user",
  },
  { key: "device", label: "Device", value: "Desktop", icon: "isax-monitor" },
  {
    key: "measure-from",
    label: "Measure from",
    value: "Australia: Sydney",
    icon: "isax-location",
  },
  {
    key: "network",
    label: "Network speed",
    value: "Custom Profile",
    icon: "isax-wifi-square",
  },
  {
    key: "frequency",
    label: "Check frequency",
    value: "No Frequency",
    icon: "isax-refresh",
  },
];

const MEASUREMENT_BAR_OPTIONS = [
  { label: "Device", value: "Desktop", icon: "isax-monitor" },
  { label: "Measure from", value: "Australia: Sydney", icon: "isax-location" },
  { label: "Network speed", value: "Custom Profile", icon: "isax-wifi-square" },
  { label: "Check frequency", value: "Once a week", icon: "isax-refresh" },
];

const getCoreWebVitals = (page) => {
  const perf = page?.performance || {};

  const formatVal = (val, unit = "") => {
    if (val === null || val === undefined || isNaN(Number(val))) return "N/A";
    return `${Number(val).toFixed(2)}${unit}`;
  };

  const fcp = perf.coreWebVitals?.FCP ?? perf.fcp ?? perf.firstContentfulPaint;
  const lcp =
    perf.coreWebVitals?.LCP ?? perf.lcp ?? perf.largestContentfulPaint;
  const si =
    perf.coreWebVitals?.SpeedIndex ?? perf.speedIndex ?? perf.speed_index;
  const tbt = perf.coreWebVitals?.TBT ?? perf.tbt ?? perf.totalBlockingTime;
  const cls = perf.coreWebVitals?.CLS ?? perf.cls ?? perf.cumulativeLayoutShift;

  return [
    {
      label: "First Contentful Paint (FCP)",
      value: formatVal(fcp, "s"),
      color: "#7c3aed",
    },
    {
      label: "Largest Contentful Paint (LCP)",
      value: formatVal(lcp, "s"),
      color: "#db2777",
    },
    { label: "Speed Index (SI)", value: formatVal(si, "s"), color: "#fb923c" },
    {
      label: "Total Blocking Time (TBT)",
      value: formatVal(tbt, "ms"),
      color: "#ea580c",
    },
    {
      label: "Cumulative Layout Shift (CLS)",
      value: formatVal(cls),
      color: "#3b82f6",
    },
  ];
};

const SIDEBAR_ITEMS = [
  { key: "summary", label: "Summary", icon: "isax-home-2" },
  { key: "quick-help", label: "Quick Help", icon: "isax-message-question" },
];

const LAST_CHECK = "February 22, 2026 5:32:03 PM";

const PERFORMANCE_REPORT_ROWS = [
  { metric: "Performance Score", value: "0" },
  { metric: "Last check", value: LAST_CHECK },
  { metric: "Checks done", value: "0" },
  { metric: "Checks to fix", value: "73" },
  { metric: "Profile", value: "Desktop cable" },
  { metric: "Device", value: "Desktop" },
  { metric: "Measure from", value: "Australia: Sydney" },
  { metric: "Network speed", value: "Custom Profile" },
  { metric: "Check frequency", value: "No Frequency" },
];

const PerformanceScoreCard = ({ page }) => {
  const score = page?.lighthousePerformanceScore || 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  let strokeColor = "#dc2626";
  if (score >= 90) strokeColor = "#22c55e";
  else if (score >= 50) strokeColor = "#f59e0b";

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="fw-semibold text-body mb-3">Performance Score</h6>
        <div className="d-flex flex-wrap align-items-start gap-4">
          <div
            className="position-relative d-inline-flex align-items-center justify-content-center"
            style={{ width: 120, height: 120 }}
          >
            <svg
              width={120}
              height={120}
              viewBox="0 0 120 120"
              style={{ transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={strokeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <span
              className="position-absolute fw-bold text-body"
              style={{ fontSize: "1.5rem" }}
            >
              {score}
            </span>
          </div>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 10, height: 10, backgroundColor: "#22c55e" }}
                aria-hidden="true"
              />
              <span className="text-body" style={{ fontSize: "0.75rem" }}>
                90-100
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 10, height: 10, backgroundColor: "#f59e0b" }}
                aria-hidden="true"
              />
              <span className="text-body" style={{ fontSize: "0.75rem" }}>
                50-89
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 10, height: 10, backgroundColor: "#dc2626" }}
                aria-hidden="true"
              />
              <span className="text-body" style={{ fontSize: "0.75rem" }}>
                0-49
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpportunitiesByPriorityCard = () => {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <h6 className="fw-semibold text-body mb-3">
          Opportunities by Priority
        </h6>
        <div
          className="progress rounded-pill mb-2 flex-grow-0"
          style={{ height: 14 }}
        >
          <div
            className="progress-bar bg-primary"
            role="progressbar"
            style={{ width: "100%" }}
            aria-valuenow={73}
            aria-valuemin={0}
            aria-valuemax={73}
          />
        </div>
        <div
          className="d-flex justify-content-between text-muted mb-3"
          style={{ fontSize: "0.8rem" }}
        >
          <span>0 Checks done</span>
          <span>73 Checks to fix</span>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-auto">
          <span
            className="badge rounded-2 px-3 py-2 bg-danger bg-opacity-10 text-danger border-0 fw-medium"
            style={{ fontSize: "0.75rem" }}
          >
            High
          </span>
          <span
            className="badge rounded-2 px-3 py-2 bg-warning bg-opacity-10 text-warning border-0 fw-medium"
            style={{ fontSize: "0.75rem" }}
          >
            Medium
          </span>
          <span
            className="badge rounded-2 px-3 py-2 bg-primary bg-opacity-10 text-primary border-0 fw-medium"
            style={{ fontSize: "0.75rem" }}
          >
            Low
          </span>
        </div>
      </div>
    </div>
  );
};

const LOAD_TIMES_KPIS = [
  { label: "First contentful paint (FCP)", value: "0 ms", color: "#7c3aed" },
  { label: "Largest contentful paint (LCP)", value: "0 ms", color: "#db2777" },
  { label: "Speed Index (SI)", value: "0 ms", color: "#fb923c" },
  { label: "Total Blocking Time (TBT)", value: "0 ms", color: "#0ea5e9" },
  { label: "Cumulative Layout Shift (CLS)", value: "0", color: "#3b82f6" },
];

const LOAD_TIMES_TREND_LABEL =
  "Measurements since February 15, 2026 5:30:20 PM";

const CHART_LEGEND = [
  { label: "First Contentful Paint", color: "#7c3aed" },
  { label: "Largest Contentful Paint", color: "#db2777" },
  { label: "Speed Index", color: "#fb923c" },
  { label: "Total Blocking Time", color: "#0ea5e9" },
  { label: "Cumulative Layout Shift", color: "#3b82f6" },
];

const UserLoadingExperienceCard = ({ page }) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h6 className="fw-semibold text-body mb-3">User Loading Experience</h6>
        <p className="text-body mb-2 fw-medium" style={{ fontSize: "0.8rem" }}>
          Loading times
        </p>
        <div className="d-flex flex-wrap gap-4 mb-4">
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-block"
              style={{ width: 14, height: 14, backgroundColor: "#3b82f6" }}
              aria-hidden="true"
            />
            <span className="text-body" style={{ fontSize: "0.8rem" }}>
              Short
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-block"
              style={{ width: 14, height: 14, backgroundColor: "#f59e0b" }}
              aria-hidden="true"
            />
            <span className="text-body" style={{ fontSize: "0.8rem" }}>
              Medium
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-block"
              style={{ width: 14, height: 14, backgroundColor: "#dc2626" }}
              aria-hidden="true"
            />
            <span className="text-body" style={{ fontSize: "0.8rem" }}>
              Long
            </span>
          </div>
        </div>

        <div className="border-top border-secondary border-opacity-25 pt-4">
          <h6 className="fw-semibold text-body mb-1">Load Times Trend</h6>
          <p className="text-muted mb-4" style={{ fontSize: "0.75rem" }}>
            {LOAD_TIMES_TREND_LABEL}
          </p>
          <div className="d-flex flex-wrap gap-4 mb-4">
            {getCoreWebVitals(page).map(({ label, value, color }) => (
              <div key={label} className="d-flex align-items-center gap-2">
                <div
                  className="rounded"
                  style={{ width: 8, height: 48, backgroundColor: color }}
                  aria-hidden="true"
                />
                <div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {label}
                  </div>
                  <div
                    className="fw-semibold text-body"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-30 p-4 mb-3"
            style={{ minHeight: 220 }}
          >
            <svg
              width="100%"
              viewBox="0 0 420 160"
              preserveAspectRatio="xMidYMid meet"
              className="d-block"
              style={{ minHeight: 180 }}
              aria-hidden="true"
            >
              <text
                x="14"
                y="22"
                fill="#5D6772"
                style={{ fontSize: 10, fontWeight: 500 }}
              >
                Milliseconds
              </text>
              <line
                x1="54"
                y1="32"
                x2="54"
                y2="118"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <line
                x1="54"
                y1="118"
                x2="402"
                y2="118"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              {[0, 2, 4, 6].map((tick) => {
                const y = 118 - (tick / 6) * 82;
                return (
                  <g key={tick}>
                    <line
                      x1="52"
                      y1={y}
                      x2="54"
                      y2={y}
                      stroke="#C6CACE"
                      strokeWidth="1"
                    />
                    <text
                      x="48"
                      y={y + 4}
                      textAnchor="end"
                      fill="#5D6772"
                      style={{ fontSize: 9 }}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}
              {["Feb 16", "Feb 18", "Feb 20", "Feb 22"].map((d, i) => (
                <text
                  key={d}
                  x={72 + i * 108}
                  y="136"
                  textAnchor="middle"
                  fill="#5D6772"
                  style={{ fontSize: 9 }}
                >
                  {d}
                </text>
              ))}
              {CHART_LEGEND.map(({ color }, i) => (
                <line
                  key={i}
                  x1="64"
                  y1="114"
                  x2="394"
                  y2="114"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
              ))}
            </svg>
          </div>
          <div
            className="d-flex flex-wrap gap-3 gap-md-4 pt-2 text-muted"
            style={{ fontSize: "0.75rem" }}
          >
            {CHART_LEGEND.map(({ label, color }) => (
              <span
                key={label}
                className="d-inline-flex align-items-center gap-1"
              >
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: 10, height: 10, backgroundColor: color }}
                  aria-hidden="true"
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const REPORT_BASE = "Performance-Report";
const EXPAND_DRAWER_Z_BACKDROP = 1065;
const EXPAND_DRAWER_Z_PANEL = 1070;
const escapeCsvCell = (value) => {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const PerformanceSection = ({ page = null, embeddedInDrawer = false }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandDrawerOpen, setExpandDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [opportunitiesFilter, setOpportunitiesFilter] = useState("errors");

  const domainId = useQaDomainId();

  const lastCheck = LAST_CHECK;
  const baseName = safeFilename(REPORT_BASE);

  useEffect(() => {
    if (!expandDrawerOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setExpandDrawerOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [expandDrawerOpen]);

  const exportCSV = useCallback(() => {
    const header = "Metric,Value\n";
    const body = PERFORMANCE_REPORT_ROWS.map(
      (r) =>
        `"${r.metric.replace(/"/g, '""')}","${String(r.value).replace(/"/g, '""')}"`,
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(PERFORMANCE_REPORT_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Performance");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Performance Report", 14, 15);
    const head = [["Metric", "Value"]];
    const body = PERFORMANCE_REPORT_ROWS.map((r) => [
      r.metric,
      String(r.value),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 22,
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: "auto" } },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName]);

  const showReferenceLayout = !!page;

  return (
    <>
      <div className="d-flex flex-column border-0">
        {!embeddedInDrawer && showReferenceLayout ? (
          /* Reference layout: page header with favicon, title, URL, Expand + Actions */
          <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-3">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center gap-3 min-w-0">
                <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                  <i
                    className="isax isax-link-square fs-20"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h6 className="mb-1 fw-semibold text-primary text-break">
                    {page.title}
                  </h6>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1"
                  >
                    <ExternalLinkIcon size={12} className="flex-shrink-0" />
                    {page.url}
                  </a>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                  title="Expand"
                  aria-label="Expand"
                  onClick={() => setExpandDrawerOpen(true)}
                >
                  <i
                    className="isax isax-maximize-2 fs-18 text-body"
                    aria-hidden="true"
                  />
                </button>
                <DownloadReportDropdown
                  reportBaseName={baseName}
                  onExportCSV={exportCSV}
                  onExportExcel={exportExcel}
                  onExportPDF={exportPDF}
                  className="border border-secondary border-opacity-25 rounded-2"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Default header: Performance title + Last check + config bar */
          <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                <i className="isax isax-chart-215 fs-22" aria-hidden="true" />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Performance</h6>
                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                  Last check: {lastCheck}
                </p>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-stretch gap-3 mt-3 p-3 rounded-3 bg-white border border-secondary border-opacity-25">
              {CONFIG_OPTIONS.map(({ key, label, value, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {}}
                  className="d-inline-flex align-items-start gap-2 rounded-3 border-0 bg-transparent py-2 px-3 text-start min-w-0"
                  title={`${label}: ${value}`}
                >
                  <i
                    className={`isax ${icon} flex-shrink-0 text-body`}
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  />
                  <span className="d-flex flex-column gap-0">
                    <span
                      className="text-muted lh-sm"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {label}
                    </span>
                    <span
                      className="fw-medium text-body lh-sm"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {value}
                    </span>
                  </span>
                </button>
              ))}
              <div className="ms-auto align-self-center">
                <DownloadReportDropdown
                  reportBaseName={baseName}
                  onExportCSV={exportCSV}
                  onExportExcel={exportExcel}
                  onExportPDF={exportPDF}
                  className="bg-white border border-secondary border-opacity-25 rounded-2 text-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Left sidebar + main content */}
        <div className="d-flex overflow-hidden" style={{ minHeight: 320 }}>
          <nav
            className="flex-shrink-0 border-end border-secondary border-opacity-25 bg-body-tertiary bg-opacity-25 py-3 rounded-start"
            style={{ width: 220 }}
            aria-label="Performance sections"
          >
            {SIDEBAR_ITEMS.map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`w-100 d-flex align-items-center gap-2 text-decoration-none py-2 px-3 border-0 rounded-0 text-start ${
                    isActive
                      ? "bg-secondary bg-opacity-25 text-body fw-medium"
                      : "bg-transparent text-body"
                  }`}
                  style={
                    isActive
                      ? { borderLeft: "3px solid var(--bs-primary)" }
                      : { borderLeft: "3px solid transparent" }
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <i
                    className={`isax ${icon} flex-shrink-0`}
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: "0.75rem" }}>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-grow-1 overflow-auto px-4 py-4 d-flex flex-column min-w-0">
            {activeTab === "summary" &&
              (showReferenceLayout || embeddedInDrawer ? (
                <>
                  <h6 className="fw-semibold text-body mb-1">
                    Performance score
                  </h6>
                  <p className="text-muted mb-4" style={{ fontSize: "0.8rem" }}>
                    Last check: {lastCheck}
                  </p>
                  <div className="d-flex flex-wrap align-items-flex-end gap-4 mb-4">
                    <div
                      className="position-relative d-inline-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 120, height: 120 }}
                    >
                      {(() => {
                        const score = page?.lighthousePerformanceScore || 0;
                        const circumference = 2 * Math.PI * 52;
                        const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

                        let strokeColor = "#dc2626";
                        if (score >= 90) strokeColor = "#22c55e";
                        else if (score >= 50) strokeColor = "#f59e0b";

                        return (
                          <>
                            <svg
                              width={120}
                              height={120}
                              viewBox="0 0 120 120"
                              style={{ transform: "rotate(-90deg)" }}
                              aria-hidden="true"
                            >
                              <circle
                                cx="60"
                                cy="60"
                                r="52"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="10"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="52"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={strokeDasharray}
                                style={{
                                  transition: "stroke-dasharray 1s ease",
                                }}
                              />
                            </svg>
                            <span
                              className="position-absolute fw-bold text-body"
                              style={{ fontSize: "1.75rem" }}
                            >
                              {score}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-inline-block"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: "#22c55e",
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-body"
                          style={{ fontSize: "0.8rem" }}
                        >
                          90-100
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-inline-block"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: "#f59e0b",
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-body"
                          style={{ fontSize: "0.8rem" }}
                        >
                          50-89
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-inline-block"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: "#dc2626",
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-body"
                          style={{ fontSize: "0.8rem" }}
                        >
                          0-49
                        </span>
                      </div>
                    </div>
                    {getCoreWebVitals(page).map((m) => (
                      <div
                        key={m.label}
                        className="d-flex flex-column align-items-center gap-1"
                        style={{ minWidth: 100 }}
                      >
                        <div
                          className="rounded"
                          style={{
                            width: 6,
                            height: 48,
                            backgroundColor: m.color,
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className="text-muted text-center"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {m.label}
                        </span>
                        <span
                          className="fw-medium text-body"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-4 py-3 px-3 rounded-3 bg-body-tertiary bg-opacity-50 border border-secondary border-opacity-25 mt-auto">
                    <span
                      className="d-inline-flex align-items-center gap-1 text-body fw-medium"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Measurement Settings
                      <i
                        className="isax isax-information text-muted"
                        style={{ fontSize: 14 }}
                        aria-hidden="true"
                      />
                    </span>
                    {MEASUREMENT_BAR_OPTIONS.map(({ label, value, icon }) => (
                      <span
                        key={label}
                        className="d-inline-flex align-items-center gap-2 text-muted"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <i
                          className={`isax ${icon} text-body`}
                          style={{ fontSize: 16 }}
                          aria-hidden="true"
                        />
                        {label}: {value}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                    <PerformanceHistoryView
                      domainId={domainId}
                      pageUrl={page?.url}
                    />
                  </div>
                </>
              ) : (
                <div className="row g-4 mb-0">
                  <div className="col-12 col-lg-6">
                    <PerformanceScoreCard page={page} />
                  </div>
                  <div className="col-12 col-lg-6">
                    <OpportunitiesByPriorityCard />
                  </div>
                  <div className="col-12 mt-1">
                    <UserLoadingExperienceCard page={page} />
                  </div>
                  <div className="col-12 mt-1">
                    <div className="card border border-secondary border-opacity-25 shadow-sm p-4">
                      <PerformanceHistoryView
                        domainId={domainId}
                        pageUrl={page?.url}
                      />
                    </div>
                  </div>
                </div>
              ))}
            {activeTab === "quick-help" && (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2">
                  <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                    <i
                      className="isax isax-message-question fs-22"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h6 className="mb-2 fw-semibold text-body">Quick Help</h6>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
                    >
                      Information on resolving performance options.
                    </p>
                  </div>
                </div>
                <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
                  <div className="card-body py-4">
                    <h6 className="fw-semibold text-body mb-3">
                      How to resolve this performance option
                    </h6>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
                    >
                      Here is some content to help you resolve this performance
                      option. You can improve your page's performance score by
                      addressing the render-blocking resources, deferring
                      offscreen images, and minifying your CSS and JS files.
                      <br />
                      <br />
                      This quick help provides the necessary content for your
                      performance options!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewPerformancePageDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        page={page ? { title: page.title, url: page.url } : null}
      />

      {/* Expand drawer: full performance details in a slide-over panel with same UI as image */}
      {expandDrawerOpen &&
        page &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
              style={{ zIndex: EXPAND_DRAWER_Z_BACKDROP }}
              aria-hidden="true"
              onClick={() => setExpandDrawerOpen(false)}
            />
            <div
              className="position-fixed top-0 end-0 bottom-0 bg-white shadow d-flex flex-column overflow-hidden"
              style={{
                zIndex: EXPAND_DRAWER_Z_PANEL,
                width: "min(100%, 1200px)",
                maxWidth: "1200px",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="performance-expand-drawer-title"
            >
              <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                  onClick={() => setExpandDrawerOpen(false)}
                  title="Close"
                  aria-label="Close"
                >
                  <i
                    className="isax isax-close-circle fs-22 text-body"
                    aria-hidden="true"
                  />
                </button>
                <div className="min-w-0 flex-grow-1">
                  <h5
                    id="performance-expand-drawer-title"
                    className="mb-1 fw-semibold text-body text-break"
                  >
                    {page.title}
                  </h5>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                  >
                    <ExternalLinkIcon size={12} className="flex-shrink-0" />
                    {page.url}
                  </a>
                </div>
              </div>
              <div className="flex-grow-1 overflow-auto">
                <PerformanceSection page={page} embeddedInDrawer={true} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

export default PerformanceSection;
