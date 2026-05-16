import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDomainLatestSummaryApi, getDomainByIdApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const TEAL = "#14b8a6";
const LEVEL_A = { passed: 44, total: 76, done: 32, toFix: 16, building: 10, person: 4, eye: 12 };
const LEVEL_AA = { passed: 16, total: 20, done: 12, toFix: 16, building: 1, person: 2, eye: 11 };
const HISTORY_A = [44, 44, 48];
const HISTORY_AA = [14, 14, 16];
const COMPLIANCE_BY_LEVEL = { done: 24, pink: 4, purple: 48, toFix: 48 };
const COMPLIANCE_PERCENT = 61.1;
const INDUSTRY_AVG_PERCENT = 81.1;
const FALLING_CHECKS = { current: 48, total: 107, change: "+100%" };
const PAGES_WITH_FALLING = 500;
const TREND_POINTS = "0 450 30 420 60 380 90 350 120 320 150 300 180 280 210 260 240 240 270 220 300 200";
const PDF_INTERNAL = { percent: 0, pending: 0 };
const PDF_EXTERNAL = { percent: 0, pending: 14 };

const Donut = ({ percent, label, color = TEAL }) => {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="position-relative">
        <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="fw-bold text-body" style={{ fontSize: "1.25rem" }}>{percent}%</span>
        </div>
      </div>
      <span className="text-muted fs-13 mt-2 text-center">{label}</span>
    </div>
  );
};

