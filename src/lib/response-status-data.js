/**
 * Sample data for Run Website Audit → Response Status detail pages (10–20 rows each).
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
];

function makeRows(pathPrefix, count, queryKey) {
  return Array.from({ length: count }, (_, i) => ({
    url: `${BASE}${pathPrefix}/item-${i + 1}${queryKey ? `?${queryKey}=${i + 1}` : ""}`,
    lastCrawled: DATES[i % DATES.length],
  }));
}

/** Slug matches route segment after /audit/response-status/ */
export const RESPONSE_STATUS_CONFIG = {
  "valid-urls": {
    title: "Valid URLs",
    affectedCount: 812,
    rows: makeRows("/valid", 16, "v"),
  },
  200: {
    title: "200 Code",
    affectedCount: 426,
    rows: makeRows("/status/200", 15, "p"),
  },
  301: {
    title: "301 Code",
    affectedCount: 23,
    rows: makeRows("/redirect/301", 12, "r"),
  },
  404: {
    title: "404 Code",
    affectedCount: 9,
    rows: makeRows("/missing", 10, "m"),
  },
  500: {
    title: "500 Code",
    affectedCount: 12,
    rows: makeRows("/errors/500", 11, "e"),
  },
};

export function getResponseStatusBySlug(slug) {
  if (!slug) return null;
  return RESPONSE_STATUS_CONFIG[slug] || null;
}
