import React, { useState } from "react";

const INVENTORY_DESCRIPTION =
  "List of where all your assets are on the website (i.e. Docs, links, email addresses, code snippet, etc).";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING = { top: 24, right: 24, bottom: 48, left: 48 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const Y_MAX = 600;
const Y_TICKS = [0, 200, 400, 600];

const X_LABELS = ["Dec 09", "Dec 16", "Dec 23", "Dec 30", "Jan 06", "Jan 13", "Jan 20", "Jan 27", "Feb 03", "Feb 15"];
const CRAWLED_PAGES_DATA = [420, 360, 480, 400, 540, 460, 580, 500, 560, 480];
const IMAGES_DATA = [120, 200, 160, 260, 200, 320, 240, 340, 280, 220];

const CRAWLED_COLOR = "#3b82f6";
const CRAWLED_FILL = "rgba(59, 130, 246, 0.12)";
const IMAGES_COLOR = "#22c55e";
const IMAGES_FILL = "rgba(34, 197, 94, 0.1)";

const DOCUMENTS_COLOR = "#9ca3af";

const smoothPath = (points) => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const n = points.length;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const InventorySummaryView = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState(2026);

  const history = data?.history || [];
  
  // Prepare dynamic chart data
  const hasHistory = history.length > 0;
  
  const displayLabels = hasHistory 
    ? history.map(h => {
        const d = new Date(h.date);
        return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      })
    : X_LABELS;

  const dynamicCrawledData = hasHistory 
    ? history.map(h => h.htmlPages)
    : CRAWLED_PAGES_DATA;

  const dynamicImagesData = hasHistory 
    ? history.map(h => h.images)
    : IMAGES_DATA;

  // Ensure we have at least some data for the chart to render properly
  const n = displayLabels.length;

  const technicalItems = [
    { label: "CSS", value: data?.css || 0, icon: "isax-code", active: (data?.css || 0) > 0 },
    { label: "Javascript", value: data?.js || 0, icon: "isax-code-1", active: (data?.js || 0) > 0 },
    { label: "Frames", value: data?.frames || 0, icon: "isax-code-circle", active: (data?.frames || 0) > 0 },
    { label: "IFrames", value: data?.iframes || 0, icon: "isax-code-circle", active: (data?.iframes || 0) > 0 },
  ];

  const linksItems = [
    { label: "Links", value: data?.links || 0, icon: "isax-link-2", active: (data?.links || 0) > 0 },
    { label: "Emails", value: data?.emails || 0, icon: "isax-sms", active: (data?.emails || 0) > 0 },
    { label: "Headlinks", value: data?.headlinks || 0, icon: "isax-link-2", active: (data?.headlinks || 0) > 0 },
  ];

  const contentItems = [
    { label: "HTML Pages", value: data?.htmlPages || 0, icon: "isax-folder", active: (data?.htmlPages || 0) > 0 },
    { label: "Documents", value: data?.documents || 0, icon: "isax-document-text", active: (data?.documents || 0) > 0 },
    { label: "Images", value: data?.images || 0, icon: "isax-image", active: (data?.images || 0) > 0 },
  ];

  const xScale = (i) => PADDING.left + (i / Math.max(1, n - 1)) * PLOT_WIDTH;
  const yScale = (v) => {
    const maxVal = Math.max(...dynamicCrawledData, ...dynamicImagesData, 10);
    const scaleMax = Math.ceil(maxVal / 100) * 100;
    return PADDING.top + PLOT_HEIGHT - (v / (scaleMax || Y_MAX)) * PLOT_HEIGHT;
  };
  const baselineY = PADDING.top + PLOT_HEIGHT;

  const crawledPoints = dynamicCrawledData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const imagesPoints = dynamicImagesData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const crawledPath = smoothPath(crawledPoints);
  const imagesPath = smoothPath(imagesPoints);
  const crawledAreaPath = `${crawledPath} L ${xScale(n - 1)} ${baselineY} L ${xScale(0)} ${baselineY} Z`;
  const imagesAreaPath = `${imagesPath} L ${xScale(n - 1)} ${baselineY} L ${xScale(0)} ${baselineY} Z`;

  return (
    <div className="inventory-summary-view d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex align-items-start gap-3">
        <span className="avatar avatar-48 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
          <i className="isax isax-element-3 fs-24" aria-hidden="true" />
        </span>
        <div>
          <h5 className="mb-2 fw-bold text-primary">Inventory</h5>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
            {INVENTORY_DESCRIPTION}
          </p>
        </div>
      </div>

      {/* Inventory History */}
      <div className="card border border-secondary border-opacity-25 rounded-3 overflow-hidden bg-transparent" style={{ boxShadow: "none" }}>
        <div className="card-body p-4 bg-transparent">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <h6 className="fw-semibold text-body mb-0">Inventory History</h6>
            <div className="d-flex flex-wrap align-items-center gap-4">
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: CRAWLED_COLOR }} aria-hidden="true" />
                Crawled pages
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: IMAGES_COLOR }} aria-hidden="true" />
                Images
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: DOCUMENTS_COLOR }} aria-hidden="true" />
                Documents
              </span>
              <button
                type="button"
                className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
                onClick={() => {}}
              >
                <i className="isax isax-calendar-1 text-primary" style={{ fontSize: "0.9rem" }} aria-hidden="true" />
                {selectedYear}
                <i className="isax isax-arrow-down-1 small" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="bg-transparent" style={{ maxWidth: CHART_WIDTH, margin: "0 auto" }}>
            <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: "visible", background: "transparent" }} aria-hidden="true">
              {Y_TICKS.map((v) => {
                const y = yScale(v);
                return <line key={v} x1={PADDING.left} y1={y} x2={PADDING.left + PLOT_WIDTH} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" strokeDasharray="4 4" />;
              })}
              {Y_TICKS.map((v) => {
                const y = yScale(v);
                return <text key={v} x={PADDING.left - 6} y={y + 4} textAnchor="end" fill="#6b7280" style={{ fontSize: 10 }}>{v}</text>;
              })}
              {displayLabels.map((label, i) => (
                <text key={`${label}-${i}`} x={xScale(i)} y={CHART_HEIGHT - 12} textAnchor="middle" fill="#6b7280" style={{ fontSize: 10 }}>{label}</text>
              ))}
              <line x1={PADDING.left} y1={baselineY} x2={PADDING.left + PLOT_WIDTH} y2={baselineY} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              <path d={crawledAreaPath} fill={CRAWLED_FILL} />
              <path d={imagesAreaPath} fill={IMAGES_FILL} />
              <path d={crawledPath} fill="none" stroke={CRAWLED_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={imagesPath} fill="none" stroke={IMAGES_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-12 col-md-6">
              <div
                className="rounded-3 p-3 border border-secondary border-opacity-25 bg-white"
                style={{
                  backgroundImage: "radial-gradient(circle at 100% 0%, rgba(147, 112, 219, 0.14) 0%, transparent 52%)",
                  backgroundColor: "#fff",
                  backgroundRepeat: "no-repeat",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-muted small mb-1">Total Crawled pages this year</p>
                <div className="d-flex flex-wrap align-items-baseline gap-2">
                  <span className="fw-bold fs-4 text-body">{data?.htmlPages || 0}</span>
                  <span className="small text-success d-inline-flex align-items-center gap-1 fw-medium">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-15" style={{ width: 20, height: 20 }}>
                      <i className="isax isax-arrow-up-1" style={{ fontSize: "0.65rem" }} aria-hidden="true" />
                    </span>
                    Latest Scan
                  </span>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div
                className="rounded-3 p-3 border border-secondary border-opacity-25 bg-white"
                style={{
                  backgroundImage: "radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.14) 0%, transparent 52%)",
                  backgroundColor: "#fff",
                  backgroundRepeat: "no-repeat",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-muted small mb-1">Total Images this year</p>
                <div className="d-flex flex-wrap align-items-baseline gap-2">
                  <span className="fw-bold fs-4 text-body">{data?.images || 0}</span>
                  <span className="small text-success d-inline-flex align-items-center gap-1 fw-medium">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-15" style={{ width: 20, height: 20 }}>
                      <i className="isax isax-arrow-up-1" style={{ fontSize: "0.65rem" }} aria-hidden="true" />
                    </span>
                    Latest Scan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical + Links */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm h-100">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-body mb-3">Technical</h6>
              <div className="row g-0">
                {technicalItems.map((item, idx) => (
                  <div key={item.label} className="col-6">
                    <div className={`d-flex align-items-center gap-3 p-3 ${idx % 2 === 0 ? "border-end border-secondary border-opacity-25" : ""} ${idx < 2 ? "border-bottom border-secondary border-opacity-25" : ""}`}>
                      <span className={`avatar avatar-40 avatar-rounded d-flex align-items-center justify-content-center flex-shrink-0 ${item.active ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                        <i className={`isax ${item.icon} fs-20`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>{item.label}</p>
                        <p className="fw-semibold mb-0 text-body" style={{ fontSize: "1rem" }}>{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm h-100">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-body mb-3">Links</h6>
              <div className="row g-0">
                {linksItems.map((item, idx) => (
                  <div key={item.label} className="col-6 col-md-4">
                    <div className={`d-flex align-items-center gap-3 p-3 border-end border-secondary border-opacity-25 ${idx < 3 ? "border-bottom border-secondary border-opacity-25" : ""}`}>
                      <span className={`avatar avatar-40 avatar-rounded d-flex align-items-center justify-content-center flex-shrink-0 ${item.active ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                        <i className={`isax ${item.icon} fs-20`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-muted mb-0 text-truncate" style={{ fontSize: "0.75rem" }}>{item.label}</p>
                        <p className="fw-semibold mb-0 text-body" style={{ fontSize: "0.95rem" }}>{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="col-6 col-md-4">
                  <div className="p-3 border-end border-secondary border-opacity-25" style={{ minHeight: 76 }} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="row">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-body mb-3">Content</h6>
              <div className="d-flex flex-column gap-0">
                {contentItems.map((item, idx) => (
                  <div key={item.label} className={`d-flex align-items-center gap-3 p-3 ${idx < contentItems.length - 1 ? "border-bottom border-secondary border-opacity-25" : ""}`}>
                    <span className={`avatar avatar-40 avatar-rounded d-flex align-items-center justify-content-center flex-shrink-0 ${item.active ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                      <i className={`isax ${item.icon} fs-20`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>{item.label}</p>
                      <p className="fw-semibold mb-0 text-body" style={{ fontSize: "1rem" }}>{item.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryView;
