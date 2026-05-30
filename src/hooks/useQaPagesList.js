import { useState, useEffect, useCallback } from 'react';
import { getQaPagesApi } from '../api/qaApi';
import { useQaDomainId } from './useQaDomainId';
import { useQaRefreshKey } from '../contexts/QaScanContext';

/**
 * Fetches paginated QA page rows from the API (server-side pagination/search/sort).
 */
export function useQaPagesList({
  filter = 'qa-errors',
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'issues',
  sortOrder = 'desc',
  enabled = true,
}) {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!domainId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getQaPagesApi(domainId, {
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        filter,
      });
      if (res.success) {
        setRows(res.data?.pages || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, pages: 1 });
      } else {
        setRows([]);
        setError(res.message || 'Failed to load');
      }
    } catch (e) {
      setRows([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [domainId, filter, page, limit, search, sortBy, sortOrder, enabled, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, pagination, loading, error, refetch: fetchData, domainId };
}
