import React from "react";
import QaSpellcheckPagesTable from "./QaSpellcheckPagesTable";

/** Pages that contain possible misspellings (live API data). */
export default function PagesWithMisspellingsPotentialTabView(props) {
  return <QaSpellcheckPagesTable filter="potential-misspellings" {...props} />;
}
