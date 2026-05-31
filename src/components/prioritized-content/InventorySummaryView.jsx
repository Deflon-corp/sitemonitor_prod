import React, { useState } from "react";

const INVENTORY_DESCRIPTION =
  "List of where all your assets are on the website (i.e. Docs, links, email addresses, code snippet, etc).";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING = { top: 24, right: 24, bottom: 120, left: 48 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const Y_MAX = 600;
const Y_TICKS = [0, 200, 400, 600];

const X_LABELS = ["Dec 09", "Dec 16", "Dec 23", "Dec 30", "Jan 06", "Jan 13", "Jan 20", "Jan 27", "Feb 03", "Feb 15"];
const CRAWLED_PAGES_DATA = [420, 360, 480, 400, 540, 460, 580, 500, 560, 480];
const IMAGES_DATA = [120, 200, 160, 260, 200, 320, 240, 340, 280, 220];
const CSS_DATA = [45, 60, 50, 80, 70, 95, 85, 110, 90, 105];
const JS_DATA = [30, 45, 40, 65, 55, 75, 60, 85, 70, 80];
const DOCS_DATA = [10, 15, 12, 18, 14, 22, 16, 25, 20, 24];
const EMAILS_DATA = [5, 8, 6, 12, 10, 15, 12, 18, 14, 16];
const HEADLINKS_DATA = [20, 30, 25, 35, 28, 45, 38, 50, 42, 48];

const CRAWLED_COLOR = "#3b82f6";
const CRAWLED_FILL = "rgba(59, 130, 246, 0.12)";
const IMAGES_COLOR = "#22c55e";
const IMAGES_FILL = "rgba(34, 197, 94, 0.1)";

const DOCUMENTS_COLOR = "#8b5cf6"; // purple
const CSS_COLOR = "#f59e0b"; // amber
const JS_COLOR = "#eab308"; // yellow
const EMAILS_COLOR = "#ef4444"; // red
const HEADLINKS_COLOR = "#06b6d4"; // cyan

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
  const [hoveredIndex, setHoveredIndex] = useState(null);

  let history = data?.history || [];

  // If there's only 1 scan in history, the graph would only draw a single dot. 
  // Duplicate it to form a horizontal line so it renders properly.
  if (history.length === 1) {
    const pt = history[0];
    const prevDate = new Date(pt.date || Date.now());
    prevDate.setDate(prevDate.getDate() - 1);
    history = [
      { ...pt, date: prevDate.toISOString() },
      pt
    ];
  }

  // Prepare dynamic chart data
  const hasHistory = history.length > 0;

  const displayLabels = hasHistory
    ? history.map(h => {
      const d = h.date ? new Date(h.date) : new Date();
      return {
        date: d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      };
    })
    : X_LABELS.map(l => ({ date: l, time: "" }));

  const dynamicCrawledData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.htmlPages ? data.htmlPages : (h.htmlPages || 0))) : CRAWLED_PAGES_DATA;
  const dynamicImagesData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.images ? data.images : (h.images || 0))) : IMAGES_DATA;
  const dynamicDocsData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.documents ? data.documents : (h.documents || 0))) : DOCS_DATA;
  const dynamicCssData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.css ? data.css : (h.css || 0))) : CSS_DATA;
  const dynamicJsData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.js ? data.js : (h.js || 0))) : JS_DATA;
  const dynamicEmailsData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.emails ? data.emails : (h.emails || 0))) : EMAILS_DATA;
  const dynamicHeadlinksData = hasHistory ? history.map((h, i) => (i === history.length - 1 && data?.headlinks ? data.headlinks : (h.headlinks || 0))) : HEADLINKS_DATA;

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

  const maxVal = Math.max(
    ...dynamicCrawledData,
    ...dynamicImagesData,
    ...dynamicDocsData,
    ...dynamicCssData,
    ...dynamicJsData,
    ...dynamicEmailsData,
    ...dynamicHeadlinksData,
    10
  );
  let scaleMax = maxVal;
  if (maxVal <= 10) scaleMax = 10;
  else if (maxVal <= 50) scaleMax = 50;
  else if (maxVal <= 100) scaleMax = 100;
  else scaleMax = Math.ceil(maxVal / 100) * 100;

  const dynamicYTicks = [
    0,
    Math.round(scaleMax * 0.25),
    Math.round(scaleMax * 0.5),
    Math.round(scaleMax * 0.75),
    scaleMax
  ];

  const xScale = (i) => n <= 1 ? PADDING.left + PLOT_WIDTH / 2 : PADDING.left + (i / (n - 1)) * PLOT_WIDTH;
  const yScale = (v) => {
    return PADDING.top + PLOT_HEIGHT - ((v || 0) / scaleMax) * PLOT_HEIGHT;
  };
  const baselineY = PADDING.top + PLOT_HEIGHT;

  const crawledPoints = dynamicCrawledData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const imagesPoints = dynamicImagesData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const docsPoints = dynamicDocsData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const cssPoints = dynamicCssData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const jsPoints = dynamicJsData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const emailsPoints = dynamicEmailsData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));
  const headlinksPoints = dynamicHeadlinksData.map((v, i) => ({ x: xScale(i), y: yScale(v) }));

  const crawledPath = smoothPath(crawledPoints);
  const imagesPath = smoothPath(imagesPoints);
  const docsPath = smoothPath(docsPoints);
  const cssPath = smoothPath(cssPoints);
  const jsPath = smoothPath(jsPoints);
  const emailsPath = smoothPath(emailsPoints);
  const headlinksPath = smoothPath(headlinksPoints);

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
                Pages
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: IMAGES_COLOR }} aria-hidden="true" />
                Images
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: CSS_COLOR }} aria-hidden="true" />
                CSS
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: JS_COLOR }} aria-hidden="true" />
                JS
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: DOCUMENTS_COLOR }} aria-hidden="true" />
                Docs
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: EMAILS_COLOR }} aria-hidden="true" />
                Emails
              </span>
              <span className="d-inline-flex align-items-center gap-2 small text-body">
                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: HEADLINKS_COLOR }} aria-hidden="true" />
                Headlinks
              </span>
              <button
                type="button"
                className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
                onClick={() => { }}
              >
                <i className="isax isax-calendar-1 text-primary" style={{ fontSize: "0.9rem" }} aria-hidden="true" />
                {selectedYear}
                <i className="isax isax-arrow-down-1 small" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="bg-transparent position-relative" style={{ maxWidth: CHART_WIDTH, margin: "0 auto" }} onMouseLeave={() => setHoveredIndex(null)}>
            <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: "visible", background: "transparent" }} aria-hidden="true">
              {dynamicYTicks.map((v) => {
                const y = yScale(v);
                return <line key={`line-${v}`} x1={PADDING.left} y1={y} x2={PADDING.left + PLOT_WIDTH} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" strokeDasharray="4 4" />;
              })}
              {dynamicYTicks.map((v) => {
                const y = yScale(v);
                return <text key={`text-${v}`} x={PADDING.left - 6} y={y + 4} textAnchor="end" fill="#6b7280" style={{ fontSize: 10 }}>{v}</text>;
              })}
              {displayLabels.map((label, i) => (
                <text
                  key={`lbl-${i}`}
                  x={xScale(i)}
                  y={baselineY + 12}
                  textAnchor="end"
                  fill="#6b7280"
                  style={{ fontSize: 10 }}
                  transform={`rotate(-90, ${xScale(i)}, ${baselineY + 12})`}
                >
                  {label.date} {label.time}
                </text>
              ))}
              <line x1={PADDING.left} y1={baselineY} x2={PADDING.left + PLOT_WIDTH} y2={baselineY} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              <path d={crawledAreaPath} fill={CRAWLED_FILL} />
              <path d={imagesAreaPath} fill={IMAGES_FILL} />

              <path d={crawledPath} fill="none" stroke={CRAWLED_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={imagesPath} fill="none" stroke={IMAGES_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={docsPath} fill="none" stroke={DOCUMENTS_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={cssPath} fill="none" stroke={CSS_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={jsPath} fill="none" stroke={JS_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={emailsPath} fill="none" stroke={EMAILS_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={headlinksPath} fill="none" stroke={HEADLINKS_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {crawledPoints.map((p, i) => <circle key={`cp-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={CRAWLED_COLOR} strokeWidth={2} />)}
              {imagesPoints.map((p, i) => <circle key={`ip-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={IMAGES_COLOR} strokeWidth={2} />)}
              {docsPoints.map((p, i) => <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={DOCUMENTS_COLOR} strokeWidth={2} />)}
              {cssPoints.map((p, i) => <circle key={`csp-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={CSS_COLOR} strokeWidth={2} />)}
              {jsPoints.map((p, i) => <circle key={`jsp-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={JS_COLOR} strokeWidth={2} />)}
              {emailsPoints.map((p, i) => <circle key={`ep-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={EMAILS_COLOR} strokeWidth={2} />)}
              {headlinksPoints.map((p, i) => <circle key={`hp-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={HEADLINKS_COLOR} strokeWidth={2} />)}

              {/* Invisible hover targets */}
              {displayLabels.map((_, i) => (
                <rect
                  key={`hover-${i}`}
                  x={xScale(i) - 24}
                  y={PADDING.top}
                  width={48}
                  height={PLOT_HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              ))}
            </svg>

            {hoveredIndex != null && (
              <div
                className="position-absolute bg-dark text-white rounded-2 shadow-lg p-3"
                style={{
                  left: Math.min(Math.max(xScale(hoveredIndex) - 90, 0), CHART_WIDTH - 200),
                  top: PADDING.top - 8,
                  minWidth: 180,
                  fontSize: "0.75rem",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div className="mb-2 fw-semibold border-bottom border-secondary pb-1">
                  {displayLabels[hoveredIndex]?.date} {displayLabels[hoveredIndex]?.time}
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: CRAWLED_COLOR }}></span>
                    <span>Pages</span>
                  </div>
                  <span>{dynamicCrawledData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: IMAGES_COLOR }}></span>
                    <span>Images</span>
                  </div>
                  <span>{dynamicImagesData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: CSS_COLOR }}></span>
                    <span>CSS</span>
                  </div>
                  <span>{dynamicCssData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: JS_COLOR }}></span>
                    <span>JS</span>
                  </div>
                  <span>{dynamicJsData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: DOCUMENTS_COLOR }}></span>
                    <span>Docs</span>
                  </div>
                  <span>{dynamicDocsData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: EMAILS_COLOR }}></span>
                    <span>Emails</span>
                  </div>
                  <span>{dynamicEmailsData[hoveredIndex]}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded d-inline-block" style={{ width: 10, height: 10, backgroundColor: HEADLINKS_COLOR }}></span>
                    <span>Headlinks</span>
                  </div>
                  <span>{dynamicHeadlinksData[hoveredIndex]}</span>
                </div>
              </div>
            )}
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
