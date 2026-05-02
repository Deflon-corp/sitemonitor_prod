import React from "react";
import PagesWithResourceDrawer from "./PagesWithResourceDrawer";

export default function PagesWithHeadlinkDrawer(props) {
  return (
    <PagesWithResourceDrawer
      {...props}
      title="Pages with this headlink"
      reportBaseName="Pages-with-Headlink-Report"
      ariaLabelledBy="pages-with-headlink-drawer-title"
    />
  );
}
