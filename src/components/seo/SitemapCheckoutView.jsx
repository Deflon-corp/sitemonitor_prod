import React, { useEffect, useState } from "react";
import { getDomainSitemapsApi } from "../../api/sitemapApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const SitemapCheckoutView = () => {
  const [sitemaps, setSitemaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isFileLoading, setIsFileLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
  const backendUrl = (import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:3000/api";

  const handleView = async (url) => {
    setViewingFile(url);
    setIsFileLoading(true);
    setFileContent("");
    try {
      const proxyUrl = `${backendUrl.replace('/api', '')}/api/sitemap/download?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent("Error: Could not load file content.");
      }
    } catch (err) {
      console.error(err);
      setFileContent("Error: Could not load file content.");
    } finally {
      setIsFileLoading(false);
    }
  };

  useEffect(() => {
    const fetchSitemaps = async () => {
      if (!domainId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getDomainSitemapsApi(domainId);
        if (res.success && res.data) {
          setSitemaps(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch sitemaps", err);
        toast.error("Failed to load sitemap data");
      } finally {
        setLoading(false);
      }
    };
    fetchSitemaps();
  }, [domainId]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-document-text fs-20 text-primary" />
          Crawl & Sitemap
        </h5>
        <p className="text-muted fs-13 mb-0">
          Review and download the crawl files and sitemaps discovered during the SEO scan.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">
                  File URL
                </th>
                <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">
                  Status
                </th>
                <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">
                  Discovered URLs
                </th>
                <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">
                  Last Scanned
                </th>
                <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4 text-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sitemaps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No files found. Trigger a scan to discover them.
                  </td>
                </tr>
              ) : (
                sitemaps.map((sitemap) => (
                  <tr key={sitemap._id}>
                    <td className="px-4 py-3">
                      <span className="text-body fw-medium fs-14">
                        {sitemap.sitemapUrl}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sitemap.status === "success" ? (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fs-12 fw-medium" style={{ width: "110px" }}>
                          Available
                        </span>
                      ) : sitemap.status === "pending" ? (
                        <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fs-12 fw-medium" style={{ width: "110px" }}>
                          Scanning...
                        </span>
                      ) : (
                        <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fs-12 fw-medium" style={{ width: "110px" }}>
                          NOT available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 fs-14 fw-medium text-body">
                      {sitemap.urlsCount > 0 ? sitemap.urlsCount : "-"}
                    </td>
                    <td className="px-4 py-3 fs-14 text-muted">
                      {new Date(sitemap.lastScanned).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                          onClick={() => handleView(sitemap.sitemapUrl)}
                          disabled={sitemap.status === "failed"}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <a
                          href={sitemap.status === "failed" ? "#" : `${backendUrl.replace('/api', '')}/api/sitemap/download?url=${encodeURIComponent(sitemap.sitemapUrl)}`}
                          className={`btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 ${sitemap.status === "failed" ? "disabled" : ""}`}
                          target={sitemap.status === "failed" ? "_self" : "_blank"}
                          rel="noopener noreferrer"
                          onClick={(e) => sitemap.status === "failed" && e.preventDefault()}
                        >
                          <i className="bi bi-file-earmark-arrow-down"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingFile && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fs-16 fw-semibold text-body">
                  <i className="isax isax-document-text me-2 text-primary" />
                  View File
                </h6>
                <button type="button" className="btn-close" onClick={() => setViewingFile(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <span className="fs-13 text-muted">URL: </span>
                  <span className="fs-13 fw-medium text-body">{viewingFile}</span>
                </div>
                {isFileLoading ? (
                  <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <div className="bg-light p-3 rounded border" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <pre className="mb-0 fs-13 text-body" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {fileContent}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setViewingFile(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitemapCheckoutView;
