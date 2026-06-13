import { useState, useEffect, useCallback } from "react";
import { getQaBrokenLinksSitemapApi } from "../api/qaApi";
import { useQaDomainId } from "./useQaDomainId";
import { useQaRefreshKey } from "../contexts/QaScanContext";

export function useQaBrokenLinksSitemap({
  page = 1,
  limit = 10,
  search = "",
  tab = "all",
}) {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getQaBrokenLinksSitemapApi(domainId, {
        page: String(page),
        limit: String(limit),
        search,
        tab,
      });
      if (res.success) {
        setLinks(res.data?.links || []);
        setPagination(
          res.data?.pagination || { page, limit, total: 0, pages: 1 },
        );
      } else {
        setLinks([]);
      }
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [domainId, page, limit, search, tab, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { links, pagination, loading, refetch: fetchData };
}
