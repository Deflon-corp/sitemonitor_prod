import React from "react";

function ComplianceRing({ percent, stroke = "#14b8a6", size = 120 }) {
  const safe = Math.min(100, Math.max(0, Number(percent) || 0));
  const dash = (safe / 100) * 389;
  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center">
      <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r="62"
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} 389`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
        <span className="d-block fs-4 fw-bold text-body">
          {Number.isFinite(safe) ? safe.toFixed(safe % 1 === 0 ? 0 : 2) : "0"}%
        </span>
        <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>
          overall compliance
        </span>
      </div>
    </div>
  );
}

function MetricCard({ title, icon, onOpen, children }) {
  return (
    <div className="card flex-fill border-0 shadow-sm dashboard-metric-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <i className={`isax ${icon} dashboard-metric-icon fs-18 text-primary`} aria-hidden="true" />
            {title}
          </h6>
          {onOpen && (
            <button type="button" className="btn btn-link btn-sm p-0" onClick={onOpen} aria-label={`Open ${title}`}>
              <i className="isax isax-arrow-right-1" aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Page dashboard tab – dynamic metrics from usePageDetails / page-detail API.
 */
export default function PageDashboardContent({ page, onNavigateTab, loading }) {
  if (loading) {
    return <p className="text-muted py-4 text-center">Loading page dashboard…</p>;
  }

  if (!page) {
    return (
      <div className="card border border-secondary border-opacity-25 rounded-3 p-4 text-center text-muted">
        <p className="mb-0 fs-13">No scan data for this page yet. Run a QA scan to see metrics.</p>
      </div>
    );
  }

  const policyPct = page.policyCompliancePercent ?? 100;
  const qaPct = page.qaCompliancePercent ?? (page.qaIssueCount > 0 ? 0 : 100);
  const a11yScore = page.lighthouseAccessibilityScore ?? 0;
  const seoScore = page.seoScore ?? page.lighthouseSeoScore ?? 0;
  const seoCount = page.seoOpportunitiesCount ?? page.seoImprovements?.length ?? 0;
  const seoPri = page.seoByPriority || { high: 0, medium: 0, low: 0 };

  return (
    <div className="row g-4 page-details-drawer-dashboard">
      <div className="col-md-6 d-flex">
        <MetricCard
          title="Content Policies"
          icon="isax-tick-circle5"
          onOpen={onNavigateTab ? () => onNavigateTab("policies") : undefined}
        >
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start">
              <ComplianceRing percent={policyPct} />
            </div>
            <div className="col-12 col-md-7 min-w-0">
              <h6 className="fs-13 fw-semibold text-body mb-1">Policies with violations</h6>
              <p className="fs-2 fw-bold text-body mb-2">{page.policyViolationsCount ?? 0}</p>
              <div className="d-flex flex-wrap gap-3 fs-13 text-muted">
                <span>Unwanted: {page.policiesByCategory?.unwanted ?? 0}</span>
                <span>Required: {page.policiesByCategory?.required ?? 0}</span>
                <span>Matches: {page.policiesByCategory?.matches ?? 0}</span>
              </div>
            </div>
          </div>
        </MetricCard>
      </div>

      <div className="col-md-6 d-flex">
        <MetricCard
          title="Quality Assurance"
          icon="isax-document-text5"
          onOpen={onNavigateTab ? () => onNavigateTab("qa") : undefined}
        >
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start">
              <ComplianceRing percent={qaPct} stroke={qaPct >= 50 ? "#14b8a6" : "#ef4444"} />
            </div>
            <div className="col-12 col-md-7 min-w-0">
              <h6 className="fs-13 fw-semibold text-body mb-1">QA Issues</h6>
              <p className="fs-2 fw-bold text-body mb-1">{page.qaIssueCount ?? 0}</p>
              <div className="d-flex flex-wrap gap-3 fs-13">
                <span className="text-danger">
                  <i className="isax isax-link-2 me-1" aria-hidden="true" />
                  {page.qaBrokenLinksCount ?? 0}
                </span>
                <span className="text-danger">
                  <i className="isax isax-image me-1" aria-hidden="true" />
                  {page.qaBrokenImagesCount ?? 0}
                </span>
                <span className="text-danger">
                  <i className="isax isax-edit-2 me-1" aria-hidden="true" />
                  {page.qaMisspellingsCount ?? 0}
                </span>
                <span className="text-primary">
                  <i className="isax isax-text me-1" aria-hidden="true" />
                  {page.qaPotentialMisspellingsCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </MetricCard>
      </div>

      <div className="col-md-6 d-flex">
        <MetricCard
          title="Accessibility"
          icon="isax-people5"
          onOpen={onNavigateTab ? () => onNavigateTab("accessibility") : undefined}
        >
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start">
              <ComplianceRing percent={a11yScore} stroke="#7c3aed" />
            </div>
            <div className="col-12 col-md-7 min-w-0">
              <p className="fs-13 text-muted mb-0">Accessibility score for this page</p>
              {page.readabilityLevel && (
                <p className="fs-13 mb-0 mt-2">
                  Readability: <strong className="text-body">{page.readabilityLevel}</strong>
                </p>
              )}
            </div>
          </div>
        </MetricCard>
      </div>

      <div className="col-md-6 d-flex">
        <MetricCard
          title="SEO Performance Overview"
          icon="isax-chart-215"
          onOpen={onNavigateTab ? () => onNavigateTab("seo") : undefined}
        >
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start">
              <ComplianceRing percent={seoScore} />
            </div>
            <div className="col-12 col-md-7 min-w-0">
              <h6 className="fs-13 fw-semibold text-body mb-1">Improvement opportunities</h6>
              <p className="fs-2 fw-bold text-body mb-2">{seoCount}</p>
              <div className="d-flex flex-wrap gap-3 fs-13">
                <span className="text-danger">High: {seoPri.high ?? 0}</span>
                <span style={{ color: "#ea580c" }}>Medium: {seoPri.medium ?? 0}</span>
                <span className="text-muted">Low: {seoPri.low ?? 0}</span>
              </div>
            </div>
          </div>
        </MetricCard>
      </div>
    </div>
  );
}
