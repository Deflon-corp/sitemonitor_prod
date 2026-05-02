import React from "react";
import PagesWithResourceDrawer from "./PagesWithResourceDrawer";

export default function PagesWithIFrameDrawer(props) {
  return (
    <PagesWithResourceDrawer
      {...props}
      title="Pages with this iframe"
      reportBaseName="Pages-with-IFrame-Report"
      ariaLabelledBy="pages-with-iframe-drawer-title"
    />
  );
}
