import { useState, useEffect, useCallback } from "react";
import { getQaSummaryApi } from "../api/qaApi";
import { useQaDomainId } from "./useQaDomainId";
import { useQaRefreshKey } from "../contexts/QaScanContext";

/** Custom dictionary words from domain settings (ignored / allowed spellings). */
export function useQaDictionary() {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!domainId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getQaSummaryApi(domainId);
      if (res.success) {
        const words = res.data?.ignoredSpellings || [];
        const scanDate = res.data?.scanDate;
        setItems(
          words.map((word, i) => ({
            id: String(i + 1),
            word,
            language: "English",
            dateAdded: scanDate ? new Date(scanDate).toISOString().slice(0, 10) : "—",
            pages: 0,
          }))
        );
      } else {
        setItems([]);
        setError(res.message || "Failed to load dictionary");
      }
    } catch (e) {
      setItems([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [domainId, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refetch: fetchData };
}
