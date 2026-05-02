import React from "react";

/**
 * Empty state shown when the current policy list filter (e.g. Unwanted, Required, Matches, Archived)
 * has no matching policies. Used in GlobalPolicyListView and PolicyListView so only the table area
 * is replaced; the rest of the page (tabs, header, search) stays the same.
 */
const PolicyListEmptyState = () => {
  return (
    <div className="card-body d-flex align-items-center justify-content-center flex-grow-1 py-5">
      <p className="text-muted mb-0 fs-15">No policies found</p>
    </div>
  );
};

export default PolicyListEmptyState;
