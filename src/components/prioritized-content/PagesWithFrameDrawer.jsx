import React from "react";
import PagesWithResourceDrawer from "./PagesWithResourceDrawer";

export default function PagesWithFrameDrawer(props) {
  return (
    <PagesWithResourceDrawer
      {...props}
      title="Pages with this frame"
      reportBaseName="Pages-with-Frame-Report"
      ariaLabelledBy="pages-with-frame-drawer-title"
    />
  );
}
