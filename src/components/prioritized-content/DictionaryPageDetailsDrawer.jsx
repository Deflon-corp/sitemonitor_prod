import React from "react";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const BACKDROP_Z = 1080;
const PANEL_Z = 1085;
/**
 * Page Details drawer opened from Dictionary issue drawer (e.g. when user clicks Open page details).
 * Uses defaultQaSubView "dictionary" when the Page Details QA sidebar has a dictionary section.
 */
const DictionaryPageDetailsDrawer = ({
  open,
  onClose,
  page,
  defaultQaSubView = "dictionary",
}) => (
  <PageDetailsMisspellingsDrawer
    open={open}
    onClose={onClose}
    page={page ? { id: 0, title: page.title, url: page.url } : null}
    backdropZIndex={BACKDROP_Z}
    panelZIndex={PANEL_Z}
    defaultQaSubView={defaultQaSubView}
  />
);

export default DictionaryPageDetailsDrawer;
