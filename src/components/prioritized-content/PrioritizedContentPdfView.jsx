import React from "react";
import PrioritizedContentDocumentsView from "./PrioritizedContentDocumentsView";

const PrioritizedContentPdfView = ({ rows, onOpenPageDetails }) => {
  return (
    <PrioritizedContentDocumentsView
      rows={rows}
      onOpenPageDetails={onOpenPageDetails}
      ariaLabel="PDF documents"
    />
  );
};

export default PrioritizedContentPdfView;
