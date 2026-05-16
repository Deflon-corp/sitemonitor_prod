import React, { useState, useEffect } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PageDetailsDrawer, { } from "@/components/prioritized-content/PageDetailsDrawer";
import { getDomainSeoPagesApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const SAMPLE_PAGES = [
  {
    title: "Bajaj Finserv: Loans, Cards, Insurance, Investments, Payments and more",
    url: "https://www.bajajfinserv.in/",
    performanceScore: null ,
  },
];

const PerformanceView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
      if (!domainId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getDomainSeoPagesApi(domainId, 1, 100);
        if (response.success && response.data?.pages) {
          setPages(response.data.pages);
        }
      } catch (error) {
        console.error("Error fetching performance pages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const filteredPages = pages.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || "").toLowerCase().includes(q) || p.url.toLowerCase().includes(q);
  });

  const openPageDetails = (title, url) => {
    setSelectedPageForDetails({ id: 0, title, url });
    setPageDetailsDrawerOpen(true);
  };

  const closePageDetailsDrawer = () => {
    setPageDetailsDrawerOpen(false);
    setSelectedPageForDetails(null);
  };

  return (
    <div className="performance-view">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i className="isax isax-shield-tick5 text-primary fs-22" aria-hidden="true" />
            Page Performance
          </h5>
          <p className="text-muted fs-13 mb-1">Powered by Google Lighthouse</p>
          <p className="text-muted fs-13 mb-0">Monitor and optimize your website's speed, responsiveness, and visual stability to ensure a top-tier user experience.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">

          <div
            className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
            style={{ minWidth: 220 }}
          >
            <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
              <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} aria-hidden="true" />
            </span>
            <input
              type="search"
              className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              style={{ paddingLeft: "0.5rem" }}
            />
          </div>
        </div>
      </div>

      {/* Page list */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted fs-13">Loading pages...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center text-muted py-5">No pages match your search or no scans found.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {filteredPages.map((p, i) => (
                <li key={i} className="list-group-item d-flex flex-wrap align-items-center gap-3 py-4 border-secondary border-opacity-10">
                  <div className="flex-grow-1 min-w-0">
                    <h6 className="mb-1 fw-semibold text-body fs-13 text-break">{p.title}</h6>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1"
                    >
                      <ExternalLinkIcon size={12} className="flex-shrink-0" />
                      {p.url}
                    </a>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-13 text-body">
                      Performance score{" "}
                      <span className={`badge rounded-pill ${
                        p.performanceScore >= 90 ? "bg-success bg-opacity-10 text-success" : 
                        p.performanceScore >= 50 ? "bg-warning bg-opacity-10 text-warning" : 
                        "bg-danger bg-opacity-10 text-danger"
                      }`}>
                        {p.performanceScore != null ? p.performanceScore : "N/A"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                      title="Open Page Details"
                      aria-label="Open Page Details"
                      onClick={() => openPageDetails(p.title, p.url)}
                    >
                      <i className="isax isax-document-text fs-18 text-primary" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>



      <PageDetailsDrawer
        open={pageDetailsDrawerOpen}
        onClose={closePageDetailsDrawer}
        page={selectedPageForDetails}
        defaultTab="performance"
        performanceSectionEmbedded={true}
      />
    </div>
  );
};

export default PerformanceView;
