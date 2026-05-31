export const DOMAINS = [
  {
    id: "example",
    name: "Example Domain -500",
    url: "https://example.com/",
    lastScan: "DEC 09 2025",
    metrics: {
      issues: 0,
      passed: 44,
      pages: 1389,
      secure: 0,
      accessibility: 51,
      documents: 0,
      scanned: 500,
    },
  },
  // Add more domains here, e.g.:
  {
    id: "aarogyaabharat", name: "Aarogyaa Bharat", url: "https://aarogyaabharat.com/", lastScan: "DEC 09 2025",
    metrics: {
      issues: 0,
      passed: 44,
      pages: 1389,
      secure: 0,
      accessibility: 51,
      documents: 0,
      scanned: 500,
    },
  },
  {
    id: "gmd", name: "GMD", url: "https://gmd.com/", lastScan: "DEC 09 2025",
    metrics: {
      issues: 0,
      passed: 44,
      pages: 1389,
      secure: 0,
      accessibility: 51,
      documents: 0,
      scanned: 500,
    },
  },
];

export function getDomainById(id) {
  return DOMAINS.find((d) => d.id === id);
}
