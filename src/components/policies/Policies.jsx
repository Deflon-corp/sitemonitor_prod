import React from "react";
import { useSearchParams } from "react-router-dom";
import PoliciesView from "@/components/policies/PoliciesView";

const Policies = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";

  const showPoliciesView =
    currentView === "summary" ||
    currentView === "list" ||
    currentView === "content-matches" ||
    currentView === "global" ||
    currentView === "global-list" ||
    currentView === "unwanted" ||
    currentView === "ignored";

  return (
    <div className="policies-page">
      <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <h6 className="mb-0">Policies</h6>
      </div>

      {showPoliciesView && <PoliciesView />}
    </div>
  );
};

export default Policies;
