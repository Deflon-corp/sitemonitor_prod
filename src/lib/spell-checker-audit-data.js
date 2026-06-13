/**
 * Run Website Audit → Spell Checker — detail page sample data (10–20 rows each).
 */

/** Slug = last segment of /audit/spell-checker/:slug */
export const SPELL_CHECKER_AUDIT_CONFIG = {
  "title-meta-spelling": {
    title: "Title & Meta spelling",
    affectedCount: 0,
    rows: [],
  },
  "headings-spelling": {
    title: "Headings (H1–H6) spelling",
    affectedCount: 0,
    rows: [],
  },
  "image-alt-spelling": {
    title: "Image alt text spelling",
    affectedCount: 0,
    rows: [],
  },
  "anchor-cta-spelling": {
    title: "Anchor & CTA text spelling",
    affectedCount: 0,
    rows: [],
  },
  "navigation-footer-spelling": {
    title: "Navigation & footer spelling",
    affectedCount: 0,
    rows: [],
  },
  "form-labels-placeholders": {
    title: "Form labels & placeholders",
    affectedCount: 0,
    rows: [],
  },
  "language-consistency": {
    title: "Language consistency check",
    affectedCount: 0,
    rows: [],
  },
  "accessibility-text-spelling": {
    title: "Accessibility text spelling",
    affectedCount: 0,
    rows: [],
  },
  "content-spelling": {
    title: "Content spelling",
    affectedCount: 0,
    rows: [],
  },
  "broken-links": {
    title: "Broken links",
    affectedCount: 0,
    rows: [],
  },
};

/** Order of rows on Run Website Audit → Spell Checker card */
export const SPELL_CHECKER_SLUGS_ORDER = [
  "title-meta-spelling",
  "headings-spelling",
  "image-alt-spelling",
  "anchor-cta-spelling",
  "navigation-footer-spelling",
  "form-labels-placeholders",
  "language-consistency",
  "accessibility-text-spelling",
  "content-spelling",
  "broken-links",
];

export function getSpellCheckerAuditBySlug(slug) {
  if (!slug) return null;
  return SPELL_CHECKER_AUDIT_CONFIG[slug] || null;
}
