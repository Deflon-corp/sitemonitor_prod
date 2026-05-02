import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DOMAINS } from "../../lib/domains-config";
import PolicyHitsPerDomainDrawer from "./PolicyHitsPerDomainDrawer";
import VerticalBarChart from "./VerticalBarChart";

const getGlobalNav = (basePath) => [
  { key: "dashboard", label: "Global Policy Dashboard", icon: "isax-hammer", href: `${basePath}?view=global` },
  { key: "list", label: "Policy List", icon: "isax-category-2", href: `${basePath}?view=global-list` },
  { key: "assistant", label: "Policy Assistant", icon: "isax-magic-star", href: `${basePath}?view=global-assistant` },
];

const PRIORITIES_DATA = [
  { label: "Low", value: 0 },
  { label: "Medium", value: 0 },
  { label: "High", value: 1 },
];

const POLICY_DIST_DATA = [
  { label: "Unwanted", value: 0 },
  { label: "Required", value: 0 },
  { label: "Matches", value: 1 },
];

/** Sample row – replace with API */
const SAMPLE_MOST_MATCHES = [
  { id: "1", title: "Text", searchScope: "Everything", status: "hits", hits: 499 },
  { id: "2", title: "Text that starts with Lorem ipsum", searchScope: "Only HTML pages", status: "compliant", hits: 0 },
  { id: "3", title: "Text that starts with FD", searchScope: "Only HTML pages", status: "compliant", hits: 0 },
  { id: "4", title: "Text that starts with Lorem ipsum", searchScope: "Only HTML pages", status: "compliant", hits: 0 },
];

