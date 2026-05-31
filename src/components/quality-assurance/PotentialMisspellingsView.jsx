import React, { useMemo, useState } from "react";
import { mapPagesForMisspellingDrawer } from "./qaMisspellingUtils";
import PotentialMisspellingsSection from "../prioritized-content/PotentialMisspellingsSection";
import { useQaMisspellings } from "../../hooks/useQaMisspellings";
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

  const { items, loading } = useQaMisspellings({ page: 1, limit: 500, potential: true });

  const selectedIssue =
    selectedIssueId != null ? items.find((r) => r.id === selectedIssueId) ?? null : null;

  const pagesWithMisspelling = useMemo(
    () =>
      selectedIssue
        ? mapPagesForMisspellingDrawer(selectedIssue.pagesList, selectedIssue.language)
        : [],
    [selectedIssue]
  );

  function openPageDetails(page, qaSubView) {
    setSelectedPageForDetails(page);
    setDefaultQaSubView(qaSubView ?? "misspellings");
    setPageDetailsOpen(true);
  }

  return (
    <React.Fragment>
      {loading && <p className="text-muted py-2">Loading possible misspellings…</p>}
      {!loading && !items.length && (
        <div className="card border border-secondary border-opacity-25 rounded-3 p-5 text-center text-muted mb-3">
          <p className="mb-0 fs-13">No possible misspellings found. Run a QA scan to refresh results.</p>
        </div>
      )}
      {!loading && items.length > 0 && (
        <PotentialMisspellingsSection
          items={items}
          onOpenIssue={(id) => setSelectedIssueId(id)}
          onOpenPageDetails={() => setOpenPageDetailsDrawerOpen(true)}
        />
      )}
      <PotentialMisspellingIssueDrawer
        open={selectedIssueId != null}
        onClose={() => setSelectedIssueId(null)}
        pagesWithMisspelling={pagesWithMisspelling}
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
