import React, { useEffect, useRef } from "react";

const AffectedPagesChart = ({ 
  chartId = "seo-affected-chart", 
  series = [], 
  categories = [], 
  height = 280, 
  colors = ["#9ca3af"],
  showLegend = false,
  type = "area",
  max = undefined,
  tooltipLabel = "Pages"
}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const el = document.querySelector(`#${chartId}`);
    if (!el) return;

    const init = () => {
      const ApexCharts = (window).ApexCharts;
      if (!ApexCharts || !mounted) return;
      
      // Destroy existing chart if it exists to allow re-render with new data
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const opts = {
        chart: {
          type: type,
          height: height,
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
          }
        },
        legend: {
          show: showLegend
        },
        stroke: {
          curve: 'smooth',
          width: type === 'bar' ? 0 : 3
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "60%",
            borderRadius: 4,
            distributed: type === 'bar' && colors.length > 1
          },
        },
        fill: {
          type: type === 'bar' ? 'solid' : (type === 'area' ? 'gradient' : 'solid'),
          opacity: 1,
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [20, 100]
          }
        },
        dataLabels: { 
          enabled: type === 'bar',
          style: {
            fontSize: '10px',
            colors: ['#fff']
          }
        },
        colors: colors,
        series: series,
        xaxis: { 
          categories: categories,
          labels: {
            style: {
              fontSize: '11px',
              colors: '#6b7280'
            }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          min: 0,
          max: max,
          labels: { 
            formatter: (val) => Math.round(val),
            style: {
              fontSize: '11px',
              colors: '#6b7280'
            }
          },
        },
        grid: {
          borderColor: "#e5e7eb",
          strokeDashArray: 4,
          padding: { top: 0, right: 8, bottom: 0, left: 8 },
        },
        tooltip: {
          theme: 'light',
          x: { show: true },
          y: { formatter: (val) => `${val} ${tooltipLabel}` }
        }
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
  }, [chartId, series, categories, height, colors, showLegend, type, max, tooltipLabel]);

  return <div id={chartId} style={{ width: "100%", minHeight: `${height}px` }} />;
};

export default AffectedPagesChart;
