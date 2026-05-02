import React, { useState  } from "react";
import MisspellingsSection, { MISSPELLINGS_SAMPLE, } from "../prioritized-content/MisspellingsSection";
import MisspellingIssueDrawer from "../prioritized-content/MisspellingIssueDrawer";

/**
 * QA Spellcheck >> Misspellings view.
 * Renders MisspellingsSection and opens the same MisspellingIssueDrawer
 * when "Open issue page" is clicked (same as Pages with Misspellings >> Open page details >> Open page issue).
 */
export default function MisspellingsSectionView() {
  const [selectedMisspellingId, setSelectedMisspellingId] = useState(null);

  const selectedIssue =
    selectedMisspellingId != null
      ? MISSPELLINGS_SAMPLE.find((r) => r.id === selectedMisspellingId) ?? null
      : null;

  return (
    <React.Fragment>
      <MisspellingsSection
        items={MISSPELLINGS_SAMPLE}
        onOpenIssue={function(id) { setSelectedMisspellingId(id); }}
      />
      <MisspellingIssueDrawer
        open={selectedMisspellingId != null}
        onClose={function() { setSelectedMisspellingId(null); }}
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

