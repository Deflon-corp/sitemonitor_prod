import React, { useState } from "react";
import { Link } from "react-router-dom";

const FILTER_TABS = [
  { key: "all", label: "All", href: "/policies?view=global-list" },
  { key: "unwanted", label: "Unwanted", icon: "isax-close-circle", iconClass: "text-danger", href: "/policies?view=unwanted" },
  { key: "required", label: "Required", icon: "isax-danger", iconClass: "text-primary", href: "/policies?view=required" },
  { key: "matches", label: "Matches", icon: "isax-search-normal-1", iconClass: "text-primary", href: "/policies?view=global-list" },
  { key: "archived", label: "Archived", icon: "isax-trash", iconClass: "text-muted", href: "/policies?view=archived" },
];

const UnwantedPoliciesView = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="d-flex flex-column h-100">
      {/* Filter tabs + search */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom border-secondary border-opacity-25 pb-2 mb-3">
        <ul className="nav nav-tabs border-0 align-items-center flex-grow-1">
          {FILTER_TABS.map((tab) => {
            const isActive = tab.key === "unwanted";
            return (
              <li key={tab.key} className="nav-item">
                <Link
                  to={tab.href}
                  className={`nav-link border-0 rounded-0 pb-2 px-3 d-flex align-items-center gap-2 ${isActive ? "text-primary border-bottom border-2 border-primary bg-transparent fw-medium" : "text-body"}`}
                >
                  {tab.icon && (
                    <i
                      className={`isax ${tab.icon} fs-16 ${tab.iconClass ?? ""}`}
                      aria-hidden="true"
                    />
                  )}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="position-relative flex-shrink-0" style={{ maxWidth: 280 }}>
          <i
            className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
            style={{ fontSize: "1rem" }}
            aria-hidden="true"
          />
          <input
            type="text"
            className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>
      </div>

      {/* Main content - empty state */}
      <div className="card border-0 shadow-sm flex-grow-1 d-flex align-items-center justify-content-center min-h-0">
        <div className="card-body d-flex align-items-center justify-content-center py-5">
          <p className="text-muted mb-0 fs-15">No policies found</p>
        </div>
      </div>
    </div>
  );
};

export default UnwantedPoliciesView;
