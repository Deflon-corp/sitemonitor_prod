import { useState, useEffect, useCallback } from 'react';
import { getQaBrokenLinksApi } from '../api/qaApi';
import { useQaDomainId } from './useQaDomainId';
import { useQaRefreshKey } from '../contexts/QaScanContext';

export function useQaBrokenLinks({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'pages',
  sortOrder = 'desc',
  tab = 'all',
}) {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [totals, setTotals] = useState({});
  const [statusCodes, setStatusCodes] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getQaBrokenLinksApi(domainId, {
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        tab,
      });
      if (res.success) {
        setLinks(res.data?.links || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, pages: 1 });
        setTotals(res.data?.totals || {});
        setStatusCodes(res.data?.statusCodes || {});
      } else {
        setLinks([]);
      }
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, page, limit, search, sortBy, sortOrder, tab, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { links, pagination, totals, statusCodes, loading, refetch: fetchData };
}
