import React, { useState  } from "react";
import { Link } from "react-router-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import HeartbeatCheckpointDrawer from "@/components/heartbeat/HeartbeatCheckpointDrawer";
import HeartbeatDateRangePicker from "@/components/heartbeat/HeartbeatDateRangePicker";

const INSPECTING_URL = "https://www.bajajfinserv.in/";

const DEFAULT_START = new Date(2025, 10, 27);
const DEFAULT_END = new Date(2026, 1, 27);

/** Sample response time (ms) over time - one point per slot for ~12 weeks */
const RESPONSE_TIME_SAMPLE = [
  120, 95, 110, 88, 102, 115, 90, 130, 145, 98, 112, 85, 92, 108, 125, 138, 72, 95, 110, 88,
  102, 115, 90, 130, 145, 98, 112, 85, 92, 108, 125, 138, 72, 95, 110, 88, 102, 115, 90, 130,
  650, 720, 680, 620, 580, 520, 480, 450, 420, 380, 350, 320, 290, 260, 230, 200, 180, 160, 140, 120,
  95, 110, 88, 102, 115, 90, 130, 145, 98, 112, 85, 92, 108, 125, 138, 72, 95, 110, 88, 102,
  115, 90, 130, 145, 98, 112, 85, 92, 108, 125, 138, 72, 95, 110, 88, 102, 115, 90, 130, 145,
  98, 112, 85, 92, 108, 125, 138, 72, 95, 110, 88, 102, 115, 90, 130, 145, 98, 112, 85, 92,
];

/** Sample incident/downtime (minutes) per slot - sparse, mostly 0 */
const INCIDENT_SAMPLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  45, 120, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const OUTAGES_SAMPLE = [
  { start: "Yesterday at 9:02 PM", end: "Yesterday at 9:12 PM", duration: "10 minutes" },
  { start: "Last Monday at 9:01 PM", end: "Last Monday at 9:14 PM", duration: "13 minutes" },
  { start: "Last Sunday at 9:04 PM", end: "Last Sunday at 9:10 PM", duration: "6 minutes" },
];

