import React from "react";
import PagesWithResourceDrawer from "./PagesWithResourceDrawer";

export default function PagesWithJsDrawer(props) {
  return (
    <PagesWithResourceDrawer
      {...props}
      title="Pages with this JavaScript"
      reportBaseName="Pages-with-JavaScript-Report"
      ariaLabelledBy="pages-with-js-drawer-title"
    />
  );
}
