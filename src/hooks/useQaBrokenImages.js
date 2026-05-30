import { useState, useEffect, useCallback } from 'react';
import { getQaBrokenImagesApi } from '../api/qaApi';
import { useQaDomainId } from './useQaDomainId';
import { useQaRefreshKey } from '../contexts/QaScanContext';

export function useQaBrokenImages({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'pages',
  sortOrder = 'desc',
  tab = 'all',
}) {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getQaBrokenImagesApi(domainId, {
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
        tab,
      });
      if (res.success) {
        setImages(res.data?.images || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, pages: 1 });
      } else {
        setImages([]);
      }
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, page, limit, search, sortBy, sortOrder, tab, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { images, pagination, loading, refetch: fetchData };
}