const CHART_WIDTH = 900;
const CHART_HEIGHT = 372;
const PADDING = { top: 24, right: 72, bottom: 104, left: 60 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const Y_LEFT_MAX = 1400;
const Y_RIGHT_MAX = 200;

const AVG_RESPONSE_MS = Math.round(
  RESPONSE_TIME_SAMPLE.reduce((a, b) => a + b, 0) / RESPONSE_TIME_SAMPLE.length
);

const PLOT_CENTER_Y = PADDING.top + PLOT_HEIGHT / 2;
const AXIS_TEXT_PADDING = 14;
/** Left: text "Response time (Milliseconds)" before (left of) the numbers, with padding. */
const LEFT_AXIS_LABEL_X = AXIS_TEXT_PADDING + 4;
const LEFT_NUMBERS_X = PADDING.left - AXIS_TEXT_PADDING;
/** Right: numbers first (closer to plot), then Downtime text shifted right of the numbers with padding. */
const RIGHT_NUMBERS_X = PADDING.left + PLOT_WIDTH + AXIS_TEXT_PADDING;
const RIGHT_AXIS_LABEL_X = PADDING.left + PLOT_WIDTH + (CHART_WIDTH - PADDING.left - PLOT_WIDTH) - AXIS_TEXT_PADDING - 4;
/** Inset so red incident bars stay fully inside the chart (not clipped at right edge). */
const INCIDENT_RIGHT_INSET = 14;

function HeartbeatChart() {
  const n = RESPONSE_TIME_SAMPLE.length;
  const xScale = (i) => PADDING.left + (i / Math.max(1, n - 1)) * PLOT_WIDTH;
  const incidentPlotWidth = PLOT_WIDTH - INCIDENT_RIGHT_INSET;
  const xScaleIncidents = (i) => PADDING.left + (i / Math.max(1, n - 1)) * incidentPlotWidth;
  const yLeftScale = (v) => PADDING.top + PLOT_HEIGHT - (v / Y_LEFT_MAX) * PLOT_HEIGHT;
  const yRightScale = (v) => PADDING.top + PLOT_HEIGHT - (v / Y_RIGHT_MAX) * PLOT_HEIGHT;

  const linePath = RESPONSE_TIME_SAMPLE.map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yLeftScale(v)}`).join(" ");
  const avgLineY = yLeftScale(AVG_RESPONSE_MS);
  const avgLinePath = `M ${PADDING.left} ${avgLineY} L ${PADDING.left + PLOT_WIDTH} ${avgLineY}`;

  return (
    React.createElement('div', { className: "card border-0 shadow-sm mb-4"   }
      , React.createElement('div', { className: "card-body p-4" }
        , React.createElement('div', { className: "position-relative", style: { width: "100%", maxWidth: CHART_WIDTH, margin: "0 auto", overflow: "visible" }}
          , React.createElement('svg', { width: "100%", viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`, style: { overflow: "visible", display: "block" }, 'aria-hidden': true}
            , React.createElement('defs', {}
              , React.createElement('linearGradient', { id: "hb-zone-green", x1: "0", y1: "1", x2: "0", y2: "0"}
                , React.createElement('stop', { offset: "0%", stopColor: "#d1fae8"} )
                , React.createElement('stop', { offset: "100%", stopColor: "#a7f3d0"} )
              )
              , React.createElement('linearGradient', { id: "hb-zone-yellow", x1: "0", y1: "1", x2: "0", y2: "0"}
                , React.createElement('stop', { offset: "0%", stopColor: "#fef3c7"} )
                , React.createElement('stop', { offset: "100%", stopColor: "#fde68a"} )
              )
              , React.createElement('linearGradient', { id: "hb-zone-red", x1: "0", y1: "1", x2: "0", y2: "0"}
                , React.createElement('stop', { offset: "0%", stopColor: "#fecaca"} )
                , React.createElement('stop', { offset: "100%", stopColor: "#fca5a5"} )
              )
            )
            /* Background zones: 0-600 green, 600-800 yellow, 800-1400 red (in plot coords) */
            , React.createElement('rect', { x: PADDING.left, y: yLeftScale(600), width: PLOT_WIDTH, height: PLOT_HEIGHT - (PADDING.top + PLOT_HEIGHT - yLeftScale(600)), fill: "url(#hb-zone-green)"} )
            , React.createElement('rect', { x: PADDING.left, y: yLeftScale(800), width: PLOT_WIDTH, height: yLeftScale(600) - yLeftScale(800), fill: "url(#hb-zone-yellow)"} )
            , React.createElement('rect', { x: PADDING.left, y: PADDING.top, width: PLOT_WIDTH, height: yLeftScale(800) - PADDING.top, fill: "url(#hb-zone-red)"} )
            /* Grid lines */
            , [0, 200, 400, 600, 800, 1000, 1200, 1400].map((v) => (
              React.createElement('line', { key: v, x1: PADDING.left, y1: yLeftScale(v), x2: PADDING.left + PLOT_WIDTH, y2: yLeftScale(v), stroke: "#e5e7eb", strokeWidth: "0.5", strokeDasharray: "4 2" } )
            ))
            /* Response time line */
            , React.createElement('path', { d: linePath, fill: "none", stroke: "#3b82f6", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"} )
            /* Avg. response horizontal line - theme pink #DD2590 (drawn on top, thicker so it’s distinct from purple) */
            , React.createElement('path', { d: avgLinePath, fill: "none", stroke: "#ec4899", strokeWidth: "1.5", strokeLinecap: "round", strokeDasharray: "4 3" } )
            /* Incident bars (right Y scale) - fully inside chart image */
            , INCIDENT_SAMPLE.map((v, i) =>
              v > 0 ? (
                React.createElement('rect', {
                  key: i,
                  x: xScaleIncidents(i) - 2,
                  y: yRightScale(v),
                  width: 4,
                  height: yRightScale(0) - yRightScale(v),
                  fill: "#dc2626",
                  rx: 1}
                )
              ) : null
            )
            /* Y-axis left labels - center-aligned in left margin */
            , [0, 200, 400, 600, 800, 1000, 1200, 1400].map((v) => (
              React.createElement('text', { key: v, x: LEFT_NUMBERS_X, y: yLeftScale(v) + 4, textAnchor: "middle", fontSize: "10", fill: "#6b7280"}
                , v
              )
            ))
            /* Y-axis right labels - center-aligned in right margin */
            , [0, 50, 100, 150, 200].map((v) => (
              React.createElement('text', { key: v, x: RIGHT_NUMBERS_X, y: yRightScale(v) + 4, textAnchor: "middle", fontSize: "10", fill: "#6b7280"}
                , v
              )
            ))
            /* X-axis labels - rotated 45° to prevent overlap */
            , ["Dec 09", "Dec 23", "Jan 06", "Jan 20", "Feb 03", "Feb 17", "Feb 26"].map((label, i) => {
              const x = PADDING.left + (i / 6) * PLOT_WIDTH;
              const y = CHART_HEIGHT - 42;
              return (
                React.createElement('text', {
                  key: label,
                  x: x,
                  y: y,
                  textAnchor: "end",
                  fontSize: "10",
                  fill: "#6b7280",
                  transform: `rotate(-45, ${x}, ${y})`}

                  , label
                )
              );
            })
            /* Axis titles - SVG text so they are exactly vertically centered on the graph */
            , React.createElement('text', {
              x: LEFT_AXIS_LABEL_X,
              y: PLOT_CENTER_Y,
              textAnchor: "middle",
              fontSize: "12",
              fill: "#6b7280",
              transform: `rotate(-90, ${LEFT_AXIS_LABEL_X}, ${PLOT_CENTER_Y})`}
, "Response time (Milliseconds)"

            )
            , React.createElement('text', {
              x: RIGHT_AXIS_LABEL_X,
              y: PLOT_CENTER_Y,
              textAnchor: "middle",
              fontSize: "12",
              fill: "#6b7280",
              transform: `rotate(90, ${RIGHT_AXIS_LABEL_X}, ${PLOT_CENTER_Y})`}
, "Downtime (Minutes)"

            )
          )
        )
        , React.createElement('div', { className: "d-flex flex-wrap align-items-center justify-content-center gap-4 mt-3 pt-2 border-top border-secondary border-opacity-25"         }
          , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
            , React.createElement('span', { className: "d-inline-block rounded" , style: { width: 12, height: 12, backgroundColor: "#dc2626" }, 'aria-hidden': true} )
            , React.createElement('span', { className: "fs-13 text-body" }, "Incidents")
          )
          , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
            , React.createElement('span', { className: "d-inline-block rounded" , style: { width: 12, height: 12, backgroundColor: "#3b82f6" }, 'aria-hidden': true} )
            , React.createElement('span', { className: "fs-13 text-body" }, "Response time" )
          )
          , React.createElement('div', { className: "d-flex align-items-center gap-2"  }
            , React.createElement('span', { className: "d-inline-block align-middle" , style: { width: 24, height: 3, backgroundColor: "#ec4899", borderRadius: 1 }, 'aria-hidden': true} )
            , React.createElement('span', { className: "fs-13 text-body" }, "Avg. response" )
          )
        )
      )
    )
  );
}

