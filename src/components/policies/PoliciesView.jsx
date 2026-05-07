import React, { useState, useEffect, useCallback } from "react";

import { Link, useSearchParams, useLocation } from "react-router-dom";
import NewPolicyDrawer from "./NewPolicyDrawer";
import ContentWithPolicyMatchesView from "./ContentWithPolicyMatchesView";
import PolicyListView from "./PolicyListView";
import GlobalPoliciesView from "./GlobalPoliciesView";
import GlobalPolicyListView from "./GlobalPolicyListView";
import UnwantedPoliciesView from "./UnwantedPoliciesView";
import PagesWithIgnoredChecksView from "./PagesWithIgnoredChecksView";
import VerticalBarChart from "./VerticalBarChart";
import { getPolicyStatsApi } from "@/api/policyApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";


const LANDING_NAV = [
  { href: "/home", label: "Domain Overview", icon: "isax-global" },
  { href: "/home/users", label: "Users", icon: "isax-people" },
  { href: "/home/policies", label: "Policies", icon: "isax-shield-tick" },
  { href: "/home/history-center", label: "History center", icon: "isax-chart-2" },
];

const POLICY_NAV = [
  { key: "summary", label: "Summary", icon: "isax-home-2", href: "/home/policies?view=summary" },
  { key: "content-matches", label: "Content with Policy Matches", icon: "isax-document-copy", href: "/home/policies?view=content-matches" },
  { key: "list", label: "Policy List", icon: "isax-shield-tick", href: "/home/policies?view=list" },
  { key: "ignored", label: "Pages with Ignored Checks", icon: "isax-eye-slash", href: "/home/policies?view=ignored" },
];

/** Sample data – replaced with API */
// const PRIORITIES_DATA = [{ label: "High", value: 1 }, { label: "Medium", value: 0 }, { label: "Low", value: 0 }];
// const POLICY_DIST_DATA = [
//   { label: "Unwanted", value: 0 },
//   { label: "Required", value: 0 },
//   { label: "Matches", value: 1 },
// ];
// const COMPLIANCE_PERCENT = 66.73;
// const POLICIES_WITH_VIOLATIONS = 1;
// const CONTENT_WITH_VIOLATIONS = 499;


const DonutChart = ({ percent, label }) => {
  const r = 62;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;
  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-n90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e9ecef" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="position-absolute text-center">
        <span className="d-block fs-4 fw-bold text-body">{percent.toFixed(2)}%</span>
        <span className="d-block fs-12 text-muted">{label}</span>
      </div>
    </div>
  );
};

