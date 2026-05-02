import React from "react";
import PagesWithResourceDrawer from "./PagesWithResourceDrawer";

export default function PagesWithCssDrawer(props) {
  return (
    <PagesWithResourceDrawer
      {...props}
      title="Pages with this CSS"
      reportBaseName="Pages-with-CSS-Report"
      ariaLabelledBy="pages-with-css-drawer-title"
    />
  );
}
