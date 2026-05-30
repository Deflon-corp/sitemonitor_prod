import React, { useState, useEffect } from "react";
import IgnoredSpellingsSection from "../prioritized-content/IgnoredSpellingsSection";
import IgnoredSpellingIssueDrawer from "../prioritized-content/IgnoredSpellingIssueDrawer";
import { getQaSummaryApi } from "../../api/qaApi";
import { useQaDomainId } from "../../hooks/useQaDomainId";

export default function IgnoredSpellingsSectionView() {
  const [selectedIgnoredSpellingId, setSelectedIgnoredSpellingId] = useState(null);
  const [items, setItems] = useState([]);
  const domainId = useQaDomainId();

  useEffect(() => {
    if (!domainId) return;
    getQaSummaryApi(domainId).then((res) => {
      if (res.success && res.data?.ignoredSpellings) {
        setItems(
          res.data.ignoredSpellings.map((word, i) => ({
            id: String(i + 1),
            word,
            language: "English",
            dateIgnored: res.data.scanDate,
          }))
        );
      }
    });
  }, [domainId]);

  const selectedIssue =
    selectedIgnoredSpellingId != null
      ? items.find((r) => r.id === selectedIgnoredSpellingId) ?? null
      : null;

  return (
    <React.Fragment>
      <IgnoredSpellingsSection
        items={items}
        onOpenIssue={function (id) {
          setSelectedIgnoredSpellingId(id);
        }}
      />
      <IgnoredSpellingIssueDrawer
        open={selectedIgnoredSpellingId != null}
        onClose={function () {
          setSelectedIgnoredSpellingId(null);
        }}
        issue={selectedIssue}
      />
    </React.Fragment>
  );
}
