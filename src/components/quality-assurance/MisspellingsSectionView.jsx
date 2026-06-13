import React, { useMemo, useState } from "react";
import MisspellingsSection from "../prioritized-content/MisspellingsSection";
import MisspellingIssueDrawer from "../prioritized-content/MisspellingIssueDrawer";
import { useQaMisspellings } from "../../hooks/useQaMisspellings";
import { useQaDomainId } from "../../hooks/useQaDomainId";
import { mapPagesForMisspellingDrawer } from "./qaMisspellingUtils";
import { QA_EMPTY } from "./qaConstants";

export default function MisspellingsSectionView() {
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const domainId = useQaDomainId();
  const { items, loading } = useQaMisspellings({ page: 1, limit: 500, potential: false });

  const selectedIssue =
    selectedMisspellingId != null
      ? items.find((r) => String(r.id) === String(selectedMisspellingId)) ?? null
      : null;

  const pagesWithMisspelling = useMemo(
    () =>
      selectedIssue
        ? mapPagesForMisspellingDrawer(selectedIssue.pagesList, selectedIssue.language)
        : [],
    [selectedIssue]
  );

  if (!domainId) {
    return (
      <div className="card border border-secondary border-opacity-25 rounded-3 p-5 text-center text-muted">
        <p className="mb-0 fs-13">{QA_EMPTY.noDomain}</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-muted py-4">Loading misspellings…</p>;
  }

  if (!items.length) {
    return (
      <div className="card border border-secondary border-opacity-25 rounded-3 p-5 text-center text-muted">
        <p className="mb-0 fs-13">No misspellings found. Run a QA scan or check the Possible misspellings tab.</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <MisspellingsSection
        items={items}
        showLanguage={false}
        onOpenIssue={function (id) {
          setSelectedMisspellingId(id);
        }}
      />
      <MisspellingIssueDrawer
        open={selectedMisspellingId != null}
        onClose={function () {
          setSelectedMisspellingId(null);
        }}
        pagesWithMisspelling={pagesWithMisspelling}
        issue={
          selectedIssue
            ? {
                id: selectedIssue.id,
                word: selectedIssue.word,
                language: selectedIssue.language,
                dateFound: selectedIssue.dateFound,
                suggestions: selectedIssue.suggestions,
              }
            : null
        }
      />
    </React.Fragment>
  );
}
