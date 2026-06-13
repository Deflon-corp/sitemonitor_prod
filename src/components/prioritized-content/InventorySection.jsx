import React, { useState, useEffect, useMemo } from "react";
import InventoryDetailsView from "./InventoryDetailsView";
import InventorySummaryView from "./InventorySummaryView";
const INVENTORY_SIDEBAR = {
  summary: [{ key: "summary", label: "Summary", icon: "isax-home-2" }],
  content: [
    { key: "html-pages", label: "HTML Pages", icon: "isax-document-copy" },
    { key: "documents", label: "Documents", icon: "isax-document-text" },
    { key: "images", label: "Images", icon: "isax-image" },
    { key: "links", label: "Links", icon: "isax-link-2" },
  ],
  technical: [
    { key: "forms", label: "Forms", icon: "isax-element-3" },
    { key: "headlinks", label: "Headlinks", icon: "isax-link-2" },
    { key: "iframes", label: "IFrames", icon: "isax-code-circle" },
    { key: "frames", label: "Frames", icon: "isax-code-circle" },
    { key: "css", label: "CSS", icon: "isax-code" },
    { key: "js", label: "JavaScript", icon: "isax-code-1" },
  ],
  personal: [
    { key: "email-addresses", label: "Email addresses", icon: "isax-sms" },
  ],
};

const InventorySection = ({
  defaultView,
  embeddedInDrawer,
  page,
  domainId,
} = {}) => {
  const [activeSidebarKey, setActiveSidebarKey] = useState(
    defaultView ?? "summary",
  );
  const [contentOpen, setContentOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(true);

  useEffect(() => {
    if (embeddedInDrawer && defaultView != null && defaultView !== "") {
      setActiveSidebarKey(defaultView);
    }
  }, [embeddedInDrawer, defaultView]);

  const pageSummaryDataMapped = useMemo(() => {
    if (!page) return null;
    return {
      htmlPages: 1,
      documents: (page.files?.others || []).length,
      images: page.images?.total || 0,
      css:
        page.networkMetrics?.resourceCount?.css ||
        page.cssAnalysis?.internalCssCount ||
        0,
      js:
        page.networkMetrics?.resourceCount?.js ||
        page.jsAnalysis?.internalJsCount ||
        0,
      frames: page.additionalChecks?.frameCount || 0,
      iframes: page.additionalChecks?.iframeCount || 0,
      links: (page.links?.internal || 0) + (page.links?.external || 0),
      emails: (page.textMetrics?.emails || []).length,
      headlinks: (page.additionalChecks?.headLinks || []).length,
      history: Array.from({ length: 10 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (9 - i) * 7);
        return {
          date: d.toISOString(),
          htmlPages: 1,
          images: page.images?.total || 0,
        };
      }),
    };
  }, [page]);

  return (
    <div className="d-flex gap-0 overflow-hidden rounded-3">
      {/* Left sidebar */}
      <nav
        className="flex-shrink-0 bg-white border border-secondary border-opacity-25 rounded-start-3 py-2"
        style={{ width: 240, minHeight: 320 }}
        aria-label="Inventory navigation"
      >
        <div className="inventory-nav-row px-3">
          {INVENTORY_SIDEBAR.summary.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${activeSidebarKey === item.key ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
              onClick={() => setActiveSidebarKey(item.key)}
            >
              <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
                <i className={`isax ${item.icon} fs-18`} aria-hidden="true" />
              </span>
              <span className="text-truncate">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 px-3">
          <button
            type="button"
            onClick={() => setContentOpen((o) => !o)}
            className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${contentOpen ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
            aria-expanded={contentOpen}
          >
            <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
              <i className="isax isax-document-copy fs-18" aria-hidden="true" />
            </span>
            <span className="text-truncate fw-semibold fs-13 flex-grow-1">
              Content
            </span>
            <i
              className={`isax isax-${contentOpen ? "arrow-up-1" : "arrow-down-1"} flex-shrink-0 text-muted fs-14`}
              aria-hidden="true"
            />
          </button>
          {contentOpen && (
            <div className="ps-4">
              {INVENTORY_SIDEBAR.content.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${activeSidebarKey === item.key ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
                  onClick={() => setActiveSidebarKey(item.key)}
                >
                  <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
                    <i
                      className={`isax ${item.icon} fs-18`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 px-3">
          <button
            type="button"
            onClick={() => setTechnicalOpen((o) => !o)}
            className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${technicalOpen ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
            aria-expanded={technicalOpen}
          >
            <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
              <i className="isax isax-setting-2 fs-18" aria-hidden="true" />
            </span>
            <span className="text-truncate fw-semibold fs-13 flex-grow-1">
              Technical
            </span>
            <i
              className={`isax isax-${technicalOpen ? "arrow-up-1" : "arrow-down-1"} flex-shrink-0 text-muted fs-14`}
              aria-hidden="true"
            />
          </button>
          {technicalOpen && (
            <div className="ps-4">
              {INVENTORY_SIDEBAR.technical.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${activeSidebarKey === item.key ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
                  onClick={() => setActiveSidebarKey(item.key)}
                >
                  <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
                    <i
                      className={`isax ${item.icon} fs-18`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 px-3">
          <div className="fw-semibold text-body fs-13 mb-1 inventory-nav-row">
            Personal
          </div>
          {INVENTORY_SIDEBAR.personal.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`inventory-nav-btn w-100 btn btn-sm d-flex flex-nowrap align-items-center gap-2 text-start rounded-2 mb-1 ${activeSidebarKey === item.key ? "bg-light text-body" : "btn-link text-body text-decoration-none"}`}
              onClick={() => setActiveSidebarKey(item.key)}
            >
              <span className="d-flex align-items-center justify-content-center flex-shrink-0 inventory-nav-icon">
                <i className={`isax ${item.icon} fs-18`} aria-hidden="true" />
              </span>
              <span className="text-truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1 min-w-0 p-3 bg-body-tertiary rounded-end-3 overflow-auto">
        {activeSidebarKey !== "summary" ? (
          <InventoryDetailsView
            domainId={domainId}
            currentView={
              activeSidebarKey === "email-addresses"
                ? "emails"
                : activeSidebarKey === "outgoing-links"
                  ? "links"
                  : activeSidebarKey
            }
            pageUrl={page?.url}
            variant={embeddedInDrawer ? "drawer" : undefined}
          />
        ) : (
          <InventorySummaryView data={pageSummaryDataMapped} />
        )}
      </div>
    </div>
  );
};

export default InventorySection;