const LevelComplianceCard = ({
  title,
  subtitle,
  mainMetric,
  done,
  toFix,
  building,
  person,
  eye,
  historyValues,
  historyLabels,
}) => {
  const total = done + toFix;
  const donePct = total > 0 ? (done / total) * 100 : 0;
  const maxHistory = Math.max(...historyValues, 1);
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="fw-semibold text-body mb-1">{title}</h6>
        <p className="text-muted fs-13 mb-2">{subtitle}</p>
        <p className="fs-3 fw-bold text-body mb-3">{mainMetric}</p>
        <div className="progress rounded-pill mb-3" style={{ height: 10 }}>
          <div className="progress-bar" style={{ width: `${donePct}%`, backgroundColor: TEAL }} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} />
          <div className="progress-bar bg-secondary bg-opacity-25" style={{ width: `${100 - donePct}%` }} role="progressbar" />
        </div>
        <div className="d-flex justify-content-between mb-2 fs-13">
          <span className="text-body">{done} done</span>
          <span className="text-muted">{toFix} to fix</span>
        </div>
        <div className="d-flex gap-3 mb-3">
          <span className="d-inline-flex align-items-center gap-1 text-muted fs-13">
            <i className="isax isax-building-4 fs-16" aria-hidden="true" />
            {building}
          </span>
          <span className="d-inline-flex align-items-center gap-1 text-muted fs-13">
            <i className="isax isax-people fs-16" aria-hidden="true" />
            {person}
          </span>
          <span className="d-inline-flex align-items-center gap-1 text-muted fs-13">
            <i className="isax isax-eye fs-16" aria-hidden="true" />
            {eye}
          </span>
        </div>
        <p className="fw-medium text-body fs-13 mb-2">History (last 3 scans)</p>
        <div className="d-flex align-items-end gap-2" style={{ height: 64 }}>
          {historyValues.map((v, i) => (
            <div key={i} className="flex-grow-1 rounded-1" style={{ height: `${(v / maxHistory) * 100}%`, minHeight: 8, backgroundColor: TEAL }} title={`${historyLabels[i]}: ${v}`} />
          ))}
        </div>
        <div className="d-flex justify-content-between mt-1 fs-12 text-muted">
          {historyLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccessibilitySummaryView = () => {
  const [summary, setSummary] = useState(null);
  const [domain, setDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
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
      console.error("Failed to fetch Accessibility summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const accessibilityScore = summary?.performanceMetrics?.avgAccessibilityScore || 0;
  const totalIssues = (summary?.issueBreakdown?.high || 0) + (summary?.issueBreakdown?.medium || 0) + (summary?.issueBreakdown?.low || 0);

  const complianceTotal = COMPLIANCE_BY_LEVEL.done + COMPLIANCE_BY_LEVEL.pink + COMPLIANCE_BY_LEVEL.purple;
  const complianceDonePct = complianceTotal > 0 ? (COMPLIANCE_BY_LEVEL.done / complianceTotal) * 100 : 0;
  const compliancePinkPct = complianceTotal > 0 ? (COMPLIANCE_BY_LEVEL.pink / complianceTotal) * 100 : 0;
  const compliancePurplePct = complianceTotal > 0 ? (COMPLIANCE_BY_LEVEL.purple / complianceTotal) * 100 : 0;

  return (
    <div className="accessibility-summary-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body">Accessibility</h5>
          <p className="text-muted fs-13 mb-0" style={{ maxWidth: 560 }}>
            Test your website's compliance levels (WCAG 2.0) and fix issues that are making it difficult for people with disabilities to use your website.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dropdown">
            <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="isax isax-people5 text-primary fs-18" aria-hidden="true" />
              Showing All
              <i className="isax isax-arrow-down-1 fs-12" aria-hidden="true" />
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><button type="button" className="dropdown-item">All</button></li>
              <li><button type="button" className="dropdown-item">Level A</button></li>
              <li><button type="button" className="dropdown-item">Level AA</button></li>
            </ul>
          </div>
          <button type="button" className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2" title="Share" aria-label="Share">
            <i className="isax isax-send-2 fs-18" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="row g-4">
            <div className="col-md-6">
              <LevelComplianceCard
                title="Level A compliance"
                subtitle={`${LEVEL_A.passed} of ${LEVEL_A.total} checks passed`}
                mainMetric={LEVEL_A.done}
                done={LEVEL_A.done}
                toFix={LEVEL_A.toFix}
                building={LEVEL_A.building}
                person={LEVEL_A.person}
                eye={LEVEL_A.eye}
                historyValues={HISTORY_A}
                historyLabels={["Dec 09", "Dec 09", "Feb 15"]}
              />
            </div>
            <div className="col-md-6">
              <LevelComplianceCard
                title="Level AA compliance"
                subtitle={`${LEVEL_AA.passed} of ${LEVEL_AA.total} checks passed`}
                mainMetric={LEVEL_AA.done}
                done={LEVEL_AA.done}
                toFix={LEVEL_AA.toFix}
                building={LEVEL_AA.building}
                person={LEVEL_AA.person}
                eye={LEVEL_AA.eye}
                historyValues={HISTORY_AA}
                historyLabels={["Dec 09", "Dec 09", "Feb 15"]}
              />
            </div>
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-semibold text-body mb-2">Accessibility checks compliance by level</h6>
                  <p className="text-muted fs-13 mb-3">{COMPLIANCE_BY_LEVEL.done} Checks done</p>
                  <div className="d-flex rounded-2 overflow-hidden mb-2" style={{ height: 28 }}>
                    <div style={{ width: `${complianceDonePct}%`, backgroundColor: TEAL }} title="Done" />
                    <div style={{ width: `${compliancePinkPct}%`, backgroundColor: "#ec4899" }} title="4" />
                    <div style={{ width: `${compliancePurplePct}%`, backgroundColor: "#8b5cf6" }} title="48" />
                  </div>
                  <div className="d-flex justify-content-between fs-13">
                    <span className="text-muted">4</span>
                    <span className="text-muted">48</span>
                    <span className="fw-medium text-body">{COMPLIANCE_BY_LEVEL.toFix} Checks to fix</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">Accessibility Diagnostics</h6>
              <p className="text-muted fs-13 mb-3">Percentage above the average compliance score across all pages on the domain</p>
              <div className="d-flex justify-content-around mb-4">
                <Donut percent={accessibilityScore} label="Accessibility Compliance" />
                <Donut percent={81.1} label="Industry average" />
              </div>
              <div className="mb-3">
                <p className="fs-13 text-body mb-1">
                  <span className="text-muted">Falling accessibility checks:</span>{" "}
                  <span className="fw-medium">{totalIssues} / 0</span>
                  <span className="text-success ms-1 fs-13">0%</span>
                </p>
                <p className="fs-13 text-body mb-0">
                  <span className="text-muted">Pages with falling checks:</span>{" "}
                  <span className="fw-medium">{summary?.totalPages || 0}</span>
                </p>
              </div>
              <div className="position-relative rounded-2 bg-body-tertiary p-3" style={{ minHeight: 180 }}>
                <svg viewBox="0 0 300 120" className="w-100" style={{ height: 160 }} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="trendFillAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke={TEAL}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={TREND_POINTS.split(" ").reduce((acc, _, i, arr) => {
                      if (i % 2 === 0 && arr[i + 1] != null) acc.push(`${arr[i]},${120 - Number(arr[i + 1]) / 5}`);
                      return acc;
                    }, []).join(" ")}
                  />
                </svg>
                <div className="d-flex flex-wrap gap-3 mt-2 fs-12 text-muted">
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="rounded" style={{ width: 8, height: 8, backgroundColor: TEAL }} /> Checks passed
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="rounded" style={{ width: 8, height: 8, backgroundColor: "#f97316" }} /> Falling checks
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="rounded" style={{ width: 8, height: 8, backgroundColor: "#94a3b8" }} /> Pages with issue
                  </span>
                </div>
                <Link to="/home/history-center" className="small text-primary text-decoration-none mt-2 d-inline-block">Show History</Link>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">PDF Compliance Status</h6>
              <p className="text-muted fs-13 mb-3">PDF files that are reviewed or pending for accessibility</p>
              <div className="row g-3">
                <div className="col-6">
                  <Donut percent={PDF_INTERNAL.percent} label="Internal PDFs reviewed" />
                  <Link to="/domain/accessibility?view=internal-pdfs" className="small text-primary text-decoration-none d-block mt-1">Pending PDF reviews ({PDF_INTERNAL.pending})</Link>
                </div>
                <div className="col-6">
                  <Donut percent={PDF_EXTERNAL.percent} label="External PDFs reviewed" />
                  <Link to="/domain/accessibility?view=external-pdfs" className="small text-primary text-decoration-none d-block mt-1">Pending PDF reviews ({PDF_EXTERNAL.pending})</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySummaryView;
