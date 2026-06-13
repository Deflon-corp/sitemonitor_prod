import React, { useState, useEffect } from "react";

function formatDisplayRange(start, end) {
  const opts = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-GB", opts)} to ${end.toLocaleDateString("en-GB", opts)}`;
}

function formatInputRange(start, end) {
  const m = (d) => String(d.getMonth() + 1).padStart(2, "0");
  const d = (d) => String(d.getDate()).padStart(2, "0");
  const y = (d) => d.getFullYear();
  return `${m(start)}/${d(start)}/${y(start)} - ${m(end)}/${d(end)}/${y(end)}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(day, start, end) {
  const t = day.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const daysInMonth = last.getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
  const grid = [];
  let row = [];
  for (let i = 0; i < startDow; i++) {
    row.push(new Date(prevYear, prevMonth, prevLast - startDow + 1 + i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(new Date(year, month, d));
    if (row.length === 7) {
      grid.push(row);
      row = [];
    }
  }
  if (row.length) {
    let next = 1;
    while (row.length < 7) row.push(new Date(year, month + 1, next++));
    grid.push(row);
  }
  return grid;
}

const PRESETS = [
  {
    label: "Last Week",
    getRange: () => {
      const t = new Date();
      const e = startOfDay(t);
      const s = new Date(e);
      s.setDate(s.getDate() - 6);
      return { start: s, end: e };
    },
  },
  {
    label: "Last Month",
    getRange: () => {
      const t = new Date();
      const e = startOfDay(t);
      const s = new Date(e);
      s.setDate(s.getDate() - 30);
      return { start: s, end: e };
    },
  },
  {
    label: "Last Quarter",
    getRange: () => {
      const t = new Date();
      const e = startOfDay(t);
      const s = new Date(e);
      s.setDate(s.getDate() - 90);
      return { start: s, end: e };
    },
  },
  {
    label: "Last Half Year",
    getRange: () => {
      const t = new Date();
      const e = startOfDay(t);
      const s = new Date(e);
      s.setDate(s.getDate() - 182);
      return { start: s, end: e };
    },
  },
  {
    label: "Last Year",
    getRange: () => {
      const t = new Date();
      const e = startOfDay(t);
      const s = new Date(e);
      s.setFullYear(s.getFullYear() - 1);
      return { start: s, end: e };
    },
  },
];

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function HeartbeatDateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  highlightIcon,
}) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [leftMonth, setLeftMonth] = useState(() => ({
    year: startDate.getFullYear(),
    month: startDate.getMonth(),
  }));

  useEffect(() => {
    if (open) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setLeftMonth({
        year: startDate.getFullYear(),
        month: startDate.getMonth(),
      });
    }
  }, [open, startDate, endDate]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const handlePreset = (start, end) => {
    setTempStart(start);
    setTempEnd(end);
  };

  const handleDayClick = (day) => {
    const d = startOfDay(day);
    if (!tempStart || isSameDay(tempStart, tempEnd)) {
      setTempStart(d);
      setTempEnd(d);
      return;
    }
    if (d.getTime() < tempStart.getTime()) {
      setTempStart(d);
      setTempEnd(tempStart);
    } else {
      setTempEnd(d);
    }
  };

  const handleApply = () => {
    onRangeChange(tempStart, tempEnd);
    setOpen(false);
  };

  const prevMonths = () => {
    if (leftMonth.month === 0)
      setLeftMonth({ year: leftMonth.year - 1, month: 11 });
    else setLeftMonth({ year: leftMonth.year, month: leftMonth.month - 1 });
  };

  const nextMonths = () => {
    if (leftMonth.month === 11)
      setLeftMonth({ year: leftMonth.year + 1, month: 0 });
    else setLeftMonth({ year: leftMonth.year, month: leftMonth.month + 1 });
  };

  const rightMonth =
    leftMonth.month === 11
      ? { year: leftMonth.year + 1, month: 0 }
      : { year: leftMonth.year, month: leftMonth.month + 1 };

  const monthLabel = (y, m) => {
    const d = new Date(y, m, 1);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  const renderCalendar = (year, month) => {
    const grid = getMonthGrid(year, month);
    return (
      <div className="heartbeat-drp-calendar">
        <div className="d-flex flex-wrap mb-1">
          {DOW.map((d) => (
            <div
              key={d}
              className="text-muted text-center fs-12 fw-medium"
              style={{ width: "14.28%" }}
            >
              {d}
            </div>
          ))}
        </div>
        {grid.map((row, ri) => (
          <div key={ri} className="d-flex flex-wrap">
            {row.map((day, di) => {
              if (!day) return <div key={di} style={{ width: "14.28%" }} />;
              const isStart = tempStart && isSameDay(day, tempStart);
              const isEnd = tempEnd && isSameDay(day, tempEnd);
              const inRange =
                tempStart && tempEnd && isInRange(day, tempStart, tempEnd);
              const isOtherMonth = day.getMonth() !== month;
              return (
                <button
                  key={di}
                  type="button"
                  className="border-0 rounded bg-transparent text-body fs-13 text-center p-1 heartbeat-drp-day"
                  style={{ width: "14.28%" }}
                  onClick={() => handleDayClick(day)}
                >
                  <span
                    className={`d-inline-block rounded ${isStart ? "bg-primary text-white" : inRange ? "bg-primary bg-opacity-25" : ""}`}
                    style={{
                      opacity: isOtherMonth ? 0.5 : 1,
                      minWidth: 28,
                      lineHeight: "28px",
                    }}
                  >
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="position-relative d-inline-block">
      <button
        type="button"
        className="btn btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center w-100 text-start"
        style={{ minWidth: 280 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Select date range"
      >
        <span
          className={`d-flex align-items-center ps-2 flex-shrink-0 ${highlightIcon || open ? "text-primary" : "text-muted"}`}
          aria-hidden={true}
        >
          <i
            className="isax isax-calendar-1"
            style={{ fontSize: "1rem" }}
            aria-hidden={true}
          />
        </span>
        <span className="form-control form-control-sm border-0 shadow-none bg-transparent py-2 fs-13 text-body flex-grow-1">
          {formatDisplayRange(startDate, endDate)}
        </span>
      </button>
      {open && (
        <React.Fragment>
          <div
            className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
            style={{ zIndex: 1040 }}
            aria-hidden={true}
            onClick={() => setOpen(false)}
          />
          <div
            className="position-fixed bg-white border border-secondary border-opacity-25 rounded-3 shadow-lg p-0 overflow-hidden"
            style={{
              zIndex: 1050,
              minWidth: 560,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Date range picker"
            onClick={(e) => e.stopPropagation()}
          >
            {
              <div className="d-flex">
                {
                  <div
                    className="border-end border-secondary border-opacity-25 py-3 px-3"
                    style={{ minWidth: 120 }}
                  >
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className="btn btn-link p-0 d-block text-start w-100 fs-13 text-body text-decoration-none py-1"
                        onClick={() =>
                          handlePreset(p.getRange().start, p.getRange().end)
                        }
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  /* Calendars + nav */
                }
                <div className="flex-grow-1 p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-light rounded-2"
                      onClick={prevMonths}
                      aria-label="Previous months"
                    >
                      <i
                        className="isax isax-arrow-left-1"
                        aria-hidden={true}
                      />
                    </button>
                    <span className="fw-semibold text-body fs-13">
                      {monthLabel(leftMonth.year, leftMonth.month)}
                    </span>
                    <span className="fw-semibold text-body fs-13">
                      {monthLabel(rightMonth.year, rightMonth.month)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-light rounded-2"
                      onClick={nextMonths}
                      aria-label="Next months"
                    >
                      <i
                        className="isax isax-arrow-right-1"
                        aria-hidden={true}
                      />
                    </button>
                  </div>
                  <div className="d-flex gap-4">
                    <div className="flex-grow-1">
                      {renderCalendar(leftMonth.year, leftMonth.month)}
                    </div>
                    <div className="flex-grow-1">
                      {renderCalendar(rightMonth.year, rightMonth.month)}
                    </div>
                  </div>
                </div>
              </div>
              /* Bottom bar */
              /* Left presets */
              /* Left presets */
              /* Left presets */
            }
            <div className="d-flex align-items-center justify-content-between border-top border-secondary border-opacity-25 px-4 py-3 bg-body-tertiary bg-opacity-25">
              <span className="fs-13 text-body">
                {formatInputRange(tempStart, tempEnd)}
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-light text-primary rounded-2"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-2"
                  onClick={handleApply}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
