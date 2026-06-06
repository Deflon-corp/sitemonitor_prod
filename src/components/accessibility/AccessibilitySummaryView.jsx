import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDomainByIdApi } from "../../api/domainApi";
import { getAccessibilitySummaryApi, triggerAccessibilityScanApi, getAccessibilityScanStatusApi } from "../../api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const TEAL = "#14b8a6";
// Static data replaced by API calculation
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
        <div className="d-flex justify-content-between mb-3 fs-13">
          <span className="text-body fw-medium">{done} Passed</span>
          <span className="text-muted fw-medium">{toFix} To Fix</span>
        </div>
        <p className="fw-medium text-body fs-13 mb-2">Trend (Last 3 Scans)</p>
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
  const [isScanning, setIsScanning] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const [summaryRes, domainRes] = await Promise.all([
        getAccessibilitySummaryApi(domainId),
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

  const pollStatus = useCallback(async () => {
    if (!domainId) return;
    try {
      const res = await getAccessibilityScanStatusApi(domainId);
      if (res.success && res.data) {
        const currentlyScanning = res.data.status === "scanning";
        
        // If it was scanning but now it's not, it means the scan finished. Refetch summary.
        if (isScanning && !currentlyScanning) {
          fetchSummary();
        }
        
        setIsScanning(currentlyScanning);
      }
    } catch (error) {
      console.error("Failed to fetch scan status", error);
    }
  }, [domainId, isScanning, fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Poll status every 5 seconds
  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const handleTriggerScan = async () => {
    if (!domainId) return;
    setIsScanning(true);
    try {
      const res = await triggerAccessibilityScanApi(domainId);
      if (res.success) {
        // Optional: show a toast notification here
        console.log("Scan started successfully");
      }
    } catch (err) {
      console.error("Failed to trigger scan", err);
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const accessibilityScore = summary?.averageScore || 0;
  const totalIssues = summary?.totalFailedChecks || 0;
  
  const allChecks = summary?.allChecks || [];
  
  const levelAChecks = allChecks.filter(c => (c.tags || []).some(t => t.match(/wcag2.*a$/i) && !t.match(/aa$/i)));
  const levelAAChecks = allChecks.filter(c => (c.tags || []).some(t => t.match(/wcag2.*aa$/i)));

  const levelA = {
    passed: levelAChecks.filter(c => c.passed).length,
    total: levelAChecks.length,
    done: levelAChecks.filter(c => c.passed).length,
    toFix: levelAChecks.filter(c => !c.passed).length,
    building: 0, person: 0, eye: 0
  };

  const levelAA = {
    passed: levelAAChecks.filter(c => c.passed).length,
    total: levelAAChecks.length,
    done: levelAAChecks.filter(c => c.passed).length,
    toFix: levelAAChecks.filter(c => !c.passed).length,
    building: 0, person: 0, eye: 0
  };

  const complianceTotal = allChecks.length;
  const complianceDonePct = complianceTotal > 0 ? (allChecks.filter(c => c.passed).length / complianceTotal) * 100 : 0;
  const compliancePinkPct = complianceTotal > 0 ? (levelA.toFix / complianceTotal) * 100 : 0;
  const compliancePurplePct = complianceTotal > 0 ? (levelAA.toFix / complianceTotal) * 100 : 0;
  const complianceToFix = allChecks.filter(c => !c.passed).length;

  return (
    <div className="accessibility-summary-view">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body">Accessibility</h5>
          <p className="text-muted fs-13 mb-0" style={{ maxWidth: 560 }}>
            Monitor your website's WCAG compliance levels and resolve issues that impact usability for users with disabilities.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-2" 
            onClick={handleTriggerScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <i className="isax isax-refresh fs-18" aria-hidden="true" />
            )}
            {isScanning ? "Scanning..." : "Re-scan"}
          </button>
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
                title="Level A Compliance (WCAG)"
                subtitle={`${levelA.passed} of ${levelA.total} checks passed`}
                mainMetric={levelA.done}
                done={levelA.done}
                toFix={levelA.toFix}
                building={levelA.building}
                person={levelA.person}
                eye={levelA.eye}
                historyValues={[levelA.done, levelA.done, levelA.done]}
                historyLabels={["Prev", "Last", "Current"]}
              />
            </div>
            <div className="col-md-6">
              <LevelComplianceCard
                title="Level AA Compliance (WCAG)"
                subtitle={`${levelAA.passed} of ${levelAA.total} checks passed`}
                mainMetric={levelAA.done}
                done={levelAA.done}
                toFix={levelAA.toFix}
                building={levelAA.building}
                person={levelAA.person}
                eye={levelAA.eye}
                historyValues={[levelAA.done, levelAA.done, levelAA.done]}
                historyLabels={["Prev", "Last", "Current"]}
              />
            </div>
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-semibold text-body mb-2">Accessibility checks compliance by level</h6>
                  <p className="text-muted fs-13 mb-3">{allChecks.filter(c => c.passed).length} Checks done</p>
                  <div className="d-flex rounded-2 overflow-hidden mb-2" style={{ height: 28 }}>
                    <div style={{ width: `${complianceDonePct}%`, backgroundColor: TEAL }} title="Done" />
                    <div style={{ width: `${compliancePinkPct}%`, backgroundColor: "#ec4899" }} title={levelA.toFix.toString()} />
                    <div style={{ width: `${compliancePurplePct}%`, backgroundColor: "#8b5cf6" }} title={levelAA.toFix.toString()} />
                  </div>
                  <div className="d-flex justify-content-between fs-13">
                    <span className="text-muted">{levelA.toFix} Level A to fix</span>
                    <span className="text-muted">{levelAA.toFix} Level AA to fix</span>
                    <span className="fw-medium text-body">{complianceToFix} Checks to fix</span>
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
              <p className="text-muted fs-13 mb-3">Overall accessibility compliance score across your domain compared to the industry average.</p>
              <div className="d-flex justify-content-around mb-4">
                <Donut percent={accessibilityScore} label="Accessibility Compliance" />
                <Donut percent={81.1} label="Industry average" />
              </div>
              <div className="mb-3">
                <p className="fs-13 text-body mb-1">
                  <span className="text-muted">Failing accessibility checks:</span>{" "}
                  <span className="fw-medium">{totalIssues}</span>
                </p>
                <p className="fs-13 text-body mb-0">
                  <span className="text-muted">Pages with failing checks:</span>{" "}
                  <span className="fw-medium">{summary?.pagesWithIssues || 0}</span>
                </p>
              </div>
              <div className="position-relative rounded-2 bg-body-tertiary p-3" style={{ minHeight: 180 }}>
                <div className="d-flex flex-wrap gap-3 mt-2 fs-12 text-muted">
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="rounded" style={{ width: 8, height: 8, backgroundColor: TEAL }} /> Checks passed
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="rounded" style={{ width: 8, height: 8, backgroundColor: "#f97316" }} /> Failing checks
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
              <p className="text-muted fs-13 mb-3">Track the accessibility review status for all internal and external PDF documents.</p>
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
