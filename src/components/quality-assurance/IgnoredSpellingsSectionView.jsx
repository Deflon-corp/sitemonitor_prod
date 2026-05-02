import React, { useState  } from "react";
import IgnoredSpellingsSection, { IGNORED_SPELLINGS_SAMPLE } from "../prioritized-content/IgnoredSpellingsSection";
import IgnoredSpellingIssueDrawer from "../prioritized-content/IgnoredSpellingIssueDrawer";

/**
 * QA Spellcheck >> Ignored Misspellings view.
 * Renders IgnoredSpellingsSection and opens IgnoredSpellingIssueDrawer when "Open issue page" is clicked.
 * From the issue drawer, "Open page details" opens IgnoredSpellingPageDetailsDrawer.
 */
export default function IgnoredSpellingsSectionView() {
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] = useState(null);

  return (
    <React.Fragment>
      <IgnoredSpellingsSection
        items={IGNORED_SPELLINGS_SAMPLE}
        onOpenIssue={function(id) { setSelectedIgnoredSpellingId(id); }}
      />
      <IgnoredSpellingIssueDrawer
        open={selectedIgnoredSpellingId != null}
        onClose={function() { setSelectedIgnoredSpellingId(null); }}
        issue={
          selectedIgnoredSpellingId != null
            ? IGNORED_SPELLINGS_SAMPLE.find((r) => r.id === selectedIgnoredSpellingId) ?? null
            : null
        }
      />
    </React.Fragment>
  );
}

