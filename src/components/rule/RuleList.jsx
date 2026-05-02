import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useState } from "react";
import GlobalPoliciesView from "../policies/GlobalPoliciesView";
import GlobalPolicyListView from "../policies/GlobalPolicyListView";
import NewPolicyDrawer from "../policies/NewPolicyDrawer";

// Static Rules Data
const STATIC_RULES = [
    {
        id: 1,
        name: "Block High-Risk Domains",
        description: "Blocks access to known malicious and phishing domains",
        type: "Security",
        status: "Active",
        lastUpdated: "2026-03-25",
        createdBy: "Admin",
    },
    {
        id: 2,
        name: "Allow Only Corporate Email",
        description: "Restricts email access to only @company.com domains",
        type: "Compliance",
        status: "Active",
        lastUpdated: "2026-03-20",
        createdBy: "Security Team",
    },
    {
        id: 3,
        name: "Limit File Download Size",
        description: "Restricts downloads larger than 50MB",
        type: "Data Control",
        status: "Inactive",
        lastUpdated: "2026-03-18",
        createdBy: "IT Admin",
    },
    {
        id: 4,
        name: "Block Social Media During Work Hours",
        description: "Blocks Facebook, Instagram, TikTok from 9 AM to 5 PM",
        type: "Productivity",
        status: "Active",
        lastUpdated: "2026-03-28",
        createdBy: "HR",
    },
    {
        id: 5,
        name: "Enforce MFA for All Users",
        description: "Requires multi-factor authentication on all logins",
        type: "Security",
        status: "Active",
        lastUpdated: "2026-03-15",
        createdBy: "Admin",
    },
];

const LANDING_NAV = [
    { href: "/home", label: "Domain Overview", icon: "isax-global" },
    { href: "/home/users", label: "Users", icon: "isax-people" },
    { href: "/home/rules", label: "Rules", icon: "isax-setting-2" },
    { href: "/home/policies", label: "Policies", icon: "isax-shield-tick" },
    { href: "/home/history-center", label: "History center", icon: "isax-chart-2" },
];

export default function RulesPage() {
    const pathname = useLocation().pathname;
    const [searchParams] = useSearchParams();
    const view = searchParams.get("view") || "global";

    const [newPolicyDrawerOpen, setNewPolicyDrawerOpen] = useState(false);

    return (
        <div>
            <div className="content landing-content">
                {/* Navigation Tabs */}
                <div className="landing-nav-tabs">
                    <div className="landing-nav-tabs-inner">
                        {LANDING_NAV.map((item) => {
                            const isActive =
                                (pathname === "/home" && item.label === "Domain Overview") ||
                                (pathname === "/home/users" && item.label === "Users") ||
                                (pathname === "/home/rules" && item.label === "Rules") ||
                                (pathname === "/home/policies" && item.label === "Policies") ||
                                (pathname === "/home/history-center" && item.label === "History center");

                            return (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    className={`landing-pill ${isActive ? "landing-pill-active" : "landing-pill-inactive"}`}
                                >
                                    <i className={`isax ${item.icon} landing-pill-icon`} aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="domain-overview-section">
                    {view === "global-list" ? (
                        <GlobalPolicyListView
                            basePath="/home/rules"
                            currentView="global-list"
                            onAddNewPolicy={() => setNewPolicyDrawerOpen(true)}
                            rules={STATIC_RULES}           // Passing static data
                        />
                    ) : view === "global-assistant" ? (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center text-muted py-5">
                                <i className="isax isax-magic-star fs-1 mb-2 d-block" aria-hidden="true" />
                                <h6 className="fw-semibold text-body">Policy Assistant</h6>
                                <p className="mb-0 small">Coming soon.</p>
                            </div>
                        </div>
                    ) : (
                        <GlobalPoliciesView
                            basePath="/home/rules"
                            currentView="global"
                            thirdCardLoading={true}
                            onAddNewPolicy={() => setNewPolicyDrawerOpen(true)}
                        />
                    )}
                </div>
            </div>

            {/* New Policy Drawer */}
            <NewPolicyDrawer
                open={newPolicyDrawerOpen}
                onClose={() => setNewPolicyDrawerOpen(false)}
            />
        </div>
    );
}