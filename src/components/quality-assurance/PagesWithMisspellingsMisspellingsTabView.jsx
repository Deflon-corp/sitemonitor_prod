import React from "react";
import QaSpellcheckPagesTable from "./QaSpellcheckPagesTable";

/** Pages that contain confirmed misspellings (live API data). */
export default function PagesWithMisspellingsMisspellingsTabView(props) {
  return <QaSpellcheckPagesTable filter="misspellings" {...props} />;
}
