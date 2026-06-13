import React, { useState, useCallback, useEffect } from "react";
import performanceApi from "@/api/performanceApi";
import HeartbeatDateRangePicker from "@/components/heartbeat/HeartbeatDateRangePicker";

const HISTORY_DEFAULT_START = new Date(2026, 0, 1); // 1 Feb 2026
const HISTORY_DEFAULT_END = new Date(2026, 1, 1); // 1 Mar 2026

const METRIC_COLORS = {
  Performance: "#dc2626",
  "First Contentful Paint": "#7c3aed",
  "Largest Contentful Paint": "#db2777",
  "Speed Index": "#38bdf8",
  "Total Blocking Time": "#fb923c",
  "Cumulative Layout Shift": "#22c55e",
};

const METRIC_KEYS = [
  "Performance",
  "First Contentful Paint",
  "Largest Contentful Paint",
  "Speed Index",
  "Total Blocking Time",
  "Cumulative Layout Shift",
];

const CHART_WIDTH = 700;
const CHART_HEIGHT = 300;
const PADDING = { top: 36, right: 48, bottom: 56, left: 48 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const SCORE_MAX = 100;
const MS_MAX = 6;
const MARKER_R = 3;

export default function PerformanceHistoryView({ domainId, pageUrl }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    performanceApi
      .getHistory(domainId, { url: pageUrl })
      .then((res) => {
        let dataToUse = STATIC_HISTORY;
        if (res.success && res.data && res.data.length > 0) {
          dataToUse = res.data;
        }
        const formatted = dataToUse.map((item) => {
          const d = new Date(item.date);
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const timestamp = d.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          });
          return {
            ...item,
            scannedAt: d.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            }),
            label,
            timestamp,
          };
        });
        setHistoryData(formatted);
      })
      .catch((err) => {
        console.error("Failed to fetch performance history", err);
        const formatted = STATIC_HISTORY.map((item) => {
          const d = new Date(item.date);
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const timestamp = d.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          });
          return {
            ...item,
            scannedAt: d.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            }),
            label,
            timestamp,
          };
        });
        setHistoryData(formatted);
      })
      .finally(() => setLoading(false));
  }, [domainId, pageUrl]);

  // Use historyData instead of historyData
  const xLabels = historyData.map((d) => d.label);

  const [startDate, setStartDate] = useState(HISTORY_DEFAULT_START);
  const [endDate, setEndDate] = useState(HISTORY_DEFAULT_END);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleRangeChange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const n = historyData.length;
  const xScale = (i) =>
    n <= 1
      ? PADDING.left + PLOT_WIDTH / 2
      : PADDING.left + (i / Math.max(1, n - 1)) * PLOT_WIDTH;
  const yScoreScale = (v) =>
    PADDING.top + PLOT_HEIGHT - (v / SCORE_MAX) * PLOT_HEIGHT;
  const yMsScale = (v) =>
    PADDING.top + PLOT_HEIGHT - (v / MS_MAX) * PLOT_HEIGHT;

  const hoveredRow = hoveredIndex != null ? historyData[hoveredIndex] : null;

  const series = [
    {
      key: "Performance",
      color: METRIC_COLORS.Performance,
      getVal: (r) => r.performanceScore,
      scale: yScoreScale,
    },
    {
      key: "First Contentful Paint",
      color: METRIC_COLORS["First Contentful Paint"],
      getVal: (r) => r.fcp,
      scale: yMsScale,
    },
    {
      key: "Largest Contentful Paint",
      color: METRIC_COLORS["Largest Contentful Paint"],
      getVal: (r) => r.lcp,
      scale: yMsScale,
    },
    {
      key: "Speed Index",
      color: METRIC_COLORS["Speed Index"],
      getVal: (r) => r.si,
      scale: yMsScale,
    },
    {
      key: "Total Blocking Time",
      color: METRIC_COLORS["Total Blocking Time"],
      getVal: (r) => r.tbt,
      scale: yMsScale,
    },
    {
      key: "Cumulative Layout Shift",
      color: METRIC_COLORS["Cumulative Layout Shift"],
      getVal: (r) => r.cls,
      scale: yMsScale,
    },
  ];

  if (loading)
    return <div className="p-4 text-center text-muted">Loading history...</div>;

  if (historyData.length === 0)
    return (
      <div className="p-4 text-center text-muted">
        No performance history found.
      </div>
    );

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-start gap-2">
        <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
          <i className="isax isax-chart-2 fs-22" aria-hidden={true} />
        </span>
        <div className="flex-grow-1 min-w-0">
          <h6 className="mb-2 fw-semibold text-body">History</h6>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <HeartbeatDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleRangeChange}
              highlightIcon={true}
            />
          </div>
        </div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-4">
          {
            <div
              className="position-relative"
              style={{ maxWidth: CHART_WIDTH, margin: "0 auto" }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {
                <svg
                  width="100%"
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  style={{ overflow: "visible" }}
                  aria-hidden={true}
                >
                  {
                    <text
                      x={14}
                      y={PADDING.top + PLOT_HEIGHT / 2}
                      fill="#6b7280"
                      style={{ fontSize: 10 }}
                      textAnchor="middle"
                      transform={`rotate(-90, 14, ${PADDING.top + PLOT_HEIGHT / 2})`}
                    >
                      Score
                    </text>
                    /* Right Y-axis label "Milliseconds" (rotated vertically) */
                  }
                  {
                    <text
                      x={CHART_WIDTH - 14}
                      y={PADDING.top + PLOT_HEIGHT / 2}
                      fill="#6b7280"
                      style={{ fontSize: 10 }}
                      textAnchor="middle"
                      transform={`rotate(90, ${CHART_WIDTH - 14}, ${PADDING.top + PLOT_HEIGHT / 2})`}
                    >
                      Milliseconds
                    </text>
                    /* Left Y-axis: grid lines and ticks 0, 50, 100 */
                  }
                  {
                    [0, 50, 100].map((v) => {
                      const y = yScoreScale(v);
                      return (
                        <g key={`score-${v}`}>
                          <line
                            x1={PADDING.left}
                            y1={y}
                            x2={PADDING.left + PLOT_WIDTH}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                          />
                          <text
                            x={PADDING.left - 6}
                            y={y + 4}
                            textAnchor="end"
                            fill="#6b7280"
                            style={{ fontSize: 10 }}
                          >
                            {v}
                          </text>
                        </g>
                      );
                    })
                    /* Right Y-axis ticks 0, 1, 2, 4, 6 (no grid from right) */
                  }
                  {
                    [0, 1, 2, 4, 6].map((v) => {
                      const y = yMsScale(v);
                      return (
                        <text
                          key={`ms-${v}`}
                          x={PADDING.left + PLOT_WIDTH + 6}
                          y={y + 4}
                          textAnchor="start"
                          fill="#6b7280"
                          style={{ fontSize: 10 }}
                        >
                          {v}
                        </text>
                      );
                    })
                    /* X-axis labels: Feb 16 ... Feb 22 */
                  }
                  {
                    xLabels.map((label, i) => (
                      <text
                        key={label}
                        x={xScale(i)}
                        y={CHART_HEIGHT - 16}
                        textAnchor="middle"
                        fill="#6b7280"
                        style={{ fontSize: 10 }}
                      >
                        {label}
                      </text>
                    ))
                    /* X-axis line */
                  }
                  {
                    <line
                      x1={PADDING.left}
                      y1={PADDING.top + PLOT_HEIGHT}
                      x2={PADDING.left + PLOT_WIDTH}
                      y2={PADDING.top + PLOT_HEIGHT}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    /* Six series: thin line + circle at each point */
                  }
                  {
                    series.map((s) => {
                      const points = historyData.map((row, i) => ({
                        x: xScale(i),
                        y: s.scale(s.getVal(row)),
                      }));
                      const pathD = points
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ");
                      return (
                        <g key={s.key}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {points.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={MARKER_R}
                              fill={s.color}
                            />
                          ))}
                        </g>
                      );
                    })
                    /* Invisible hover targets */
                  }
                  {historyData.map((_, i) => (
                    <rect
                      key={i}
                      x={xScale(i) - 24}
                      y={PADDING.top}
                      width={48}
                      height={PLOT_HEIGHT}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />
                  ))}
                </svg>

                /* Left Y-axis label "Score" (rotated vertically) */
              }
              {hoveredRow && hoveredIndex != null && (
                <div
                  className="position-absolute bg-dark text-white rounded-2 shadow-lg p-3"
                  style={{
                    left: Math.min(
                      Math.max(xScale(hoveredIndex) - 90, 0),
                      CHART_WIDTH - 200,
                    ),
                    top: PADDING.top - 8,
                    minWidth: 180,
                    fontSize: "0.75rem",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <div className="mb-2">{hoveredRow.timestamp}</div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: METRIC_COLORS.Performance,
                      }}
                    />
                    <span>
                      {"Performance: "}
                      {hoveredRow.performanceScore}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor:
                          METRIC_COLORS["First Contentful Paint"],
                      }}
                    />
                    <span>
                      {"First Contentful Paint: "}
                      {hoveredRow.fcp}
                      ms
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor:
                          METRIC_COLORS["Largest Contentful Paint"],
                      }}
                    />
                    <span>
                      {"Largest Contentful Paint: "}
                      {hoveredRow.lcp}
                      ms
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: METRIC_COLORS["Speed Index"],
                      }}
                    />
                    <span>
                      {"Speed Index: "}
                      {hoveredRow.si}
                      ms
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: METRIC_COLORS["Total Blocking Time"],
                      }}
                    />
                    <span>
                      {"Total Blocking Time: "}
                      {hoveredRow.tbt}
                      ms
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="rounded d-inline-block"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor:
                          METRIC_COLORS["Cumulative Layout Shift"],
                      }}
                    />
                    <span>
                      {"Cumulative Layout Shift: "}
                      {hoveredRow.cls}
                    </span>
                  </div>
                </div>
              )}
            </div>

            /* Legend: filled squares, centered below chart */
          }
          <div
            className="d-flex flex-wrap justify-content-center gap-3 gap-md-4 mt-3 pt-2"
            style={{ fontSize: "0.75rem" }}
          >
            {METRIC_KEYS.map((name) => (
              <span
                key={name}
                className="d-inline-flex align-items-center gap-1 text-body"
              >
                <span
                  className="d-inline-block"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: METRIC_COLORS[name],
                    borderRadius: 2,
                  }}
                  aria-hidden={true}
                />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th
                  className="fw-semibold text-body py-3 ps-4"
                  style={{ fontSize: "0.8rem" }}
                >
                  Scanned at
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  Performance Score
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  First contentful paint (FCP)
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  Largest contentful paint (LCP)
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  Speed Index (SI)
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ fontSize: "0.8rem" }}
                >
                  Total Blocking Time (TBT)
                </th>
                <th
                  className="fw-semibold text-body py-3 pe-4"
                  style={{ fontSize: "0.8rem" }}
                >
                  Cumulative Layout Shift (CLS)
                </th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row) => (
                <tr
                  key={row.scannedAt}
                  className="border-bottom border-secondary border-opacity-10"
                >
                  <td
                    className="ps-4 py-3 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.scannedAt}
                  </td>
                  <td className="py-3">
                    <span
                      className="rounded-circle border border-secondary border-opacity-50 d-inline-flex align-items-center justify-content-center fw-medium"
                      style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                    >
                      {row.performanceScore}
                    </span>
                  </td>
                  <td
                    className="py-3 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.fcp}
                  </td>
                  <td
                    className="py-3 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.lcp}
                  </td>
                  <td
                    className="py-3 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.si}
                  </td>
                  <td
                    className="py-3 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.tbt}
                  </td>
                  <td
                    className="py-3 pe-4 text-body"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {row.cls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
