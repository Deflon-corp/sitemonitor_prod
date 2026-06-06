import React from "react";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const BACKDROP_Z = 1070;
const PANEL_Z = 1075;

const PotentialMisspellingPageDetailsDrawer = ({ open, onClose, page }) => {
  return (
    <PageDetailsMisspellingsDrawer
      open={open}
      onClose={onClose}
      page={page}
      defaultQaSubView="potential-misspellings"
      backdropZIndex={BACKDROP_Z}
      panelZIndex={PANEL_Z}
    />
  );
};

export default PotentialMisspellingPageDetailsDrawer;
