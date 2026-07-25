import React, { useState, useEffect, useCallback } from 'react';

import { getCompetitorReportsApi, addCompetitorApi, triggerCompetitorScanApi } from '../../api/competitorApi';
import { getDomainByIdApi } from '../../api/domainApi';
import { SELECTED_DOMAIN_KEY } from '../../layouts/Sidebar';

const CompetitorMatrix = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchReports = useCallback(async () => {
    if (!domainId) return;
    setLoading(true);
    try {
      const domainRes = await getDomainByIdApi(domainId);
      if (domainRes.success && domainRes.data) {
        const dmName = domainRes.data.dm_url;
        const res = await getCompetitorReportsApi(dmName);
        if (res.success) {
          setReports(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!newCompetitor || !domainId) return;
    try {
      await addCompetitorApi(domainId, newCompetitor);
      setNewCompetitor('');
      alert('Competitor added! Click Scan to analyze them.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleScan = async () => {
    if (!domainId) return;
    setIsScanning(true);
    try {
      const domainRes = await getDomainByIdApi(domainId);
      if (domainRes.success && domainRes.data) {
        await triggerCompetitorScanApi(domainRes.data.dm_url, domainId);
        alert('Scan started! This may take a few minutes. Check back later.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><i className="isax isax-radar fs-20 me-2 text-primary"></i>Market Benchmarking</h4>
        <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
          {isScanning ? 'Scanning...' : 'Run Market Scan'}
        </button>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleAddCompetitor} className="d-flex gap-2">
            <input 
              type="url" 
              className="form-control w-50" 
              placeholder="https://competitor.com" 
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-outline-primary">Add Competitor</button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : reports.length === 0 ? (
        <div className="text-center text-muted mt-5">No competitor data found. Add one and run a scan!</div>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Competitor Domain</th>
                <th>SEO Score</th>
                <th>Accessibility Score</th>
                <th>Dark Patterns Used</th>
                <th>Shared Keywords</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id}>
                  <td className="fw-medium text-primary">{report.competitorUrl}</td>
                  <td>
                    <span className={`badge ${report.seoScore > 70 ? 'bg-success' : 'bg-warning'}`}>
                      {report.seoScore}/100
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${report.accessibilityScore > 70 ? 'bg-success' : 'bg-warning'}`}>
                      {report.accessibilityScore}/100
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${report.darkPatternsFound === 0 ? 'bg-success' : 'bg-danger'}`}>
                      {report.darkPatternsFound} Found
                    </span>
                  </td>
                  <td>
                    {report.commonKeywords && report.commonKeywords.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {report.commonKeywords.slice(0, 3).map(kw => (
                          <span key={kw} className="badge bg-light text-dark border">{kw}</span>
                        ))}
                        {report.commonKeywords.length > 3 && (
                          <span className="badge bg-light text-muted border">+{report.commonKeywords.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted fs-12">None found</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompetitorMatrix;
