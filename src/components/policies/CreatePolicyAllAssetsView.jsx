import React from "react";
import CreatePolicyBuilderView from "./CreatePolicyBuilderView";

/** Policy builder for "All assets" (HTML and documents). Reuses shared CreatePolicyBuilderView. */
const CreatePolicyAllAssetsView = ({
  onBack,
  onSuccess,
  policyId,
  readOnly,
  initialData,
}) => {
  return (
    <CreatePolicyBuilderView
      onBack={onBack}
      onSuccess={onSuccess}
      policyId={policyId}
      readOnly={readOnly}
      initialData={initialData}
    />
  );
};

export default CreatePolicyAllAssetsView;
