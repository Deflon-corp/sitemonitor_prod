import React from "react";
import PrioritizedContentDocumentsView from "./PrioritizedContentDocumentsView";

const PrioritizedContentOtherDocumentsView = ({ rows, onOpenPageDetails }) => {
  return (
    <PrioritizedContentDocumentsView
      rows={rows}
      onOpenPageDetails={onOpenPageDetails}
      ariaLabel="Other documents"
    />
  );
};

export default PrioritizedContentOtherDocumentsView;
