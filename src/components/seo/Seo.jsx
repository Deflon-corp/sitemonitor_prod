import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SeoSummaryView from "./SeoSummaryView";
import PagesWithOpportunitiesView from "./PagesWithOpportunitiesView";
import SeoCheckpointsView from "./SeoCheckpointsView";
import SitemapCheckoutView from "./SitemapCheckoutView";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import { getDomainByIdApi, triggerDomainScanApi } from "../../api/domainApi";
import toast from "react-hot-toast";

const SEO_NAV = [
  {
    key: "summary",
    label: "SEO Overview",
    description: "Performance summary and top issues",
    icon: "isax-chart-215",
    href: "/domain/seo?view=summary",
  },
  {
    key: "opportunities",
    label: "Pages to Optimize",
    description: "Pages requiring SEO improvements",
    icon: "isax-document-copy",
    href: "/domain/seo?view=opportunities",
  },
  {
    key: "checkpoints",
    label: "Audit Checklist",
    description: "Detailed breakdown of all SEO rules",
    icon: "isax-tick-circle",
    href: "/domain/seo?view=checkpoints",
  },
  {
    key: "sitemap-checkout",
    label: "Crawl & Sitemap",
    description: "Review crawl files & sitemaps",
    icon: "isax-document-text",
    href: "/domain/seo?view=sitemap-checkout",
  },
];

const Seo = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";
  const [isScanning, setIsScanning] = useState(false);
  const [domain, setDomain] = useState(null);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const checkStatus = useCallback(async () => {
    if (!domainId) return;
    try {
      const res = await getDomainByIdApi(domainId);
      if (res.success && res.data) {
        setDomain(res.data);
        setIsScanning(
          res.data.dm_seo_status === "pending" ||
          res.data.dm_seo_status === "scanning"
        );
      }
    } catch (err) {
      console.error("Error checking domain status in SEO:", err);
    }
  }, [domainId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    let interval;
    if (isScanning && domainId) {
      interval = setInterval(checkStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, domainId, checkStatus]);

  const handleTriggerScan = async () => {
    if (!domainId) return;
    setIsScanning(true);
    try {
      const res = await triggerDomainScanApi(domainId);
      if (res.success) {
        toast.success("SEO scan triggered successfully!");
        setDomain((prev) =>
          prev ? { ...prev, dm_seo_status: "pending" } : null,
        );
      }
    } catch (err) {
      console.error("Failed to trigger scan", err);
      toast.error("Failed to trigger SEO scan");
      setIsScanning(false);
    }
  };

  return (
    <div className="seo-page">
      <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <h6 className="mb-0 fs-18 fw-semibold text-body">SEO</h6>
        {domainId && (
          <button
            type="button"
            className="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm"
            disabled={isScanning}
            onClick={handleTriggerScan}
            title="Trigger manual SEO scan"
          >
            {isScanning ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                Scanning...
              </>
            ) : (
              <>
                <i className="isax isax-chart-215 fs-16" aria-hidden="true" />
                Scan New SEO
              </>
            )}
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <nav
            className="d-flex flex-wrap gap-3 align-items-stretch"
            aria-label="SEO navigation"
          >
            {SEO_NAV.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`d-flex flex-column text-decoration-none py-2 px-3 rounded transition-all ${currentView === item.key ? "bg-primary bg-opacity-10 text-primary shadow-sm border border-primary border-opacity-10" : "text-body hover-bg-light border border-transparent"}`}
                style={{ minWidth: "180px", flex: "1 1 0" }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i
                    className={`isax ${item.icon} fs-18 ${currentView === item.key ? "text-primary" : "text-muted"}`}
                    aria-hidden="true"
                  ></i>
                  <span className="fw-semibold fs-14">{item.label}</span>
                </div>
                <span
                  className={`fs-11 ${currentView === item.key ? "text-primary opacity-75" : "text-muted"}`}
                >
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
        {currentView === "summary" && <SeoSummaryView />}
        {currentView === "opportunities" && <PagesWithOpportunitiesView />}
        {currentView === "checkpoints" && <SeoCheckpointsView />}
        {currentView === "sitemap-checkout" && <SitemapCheckoutView />}
      </div>
    </div>
  );
};

export default Seo;
