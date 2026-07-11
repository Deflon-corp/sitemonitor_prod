import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import DarkPatternSummaryView from "./DarkPatternSummaryView";
import DarkPatternIssuesView from "./DarkPatternIssuesView";

const DARK_PATTERN_NAV = [
  {
    key: "summary",
    label: "Audit Summary",
    description: "Overview and audit metrics",
    icon: "isax-chart-215",
    href: "/domain/dark-pattern?view=summary",
  },
  {
    key: "issues",
    label: "Detected Issues",
    description: "Detailed list by URL",
    icon: "isax-danger",
    href: "/domain/dark-pattern?view=issues",
  }
];

const DarkPattern = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";

  return (
    <div className="dark-pattern-page">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 fs-12 py-1 px-2 rounded">
            Coming Soon (Currently showing static data)
          </span>
          <h6 className="mb-0 fs-18 fw-semibold text-body">Dark Patterns</h6>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <nav
            className="d-flex flex-wrap gap-3 align-items-stretch"
            aria-label="Dark Pattern navigation"
          >
            {DARK_PATTERN_NAV.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`d-flex flex-column text-decoration-none py-2 px-3 rounded transition-all ${currentView === item.key ? "bg-primary bg-opacity-10 text-primary shadow-sm border border-primary border-opacity-10" : "text-body hover-bg-light border border-transparent"}`}
                style={{ minWidth: "180px", flex: "1 1 0" }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i
                    className={`isax ${item.icon} fs-18 ${currentView === item.key ? "text-primary" : "text-muted"}`}
                    aria-hidden="true"
                  ></i>
                  <span className="fw-semibold fs-14">{item.label}</span>
                </div>
                <span
                  className={`fs-11 ${currentView === item.key ? "text-primary opacity-75" : "text-muted"}`}
                >
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
        {currentView === "summary" && <DarkPatternSummaryView />}
        {currentView === "issues" && <DarkPatternIssuesView />}
      </div>
    </div>
  );
};

export default DarkPattern;
