import { useState, useEffect, useCallback } from "react";
import { getQaPageDetailApi } from "../api/qaApi";

/**
 * Loads merged page detail (QA report + domain report + policies) for the page drawer.
 */
export function usePageDetails(domainId, pageUrl, enabled = true) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async () => {
    if (!domainId || !pageUrl) {
      setPage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getQaPageDetailApi(domainId, pageUrl);
      if (res.success && res.data) {
        setPage(res.data);
      } else {
        setPage(null);
        setError(res.message || "Could not load page details");
      }
    } catch (err) {
      setPage(null);
      setError(err?.message || "Failed to load page details");
    } finally {
      setLoading(false);
    }
  }, [domainId, pageUrl]);

  useEffect(() => {
    if (!enabled) return;
    fetchPage();
  }, [enabled, fetchPage]);

  return { page, loading, error, refetch: fetchPage };
}
