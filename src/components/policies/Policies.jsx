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

  return showPoliciesView ? <PoliciesView /> : null;
};

export default Policies;
