import { useEffect, useRef } from "react";

export default function DashboardCharts() {
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
    if (scanHistoryEl && !scanHistoryChartRef.current) {
      const scanTooltipItems = [
        { color: "#F38BBB", label: "Policies", value: "0 pages" },
        { color: "#5297FE", label: "QA", value: "500 pages" },
        { color: "#7539FF", label: "Accessibility", value: "500 pages" },
        { color: "#c4956a", label: "SEO", value: "500 pages" },
        { color: "#00D4FF", label: "Pages crawled", value: "500 pages" },
        { color: "#94a3b8", label: "Documents crawled", value: "0 documents" },
        { color: "#67e8f9", label: "Total crawled", value: "500 pages" },
      ];
      const scanTooltipHtml = (category) => {
        const items = scanTooltipItems
          .map(
            (item) =>
              `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#f3f4f6">
                <span style="width:8px;height:8px;border-radius:2px;background:${item.color};flex-shrink:0"></span>
                <span>${item.label}: ${item.value}</span>
              </div>`
          )
          .join("");
        return `<div style="background:#374151;color:#f3f4f6;padding:10px 12px;border-radius:8px;min-width:200px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
          <div style="font-weight:600;color:#d1d5db;font-size:12px;margin-bottom:8px">${category}</div>
          ${items}
        </div>`;
      };

      const scanHistoryOptions = {
        chart: {
          height: 280,
          type: "bar",
          stacked: false,
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            columnWidth: "60%",
            endingShape: "rounded",
          },
        },
        legend: { show: false },
        dataLabels: { enabled: false },
        colors: ["#5297FE", "#7539FF", "#E8A838"],
        series: [
          { name: "Pages", data: [500, 500] },
          { name: "Docs", data: [500, 500] },
          { name: "Other", data: [500, 500] },
          {
            name: "Target",
            type: "line",
            data: [500, 500],
          },
        ],
        stroke: {
          width: [0, 0, 0, 2],
          colors: ["#00D4FF"],
        },
        tooltip: {
          theme: "dark",
          custom: function (opts) {
            const category = opts.w.globals.labels[opts.dataPointIndex] || "Dec 09";
            return scanTooltipHtml(category);
          },
        },
        grid: {
          borderColor: "#E2E4E6",
          strokeDashArray: 4,
          padding: { right: 8, left: 8, bottom: 0 },
        },
        xaxis: {
          categories: ["Dec 09", "Dec 09"],
          axisBorder: { show: true, color: "#E2E4E6" },
        },
        yaxis: {
          min: 0,
          max: 600,
          tickAmount: 3,
          labels: {
            style: { colors: "#6c757d", fontSize: "12px" },
            formatter: (val) => String(val),
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        fill: { opacity: 1 },
      } ;
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
  }, []);

  return null;
}
