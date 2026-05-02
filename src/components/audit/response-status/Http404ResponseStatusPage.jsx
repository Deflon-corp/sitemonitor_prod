import React from "react";
import ResponseStatusDetailPage from "./ResponseStatusDetailPage";

export default function Http404ResponseStatusPage() {
  return React.createElement(ResponseStatusDetailPage, { slug: "404" });
}
