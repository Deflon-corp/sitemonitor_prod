import { useState, useEffect, useCallback } from 'react';
import { getQaMisspellingsApi } from '../api/qaApi';
import { useQaDomainId } from './useQaDomainId';
import { useQaRefreshKey } from '../contexts/QaScanContext';

export function useQaMisspellings({ page = 1, limit = 50, search = '', potential = false }) {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getQaMisspellingsApi(domainId, {
        page: String(page),
        limit: String(limit),
        search,
        potential: potential ? 'true' : 'false',
      });
      if (res.success) {
        setItems(
          (res.data?.items || []).map((item, i) => {
            const pagesList = Array.isArray(item.pages) ? item.pages : [];
            const pagesCount = item.pagesCount ?? pagesList.length ?? 0;
            return {
              id: item.id || String(i + 1),
              word: item.word,
              language: item.language || 'English',
              dateFound: item.dateFound
                ? new Date(item.dateFound).toISOString().slice(0, 10)
                : '—',
              pages: pagesCount,
              pagesCount,
              pagesList,
              suggestions: item.suggestions || [],
            };
          })
        );
        setPagination(res.data?.pagination || { page, limit, total: 0, pages: 1 });
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, page, limit, search, potential, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, pagination, loading, refetch: fetchData };
}
