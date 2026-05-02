import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import SeoSummaryView from "./SeoSummaryView";
import PagesWithOpportunitiesView from "./PagesWithOpportunitiesView";
import SeoCheckpointsView from "./SeoCheckpointsView";

const SEO_NAV = [
    { key: "summary", label: "Summary", icon: "isax-home-2", href: "/domain/seo?view=summary" },
    { key: "opportunities", label: "Pages with Opportunities", icon: "isax-document-copy", href: "/domain/seo?view=opportunities" },
    { key: "checkpoints", label: "SEO Checkpoints", icon: "isax-tick-circle", href: "/domain/seo?view=checkpoints" },
];

const Seo = () => {
    const [searchParams] = useSearchParams();
    const currentView = searchParams.get("view") || "summary";

    return (
        <div className="seo-page">
            <div className="card mb-4">
                <div className="card-body py-3">
                    <nav className="d-flex flex-wrap gap-1 gap-md-4 align-items-center" aria-label="SEO navigation">
                        {SEO_NAV.map((item) => (
                            <Link
                                key={item.key}
                                to={item.href}
                                className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded ${currentView === item.key ? "bg-light text-primary" : "text-body"}`}
                            >
                                <i className={`isax ${item.icon} me-2`} aria-hidden="true"></i>
                                <span>{item.label}</span>
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