const GlobalPoliciesView = ({
  onAddNewPolicy,
  basePath = "/policies",
  currentView = "global",
  thirdCardLoading = false,
}) => {
  const [sortHitsDesc, setSortHitsDesc] = useState(true);
  const [hitsDrawerPolicy, setHitsDrawerPolicy] = useState(null);
  const [runPolicyAgainPolicy, setRunPolicyAgainPolicy] = useState(null);
  const GLOBAL_NAV = getGlobalNav(basePath);

  const sortedRows = useMemo(() => {
    return [...SAMPLE_MOST_MATCHES].sort((a, b) =>
      sortHitsDesc ? b.hits - a.hits : a.hits - b.hits
    );
  }, [sortHitsDesc]);

  const domainHitsForPolicy = useMemo(() => {
    if (!hitsDrawerPolicy || hitsDrawerPolicy.hits <= 0) return [];
    const first = DOMAINS[0];
    if (!first) return [{ domainId: "1", domainName: "Bajaj FinServ -500", domainUrl: "https://www.bajajfinserv.in/", hits: hitsDrawerPolicy.hits }];
    return [{ domainId: first.id, domainName: first.name, domainUrl: first.url, hits: hitsDrawerPolicy.hits }];
  }, [hitsDrawerPolicy]);

  return (
    <div className="d-flex flex-column h-100">
      {/* Top nav */}
      <ul className="nav nav-tabs border-0 border-bottom border-secondary border-opacity-25 mb-4">
        {GLOBAL_NAV.map((item) => {
          const isActive =
            (item.key === "dashboard" && (currentView === "global" || !currentView)) ||
            (item.key === "list" && currentView === "global-list") ||
            (item.key === "assistant" && currentView === "global-assistant");
          return (
            <li key={item.key} className="nav-item">
              <Link
                to={item.href}
                className={`nav-link border-0 rounded-0 pb-2 px-3 d-flex align-items-center gap-2 ${isActive ? "text-primary border-bottom border-2 border-primary bg-transparent" : "text-body"}`}
              >
                <i className={`isax ${item.icon} fs-16`} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <h5 className="mb-0 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-hammer fs-20 text-primary" aria-hidden="true" />
          Global Policies
        </h5>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-2 d-inline-flex align-items-center"
            onClick={onAddNewPolicy}
          >
            <i className="isax isax-add-circle fs-18 me-1" aria-hidden="true" />
            Add new policy
          </button>
          <button type="button" className="btn btn-primary btn-sm rounded-2 d-inline-flex align-items-center gap-2">
            <i className="isax isax-magic-star fs-18" aria-hidden="true" />
            Add Policy with AI
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="row g-3 g-xl-4 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">Priorities</h6>
              <p className="fs-13 text-muted mb-3">Distribution of policies with matches across priority levels</p>
              <VerticalBarChart items={PRIORITIES_DATA} maxVal={5} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">Policy Distribution</h6>
              <p className="fs-13 text-muted mb-3">Distribution of policies that match their corresponding setting</p>
              <VerticalBarChart items={POLICY_DIST_DATA} maxVal={5} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-1">Policy Distribution</h6>
              <p className="fs-13 text-muted mb-3">Distribution of policies that match their corresponding setting</p>
              {thirdCardLoading ? (
                <div className="d-flex align-items-center justify-content-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" aria-label="Loading">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <VerticalBarChart items={POLICY_DIST_DATA} maxVal={5} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Policies with most matches */}
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="card-header border-0 bg-transparent py-3">
          <h6 className="mb-0 fw-semibold text-body">Policies with most matches</h6>
        </div>
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fs-13 fw-semibold" style={{ minWidth: 280 }}>Title</th>
                <th className="py-3 text-body fs-13 fw-semibold">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                    onClick={() => setSortHitsDesc((d) => !d)}
                    aria-label={sortHitsDesc ? "Sorted descending. Click to sort ascending." : "Sorted ascending. Click to sort descending."}
                  >
                    Hits across all domains and modules
                    <i className={`isax ms-1 text-muted ${sortHitsDesc ? "isax-arrow-down" : "isax-arrow-up-1"}`} aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 ps-4">
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className={`d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle ${row.status === "hits" ? "bg-secondary bg-opacity-25" : "bg-success bg-opacity-25"}`}
                        style={{ width: 32, height: 32 }}
                      >
                        {row.status === "hits" ? (
                          <i className="isax isax-search-normal-1 text-secondary fs-16" aria-hidden="true" />
                        ) : (
                          <i className="isax isax-tick-circle text-success fs-16" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="fw-semibold text-body d-block fs-13">{row.title}</span>
                        <span className="text-muted fs-12 d-block">Search in: {row.searchScope}</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <i className="isax isax-information text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
                          <i className="isax isax-information text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2">
                    {row.hits > 0 ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-decoration-none d-inline-block"
                        onClick={() => setHitsDrawerPolicy(row)}
                        aria-label={`${row.hits} hits – view policy hits per domain`}
                      >
                        <div className="progress rounded-pill flex-grow-1" style={{ height: 24, minWidth: 80, maxWidth: 120 }}>
                          <div
                            className="progress-bar bg-primary d-flex align-items-center justify-content-center rounded-pill"
                            role="progressbar"
                            style={{ width: `${Math.min(100, (row.hits / 500) * 100)}%` }}
                            aria-valuenow={row.hits}
                            aria-valuemin="0"
                            aria-valuemax="500"
                          >
                            <span className="text-white fs-13 fw-medium">{row.hits}</span>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <span className="text-muted fs-13">{row.hits}</span>
                    )}
                  </td>
                  <td className="py-3 pe-4">
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-1 dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        aria-label="Policy actions"
                      >
                        Action
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary" onClick={() => setRunPolicyAgainPolicy(row)}>
                            <i className="isax isax-play" aria-hidden="true" /> Run policy again
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary">
                            <i className="isax isax-edit-2" aria-hidden="true" /> Edit
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-primary">
                            <i className="isax isax-box" aria-hidden="true" /> Archive
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-danger">
                            <i className="isax isax-trash" aria-hidden="true" /> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PolicyHitsPerDomainDrawer
        open={hitsDrawerPolicy != null}
        onClose={() => setHitsDrawerPolicy(null)}
        policyTitle={hitsDrawerPolicy?.title}
        domainHits={domainHitsForPolicy}
      />

      {/* Run policy again – confirm modal */}
      {runPolicyAgainPolicy != null && (
        <>
          <div
            className="position-fixed top-0 start-0 end-0 bottom-0 opacity-75"
            style={{ backgroundColor: "#000", zIndex: 1100 }}
            aria-hidden="true"
            onClick={() => setRunPolicyAgainPolicy(null)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-policy-again-global-confirm-title"
            style={{ backgroundColor: "transparent", zIndex: 1105 }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
              <div className="modal-content border-0 rounded-3 shadow-lg overflow-hidden position-relative">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light rounded-circle position-absolute end-0 p-1 mt-2 me-3"
                  style={{ zIndex: 1, top: 0 }}
                  aria-label="Close"
                  onClick={() => setRunPolicyAgainPolicy(null)}
                >
                  <i className="isax isax-close-circle fs-20 text-muted" aria-hidden="true" />
                </button>
                <div className="modal-header border-0 pt-4 px-4 pb-0 pe-5">
                  <p className="modal-title mb-0 text-body fw-medium lh-base text-nowrap" id="run-policy-again-global-confirm-title" style={{ lineHeight: "1.5", fontSize: "1.125rem" }}>
                    Are you sure you want to run "{runPolicyAgainPolicy.title}" again?
                  </p>
                </div>
                <hr className="mx-4 mt-3 mb-0 text-muted opacity-25" />
                <div className="modal-footer border-0 pt-3 pb-4 px-4 justify-content-end gap-2 bg-transparent">
                  <button
                    type="button"
                    className="btn btn-light border px-3 py-2 rounded-2"
                    onClick={() => setRunPolicyAgainPolicy(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-2 rounded-2"
                    onClick={() => setRunPolicyAgainPolicy(null)}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalPoliciesView;
