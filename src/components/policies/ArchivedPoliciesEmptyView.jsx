import React from "react";

/**
 * Empty state shown when the Archived tab is selected and there are no archived policies.
 * Displays centered "No policies found" inside the list card. Only the content below
 * the filter tabs is replaced; the rest of the page (tabs, header, search) stays the same.
 */
const ArchivedPoliciesEmptyView = () => {
  return (
    <div className="card-body d-flex align-items-center justify-content-center flex-grow-1 py-5">
      <p className="text-muted mb-0 fs-15">No policies found</p>
    </div>
  );
};

export default ArchivedPoliciesEmptyView;
