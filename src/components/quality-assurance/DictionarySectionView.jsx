import React, { useState } from "react";
import DictionarySection from "../prioritized-content/DictionarySection";
import DictionaryIssueDrawer from "../prioritized-content/DictionaryIssueDrawer";
import { useQaDictionary } from "../../hooks/useQaDictionary";
import { QaPanelEmpty } from "./QaDataStates";
import { QA_EMPTY } from "./qaConstants";

/**
 * Custom dictionary — words allowed by your domain settings (ignored spellings).
 */
export default function DictionarySectionView() {
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(null);
  const { items, loading, error } = useQaDictionary();

  const selectedIssue =
    selectedDictionaryId != null
      ? (items.find((r) => r.id === selectedDictionaryId) ?? null)
      : null;

  if (loading) {
    return <p className="text-muted py-4">Loading custom dictionary…</p>;
  }

  if (error) {
    return (
      <QaPanelEmpty
        title="Could not load dictionary"
        message={error}
        icon="isax-danger"
      />
    );
  }

  if (items.length === 0) {
    return (
      <QaPanelEmpty
        title="Custom dictionary is empty"
        message="Add words to your domain’s ignored spellings list to treat them as valid during spellcheck."
        icon="isax-book-1"
      />
    );
  }

  return (
    <>
      <DictionarySection
        items={items}
        onOpenIssue={(id) => setSelectedDictionaryId(id)}
      />
      <DictionaryIssueDrawer
        open={selectedDictionaryId != null}
        onClose={() => setSelectedDictionaryId(null)}
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
    </>
  );
}
