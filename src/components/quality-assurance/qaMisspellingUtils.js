/** Map API page rows for misspelling issue drawers */
export function mapPagesForMisspellingDrawer(pagesList, language = "English") {
  if (!Array.isArray(pagesList)) return [];
  return pagesList.map((p) => ({
    title: p.title || p.url || "(No title)",
    url: p.url,
    language: p.language || language,
    misspellings: p.misspellings ?? 0,
    potentialMisspellings: p.potentialMisspellings ?? 0,
    views: p.views ?? 0,
  }));
}
