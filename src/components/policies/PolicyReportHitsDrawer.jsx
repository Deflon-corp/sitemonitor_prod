import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import { getPolicyReportsApi } from "@/api/policyApi";
import toast from "react-hot-toast";

const DRAWER_Z_BACKDROP = 1100;
const DRAWER_Z_PANEL = 1105;

const PolicyReportHitsDrawer = ({
  open,
  onClose,
  policyId,
  policyTitle,
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchReports = useCallback(async () => {
    if (!policyId) return;
    try {
      setLoading(true);
      const res = await getPolicyReportsApi(policyId);
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch policy reports:", err);
      toast.error("Failed to load policy hits");
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open, fetchReports]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r => 
      r.url.toLowerCase().includes(q) || 
      r.domainName.toLowerCase().includes(q)
    );
  }, [reports, search]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow d-flex flex-column overflow-hidden"
        style={{ zIndex: DRAWER_Z_PANEL, width: "min(100%, 800px)", maxWidth: "800px" }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
              onClick={onClose}
            >
              <i className="isax isax-close-circle fs-22 text-body" aria-hidden="true" />
            </button>
            <div className="flex-grow-1 text-center">
              <h2 className="mb-0 fw-semibold text-body fs-5">{policyTitle} - Hits</h2>
              <p className="text-muted small mb-0">{reports.length} total hits found</p>
            </div>
            <div style={{ width: 40 }} /> {/* balance */}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-bottom bg-light bg-opacity-50">
          <div className="position-relative">
            <i className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3" />
            <input
              type="text"
              className="form-control form-control-sm ps-5 rounded-2"
              placeholder="Search by URL or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto p-4">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-5">
              <i className="isax isax-search-status fs-1 text-muted opacity-25 mb-3 d-block" />
              <p className="text-muted">No hits found for this policy.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="fs-12 fw-semibold">URL</th>
                    <th className="fs-12 fw-semibold text-center">Match Count</th>
                    <th className="fs-12 fw-semibold">Scan Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report._id}>
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="text-muted small mb-1">{report.domainName}</span>
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1"
                          >
                            {report.url}
                            <ExternalLinkIcon size={12} />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="badge bg-danger rounded-pill px-2">
                          {report.matchCount || 0}
                        </span>
                      </td>
                      <td className="py-3 text-muted small">
                        {new Date(report.scanDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
    , document.body
  );
};

export default PolicyReportHitsDrawer;
