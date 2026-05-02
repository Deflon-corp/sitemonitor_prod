import React from "react";
import ResponseStatusDetailPage from "./ResponseStatusDetailPage";

export default function Http500ResponseStatusPage() {
  return React.createElement(ResponseStatusDetailPage, { slug: "500" });
}
