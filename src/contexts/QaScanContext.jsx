import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getQaScanStatusApi, triggerQaScanApi } from '../api/qaApi';
import { useQaDomainId } from '../hooks/useQaDomainId';

const QaScanContext = createContext(null);

export function QaScanProvider({ children }) {
  const domainId = useQaDomainId();
  const [qaStatus, setQaStatus] = useState('pending');
  const [scanMessage, setScanMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!domainId) return;
    try {
      const res = await getQaScanStatusApi(domainId);
      if (res.success && res.data) {
        const status = res.data.status || 'pending';
        setQaStatus(status);
        if (status === 'completed') {
          stopPolling();
          setScanMessage('QA scan completed. Showing latest results.');
          setRefreshKey((k) => k + 1);
          setTimeout(() => setScanMessage(''), 8000);
        } else if (status === 'failed') {
          stopPolling();
          setScanMessage('QA scan failed. Please try again.');
        }
      }
    } catch {
      /* ignore poll errors */
    }
  }, [domainId, stopPolling]);

  useEffect(() => {
    if (!domainId) return;
    checkStatus();
    return () => stopPolling();
  }, [domainId, checkStatus, stopPolling]);

  const runQaScan = useCallback(async () => {
    if (!domainId || qaStatus === 'scanning') return false;
    setScanMessage('');
    try {
      const res = await triggerQaScanApi(domainId);
      if (res.success) {
        setQaStatus('scanning');
        setScanMessage(
          res.message || 'QA scan started. Crawling pages and building QA report…'
        );
        stopPolling();
        pollRef.current = setInterval(checkStatus, 4000);
        return true;
      }
      setScanMessage(res.message || 'Failed to start QA scan.');
      return false;
    } catch (err) {
      setScanMessage(err.message || 'Failed to start QA scan.');
      return false;
    }
  }, [domainId, qaStatus, checkStatus, stopPolling]);

  const value = {
    domainId,
    qaStatus,
    isScanning: qaStatus === 'scanning',
    scanMessage,
    refreshKey,
    runQaScan,
    bumpRefresh: () => setRefreshKey((k) => k + 1),
  };

  return <QaScanContext.Provider value={value}>{children}</QaScanContext.Provider>;
}

export function useQaScan() {
  const ctx = useContext(QaScanContext);
  if (!ctx) {
    throw new Error('useQaScan must be used within QaScanProvider');
  }
  return ctx;
}

/** Optional hook for lists outside provider (returns noop refreshKey 0) */
export function useQaRefreshKey() {
  const ctx = useContext(QaScanContext);
  return ctx?.refreshKey ?? 0;
}
