import React from "react";
import CreatePolicyBuilderView from "./CreatePolicyBuilderView";

/** Policy builder for "Documents". Left panel shows only document-relevant rules (excludes Page html, Image size, Image text, Image text length). */
const CreatePolicyDocumentsView = ({ onBack }) => {
  return <CreatePolicyBuilderView onBack={onBack} contentType="documents" />;
};

export default CreatePolicyDocumentsView;