function MetricBlock({
  label,
  value,
  status = "neutral",
  valueSub,
}




) {
  const borderClass = status === "success" ? "border-start border-success border-3" : status === "danger" ? "border-start border-danger border-3" : "";
  return (
    React.createElement('div', { className: `flex-grow-1 px-3 py-3 ${borderClass}`, style: { minWidth: 140 }}
      , React.createElement('div', { className: "fs-12 text-muted mb-1"  }, label)
      , React.createElement('div', { className: "d-flex align-items-baseline gap-1"  }
        , React.createElement('span', { className: "fw-semibold text-body" }, value)
        , valueSub != null && React.createElement('span', { className: "fs-12 text-muted" }, valueSub)
      )
    )
  );
}

export default function HeartbeatView() {
  const [checkpointDrawerOpen, setCheckpointDrawerOpen] = useState(false);
  const [checkpointDrawerEditMode, setCheckpointDrawerEditMode] = useState(false);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  const openAddCheck = () => {
    setCheckpointDrawerEditMode(false);
    setCheckpointDrawerOpen(true);
  };

  const openSettings = () => {
    setCheckpointDrawerEditMode(true);
    setCheckpointDrawerOpen(true);
  };

  return (
    React.createElement('div', { className: "heartbeat-view"}
      /* Header */
      , React.createElement('div', { className: "d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4"     }
        , React.createElement('div', {}
          , React.createElement('h5', { className: "mb-1 fw-semibold text-body d-flex align-items-center gap-2"     }
            , React.createElement('i', { className: "isax isax-heart5 text-primary fs-22"   , 'aria-hidden': true} ), "Heartbeat"

          )
          , React.createElement('p', { className: "text-muted fs-13 mb-2"  }, "Checks whether your website is responding and measures the response time of the server."

          )
          , React.createElement('p', { className: "fs-13 text-body mb-0"  }, "Inspecting:"
            , " "
            , React.createElement('a', { href: INSPECTING_URL, target: "_blank", rel: "noopener noreferrer" , className: "text-primary text-decoration-none d-inline-flex align-items-center gap-1"    }
              , React.createElement(ExternalLinkIcon, { size: 12, className: "flex-shrink-0"} )
              , React.createElement('span', { className: "text-break"}, INSPECTING_URL)
            )
          )
        )
        , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2"   }
          , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"       , title: "Download", 'aria-label': "Download"}
            , React.createElement('i', { className: "isax isax-document-download text-primary fs-18"   , 'aria-hidden': true} )
          )
          , React.createElement('button', { type: "button", className: "btn btn-primary btn-sm rounded-2 d-inline-flex align-items-center gap-2"      , onClick: openAddCheck}
            , React.createElement('i', { className: "isax isax-add fs-18"  , 'aria-hidden': true} ), "Add new check"

          )
          , React.createElement('button', { type: "button", className: "btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"         }, "Exemption "
             , React.createElement('span', { className: "badge bg-secondary rounded-pill"  }, "0")
          )
          , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"       , title: "Settings", 'aria-label': "Settings", onClick: openSettings}
            , React.createElement('i', { className: "isax isax-setting-2 text-primary fs-18"   , 'aria-hidden': true} )
          )
          , React.createElement(HeartbeatDateRangePicker, { startDate: startDate, endDate: endDate, onRangeChange: (s, e) => { setStartDate(s); setEndDate(e); }} )
        )
      )

      /* Metrics */
      , React.createElement('div', { className: "card border-0 shadow-sm mb-4"   }
        , React.createElement('div', { className: "card-body p-0" }
          , React.createElement('div', { className: "d-flex flex-wrap border-bottom border-secondary border-opacity-25"    }
            , React.createElement(MetricBlock, { label: "Monitoring", value: "ACTIVE", status: "success"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Current domain status"  , value: "OK"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Average response time"  , value: "74", valueSub: " ms" , status: "success"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Average uptime" , value: "99.37", valueSub: " %" , status: "success"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Incidents", value: "63", status: "danger"} )
          )
        )
      )

      /* Chart */
      , React.createElement(HeartbeatChart, {} )

      /* Outages table */
      , React.createElement('div', { className: "card border-0 shadow-sm"  }
        , React.createElement('div', { className: "card-body"}
          , React.createElement('h6', { className: "fw-semibold text-body mb-3"  }, "Outages during the selected time-frame"    )
          , React.createElement('div', { className: "table-responsive"}
            , React.createElement('table', { className: "table table-borderless align-middle mb-0"   }
              , React.createElement('thead', {}
                , React.createElement('tr', { className: "border-bottom border-secondary border-opacity-25"  }
                  , React.createElement('th', { className: "py-2 ps-0 text-body fs-13 fw-semibold"    }, "Start time" )
                  , React.createElement('th', { className: "py-2 text-body fs-13 fw-semibold"   }, "End time" )
                  , React.createElement('th', { className: "py-2 pe-0 text-body fs-13 fw-semibold"    }, "Duration")
                )
              )
              , React.createElement('tbody', {}
                , OUTAGES_SAMPLE.map((row, i) => (
                  React.createElement('tr', { key: i, className: "border-bottom border-secondary border-opacity-10"  }
                    , React.createElement('td', { className: "py-3 ps-0 fs-13 text-body"   }, row.start)
                    , React.createElement('td', { className: "py-3 fs-13 text-body"  }, row.end)
                    , React.createElement('td', { className: "py-3 pe-0 fs-13 text-body"   }, row.duration)
                  )
                ))
              )
            )
          )
          , React.createElement(Link, { to: "#", className: "fs-13 text-primary text-decoration-none mt-2 d-inline-block"    }, "Show all"

          )
        )
      )

      , React.createElement(HeartbeatCheckpointDrawer, {
        open: checkpointDrawerOpen,
        onClose: () => setCheckpointDrawerOpen(false),
        initialData: checkpointDrawerEditMode ? { url: INSPECTING_URL, status: true, pingInterval: "5" } : undefined,
        onSave: (data) => {
          // Optional: persist or refresh list
        }}
      )
    )
  );
}
