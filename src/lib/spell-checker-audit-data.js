/**
 * Run Website Audit → Spell Checker — detail page sample data (10–20 rows each).
 */

const BASE = "https://uat.aarogyaabharat.com";
const DATES = [
  "Dec 11, 2025",
  "Dec 9, 2025",
  "Nov 28, 2025",
  "Nov 22, 2025",
  "Nov 15, 2025",
  "Nov 13, 2025",
  "Nov 12, 2025",
  "Nov 10, 2025",
  "Nov 8, 2025",
  "Oct 30, 2025",
  "Oct 22, 2025",
  "Oct 15, 2025",
  "Oct 2, 2025",
  "Sep 18, 2025",
  "Sep 5, 2025",
  "Aug 20, 2025",
  "Aug 1, 2025",
  "Jul 12, 2025",
];

function makeRows(pathPrefix, count, queryKey) {
  return Array.from({ length: count }, (_, i) => ({
    url: `${BASE}${pathPrefix}/page-${i + 1}${queryKey ? `?${queryKey}=${i + 1}` : ""}`,
    lastCrawled: DATES[i % DATES.length],
  }));
}

/** Slug = last segment of /audit/spell-checker/:slug */
export const SPELL_CHECKER_AUDIT_CONFIG = {
  "title-meta-spelling": {
    title: "Title & Meta spelling",
    affectedCount: 426,
    rows: makeRows("/spellcheck/title-meta", 18, "s"),
  },
  "headings-spelling": {
    title: "Headings (H1–H6) spelling",
    affectedCount: 23,
    rows: makeRows("/spellcheck/headings", 14, "h"),
  },
  "image-alt-spelling": {
    title: "Image alt text spelling",
    affectedCount: 9,
    rows: makeRows("/spellcheck/image-alt", 10, "a"),
  },
  "anchor-cta-spelling": {
    title: "Anchor & CTA text spelling",
    affectedCount: 12,
    rows: makeRows("/spellcheck/anchor-cta", 12, "c"),
  },
  "navigation-footer-spelling": {
    title: "Navigation & footer spelling",
    affectedCount: 12,
    rows: makeRows("/spellcheck/nav-footer", 11, "n"),
  },
  "form-labels-placeholders": {
    title: "Form labels & placeholders",
    affectedCount: 12,
    rows: makeRows("/spellcheck/forms", 13, "f"),
  },
  "language-consistency": {
    title: "Language consistency check",
    affectedCount: 12,
    rows: makeRows("/spellcheck/language", 15, "l"),
  },
  "accessibility-text-spelling": {
    title: "Accessibility text spelling",
    affectedCount: 12,
    rows: makeRows("/spellcheck/a11y-text", 12, "x"),
  },
  "content-spelling": {
    title: "Content spelling",
    affectedCount: 12,
    rows: makeRows("/spellcheck/content", 16, "t"),
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
];

export function getSpellCheckerAuditBySlug(slug) {
  if (!slug) return null;
  return SPELL_CHECKER_AUDIT_CONFIG[slug] || null;
}
