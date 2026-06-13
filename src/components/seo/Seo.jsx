import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import SeoSummaryView from "./SeoSummaryView";
import PagesWithOpportunitiesView from "./PagesWithOpportunitiesView";
import SeoCheckpointsView from "./SeoCheckpointsView";

const SEO_NAV = [
  {
    key: "summary",
    label: "SEO Overview",
    description: "Performance summary and top issues",
    icon: "isax-chart-215",
    href: "/domain/seo?view=summary",
  },
  {
    key: "opportunities",
    label: "Pages to Optimize",
    description: "Pages requiring SEO improvements",
    icon: "isax-document-copy",
    href: "/domain/seo?view=opportunities",
  },
  {
    key: "checkpoints",
    label: "Audit Checklist",
    description: "Detailed breakdown of all SEO rules",
    icon: "isax-tick-circle",
    href: "/domain/seo?view=checkpoints",
  },
];

const Seo = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";

  return (
    <div className="seo-page">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <nav
            className="d-flex flex-wrap gap-3 align-items-stretch"
            aria-label="SEO navigation"
          >
            {SEO_NAV.map((item) => (
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
        {currentView === "summary" && <SeoSummaryView />}
        {currentView === "opportunities" && <PagesWithOpportunitiesView />}
        {currentView === "checkpoints" && <SeoCheckpointsView />}
      </div>
    </div>
  );
};

export default Seo;
