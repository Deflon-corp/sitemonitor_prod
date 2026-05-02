import React from "react";

/**
 * Empty state shown when the Unwanted tab is selected (Policy list >> Unwanted) and there are
 * no unwanted policies. Displays a white card with centered "No policies found" in light grey.
 * Only the content below the filter tabs is replaced; the rest of the page stays the same.
 */
const UnwantedPoliciesEmptyView = () => {
  return (
    <div className="card-body d-flex align-items-center justify-content-center flex-grow-1 py-5">
      <p className="text-muted mb-0 fs-15">No policies found</p>
    </div>
  );
};

export default UnwantedPoliciesEmptyView;
