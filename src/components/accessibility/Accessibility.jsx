import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import AccessibilitySummaryView from "./AccessibilitySummaryView";
import AccessibilityFastTrackView from "./AccessibilityFastTrackView";
import PagesWithFailingChecksView from "./PagesWithFailingChecksView";
import AccessibilityChecklistView from "./AccessibilityChecklistView";
import GuidelinesView from "./GuidelinesView";
import PagesWithIgnoredChecksView from "./PagesWithIgnoredChecksView";
import InternalPdfsView from "./InternalPdfsView";
import ExternalPdfsView from "./ExternalPdfsView";

const ACCESSIBILITY_NAV = [
    { key: "summary", label: "Summary", icon: "isax-home-2", href: "/domain/accessibility?view=summary" },
    { key: "fast-track", label: "Fast Track", icon: "isax-driving", href: "/domain/accessibility?view=fast-track" },
    { key: "failing-checks", label: "Pages with Failing Checks", icon: "isax-document", href: "/domain/accessibility?view=failing-checks" },
    { key: "checklist", label: "Checklist", icon: "isax-tick-circle", href: "/domain/accessibility?view=checklist" },
    { key: "guidelines", label: "Guidelines", icon: "isax-menu", href: "/domain/accessibility?view=guidelines" },
    { key: "pdfs", label: "PDFs", icon: "isax-document-text", href: "/domain/accessibility?view=internal-pdfs", isParent: true },
];

const Accessibility = () => {
    const [searchParams] = useSearchParams();
    const currentView = searchParams.get("view") || "summary";

    return (
        <div className="accessibility-page">
            <div className="card mb-4">
                <div className="card-body py-3">
                    <nav className="d-flex flex-wrap gap-1 gap-md-4 align-items-center" aria-label="Accessibility navigation">
                        {ACCESSIBILITY_NAV.map((item) => {
                            if (item.key === "pdfs") {
                                const isActive = currentView === "internal-pdfs" || currentView === "external-pdfs";
                                return (
                                    <div key={item.key} className="dropdown">
                                        <button
                                            type="button"
                                            className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded border-0 bg-transparent ${isActive ? "bg-light text-primary" : "text-body"}`}
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            <i className={`isax ${item.icon} me-2`} aria-hidden="true"></i>
                                            <span>{item.label}</span>
                                            <i className="isax isax-arrow-down-1 ms-1 fs-12" aria-hidden="true"></i>
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li>
                                                <Link to="/domain/accessibility?view=internal-pdfs" className={`dropdown-item ${currentView === "internal-pdfs" ? "active" : ""}`}>
                                                    Internal PDFs
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/domain/accessibility?view=external-pdfs" className={`dropdown-item ${currentView === "external-pdfs" ? "active" : ""}`}>
                                                    External PDFs
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    key={item.key}
                                    to={item.href}
                                    className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded ${currentView === item.key ? "bg-light text-primary" : "text-body"}`}
                                >
                                    <i className={`isax ${item.icon} me-2`} aria-hidden="true"></i>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
                {currentView === "summary" && <AccessibilitySummaryView />}
                {currentView === "fast-track" && <AccessibilityFastTrackView />}
                {currentView === "failing-checks" && <PagesWithFailingChecksView />}
                {currentView === "checklist" && <AccessibilityChecklistView />}
                {currentView === "guidelines" && <GuidelinesView />}
                {currentView === "ignored-checks" && <PagesWithIgnoredChecksView />}
                {currentView === "internal-pdfs" && <InternalPdfsView />}
                {currentView === "external-pdfs" && <ExternalPdfsView />}
            </div>
        </div>
    );
};

export default Accessibility;
