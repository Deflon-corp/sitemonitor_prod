import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import HeartbeatCheckpointDrawer from "@/components/heartbeat/HeartbeatCheckpointDrawer";
import HeartbeatDateRangePicker from "@/components/heartbeat/HeartbeatDateRangePicker";
import { getDomainsApi, getHeartbeatDataApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const DEFAULT_START = new Date();
DEFAULT_START.setDate(DEFAULT_START.getDate() - 90);
const DEFAULT_END = new Date();

const CHART_WIDTH = 900;
const CHART_HEIGHT = 372;
const PADDING = { top: 24, right: 72, bottom: 104, left: 60 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const Y_LEFT_MAX = 1400;
const Y_RIGHT_MAX = 200;

// Helper to format ISO strings
const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  
  const timeString = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (isToday) return `Today at ${timeString}`;
  if (isYesterday) return `Yesterday at ${timeString}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeString}`;
};

const PLOT_CENTER_Y = PADDING.top + PLOT_HEIGHT / 2;
const AXIS_TEXT_PADDING = 14;
const LEFT_AXIS_LABEL_X = AXIS_TEXT_PADDING + 4;
const LEFT_NUMBERS_X = PADDING.left - AXIS_TEXT_PADDING;
const RIGHT_NUMBERS_X = PADDING.left + PLOT_WIDTH + AXIS_TEXT_PADDING;
const RIGHT_AXIS_LABEL_X = PADDING.left + PLOT_WIDTH + (CHART_WIDTH - PADDING.left - PLOT_WIDTH) - AXIS_TEXT_PADDING - 4;
const INCIDENT_RIGHT_INSET = 14;

function HeartbeatChart({ responseTimeSample, incidentSample, avgResponseMs, dates }) {
  const n = responseTimeSample.length || 1;
  const xScale = (i) => PADDING.left + (i / Math.max(1, n - 1)) * PLOT_WIDTH;
  const incidentPlotWidth = PLOT_WIDTH - INCIDENT_RIGHT_INSET;
  const xScaleIncidents = (i) => PADDING.left + (i / Math.max(1, n - 1)) * incidentPlotWidth;
  const yLeftScale = (v) => PADDING.top + PLOT_HEIGHT - (v / Y_LEFT_MAX) * PLOT_HEIGHT;
  const yRightScale = (v) => PADDING.top + PLOT_HEIGHT - (v / Y_RIGHT_MAX) * PLOT_HEIGHT;

  const linePath = responseTimeSample.map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yLeftScale(v)}`).join(" ");
  const avgLineY = yLeftScale(avgResponseMs);
  const avgLinePath = `M ${PADDING.left} ${avgLineY} L ${PADDING.left + PLOT_WIDTH} ${avgLineY}`;

  // Helper to format dates for x-axis labels
  const formatLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Generate up to 7 evenly spaced labels
  const xLabels = [];
  const numLabels = Math.min(7, dates.length);
  for (let i = 0; i < numLabels; i++) {
    const idx = numLabels <= 1 ? 0 : Math.round((i / (numLabels - 1)) * (dates.length - 1));
    const xPos = PADDING.left + (idx / Math.max(1, dates.length - 1)) * PLOT_WIDTH;
    xLabels.push({ text: formatLabel(dates[idx]), x: xPos, key: `label-${idx}` });
  }

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
            , React.createElement('rect', { x: PADDING.left, y: yLeftScale(600), width: PLOT_WIDTH, height: PLOT_HEIGHT - (PADDING.top + PLOT_HEIGHT - yLeftScale(600)), fill: "url(#hb-zone-green)"} )
            , React.createElement('rect', { x: PADDING.left, y: yLeftScale(800), width: PLOT_WIDTH, height: yLeftScale(600) - yLeftScale(800), fill: "url(#hb-zone-yellow)"} )
            , React.createElement('rect', { x: PADDING.left, y: PADDING.top, width: PLOT_WIDTH, height: yLeftScale(800) - PADDING.top, fill: "url(#hb-zone-red)"} )
            , [0, 200, 400, 600, 800, 1000, 1200, 1400].map((v) => (
              React.createElement('line', { key: v, x1: PADDING.left, y1: yLeftScale(v), x2: PADDING.left + PLOT_WIDTH, y2: yLeftScale(v), stroke: "#e5e7eb", strokeWidth: "0.5", strokeDasharray: "4 2" } )
            ))
            , React.createElement('path', { d: linePath, fill: "none", stroke: "#3b82f6", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"} )
            , React.createElement('path', { d: avgLinePath, fill: "none", stroke: "#ec4899", strokeWidth: "1.5", strokeLinecap: "round", strokeDasharray: "4 3" } )
            , responseTimeSample.map((v, i) => (
              React.createElement('circle', {
                key: `point-${i}`,
                cx: xScale(i),
                cy: yLeftScale(v),
                r: 4,
                fill: "#3b82f6",
                style: { cursor: 'pointer', transition: 'r 0.2s' },
                onMouseEnter: (e) => e.target.setAttribute('r', '6'),
                onMouseLeave: (e) => e.target.setAttribute('r', '4')
              }, React.createElement('title', null, `${formatDateTime(dates[i])}: ${v} ms`))
            ))
            , incidentSample.map((v, i) =>
              v > 0 ? (
                React.createElement('rect', {
                  key: i,
                  x: xScaleIncidents(i) - 2,
                  y: yRightScale(v),
                  width: 4,
                  height: yRightScale(0) - yRightScale(v),
                  fill: "#dc2626",
                  rx: 1,
                  style: { cursor: 'pointer' }}
                  , React.createElement('title', null, `${formatDateTime(dates[i])}: ${v} minutes downtime`)
                )
              ) : null
            )
            , [0, 200, 400, 600, 800, 1000, 1200, 1400].map((v) => (
              React.createElement('text', { key: v, x: LEFT_NUMBERS_X, y: yLeftScale(v) + 4, textAnchor: "middle", fontSize: "10", fill: "#6b7280"}
                , v
              )
            ))
            , [0, 50, 100, 150, 200].map((v) => (
              React.createElement('text', { key: v, x: RIGHT_NUMBERS_X, y: yRightScale(v) + 4, textAnchor: "middle", fontSize: "10", fill: "#6b7280"}
                , v
              )
            ))
            , xLabels.map((labelObj) => {
              const y = CHART_HEIGHT - 42;
              if(!labelObj.text) return null;
              return (
                React.createElement('text', {
                  key: labelObj.key,
                  x: labelObj.x,
                  y: y,
                  textAnchor: "end",
                  fontSize: "10",
                  fill: "#6b7280",
                  transform: `rotate(-45, ${labelObj.x}, ${y})`}

                  , labelObj.text
                )
              );
            })
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
}) {
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
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [heartbeatData, setHeartbeatData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllOutages, setShowAllOutages] = useState(false);

  // Load domains and selected domain on mount
  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await getDomainsApi(1, 100);
        if (res.success && res.data?.domains) {
          setDomains(res.data.domains);
          const savedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
          const preSelected = savedId
            ? res.data.domains.find((d) => d._id === savedId)
            : res.data.domains[0];
          if (preSelected) {
            setSelectedDomain(preSelected);
          }
        }
      } catch (err) {
        console.error("Failed to load domains:", err);
      }
    }
    loadDomains();
  }, []);

  // Fetch heartbeat data when domain or dates change
  useEffect(() => {
    async function fetchHeartbeat() {
      if (!selectedDomain) return;
      setIsLoading(true);
      try {
        const res = await getHeartbeatDataApi(
          selectedDomain._id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        if (res.success) {
          setHeartbeatData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch heartbeat data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHeartbeat();
  }, [selectedDomain, startDate, endDate]);

  const handleDomainChange = (e) => {
    const domain = domains.find((d) => d._id === e.target.value);
    if (domain) {
      setSelectedDomain(domain);
      sessionStorage.setItem(SELECTED_DOMAIN_KEY, domain._id);
    }
  };

  const hasData = heartbeatData?.dates?.length > 0;
  const currentStatus = isLoading ? "LOADING" : !hasData ? "-" : heartbeatData?.incidents > 0 ? "DOWN" : "OK";
  const uptimeStatus = !hasData ? "neutral" : parseFloat(heartbeatData?.uptimePercent || 100) >= 99 ? "success" : "danger";

  const handleDownload = () => {
    if (!heartbeatData || !heartbeatData.dates || heartbeatData.dates.length === 0) {
      alert("No data available to download.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Scan Date,Response Time (ms),Incident (Downtime Mins)\n";

    heartbeatData.dates.forEach((date, i) => {
      const formattedDate = new Date(date).toLocaleString();
      const responseTime = heartbeatData.responseTimeSample[i];
      const incident = heartbeatData.incidentSample[i];
      csvContent += `"${formattedDate}",${responseTime},${incident}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Heartbeat_Report_${selectedDomain?.dm_url || "domain"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          , React.createElement('div', { className: "d-flex align-items-center gap-2 mb-0"  }
            , React.createElement('span', { className: "fs-13 text-body" }, "Inspecting:")
            , selectedDomain ? React.createElement('a', { href: selectedDomain.dm_url, target: "_blank", rel: "noopener noreferrer" , className: "text-primary text-decoration-none d-inline-flex align-items-center gap-1"    }
              , React.createElement(ExternalLinkIcon, { size: 12, className: "flex-shrink-0"} )
              , React.createElement('span', { className: "text-break"}, selectedDomain.dm_url)
            ) : React.createElement('span', { className: "fs-13 text-muted" }, "No domain selected")
          )
        )
        , React.createElement('div', { className: "d-flex flex-wrap align-items-center gap-2"   }
          , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"       , title: "Download", 'aria-label': "Download", onClick: handleDownload }
            , React.createElement('i', { className: "isax isax-document-download text-primary fs-18"   , 'aria-hidden': true} )
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
            , React.createElement(MetricBlock, { label: "Current domain status"  , value: currentStatus, status: currentStatus === "OK" ? "success" : currentStatus === "-" || currentStatus === "LOADING" ? "neutral" : "danger"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Average response time"  , value: isLoading ? "..." : hasData ? heartbeatData?.avgResponseMs : "-", valueSub: hasData && !isLoading ? " ms" : "" , status: hasData && !isLoading ? "success" : "neutral"} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Average uptime" , value: isLoading ? "..." : hasData ? heartbeatData?.uptimePercent : "-", valueSub: hasData && !isLoading ? " %" : "" , status: uptimeStatus} )
            , React.createElement('div', { className: "border-start border-secondary border-opacity-25"  , style: { width: 1 }, 'aria-hidden': true} )
            , React.createElement(MetricBlock, { label: "Incidents", value: isLoading ? "..." : hasData ? heartbeatData?.incidents : "-", status: !hasData || isLoading ? "neutral" : heartbeatData?.incidents > 0 ? "danger" : "success"} )
          )
        )
      )

      /* Chart */
      , isLoading ? (
        React.createElement('div', { className: "text-center py-5" }
          , React.createElement('div', { className: "spinner-border text-primary mb-3", role: "status" }
            , React.createElement('span', { className: "visually-hidden" }, "Loading...")
          )
          , React.createElement('p', { className: "text-muted fs-13" }, "Fetching heartbeat data...")
        )
      ) : heartbeatData?.dates?.length > 0 ? (
        React.createElement(HeartbeatChart, {
          responseTimeSample: heartbeatData.responseTimeSample,
          incidentSample: heartbeatData.incidentSample,
          avgResponseMs: heartbeatData.avgResponseMs,
          dates: heartbeatData.dates
        })
      ) : (
        React.createElement('div', { className: "card border-0 shadow-sm mb-4" }
          , React.createElement('div', { className: "card-body p-5 text-center" }
            , React.createElement('div', { className: "text-muted mb-2" }
              , React.createElement('i', { className: "isax isax-document-filter fs-2", 'aria-hidden': true })
            )
            , React.createElement('h6', { className: "fw-semibold text-body mb-1" }, "No scan data found")
            , React.createElement('p', { className: "text-muted fs-13 mb-0" }, "There are no recorded scans for this domain within the selected date range.")
          )
        )
      )

      /* Outages table */
      , React.createElement('div', { className: "card border-0 shadow-sm"  }
        , React.createElement('div', { className: "card-body"}
          , React.createElement('div', { className: "mb-3" }
            , React.createElement('h6', { className: "fw-semibold text-body mb-1"  }, "Downtime History" )
            , React.createElement('p', { className: "text-muted fs-13 mb-0" }, "A log of incidents where your website was unreachable or returned an error during a scan." )
          )
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
                , !isLoading && heartbeatData?.outagesSample?.length === 0 ? (
                  React.createElement('tr', {}
                    , React.createElement('td', { colSpan: 3, className: "py-4 text-center text-muted fs-13" }, "No outages recorded in this timeframe.")
                  )
                ) : (
                  (showAllOutages ? heartbeatData?.outagesSample : heartbeatData?.outagesSample?.slice(0, 3))?.map((row, i) => (
                    React.createElement('tr', { key: i, className: "border-bottom border-secondary border-opacity-10"  }
                      , React.createElement('td', { className: "py-3 ps-0 fs-13 text-body"   }, formatDateTime(row.start))
                      , React.createElement('td', { className: "py-3 fs-13 text-body"  }, formatDateTime(row.end))
                      , React.createElement('td', { className: "py-3 pe-0 fs-13 text-body"   }, row.duration)
                    )
                  ))
                )
              )
            )
          )
          , heartbeatData?.outagesSample?.length > 3 && React.createElement('button', { type: "button", className: "btn btn-link p-0 fs-13 text-primary text-decoration-none mt-2 d-inline-block", onClick: () => setShowAllOutages(!showAllOutages) }, showAllOutages ? "Show less" : "Show all")
        )
      )

      , React.createElement(HeartbeatCheckpointDrawer, {
        open: checkpointDrawerOpen,
        onClose: () => setCheckpointDrawerOpen(false),
        initialData: checkpointDrawerEditMode ? { url: selectedDomain?.dm_url || "", status: true, pingInterval: "5" } : undefined,
        onSave: (data) => {
          // Optional: persist or refresh list
        }}
      )
    )
  );
}
