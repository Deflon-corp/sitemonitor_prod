import React, { useState  } from "react";
import PotentialMisspellingsSection, {
  POTENTIAL_MISSPELLINGS_SAMPLE,
} from "../prioritized-content/PotentialMisspellingsSection";
import PotentialMisspellingIssueDrawer from "../prioritized-content/PotentialMisspellingIssueDrawer";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";
import PotentialMisspellingPageDetailsDrawer from "../prioritized-content/PotentialMisspellingPageDetailsDrawer";

/**
 * QA Spellcheck >> Potential Misspellings view.
 * Renders PotentialMisspellingsSection (words table with language tabs, Confirm, Pages, Action)
 * and opens PotentialMisspellingIssueDrawer when "Open issue page" is clicked.
 * Clicking the document icon in that drawer opens PageDetailsMisspellingsDrawer (Misspellings on a Page).
 */
export default function PotentialMisspellingsView() {
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [openPageDetailsDrawerOpen, setOpenPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [defaultQaSubView, setDefaultQaSubView] = useState("misspellings");

  const selectedIssue =
    selectedIssueId != null
      ? POTENTIAL_MISSPELLINGS_SAMPLE.find((r) => r.id === selectedIssueId) ?? null
      : null;

  function openPageDetails(page, qaSubView) {
    setSelectedPageForDetails(page);
    setDefaultQaSubView(qaSubView ?? "misspellings");
    setPageDetailsOpen(true);
  }

  return (
    <React.Fragment>
      <PotentialMisspellingsSection
        items={POTENTIAL_MISSPELLINGS_SAMPLE}
        onOpenIssue={(id) => setSelectedIssueId(id)}
        onOpenPageDetails={() => setOpenPageDetailsDrawerOpen(true)}
      />
      <PotentialMisspellingIssueDrawer
        open={selectedIssueId != null}
        onClose={() => setSelectedIssueId(null)}
        issue={
          selectedIssue
            ? {
                id: selectedIssue.id,
                word: selectedIssue.word,
                language: selectedIssue.language,
                dateFound: selectedIssue.dateFound,
              }
            : null
        }
        onOpenPageDetails={openPageDetails}
      />
      <PotentialMisspellingPageDetailsDrawer
        open={openPageDetailsDrawerOpen}
        onClose={() => setOpenPageDetailsDrawerOpen(false)}
      />
      <PageDetailsMisspellingsDrawer
        open={pageDetailsOpen}
        onClose={() => {
          setPageDetailsOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={
          selectedPageForDetails
            ? { id: 0, title: selectedPageForDetails.title, url: selectedPageForDetails.url }
            : null
        }
        defaultQaSubView={defaultQaSubView}
        backdropZIndex={1080}
        panelZIndex={1085}
      />
    </React.Fragment>
  );
}
