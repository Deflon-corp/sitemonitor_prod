/**
 * Sample data for Run Website Audit → Response Status detail pages (10–20 rows each).
 */

/** Slug matches route segment after /audit/response-status/ */
export const RESPONSE_STATUS_CONFIG = {
  "valid-urls": {
    title: "Valid URLs",
    affectedCount: 0,
    rows: [],
  },
  200: {
    title: "200 Code",
    affectedCount: 0,
    rows: [],
  },
  301: {
    title: "301 Code",
    affectedCount: 0,
    rows: [],
  },
  404: {
    title: "404 Code",
    affectedCount: 0,
    rows: [],
  },
  500: {
    title: "500 Code",
    affectedCount: 0,
    rows: [],
  },
};

export function getResponseStatusBySlug(slug) {
  if (!slug) return null;
  return RESPONSE_STATUS_CONFIG[slug] || null;
}