/** Simple placeholder for time-series – replace with chart library if needed */
const PolicyTrendChart = () => {
  const pathPoints = "0 80 35 70 70 55 105 45 140 35 175 28 210 22 245 18 280 12";
  return (
    <div className="mt-3">
      <svg viewBox="0 0 280 100" className="w-100" style={{ height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="policyTrendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path fill="url(#policyTrendGrad)" d={`M${pathPoints} L280,100 L0,100 Z`} />
        <path d={`M${pathPoints}`} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="d-flex flex-wrap gap-3 mt-2 fs-12 text-muted">
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-danger" style={{ width: 8, height: 8 }} /> Unwanted
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-warning" style={{ width: 8, height: 8 }} /> Required
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#14b8a6" }} /> Content with issues
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="rounded-circle bg-secondary bg-opacity-50" style={{ width: 8, height: 8 }} /> Scanned content
        </span>
      </div>
    </div>
  );
};

const PoliciesView = ({ isLanding = false }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";

  const [newPolicyDrawerOpen, setNewPolicyDrawerOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [editingPolicyReadOnly, setEditingPolicyReadOnly] = useState(false);
  const [stats, setStats] = useState({
    priorities: [],
    distribution: [],
    policiesWithViolations: 0,
    contentWithViolations: 0,
    compliancePercent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const selectedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
        const res = await getPolicyStatsApi({ domainId: selectedId });
        if (res.success && res.data) {
          setStats({
            priorities: res.data.priorities || [],
            distribution: res.data.distribution || [],
            policiesWithViolations: res.data.policiesWithViolations || 0,
            contentWithViolations: res.data.contentWithViolations || 0,
            compliancePercent: res.data.compliancePercent || 0,
          });
        }

      } catch (err) {
        console.error("Failed to fetch policy stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  if (isLanding) {
    return (
        <div className="content landing-content">
          {/* Navigation Tabs */}
          <div className="landing-nav-tabs">
            <div className="landing-nav-tabs-inner">
              {LANDING_NAV.map((item) => {
                const isActive =
                  (pathname === "/home" && item.label === "Domain Overview") ||
                  (pathname === "/home/users" && item.label === "Users") ||
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
    
          <div className="domain-overview-section">
            <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
              <PolicyListView 
                onAddNewPolicy={() => {
                  setEditingPolicyId(null);
                  setEditingPolicyReadOnly(false);
                  setNewPolicyDrawerOpen(true);
                }} 
                onEditPolicy={(id) => {
                  setEditingPolicyId(id);
                  setEditingPolicyReadOnly(false);
                  setNewPolicyDrawerOpen(true);
                }}
                onViewPolicy={(id) => {
                  setEditingPolicyId(id);
                  setEditingPolicyReadOnly(true);
                  setNewPolicyDrawerOpen(true);
                }}
                hideGlobalButton={true} 
              />
            </div>
          </div>
    
          <NewPolicyDrawer
            open={newPolicyDrawerOpen}
            onClose={() => {
              setNewPolicyDrawerOpen(false);
              setTimeout(() => {
                setEditingPolicyId(null);
                setEditingPolicyReadOnly(false);
              }, 300); // clear after drawer closes
            }}
            policyId={editingPolicyId}
            readOnly={editingPolicyReadOnly}
          />
        </div>
      );
  }

  return (
    <>
      <div>
        {/* Horizontal nav – same pattern as Accessibility / Quality Assurance */}
        <div className="card mb-4">
          <div className="card-body py-3">
            <nav className="d-flex flex-wrap gap-1 gap-md-4 align-items-center" aria-label="Policies navigation">
              {POLICY_NAV.map((item) => {
                const isActive = currentView === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={`d-inline-flex align-items-center text-decoration-none py-2 px-2 rounded ${isActive ? "bg-light text-primary" : "text-body"}`}
                  >
                    <i className={`isax ${item.icon} me-2`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
          {currentView === "content-matches" ? (
            <ContentWithPolicyMatchesView />
          ) : currentView === "list" ? (
            <PolicyListView 
              onAddNewPolicy={() => {
                setEditingPolicyId(null);
                setEditingPolicyReadOnly(false);
                setNewPolicyDrawerOpen(true);
              }} 
              onEditPolicy={(id) => {
                setEditingPolicyId(id);
                setEditingPolicyReadOnly(false);
                setNewPolicyDrawerOpen(true);
              }}
              onViewPolicy={(id) => {
                setEditingPolicyId(id);
                setEditingPolicyReadOnly(true);
                setNewPolicyDrawerOpen(true);
              }}
            />
          ) : currentView === "global" ? (
            <GlobalPoliciesView onAddNewPolicy={() => {
              setEditingPolicyId(null);
              setEditingPolicyReadOnly(false);
              setNewPolicyDrawerOpen(true);
            }} />
          ) : currentView === "global-list" ? (
            <GlobalPolicyListView 
              onAddNewPolicy={() => {
                setEditingPolicyId(null);
                setEditingPolicyReadOnly(false);
                setNewPolicyDrawerOpen(true);
              }} 
              onEditPolicy={(id) => {
                setEditingPolicyId(id);
                setEditingPolicyReadOnly(false);
                setNewPolicyDrawerOpen(true);
              }}
              onViewPolicy={(id) => {
                setEditingPolicyId(id);
                setEditingPolicyReadOnly(true);
                setNewPolicyDrawerOpen(true);
              }}
            />
          ) : currentView === "unwanted" ? (
            <UnwantedPoliciesView />
          ) : currentView === "ignored" ? (
            <PagesWithIgnoredChecksView />
          ) : (
            <>
              {/* Header */}
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
                    <i className="isax isax-shield-tick fs-20 text-primary" aria-hidden="true" />
                    Policies
                  </h5>
                  <p className="text-muted fs-13 mb-0" style={{ maxWidth: 560 }}>
                    Find and address violations relating to your content guides and regulatory compliance and find outdated content across your website.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setNewPolicyDrawerOpen(true)}
                >
                  <i className="isax isax-add-circle fs-18 me-1" aria-hidden="true" />
                  Add new policy
                </button>
              </div>

              {/* Cards grid */}
              <div className="row g-3 g-xl-4">
                {/* Priorities */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="fw-semibold text-body mb-1">Priorities</h6>
                      <p className="fs-13 text-muted mb-3">Distribution of policies with matches across priority levels</p>
                      <VerticalBarChart items={stats.priorities || []} maxVal={Math.max(5, ...(stats.priorities || []).map(p => p.value || 0))} />

                    </div>

                  </div>
                </div>

                {/* Policy Distribution */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="fw-semibold text-body mb-1">Policy Distribution</h6>
                      <p className="fs-13 text-muted mb-3">Distribution of policies that matches their corresponding setting</p>
                      <VerticalBarChart items={stats.distribution || []} maxVal={Math.max(5, ...(stats.distribution || []).map(d => d.value || 0))} />

                    </div>

                  </div>
                </div>

                {/* Policy Diagnostics */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="fw-semibold text-body mb-1">Policy Diagnostics</h6>
                      <p className="fs-13 text-muted mb-3">Percentage shows number of pages that are compliant with all Policies</p>
                      <div className="d-flex justify-content-center justify-content-lg-start">
                        <DonutChart percent={stats.compliancePercent} label="Policy Compliance" />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Metrics + trend */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="mb-3">
                        <h6 className="fs-13 fw-semibold text-body mb-1">Policies with violations</h6>
                        <p className="display-6 fw-bold text-body mb-0">{stats.policiesWithViolations}</p>
                      </div>
                      <div className="mb-3">
                        <h6 className="fs-13 fw-semibold text-body mb-1 d-flex align-items-center gap-1">
                          Content with policy violations
                          <i className="isax isax-information text-muted fs-14" title="Content with policy violations" aria-hidden="true" />
                        </h6>
                        <p className="display-6 fw-bold text-body mb-0">{stats.contentWithViolations}</p>
                      </div>
                      <PolicyTrendChart />

                      <div className="d-flex justify-content-end mt-2 pt-2 border-top">
                        <Link to="#" className="text-primary fs-13 d-inline-flex align-items-center">
                          Show history
                          <i className="isax isax-arrow-right-1 ms-1" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <NewPolicyDrawer
        open={newPolicyDrawerOpen}
        onClose={() => {
          setNewPolicyDrawerOpen(false);
          setTimeout(() => {
            setEditingPolicyId(null);
            setEditingPolicyReadOnly(false);
          }, 300); // clear after drawer closes
        }}
        policyId={editingPolicyId}
        readOnly={editingPolicyReadOnly}
      />
    </>
  );
};

export default PoliciesView;
