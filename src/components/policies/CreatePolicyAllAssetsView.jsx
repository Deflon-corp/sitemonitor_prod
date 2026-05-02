import React from "react";
import CreatePolicyBuilderView from "./CreatePolicyBuilderView";

/** Policy builder for "All assets" (HTML and documents). Reuses shared CreatePolicyBuilderView. */
const CreatePolicyAllAssetsView = ({ onBack }) => {
  return <CreatePolicyBuilderView onBack={onBack} />;
};

export default CreatePolicyAllAssetsView;
