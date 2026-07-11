import React from "react";

const DarkPatternSummaryView = () => {
  const stats = [
    { label: "Total Pages Scanned", value: 124 },
    { label: "Dark Patterns Found", value: 12 },
    { label: "High Severity", value: 3, color: "text-danger" },
    { label: "Medium Severity", value: 9, color: "text-warning" },
  ];

  const issues = [
    {
      id: 1,
      type: "Hidden Costs",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "Additional fees are added to the cart without clear upfront disclosure.",
      pagesAffected: 2,
    },
    {
      id: 2,
      type: "Roach Motel",
      severity: "High",
      severityClass: "bg-danger bg-opacity-10 text-danger",
      description: "The account deletion process is unnecessarily complex and requires contacting support.",
      pagesAffected: 1,
    },
    {
      id: 3,
      type: "Misdirection",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "The visual design emphasizes the more expensive subscription option.",
      pagesAffected: 5,
    },
    {
      id: 4,
      type: "Confirmshaming",
      severity: "Medium",
      severityClass: "bg-warning bg-opacity-10 text-warning",
      description: "Opt-out buttons use guilt-inducing language.",
      pagesAffected: 4,
    },
  ];

  const darkPatternDistributions = [
    { id: 1, type: "Misdirection", percentage: 25, colorClass: "bg-warning" },
    { id: 2, type: "Confirmshaming", percentage: 18, colorClass: "bg-primary" },
    { id: 3, type: "Hidden Costs", percentage: 15, colorClass: "bg-danger" },
    { id: 4, type: "Roach Motel", percentage: 12, colorClass: "bg-danger opacity-75" },
    { id: 5, type: "Forced Continuity", percentage: 10, colorClass: "bg-info" },
    { id: 6, type: "Sneak into Basket", percentage: 8, colorClass: "bg-secondary" },
    { id: 7, type: "Fake Scarcity", percentage: 6, colorClass: "bg-success" },
    { id: 8, type: "Privacy Zuckering", percentage: 4, colorClass: "bg-dark" },
    { id: 9, type: "Bait and Switch", percentage: 2, colorClass: "bg-warning opacity-75" },
  ];

  const totalDarkPatterns = stats.find(s => s.label === "Dark Patterns Found")?.value || 0;

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-shield-tick fs-20 text-primary" />
          Dark Pattern Audit Summary
        </h5>
        <p className="text-muted fs-13 mb-0">
          Review potential deceptive design patterns found across your domain.
        </p>
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
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="439.8" strokeDashoffset="48" strokeLinecap="round" />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <span className="fs-24 fw-bold text-body d-block">89%</span>
                  <span className="fs-12 text-muted">Clean Pages</span>
                </div>
              </div>
              <p className="fs-13 text-center text-muted mb-0 px-4">
                11% of scanned pages contain one or more dark patterns that may degrade user experience and trust.
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
            {[
              { date: "Jul 07, 2026, 10:30 AM", count: 45, height: "75%" },
              { date: "Jul 08, 2026, 02:15 PM", count: 30, height: "50%" },
              { date: "Jul 09, 2026, 11:00 AM", count: 28, height: "46%" },
              { date: "Jul 10, 2026, 09:45 AM", count: 18, height: "30%" },
              { date: "Jul 11, 2026, 04:20 PM", count: 12, height: "20%" },
            ].map((scan, i) => (
              <div key={i} className="d-flex flex-column align-items-center h-100 justify-content-end" style={{ width: '95px' }}>
                <span className="fs-12 fw-medium text-body mb-2">{scan.count}</span>
                <div 
                  className="bg-primary rounded-top transition-all" 
                  style={{ height: scan.height, opacity: 0.85, width: '36px' }}
                ></div>
                <span className="fs-11 text-muted mt-2 text-center">{scan.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DarkPatternSummaryView;
