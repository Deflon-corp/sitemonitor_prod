import React, { useState  } from "react";
import DictionarySection, { DICTIONARY_SAMPLE, } from "../prioritized-content/DictionarySection";
import DictionaryIssueDrawer from "../prioritized-content/DictionaryIssueDrawer";

/**
 * QA Spellcheck >> Dictionary view.
 * Renders DictionarySection and opens DictionaryIssueDrawer when "Open issue page" is clicked.
 */
export default function DictionarySectionView() {
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(null);

  const selectedIssue =
    selectedDictionaryId != null
      ? DICTIONARY_SAMPLE.find((r) => r.id === selectedDictionaryId) ?? null
      : null;

  return (
    <React.Fragment>
      <DictionarySection
        items={DICTIONARY_SAMPLE}
        onOpenIssue={function(id) { setSelectedDictionaryId(id); }}
      />
      <DictionaryIssueDrawer
        open={selectedDictionaryId != null}
        onClose={function() { setSelectedDictionaryId(null); }}
        issue={
          selectedIssue
            ? {
                id: selectedIssue.id,
                word: selectedIssue.word,
                language: selectedIssue.language,
                dateAdded: selectedIssue.dateAdded,
              }
            : null
        }
      />
    </React.Fragment>
  );
}

