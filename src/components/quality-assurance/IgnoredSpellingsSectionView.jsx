import React, { useState } from "react";
import IgnoredSpellingsSection from "../prioritized-content/IgnoredSpellingsSection";
import IgnoredSpellingIssueDrawer from "../prioritized-content/IgnoredSpellingIssueDrawer";
import { useQaDictionary } from "../../hooks/useQaDictionary";
import { QaPanelEmpty } from "./QaDataStates";

export default function IgnoredSpellingsSectionView() {
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] =
    useState(null);
  const { items, loading, error } = useQaDictionary();

  const selectedIssue =
    selectedIgnoredSpellingId != null
      ? (items.find((r) => r.id === selectedIgnoredSpellingId) ?? null)
      : null;

  if (loading) {
    return <p className="text-muted py-4">Loading ignored words…</p>;
  }

  if (error) {
    return (
      <QaPanelEmpty
        title="Could not load ignored words"
        message={error}
        icon="isax-danger"
      />
    );
  }

  if (items.length === 0) {
    return (
      <QaPanelEmpty
        title="No ignored words"
        message="Words you ignore during spellcheck will appear here."
        icon="isax-eye-slash"
      />
    );
  }

  return (
    <React.Fragment>
      <IgnoredSpellingsSection
        items={items.map((r) => ({
          id: r.id,
          word: r.word,
          dateIgnored: r.dateAdded,
        }))}
        onOpenIssue={function (id) {
          setSelectedIgnoredSpellingId(id);
        }}
      />
      <IgnoredSpellingIssueDrawer
        open={selectedIgnoredSpellingId != null}
        onClose={function () {
          setSelectedIgnoredSpellingId(null);
        }}
        issue={
          selectedIssue
            ? {
                id: selectedIssue.id,
                word: selectedIssue.word,

                dateIgnored: selectedIssue.dateAdded,
              }
            : null
        }
      />
    </React.Fragment>
  );
}
