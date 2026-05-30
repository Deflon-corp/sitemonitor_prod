import React, { useState } from "react";
import MisspellingsSection from "../prioritized-content/MisspellingsSection";
import MisspellingIssueDrawer from "../prioritized-content/MisspellingIssueDrawer";
import { useQaMisspellings } from "../../hooks/useQaMisspellings";

export default function MisspellingsSectionView() {
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);
  const { items, loading } = useQaMisspellings({ page: 1, limit: 500, potential: false });

  const selectedIssue =
    selectedMisspellingId != null
      ? items.find((r) => r.id === selectedMisspellingId) ?? null
      : null;

  if (loading) {
    return <p className="text-muted py-4">Loading misspellings…</p>;
  }

  return (
    <React.Fragment>
      <MisspellingsSection
        items={items}
        onOpenIssue={function (id) {
          setSelectedMisspellingId(id);
        }}
      />
      <MisspellingIssueDrawer
        open={selectedMisspellingId != null}
        onClose={function () {
          setSelectedMisspellingId(null);
        }}
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
      />
    </React.Fragment>
  );
}
