import React from "react";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const BACKDROP_Z = 1070;
const PANEL_Z = 1075;

const DEFAULT_PAGE = {
  id: 0,
  title: "(No title found)",
  url: "https://example.com/store/laptops/lenovo-intel-core-i3-laptop",
};

/**
 * Page Details drawer opened from Dashboard >> QA >> Spellcheck >> Potential misspelling >> Open page details.
 * Shows the full Page Details UI (header, tabs, QA sidebar, Potential Misspellings section).
 * From this drawer, "Open issue page" (info icon) opens the issue drawer; closing it returns to this drawer.
 */
const PotentialMisspellingPageDetailsDrawer = ({ open, onClose, page }) => {
  const pageToShow = page ?? (open ? DEFAULT_PAGE : null);
  return (
    <PageDetailsMisspellingsDrawer
      open={open}
      onClose={onClose}
      page={pageToShow}
      defaultQaSubView="potential-misspellings"
      backdropZIndex={BACKDROP_Z}
      panelZIndex={PANEL_Z}
    />
  );
};

export default PotentialMisspellingPageDetailsDrawer;
