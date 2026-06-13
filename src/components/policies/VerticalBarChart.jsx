import React from "react";

const CHART_HEIGHT = 120;
const BAR_WIDTH = 32;

const VerticalBarChart = ({
  items,
  barColor = "var(--bs-primary)",
  maxVal = 10,
}) => {
  const effectiveMax = maxVal && maxVal > 0 ? maxVal : 1;

  return (
    <div
      className="d-flex align-items-end justify-content-around gap-1"
      style={{ height: CHART_HEIGHT + 44 }}
    >
      {items.map(({ label, value }) => {
        const pct = Math.min(100, (value / effectiveMax) * 100);
        const barHeight = (pct / 100) * CHART_HEIGHT;
        return (
          <div
            key={label}
            className="d-flex flex-column align-items-center flex-grow-1"
          >
            <span className="text-body fw-medium fs-13 mb-1">{value}</span>
            <div
              className="rounded-top d-flex align-items-end justify-content-center"
              style={{
                width: BAR_WIDTH,
                height: CHART_HEIGHT,
                backgroundColor: "var(--bs-body-tertiary)",
              }}
            >
              <div
                className="rounded-top"
                style={{
                  width: Math.max(12, BAR_WIDTH - 8),
                  height: value > 0 ? Math.max(4, barHeight) : 0,
                  backgroundColor: barColor,
                }}
              />
            </div>
            <span className="text-muted fs-12 text-center mt-1 text-truncate w-100">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default VerticalBarChart;
