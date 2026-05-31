import React from "react";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const BACKDROP_Z = 1080;
const PANEL_Z = 1085;
/**
 * Renders the full Page Details drawer when opened from the Misspelling issue drawer
 * (e.g. when user clicks the misspelling or potential misspelling count).
 * Uses higher z-index so it appears on top of the issue drawer.
 */
const PageDetailsDrawerFromMisspelling = ({
  open,
  onClose,
  page,
  defaultQaSubView = "misspellings",
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

export default PageDetailsDrawerFromMisspelling;
