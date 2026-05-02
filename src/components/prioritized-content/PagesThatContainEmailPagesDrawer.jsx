import React from "react";
import PagesThatContainEmailDrawer from "./PagesThatContainEmailDrawer";

/**
 * Drawer opened from Personal → Email addresses when the user clicks the **PAGES** count (e.g. “34 pages”).
 * Same layout as the documents flow; separate file and export filename for reporting.
 */
export default function PagesThatContainEmailPagesDrawer(props) {
  return (
    <PagesThatContainEmailDrawer
      {...props}
      reportBaseName="Pages-Email-Pages-Count-Report"
      ariaLabelledBy="pages-that-contain-email-pages-drawer-title"
    />
  );
}
