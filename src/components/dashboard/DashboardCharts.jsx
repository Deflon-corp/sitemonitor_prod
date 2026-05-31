import { useEffect, useRef } from "react";

export default function DashboardCharts({ historyData = [] }) {
  const lineChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const scanHistoryChartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const initCharts = () => {
      const ApexCharts = typeof window !== "undefined" ? (window ).ApexCharts : undefined;
      if (!ApexCharts || !mounted) return;

    // Total Income on Invoice - green line/area chart
    const invoiceEl = document.querySelector("#invoice_income");
    if (invoiceEl && !lineChartRef.current) {
      const sLineArea = {
        chart: {
          height: 120,
          type: "area",
          background: "#ffffff",
          toolbar: { show: false },
          sparkline: { enabled: false },
        },
        colors: ["#27AE60"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
          },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        series: [
          {
            name: "Income",
            data: [30, 35, 45, 40, 55, 45, 56, 53, 68, 63, 70, 80],
          },
        ],
        grid: {
          show: false,
          padding: { left: -10, right: -10, top: -10, bottom: -10 },
        },
        yaxis: {
          min: 0,
          max: 80,
          labels: { show: false },
        },
        xaxis: {
          categories: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"],
          labels: { show: false },
        },
      } ;
      lineChartRef.current = new ApexCharts(invoiceEl, sLineArea);
      lineChartRef.current.render();
    }

    // Top Sales Statistics - semi-circular donut
    const salesEl = document.querySelector("#total_sales");
    if (salesEl && !donutChartRef.current) {
      const donutOptions = {
        series: [35, 40, 25],
        chart: {
          type: "donut",
          height: 280,
        },
        labels: ["Dell XPS 13", "Nike T-shirt", "Apple iPhone 15"],
        colors: ["#F38BBB", "#5297FE", "#7DCEA0"],
        plotOptions: {
          pie: {
            startAngle: -110,
            endAngle: 110,
            donut: {
              size: "60%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Leads",
                  formatter: () => "589",
                },
              },
            },
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
      } ;
      donutChartRef.current = new ApexCharts(salesEl, donutOptions);
      donutChartRef.current.render();
    }

    // Scan History - grouped bar chart with custom tooltip (bar pop)
    const scanHistoryEl = document.querySelector("#scan_history_chart");
    if (scanHistoryEl) {
      // Destroy existing chart if it exists to redraw with new data
      if (scanHistoryChartRef.current) {
        scanHistoryChartRef.current.destroy();
      }

      const history = [...historyData].reverse(); // Show oldest to newest
      const categories = history.map(h => {
          if (!h || !h.lastScanDate) return "Unknown";
          const d = new Date(h.lastScanDate);
          if (isNaN(d.getTime())) return "Unknown";
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + 
                 d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      });

      const fullDates = history.map(h => {
          if (!h || !h.lastScanDate) return "Unknown";
          const d = new Date(h.lastScanDate);
          if (isNaN(d.getTime())) return "Unknown";
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                 d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      });

      const scanTooltipHtml = (index) => {
        const h = history[index];
        if (!h) return '';
        
        const items = [
            { color: "#F38BBB", label: "Policies", value: (h.complianceSummary?.termsFound ? "100%" : "0%") },
            { color: "#5297FE", label: "QA", value: (h.issueBreakdown?.high || 0) + " issues" },
            { color: "#7539FF", label: "Accessibility", value: (h.performanceMetrics?.avgAccessibilityScore || 0) + "%" },
            { color: "#c4956a", label: "SEO", value: (h.finalSeoScore || 0) + "%" },
            { color: "#00D4FF", label: "Pages crawled", value: (h.totalPages || 0) + " pages" },
            { color: "#94a3b8", label: "Documents crawled", value: "0 documents" },
            { color: "#67e8f9", label: "Total crawled", value: (h.totalPages || 0) + " pages" },
        ];

        const itemHtml = items
          .map(
            (item) =>
              `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#f3f4f6">
                <span style="width:10px;height:10px;border-radius:2px;background:${item.color};flex-shrink:0"></span>
                <span style="flex:1">${item.label}: <span style="font-weight:600">${item.value}</span></span>
              </div>`
          )
          .join("");

        return `<div style="background:#2d3748;color:#f3f4f6;padding:12px 16px;border-radius:12px;min-width:240px;box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1)">
          <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:12px;border-bottom:1px solid #4a5568;padding-bottom:8px">${fullDates[index]}</div>
          ${itemHtml}
        </div>`;
      };

      const scanHistoryOptions = {
        chart: {
          height: 280,
          type: "line", // Use line as base for mixed charts
          stacked: false,
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            columnWidth: "50%",
          },
        },
        legend: { show: false },
        dataLabels: { enabled: false },
        colors: ["#5297FE", "#7539FF", "#c4956a", "#00D4FF"],
        series: [
          { name: "QA Issues", type: "column", data: history.map(h => h.issueBreakdown?.high || 0) },
          { name: "Accessibility", type: "column", data: history.map(h => h.performanceMetrics?.avgAccessibilityScore || 0) },
          { name: "SEO", type: "column", data: history.map(h => h.finalSeoScore || 0) },
          { name: "Total Crawled", type: "line", data: history.map(h => h.totalPages || 0) },
        ],
        stroke: {
          width: [0, 0, 0, 3],
          curve: "smooth",
        },
        tooltip: {
          theme: "dark",
          custom: function ({ dataPointIndex }) {
            return scanTooltipHtml(dataPointIndex);
          },
        },
        grid: {
          borderColor: "#E2E4E6",
          strokeDashArray: 4,
          padding: { right: 8, left: 8, bottom: 0 },
        },
        xaxis: {
          categories: categories.length > 0 ? categories : ["No Data"],
          axisBorder: { show: true, color: "#E2E4E6" },
          labels: {
            rotate: -45,
            style: { fontSize: "10px" }
          }
        },
        yaxis: {
          min: 0,
          tickAmount: 3,
          labels: {
            style: { colors: "#6c757d", fontSize: "12px" },
            formatter: (val) => Math.round(val),
          },
        },
        fill: { 
            opacity: [1, 1, 1, 0.3],
            type: ['solid', 'solid', 'solid', 'solid']
        },
        markers: {
            size: [0, 0, 0, 4],
            colors: ["#00D4FF"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: { size: 6 }
        }
      };

      scanHistoryChartRef.current = new ApexCharts(scanHistoryEl, scanHistoryOptions);
      scanHistoryChartRef.current.render();
    }

    };
    // Run when ApexCharts is available (script may load after first paint)
    if ((window ).ApexCharts) {
      initCharts();
    } else {
      const t = setInterval(() => {
        if ((window ).ApexCharts) {
          clearInterval(t);
          initCharts();
        }
      }, 50);
      return () => {
        mounted = false;
        clearInterval(t);
        if (lineChartRef.current) {
          lineChartRef.current.destroy();
          lineChartRef.current = null;
        }
        if (donutChartRef.current) {
          donutChartRef.current.destroy();
          donutChartRef.current = null;
        }
        if (scanHistoryChartRef.current) {
          scanHistoryChartRef.current.destroy();
          scanHistoryChartRef.current = null;
        }
      };
    }
    return () => {
      mounted = false;
      if (lineChartRef.current) {
        lineChartRef.current.destroy();
        lineChartRef.current = null;
      }
      if (donutChartRef.current) {
        donutChartRef.current.destroy();
        donutChartRef.current = null;
      }
      if (scanHistoryChartRef.current) {
        scanHistoryChartRef.current.destroy();
        scanHistoryChartRef.current = null;
      }
    };
  }, [historyData]);

  return null;
}
