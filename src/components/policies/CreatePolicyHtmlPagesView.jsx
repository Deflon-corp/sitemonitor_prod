import React from "react";
import CreatePolicyBuilderView from "./CreatePolicyBuilderView";

/** Policy builder for "HTML pages". Reuses same UI as All assets (Settings, Add rule to policy, all rule drawers). */
const CreatePolicyHtmlPagesView = ({ onBack }) => {
  return <CreatePolicyBuilderView onBack={onBack} />;
};

export default CreatePolicyHtmlPagesView;
