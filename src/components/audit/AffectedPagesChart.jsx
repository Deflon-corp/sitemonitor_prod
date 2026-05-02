import React, { useEffect, useRef  } from "react";

const CHART_DATA = {
  categories: ["11/2/25", "11/12/25", "11/24/25", "12/5/25", "12/16/25", "12/27/25", "1/7/26", "1/18/26"],
  series: [180, 245, 238, 210, 195, 175, 165, 150],
};

const AffectedPagesChart = ({ chartId = "seo-affected-chart" }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const el = document.querySelector(`#${chartId}`);
    if (!el) return;

    const init = () => {
      const ApexCharts = (window).ApexCharts;
      if (!ApexCharts || !mounted) return;
      if (chartRef.current) return;
      const opts = {
        chart: {
          type: "bar",
          height: 280,
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "60%",
            borderRadius: 4,
          },
        },
        dataLabels: { enabled: false },
        colors: ["#9ca3af"],
        series: [{ name: "Affected pages", data: CHART_DATA.series }],
        xaxis: { categories: CHART_DATA.categories },
        yaxis: {
          min: 0,
          max: 300,
          tickAmount: 4,
        },
        grid: {
          borderColor: "#e5e7eb",
          strokeDashArray: 4,
          padding: { top: 0, right: 8, bottom: 0, left: 8 },
        },
      };
      chartRef.current = new ApexCharts(el, opts);
      chartRef.current.render();
    };

    if ((window).ApexCharts) init();
    else {
      const t = setInterval(() => {
        if ((window).ApexCharts) {
          clearInterval(t);
          init();
        }
      }, 50);
      return () => {
        mounted = false;
        clearInterval(t);
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }
    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartId]);

  return <div id={chartId} style={{ minHeight: "280px" }} />;
};

export default AffectedPagesChart;
