const fs = require('fs');

const viewPath = 'd:/sitemonitor/Frontend/src/components/prioritized-content/PerformanceHistoryView.jsx';
let content = fs.readFileSync(viewPath, 'utf8');

// Replace imports to add useEffect
content = content.replace(
  'import React, { useState, useCallback } from "react";',
  'import React, { useState, useCallback, useEffect } from "react";\nimport performanceApi from "@/api/performanceApi";'
);

// Remove static constants X_LABELS and HISTORY_DATA
content = content.replace(/const X_LABELS = \[.*\];\s*const HISTORY_DATA = \[\s*(?:\{.*\},\s*)*\];/g, '');

// Change component definition
content = content.replace(
  'export default function PerformanceHistoryView() {',
  `export default function PerformanceHistoryView({ domainId, pageUrl }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    performanceApi.getHistory(domainId, { url: pageUrl })
      .then(res => {
        if (res.success && res.data) {
          const formatted = res.data.map(item => {
            const d = new Date(item.date);
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timestamp = d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
            return {
              ...item,
              scannedAt: d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }),
              label,
              timestamp
            };
          });
          setHistoryData(formatted);
        }
      })
      .catch(err => console.error("Failed to fetch performance history", err))
      .finally(() => setLoading(false));
  }, [domainId, pageUrl]);
  
  // Use historyData instead of HISTORY_DATA
  const xLabels = historyData.map(d => d.label);
`
);

// Replace HISTORY_DATA with historyData and X_LABELS with xLabels
content = content.replace(/HISTORY_DATA/g, 'historyData');
content = content.replace(/X_LABELS/g, 'xLabels');

// Handle loading state
content = content.replace(
  'return (',
  `if (loading) return React.createElement('div', { className: "p-4 text-center text-muted" }, "Loading history...");
  
  if (historyData.length === 0) return React.createElement('div', { className: "p-4 text-center text-muted" }, "No performance history found.");

  return (`
);

fs.writeFileSync(viewPath, content);
console.log("PerformanceHistoryView updated.");
