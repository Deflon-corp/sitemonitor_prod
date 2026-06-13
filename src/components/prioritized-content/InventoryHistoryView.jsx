import React, { useState, useEffect } from "react";
import inventoryApi from "@/api/inventoryApi";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 200;
const PADDING = { top: 24, right: 24, bottom: 36, left: 48 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

const X_LABELS = [
  "Dec 09",
  "Dec 16",
  "Dec 23",
  "Dec 30",
  "Jan 06",
  "Jan 13",
  "Jan 20",
  "Jan 27",
  "Feb 03",
  "Feb 15",
];

const CRAWLED_COLOR = "#3b82f6";
const IMAGES_COLOR = "#22c55e";
const DOCUMENTS_COLOR = "#8b5cf6";
const CSS_COLOR = "#f59e0b";
const JS_COLOR = "#eab308";
const EMAILS_COLOR = "#ef4444";
const HEADLINKS_COLOR = "#06b6d4";

const CATEGORY_CONFIG = {
  "html-pages": {
    key: "htmlPages",
    color: CRAWLED_COLOR,
    fill: "rgba(59, 130, 246, 0.12)",
    label: "HTML Pages",
  },
  images: {
    key: "images",
    color: IMAGES_COLOR,
    fill: "rgba(34, 197, 94, 0.1)",
    label: "Images",
  },
  css: {
    key: "css",
    color: CSS_COLOR,
    fill: "rgba(245, 158, 11, 0.1)",
    label: "CSS",
  },
  js: {
    key: "js",
    color: JS_COLOR,
    fill: "rgba(234, 179, 8, 0.1)",
    label: "JavaScript",
  },
  documents: {
    key: "documents",
    color: DOCUMENTS_COLOR,
    fill: "rgba(139, 92, 246, 0.1)",
    label: "Documents",
  },
  emails: {
    key: "emails",
    color: EMAILS_COLOR,
    fill: "rgba(239, 68, 68, 0.1)",
    label: "Emails",
  },
  headlinks: {
    key: "headlinks",
    color: HEADLINKS_COLOR,
    fill: "rgba(6, 182, 212, 0.1)",
    label: "Headlinks",
  },
  links: {
    key: "links",
    color: CRAWLED_COLOR,
    fill: "rgba(59, 130, 246, 0.1)",
    label: "Links",
  },
  forms: {
    key: "forms",
    color: IMAGES_COLOR,
    fill: "rgba(34, 197, 94, 0.1)",
    label: "Forms",
  },
  iframes: {
    key: "iframes",
    color: CSS_COLOR,
    fill: "rgba(245, 158, 11, 0.1)",
    label: "IFrames",
  },
  frames: {
    key: "frames",
    color: JS_COLOR,
    fill: "rgba(234, 179, 8, 0.1)",
    label: "Frames",
  },
};

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

export default function InventoryHistoryView({ domainId, category }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domainId) return;
    setLoading(true);
    inventoryApi
      .getInventoryHistory(domainId)
      .then((res) => {
        if (res && res.success && res.history) {
          let hist = res.history;
          if (hist.length === 1) {
            const pt = hist[0];
            const prevDate = new Date(pt.date || Date.now());
            prevDate.setDate(prevDate.getDate() - 1);
            hist = [{ ...pt, date: prevDate.toISOString() }, pt];
          }
          setHistory(hist);
        }
      })
      .catch((err) => console.error("Failed to fetch inventory history", err))
      .finally(() => setLoading(false));
  }, [domainId, category]);

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["html-pages"];

  const hasHistory = history.length > 0;

  const displayLabels = hasHistory
    ? history.map((h) => {
        const d = h.date ? new Date(h.date) : new Date();
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        });
      })
    : X_LABELS;

  const dynamicCrawledData = hasHistory
    ? history.map((h) => h.htmlPages || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicImagesData = hasHistory
    ? history.map((h) => h.images || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicDocsData = hasHistory
    ? history.map((h) => h.documents || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicCssData = hasHistory
    ? history.map((h) => h.css || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicJsData = hasHistory
    ? history.map((h) => h.js || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicEmailsData = hasHistory
    ? history.map((h) => h.emails || 0)
    : Array(X_LABELS.length).fill(0);
  const dynamicHeadlinksData = hasHistory
    ? history.map((h) => h.headlinks || 0)
    : Array(X_LABELS.length).fill(0);

  const n = displayLabels.length;

  const maxVal = Math.max(
    ...dynamicCrawledData,
    ...dynamicImagesData,
    ...dynamicDocsData,
    ...dynamicCssData,
    ...dynamicJsData,
    ...dynamicEmailsData,
    ...dynamicHeadlinksData,
    10,
  );
  let scaleMax = maxVal;
  if (maxVal <= 10) scaleMax = 10;
  else if (maxVal <= 50) scaleMax = 50;
  else if (maxVal <= 100) scaleMax = 100;
  else scaleMax = Math.ceil(maxVal / 100) * 100;

  const dynamicYTicks = [0, Math.round(scaleMax * 0.5), scaleMax];

  const xScale = (i) =>
    n <= 1
      ? PADDING.left + PLOT_WIDTH / 2
      : PADDING.left + (i / (n - 1)) * PLOT_WIDTH;
  const yScale = (v) => {
    return PADDING.top + PLOT_HEIGHT - ((v || 0) / scaleMax) * PLOT_HEIGHT;
  };
  const baselineY = PADDING.top + PLOT_HEIGHT;

  const crawledPoints = dynamicCrawledData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const imagesPoints = dynamicImagesData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const docsPoints = dynamicDocsData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const cssPoints = dynamicCssData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const jsPoints = dynamicJsData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const emailsPoints = dynamicEmailsData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));
  const headlinksPoints = dynamicHeadlinksData.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
  }));

  const crawledPath = smoothPath(crawledPoints);
  const imagesPath = smoothPath(imagesPoints);
  const docsPath = smoothPath(docsPoints);
  const cssPath = smoothPath(cssPoints);
  const jsPath = smoothPath(jsPoints);
  const emailsPath = smoothPath(emailsPoints);
  const headlinksPath = smoothPath(headlinksPoints);

  const crawledAreaPath = `${crawledPath} L ${xScale(n - 1)} ${baselineY} L ${xScale(0)} ${baselineY} Z`;

  if (loading) return null;

  return (
    <div className="card border-0 shadow-sm mb-4 bg-white rounded-4 overflow-hidden">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <h6 className="fw-semibold text-body mb-0">{config.label} History</h6>
          <div className="d-flex flex-wrap align-items-center gap-4">
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 8, height: 8, backgroundColor: CRAWLED_COLOR }}
                aria-hidden="true"
              />
              Pages
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 8, height: 8, backgroundColor: IMAGES_COLOR }}
                aria-hidden="true"
              />
              Images
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 8, height: 8, backgroundColor: CSS_COLOR }}
                aria-hidden="true"
              />
              CSS
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 8, height: 8, backgroundColor: JS_COLOR }}
                aria-hidden="true"
              />
              JS
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: DOCUMENTS_COLOR,
                }}
                aria-hidden="true"
              />
              Docs
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 8, height: 8, backgroundColor: EMAILS_COLOR }}
                aria-hidden="true"
              />
              Emails
            </span>
            <span className="d-inline-flex align-items-center gap-2 small text-body">
              <span
                className="d-inline-block rounded-circle"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: HEADLINKS_COLOR,
                }}
                aria-hidden="true"
              />
              Headlinks
            </span>
          </div>
        </div>

        <div
          className="position-relative"
          style={{ maxWidth: CHART_WIDTH, margin: "0 auto" }}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {dynamicYTicks.map((v) => {
              const y = yScale(v);
              return (
                <line
                  key={`line-${v}`}
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + PLOT_WIDTH}
                  y2={y}
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
              );
            })}
            {dynamicYTicks.map((v) => {
              const y = yScale(v);
              return (
                <text
                  key={`text-${v}`}
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  style={{ fontSize: 10 }}
                >
                  {v}
                </text>
              );
            })}
            {displayLabels.map((label, i) => (
              <text
                key={`${label}-${i}`}
                x={xScale(i)}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fill="#6b7280"
                style={{ fontSize: 10 }}
              >
                {label}
              </text>
            ))}

            <line
              x1={PADDING.left}
              y1={baselineY}
              x2={PADDING.left + PLOT_WIDTH}
              y2={baselineY}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />

            <path
              d={crawledAreaPath}
              fill={CATEGORY_CONFIG["html-pages"].fill}
            />

            <path
              d={crawledPath}
              fill="none"
              stroke={CRAWLED_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={imagesPath}
              fill="none"
              stroke={IMAGES_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={docsPath}
              fill="none"
              stroke={DOCUMENTS_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={cssPath}
              fill="none"
              stroke={CSS_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={jsPath}
              fill="none"
              stroke={JS_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={emailsPath}
              fill="none"
              stroke={EMAILS_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={headlinksPath}
              fill="none"
              stroke={HEADLINKS_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {crawledPoints.map((p, i) => (
              <circle
                key={`cp-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={CRAWLED_COLOR}
                strokeWidth={2}
              />
            ))}
            {imagesPoints.map((p, i) => (
              <circle
                key={`ip-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={IMAGES_COLOR}
                strokeWidth={2}
              />
            ))}
            {docsPoints.map((p, i) => (
              <circle
                key={`dp-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={DOCUMENTS_COLOR}
                strokeWidth={2}
              />
            ))}
            {cssPoints.map((p, i) => (
              <circle
                key={`csp-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={CSS_COLOR}
                strokeWidth={2}
              />
            ))}
            {jsPoints.map((p, i) => (
              <circle
                key={`jsp-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={JS_COLOR}
                strokeWidth={2}
              />
            ))}
            {emailsPoints.map((p, i) => (
              <circle
                key={`ep-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={EMAILS_COLOR}
                strokeWidth={2}
              />
            ))}
            {headlinksPoints.map((p, i) => (
              <circle
                key={`hp-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff"
                stroke={HEADLINKS_COLOR}
                strokeWidth={2}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
