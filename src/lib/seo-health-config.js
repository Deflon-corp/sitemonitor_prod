 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }export const SEO_HEALTH_ISSUES = [
  { slug: "meta-title-missing", label: "Meta Title Missing", count: 12 },
  { slug: "meta-description-missing", label: "Meta Description Missing", count: 34 },
  { slug: "h1-tags-missing", label: "H1 Tags Missing", count: 5 },
  { slug: "no-canonical", label: "Pages with no Canonical", count: 8 },
  { slug: "multiple-h1-tags", label: "Pages with Multiple H1 Tags", count: 2 },
  { slug: "meta-description-too-long", label: "Meta Description Too Long (> 155 characters)", count: 12 },
  { slug: "meta-description-too-short", label: "Meta Description Too Short (< 30 characters)", count: 12 },
  { slug: "missing-alt-text", label: "Missing Alt Text", count: 15 },
];

/** Short title for breadcrumb and H1 (e.g. "H1 Tag Missing") */
export function getSeoIssuePageTitle(slug) {
  const map = {
    "meta-title-missing": "Meta Title Missing",
    "meta-description-missing": "Meta Description Missing",
    "h1-tags-missing": "H1 Tag Missing",
    "no-canonical": "Pages with no Canonical",
    "multiple-h1-tags": "Multiple H1 Tags",
    "meta-description-too-long": "Meta Description Too Long",
    "meta-description-too-short": "Meta Description Too Short",
    "missing-alt-text": "Missing Alt Text",
  };
  return _nullishCoalesce(map[slug], () => ( slug));
}

export function getSeoIssueBySlug(slug) {
  return SEO_HEALTH_ISSUES.find((i) => i.slug === slug);
}
