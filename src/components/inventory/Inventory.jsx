import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import InventorySummaryView from "@/components/prioritized-content/InventorySummaryView";
import InventoryDocumentsView from "@/components/prioritized-content/InventoryDocumentsView";
import InventoryLinksView from "@/components/prioritized-content/InventoryLinksView";
import InventoryFormsView from "@/components/prioritized-content/InventoryFormsView";
import InventoryHeadlinksView from "@/components/prioritized-content/InventoryHeadlinksView";
import InventoryIFramesView from "@/components/prioritized-content/InventoryIFramesView";
import InventoryFramesView from "@/components/prioritized-content/InventoryFramesView";
import InventoryCssView from "@/components/prioritized-content/InventoryCssView";
import InventoryJsView from "@/components/prioritized-content/InventoryJsView";
import InventoryPersonalEmailAddressesView from "@/components/prioritized-content/InventoryPersonalEmailAddressesView";
import InventoryHtmlPagesView from "@/components/prioritized-content/InventoryHtmlPagesView";
import PrioritizedContentImagesView from "@/components/prioritized-content/PrioritizedContentImagesView";
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domainName, setDomainName] = useState("");
  const contentRef = useRef(null);
  const technicalRef = useRef(null);

  useEffect(() => {
    const fetchDomainAndData = async () => {
      try {
        setLoading(true);
        const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
        if (!domainId) {
          toast.error("No domain selected");
          setLoading(false);
          return;
        }

        const domainRes = await getDomainsApi();
        const domainList = Array.isArray(domainRes.data) ? domainRes.data : (domainRes.data?.domains || []);
        const domain = domainList.find(d => d._id === domainId || String(d.dm_id) === domainId);
        if (!domain) {
          toast.error("Domain not found");
          setLoading(false);
          return;
        }
        const hostname = domain.dm_url.toLowerCase().trim().replace(/^https?[:/\\]+/i, '').replace(/[/\\]+.*$/, '');
        setDomainName(domain.dm_title || hostname);

        let res;
        switch (currentView) {
          case "summary": res = await inventoryApi.getSummary(hostname); break;
          case "html-pages": res = await inventoryApi.getHtmlPages(hostname); break;
          case "css": res = await inventoryApi.getCss(hostname); break;
          case "js": res = await inventoryApi.getJs(hostname); break;
          case "images": res = await inventoryApi.getImages(hostname); break;
          case "links": res = await inventoryApi.getLinks(hostname); break;
          case "documents": res = await inventoryApi.getDocuments(hostname); break;
          case "forms": res = await inventoryApi.getForms(hostname); break;
          case "headlinks": res = await inventoryApi.getHeadlinks(hostname); break;
          case "iframes": res = await inventoryApi.getIframes(hostname); break;
          case "frames": res = await inventoryApi.getFrames(hostname); break;
          case "email-addresses":
          case "personal": res = await inventoryApi.getEmailAddresses(hostname); break;
          default: res = { success: true, data: [] };
        }

        if (res.success) {
          setData(res.data);
        } else {
          toast.error(res.message || "Failed to fetch inventory data");
        }
      } catch (error) {
        console.error("Inventory fetch error:", error);
        toast.error("Error fetching inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchDomainAndData();
  }, [currentView]);

  useEffect(() => {
    const close = (e) => {
      if (
        contentRef.current && !contentRef.current.contains(e.target ) &&
        technicalRef.current && !technicalRef.current.contains(e.target )
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

  return (
    React.createElement(DashboardLayout, {
      breadcrumbTitle: "Inventory"}

      , React.createElement('div', { className: "inventory-page"}
        , React.createElement('div', { className: "d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-4"      }
          , React.createElement('h6', { className: "mb-0"}, "Inventory")
        )

        , React.createElement('div', { className: "card mb-4" }
          , React.createElement('div', { className: "card-body py-3" }
            , React.createElement('div', { className: "d-flex flex-wrap gap-1 gap-md-4 align-items-center position-relative"     }
              , React.createElement(Link, {
                to: "/domain/inventory?view=summary",
                className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-2 rounded ${currentView === "summary" ? "bg-primary text-white" : "text-body"}`}

                , React.createElement('i', { className: "isax isax-home-2 me-1"  , 'aria-hidden': true})
                , React.createElement('span', {}, "Summary")
              )

              , React.createElement('div', { ref: contentRef, className: "position-relative d-inline-block" }
                , React.createElement('button', {
                  type: "button",
                  onClick: handleContentClick,
                  className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-2 rounded border-0 bg-transparent ${isContentActive ? "bg-primary text-white" : "text-body"}`,
                  'aria-expanded': contentOpen,
                  'aria-haspopup': "true"}

                  , React.createElement('i', { className: "isax isax-document-copy me-1"  , 'aria-hidden': true})
                  , React.createElement('span', {}, "Content")
                  , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 opacity-75"   , style: { fontSize: "0.75rem", transform: contentOpen ? "rotate(180deg)" : undefined }, 'aria-hidden': true})
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
                        className: `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none ${currentView === item.key ? "bg-light text-primary fw-medium" : "text-body"}`,
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
                  className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-2 rounded border-0 bg-transparent ${isTechnicalActive ? "bg-primary text-white" : "text-body"}`,
                  'aria-expanded': technicalOpen,
                  'aria-haspopup': "true"}

                  , React.createElement('i', { className: "isax isax-setting-2 me-1"  , 'aria-hidden': true})
                  , React.createElement('span', {}, "Technical")
                  , React.createElement('i', { className: "isax isax-arrow-down-1 ms-1 opacity-75"   , style: { fontSize: "0.75rem", transform: technicalOpen ? "rotate(180deg)" : undefined }, 'aria-hidden': true})
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
                        className: `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none ${currentView === item.key ? "bg-light text-primary fw-medium" : "text-body"}`,
                        onClick: () => setTechnicalOpen(false)}

                        , React.createElement('i', { className: `isax ${item.icon} flex-shrink-0`, style: { fontSize: "1rem" }, 'aria-hidden': true})
                        , React.createElement('span', {}, item.label)
                      )
                    ))
                  )
                )
              )

              , React.createElement(Link, { to: "/domain/inventory?view=personal",
                className: `d-inline-flex align-items-center gap-1 text-decoration-none py-2 px-2 rounded ${currentView === "personal" || currentView === "email-addresses" ? "bg-primary text-white" : "text-body"}`}

                , React.createElement('i', { className: "isax isax-people5 me-1"  , 'aria-hidden': true})
                , React.createElement('span', {}, "Personal")
              )
            )
          )
        )

        , loading && React.createElement('div', { className: "text-center py-5" }, React.createElement('div', { className: "spinner-border text-primary", role: "status" }, React.createElement('span', { className: "visually-hidden" }, "Loading...")))
        , !loading && currentView === "summary" && React.createElement(InventorySummaryView, { data: data } )
        , !loading && currentView === "html-pages" && React.createElement(InventoryHtmlPagesView, { items: Array.isArray(data) ? data : [] } )
        , !loading && currentView === "documents" && React.createElement(InventoryDocumentsView, { items: data || [] } )
        , !loading && currentView === "images" && React.createElement(PrioritizedContentImagesView, { items: data || [] } )
        , !loading && currentView === "links" && React.createElement(InventoryLinksView, { items: data || [] } )
        , !loading && currentView === "forms" && React.createElement(InventoryFormsView, { items: data || [] } )
        , !loading && currentView === "headlinks" && React.createElement(InventoryHeadlinksView, { items: data || [] } )
        , !loading && currentView === "iframes" && React.createElement(InventoryIFramesView, { items: data || [] } )
        , !loading && currentView === "frames" && React.createElement(InventoryFramesView, { items: data || [] } )
        , !loading && currentView === "css" && React.createElement(InventoryCssView, { items: data || [] } )
        , !loading && currentView === "js" && React.createElement(InventoryJsView, { items: data || [] } )
        , !loading && (currentView === "email-addresses" || currentView === "personal") && React.createElement(InventoryPersonalEmailAddressesView, { items: data || [] } )
        , (currentView === "content" || currentView === "technical") && (
          React.createElement('div', { className: "card"}
            , React.createElement('div', { className: "card-body py-5 text-center text-muted"   }
              , currentView === "content" && "Select a Content item from the dropdown above."
              , currentView === "technical" && "Select a Technical item from the dropdown above."
            )
          )
        )
      )
    )
  );
}
