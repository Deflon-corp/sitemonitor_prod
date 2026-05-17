import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import InventorySummaryView from "@/components/prioritized-content/InventorySummaryView";
import InventoryDetailsView from "@/components/prioritized-content/InventoryDetailsView";
import { Link, useSearchParams } from "react-router-dom";
import inventoryApi from "@/api/inventoryApi";
import { getDomainsApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import toast from "react-hot-toast";

const CONTENT_SUB_VIEWS = [
  { key: "html-pages", label: "HTML Pages", icon: "isax-document-copy" },
  { key: "documents", label: "Documents", icon: "isax-document-text" },
  { key: "images", label: "Images", icon: "isax-image" },
  { key: "links", label: "Links", icon: "isax-link-2" },
] ;

const TECHNICAL_SUB_VIEWS = [
  { key: "forms", label: "Forms", icon: "isax-element-3" },
  { key: "headlinks", label: "Headlinks", icon: "isax-link-2" },
  { key: "iframes", label: "IFrames", icon: "isax-code-circle" },
  { key: "frames", label: "Frames", icon: "isax-code-circle" },
  { key: "css", label: "CSS", icon: "isax-code" },
  { key: "js", label: "JavaScript", icon: "isax-code-1" },
] ;

const CONTENT_VIEW_KEYS = ["content", ...CONTENT_SUB_VIEWS.map((s) => s.key)];
const TECHNICAL_VIEW_KEYS = ["technical", ...TECHNICAL_SUB_VIEWS.map((s) => s.key)];

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";
  const [contentOpen, setContentOpen] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domainId, setDomainId] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [domainName, setDomainName] = useState("");

  // Real-time scanner states
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const contentRef = useRef(null);
  const technicalRef = useRef(null);

  // Fetch domain meta & latest scan status
  const fetchDomainAndStatus = async () => {
    try {
      setLoading(true);
      const selDomainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
      if (!selDomainId) {
        toast.error("No domain selected");
        setLoading(false);
        return;
      }
      setDomainId(selDomainId);

      const domainRes = await getDomainsApi();
      const domainList = Array.isArray(domainRes.data) ? domainRes.data : (domainRes.data?.domains || []);
      const domain = domainList.find(d => d._id === selDomainId || String(d.dm_id) === selDomainId);
      if (!domain) {
        toast.error("Domain not found");
        setLoading(false);
        return;
      }

      const hostname = domain.dm_url.toLowerCase().trim().replace(/^https?[:/\\]+/i, '').replace(/[/\\]+.*$/, '');
      setDomainUrl(domain.dm_url);
      setDomainName(domain.dm_title || hostname);

      // Load summary & scan status from our new high-performance APIs
      const sumRes = await inventoryApi.getInventorySummary(selDomainId);
      if (sumRes && sumRes.success && sumRes.summary) {
        setScanStatus(sumRes.summary);
        if (sumRes.summary.status === "pending" || sumRes.summary.status === "scanning") {
          setIsScanning(true);
          setProgressPercent(sumRes.summary.progress || 0);
        } else {
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error("Inventory summary fetch error:", error);
      toast.error("Error loading inventory summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainAndStatus();
  }, [domainId]);

  // Poll for active scan status
  useEffect(() => {
    let intervalId;
    if (isScanning && scanStatus?.scanId) {
      intervalId = setInterval(async () => {
        try {
          const res = await inventoryApi.getScanStatus(scanStatus.scanId);
          if (res && res.success && res.scan) {
            const scan = res.scan;
            setScanStatus(prev => ({
              ...prev,
              status: scan.status,
              progress: scan.progress_percent,
              totalPages: scan.total_pages,
              totalImages: scan.total_images,
              totalCss: scan.total_css,
              totalJs: scan.total_js,
              totalDocuments: scan.total_documents,
              totalEmails: scan.total_emails,
              totalHeadlinks: scan.total_headlinks,
            }));
            setProgressPercent(scan.progress_percent || 0);

            if (scan.status === "completed" || scan.status === "failed") {
              setIsScanning(false);
              clearInterval(intervalId);
              toast.success(scan.status === "completed" ? "Domain inventory crawl completed!" : "Domain inventory crawl failed.");
              fetchDomainAndStatus();
            }
          }
        } catch (err) {
          console.error("Status check failed:", err);
        }
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, scanStatus?.scanId]);

  // Initiate a new inventory crawl
  const handleStartScan = async () => {
    if (!domainId || !domainUrl) {
      toast.error("Crawl initialization failed: Invalid domain.");
      return;
    }
    setLoading(true);
    try {
      const res = await inventoryApi.startScan(domainId, domainUrl);
      if (res && res.success) {
        toast.success("Inventory crawl job enqueued!");
        setIsScanning(true);
        // Refresh domain status instantly to set the pending status
        const sumRes = await inventoryApi.getInventorySummary(domainId);
        if (sumRes && sumRes.success && sumRes.summary) {
          setScanStatus(sumRes.summary);
          setProgressPercent(0);
        }
      } else {
        toast.error(res.message || "An active crawl is already in progress.");
      }
    } catch (err) {
      toast.error("Crawl service currently offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const close = (e) => {
      if (
        contentRef.current && !contentRef.current.contains(e.target) &&
        technicalRef.current && !technicalRef.current.contains(e.target)
      ) {
        setContentOpen(false);
        setTechnicalOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const isContentActive = CONTENT_VIEW_KEYS.includes(currentView);
  const isTechnicalActive = TECHNICAL_VIEW_KEYS.includes(currentView);

  const handleContentClick = (e) => {
    e.preventDefault();
    setContentOpen((o) => !o);
    setTechnicalOpen(false);
  };

  const handleTechnicalClick = (e) => {
    e.preventDefault();
    setTechnicalOpen((o) => !o);
    setContentOpen(false);
  };

  // Map scanStatus counts to old format compatible with InventorySummaryView
  const summaryDataMapped = scanStatus ? {
    htmlPages: scanStatus.totalPages || 0,
    documents: scanStatus.totalDocuments || 0,
    images: scanStatus.totalImages || 0,
    css: scanStatus.totalCss || 0,
    js: scanStatus.totalJs || 0,
    frames: 0,
    iframes: 0,
    links: 0,
    emails: scanStatus.totalEmails || 0,
    headlinks: scanStatus.totalHeadlinks || 0,
    history: []
  } : null;

  const supportedDetailViews = ["html-pages", "documents", "images", "css", "js", "emails", "personal", "headlinks", "links", "forms", "iframes", "frames"];
  const finalDetailViewKey = currentView === "personal" ? "emails" : currentView;

  return (
    React.createElement(DashboardLayout, {
      breadcrumbTitle: "Inventory"}

      , React.createElement('div', { className: "inventory-page"}
        /* Control Panel Header */
        , React.createElement('div', { className: "d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4" }
          , React.createElement('h5', { className: "mb-0 fw-semibold text-body" }, `Domain Asset Scanner: ${domainName}`)
          
          , React.createElement('button', {
            type: "button",
            className: "btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm rounded-2",
            disabled: isScanning || loading,
            onClick: handleStartScan
          }, 
            isScanning 
              ? React.createElement(React.Fragment, null, 
                  React.createElement('div', { className: "spinner-border spinner-border-sm me-1" }),
                  "Crawling Domain..."
                )
              : React.createElement(React.Fragment, null,
                  React.createElement('i', { className: "isax isax-refresh fs-18" }),
                  "Run New Inventory Scan"
                )
          )
        )

        /* Gorgeous Live Scanner Progress banner */
        , scanStatus && (scanStatus.status === "pending" || scanStatus.status === "scanning" || isScanning) && (
          React.createElement('div', { 
            className: "card mb-4 border border-primary border-opacity-25 rounded-3 shadow-sm animate__animated animate__fadeIn",
            style: {
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(8px)",
              backgroundImage: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)"
            }
          }
            , React.createElement('div', { className: "card-body p-4" }
              , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3" }
                , React.createElement('div', { className: "d-flex align-items-center gap-3" }
                  , React.createElement('span', { className: "spinner-grow spinner-grow-sm text-primary" })
                  , React.createElement('div', {}
                    , React.createElement('h6', { className: "fw-semibold text-primary mb-1" }, "Recursive Site Crawl In Progress")
                    , React.createElement('p', { className: "text-muted fs-13 mb-0" }, `Scanned ${scanStatus.totalPages || 0} pages recursively. Collecting images, code snippets, emails, and head links.`)
                  )
                )
                , React.createElement('span', { className: "badge bg-primary fs-14 fw-bold py-2 px-3 rounded-pill" }, `${progressPercent}%`)
              )

              /* Progress Bar */
              , React.createElement('div', { className: "progress mb-3", style: { height: 10, borderRadius: 5 } }
                , React.createElement('div', { 
                  className: "progress-bar progress-bar-striped progress-bar-animated bg-primary",
                  role: "progressbar",
                  style: { width: `${progressPercent}%` },
                  "aria-valuenow": progressPercent,
                  "aria-valuemin": 0,
                  "aria-valuemax": 100
                })
              )

              /* Counts Summary */
              , React.createElement('div', { className: "d-flex flex-wrap gap-4 mt-3" }
                , React.createElement('div', { className: "small text-muted" }, "Pages Crawled: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalPages || 0))
                , React.createElement('div', { className: "small text-muted" }, "Images: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalImages || 0))
                , React.createElement('div', { className: "small text-muted" }, "Stylesheets: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalCss || 0))
                , React.createElement('div', { className: "small text-muted" }, "JS Files: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalJs || 0))
                , React.createElement('div', { className: "small text-muted" }, "Documents: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalDocuments || 0))
                , React.createElement('div', { className: "small text-muted" }, "Emails: ", React.createElement('strong', { className: "text-body" }, scanStatus.totalEmails || 0))
              )
            )
          )
        )

        /* Navigation Tabs */
        , React.createElement('div', { className: "card mb-4" }
          , React.createElement('div', { className: "card-body py-3" }
            , React.createElement('div', { className: "d-flex flex-wrap gap-1 gap-md-4 align-items-center position-relative" }
              , React.createElement(Link, {
                to: "/domain/inventory?view=summary",
                className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-3 rounded-2 fw-medium transition ${currentView === "summary" ? "bg-primary text-white shadow-sm" : "text-body hover-bg-light"}`}

                , React.createElement('i', { className: "isax isax-home-2 me-1", 'aria-hidden': true})
                , React.createElement('span', {}, "Summary")
              )

              , React.createElement('div', { ref: contentRef, className: "position-relative d-inline-block" }
                , React.createElement('button', {
                  type: "button",
                  onClick: handleContentClick,
                  className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-3 rounded-2 border-0 bg-transparent transition ${isContentActive ? "bg-primary text-white shadow-sm" : "text-body hover-bg-light"}`,
                  'aria-expanded': contentOpen,
                  'aria-haspopup': "true"}

                  , React.createElement('i', { className: "isax isax-document-copy me-1", 'aria-hidden': true})
                  , React.createElement('span', {}, "Content")
                  , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 opacity-75", style: { fontSize: "0.75rem", transform: contentOpen ? "rotate(180deg)" : undefined }, 'aria-hidden': true})
                )
                , contentOpen && (
                  React.createElement('div', {
                    className: "position-absolute start-0 top-100 mt-1 py-2 bg-white border border-secondary border-opacity-25 rounded-2 shadow-lg"          ,
                    style: { minWidth: 200, zIndex: 1050 },
                    role: "menu"}

                    , CONTENT_SUB_VIEWS.map((item) => (
                      React.createElement(Link, {
                        key: item.key,
                        to: `/domain/inventory?view=${item.key}`,
                        role: "menuitem",
                        className: `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none transition ${currentView === item.key ? "bg-light text-primary fw-medium" : "text-body hover-bg-light"}`,
                        onClick: () => setContentOpen(false)}

                        , React.createElement('i', { className: `isax ${item.icon} flex-shrink-0`, style: { fontSize: "1rem" }, 'aria-hidden': true})
                        , React.createElement('span', {}, item.label)
                      )
                    ))
                  )
                )
              )

              , React.createElement('div', { ref: technicalRef, className: "position-relative d-inline-block" }
                , React.createElement('button', {
                  type: "button",
                  onClick: handleTechnicalClick,
                  className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-3 rounded-2 border-0 bg-transparent transition ${isTechnicalActive ? "bg-primary text-white shadow-sm" : "text-body hover-bg-light"}`,
                  'aria-expanded': technicalOpen,
                  'aria-haspopup': "true"}

                  , React.createElement('i', { className: "isax isax-setting-2 me-1", 'aria-hidden': true})
                  , React.createElement('span', {}, "Technical")
                  , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 opacity-75", style: { fontSize: "0.75rem", transform: technicalOpen ? "rotate(180deg)" : undefined }, 'aria-hidden': true})
                )
                , technicalOpen && (
                  React.createElement('div', {
                    className: "position-absolute start-0 top-100 mt-1 py-2 bg-white border border-secondary border-opacity-25 rounded-2 shadow-lg"          ,
                    style: { minWidth: 200, zIndex: 1050 },
                    role: "menu"}

                    , TECHNICAL_SUB_VIEWS.map((item) => (
                      React.createElement(Link, {
                        key: item.key,
                        to: `/domain/inventory?view=${item.key}`,
                        role: "menuitem",
                        className: `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none transition ${currentView === item.key ? "bg-light text-primary fw-medium" : "text-body hover-bg-light"}`,
                        onClick: () => setTechnicalOpen(false)}

                        , React.createElement('i', { className: `isax ${item.icon} flex-shrink-0`, style: { fontSize: "1rem" }, 'aria-hidden': true})
                        , React.createElement('span', {}, item.label)
                      )
                    ))
                  )
                )
              )

              , React.createElement(Link, { to: "/domain/inventory?view=emails",
                className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-3 rounded-2 fw-medium transition ${currentView === "emails" || currentView === "personal" ? "bg-primary text-white shadow-sm" : "text-body hover-bg-light"}`}

                , React.createElement('i', { className: "isax isax-people5 me-1", 'aria-hidden': true})
                , React.createElement('span', {}, "Emails")
              )
            )
          )
        )

        /* Loader & View render */
        , loading && React.createElement('div', { className: "text-center py-5" }, React.createElement('div', { className: "spinner-border text-primary", role: "status" }, React.createElement('span', { className: "visually-hidden" }, "Loading...")))
        
        , !loading && currentView === "summary" && React.createElement(InventorySummaryView, { data: summaryDataMapped })
        
        , !loading && supportedDetailViews.includes(currentView) && React.createElement(InventoryDetailsView, { domainId: domainId, currentView: finalDetailViewKey })
        
        , !loading && !supportedDetailViews.includes(currentView) && currentView !== "summary" && (
          React.createElement('div', { className: "card border-0 shadow-sm" }
            , React.createElement('div', { className: "card-body py-5 text-center text-muted" }
              , currentView === "content" && "Select a Content item from the dropdown menu above."
              , currentView === "technical" && "Select a Technical item from the dropdown menu above."
              , !["content", "technical"].includes(currentView) && (
                  React.createElement('div', { className: "p-4" }
                    , React.createElement('i', { className: "isax isax-info-circle text-primary fs-32 mb-2 d-block" })
                    , React.createElement('h6', { className: "fw-semibold text-body mb-2" }, "Asset Type Grouping")
                    , React.createElement('p', { className: "mb-0 text-muted" }, "This asset type is compiled during scans. Forms, frames, and iframes are analyzed directly as part of the individual page specifications. Access the 'HTML Pages' detailed view to inspect page asset distributions.")
                  )
                )
            )
          )
        )
      )
    )
  );
}
