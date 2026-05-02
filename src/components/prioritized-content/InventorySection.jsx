import React, { useState, useEffect } from "react";
import InventoryDocumentsView from "./InventoryDocumentsView";
import InventoryOutgoingLinksView from "./InventoryOutgoingLinksView";
import InventoryFormsView from "./InventoryFormsView";
import InventoryHeadlinksView from "./InventoryHeadlinksView";
import InventoryIFramesView from "./InventoryIFramesView";
import InventoryFramesView from "./InventoryFramesView";
import InventoryCssView from "./InventoryCssView";
import InventoryJsView from "./InventoryJsView";
import InventoryEmailAddressesView from "./InventoryEmailAddressesView";
import InventoryHtmlPagesView from "./InventoryHtmlPagesView";
import PrioritizedContentImagesView from "./PrioritizedContentImagesView";

const INVENTORY_SIDEBAR = {
  summary: [{ key: "summary", label: "Summary", icon: "isax-home-2" }],
  content: [
    { key: "html-pages", label: "HTML Pages", icon: "isax-document-copy" },
    { key: "documents", label: "Documents", icon: "isax-document-text" },
    { key: "images", label: "Images", icon: "isax-image" },
    { key: "inline-images", label: "Inline Images", icon: "isax-image" },
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

const CONTENT_METRICS = [
  { label: "Images", value: 36, icon: "isax-image" },
  { label: "Incoming Links", value: 4, icon: "isax-link-square" },
  { label: "Outgoing Links", value: 813, icon: "isax-arrow-right" },
  { label: "PDF Documents", value: 15, icon: "isax-document-text" },
  { label: "Excel Documents", value: 0, icon: "isax-document-copy" },
  { label: "Text Documents", value: 0, icon: "isax-document" },
];

const TECHNICAL_METRICS = [
  { label: "CSS", value: 5, icon: "isax-code" },
  { label: "Javascript", value: 13, icon: "isax-code-1" },
  { label: "Frames", value: 0, icon: "isax-code-circle" },
  { label: "IFrames", value: 0, icon: "isax-code-circle" },
];

const MetricBlock = ({ label, value, icon, borderEnd, borderBottom }) => (
  <div
    className={`d-flex align-items-center gap-3 p-3 ${borderEnd !== false ? "border-end border-secondary border-opacity-25" : ""} ${borderBottom !== false ? "border-bottom border-secondary border-opacity-25" : ""}`}
  >
    <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
      <i className={`isax ${icon} fs-20`} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-muted fs-13 mb-0">{label}</p>
      <p className="fw-semibold fs-5 mb-0 text-body">{value}</p>
    </div>
  </div>
);

const InventorySection = ({ defaultView, embeddedInDrawer } = {}) => {
  const [activeSidebarKey, setActiveSidebarKey] = useState(defaultView ?? "summary");
  const [contentOpen, setContentOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(true);

  useEffect(() => {
    if (embeddedInDrawer && defaultView != null && defaultView !== "") {
      setActiveSidebarKey(defaultView);
    }
  }, [embeddedInDrawer, defaultView]);

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
            <span className="text-truncate fw-semibold fs-13 flex-grow-1">Content</span>
            <i className={`isax isax-${contentOpen ? "arrow-up-1" : "arrow-down-1"} flex-shrink-0 text-muted fs-14`} aria-hidden="true" />
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
                    <i className={`isax ${item.icon} fs-18`} aria-hidden="true" />
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
            <span className="text-truncate fw-semibold fs-13 flex-grow-1">Technical</span>
            <i className={`isax isax-${technicalOpen ? "arrow-up-1" : "arrow-down-1"} flex-shrink-0 text-muted fs-14`} aria-hidden="true" />
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
                    <i className={`isax ${item.icon} fs-18`} aria-hidden="true" />
                  </span>
                  <span className="text-truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 px-3">
          <div className="fw-semibold text-body fs-13 mb-1 inventory-nav-row">Personal</div>
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
        {activeSidebarKey === "documents" ? (
          <InventoryDocumentsView />
        ) : activeSidebarKey === "images" ? (
          <PrioritizedContentImagesView />
        ) : activeSidebarKey === "links" || activeSidebarKey === "outgoing-links" ? (
          <InventoryOutgoingLinksView />
        ) : activeSidebarKey === "forms" ? (
          <InventoryFormsView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "headlinks" ? (
          <InventoryHeadlinksView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "iframes" ? (
          <InventoryIFramesView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "frames" ? (
          <InventoryFramesView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "css" ? (
          <InventoryCssView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "js" ? (
          <InventoryJsView variant={embeddedInDrawer ? "details" : undefined} />
        ) : activeSidebarKey === "email-addresses" ? (
          <InventoryEmailAddressesView />
        ) : activeSidebarKey === "html-pages" ? (
          <InventoryHtmlPagesView />
        ) : activeSidebarKey === "inline-images" ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body py-5 text-center text-muted">
              Inline Images — content coming soon.
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2">
                  <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                    <i className="isax isax-document-copy fs-22" aria-hidden="true" />
                  </span>
                  <div>
                    <h6 className="mb-0 fw-semibold">Inventory</h6>
                    <p className="text-muted fs-13 mb-0">Content and technical inventory for this page.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* Content card */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-3">Content</h6>
                    <div className="row g-0">
                      {CONTENT_METRICS.map((m, idx) => (
                        <div key={m.label} className="col-6">
                          <MetricBlock
                            label={m.label}
                            value={m.value}
                            icon={m.icon}
                            borderEnd={idx % 2 === 0}
                            borderBottom={idx < CONTENT_METRICS.length - 2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical card */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-3">Technical</h6>
                    <div className="row g-0">
                      {TECHNICAL_METRICS.map((m, idx) => (
                        <div key={m.label} className="col-6">
                          <MetricBlock
                            label={m.label}
                            value={m.value}
                            icon={m.icon}
                            borderEnd={idx % 2 === 0}
                            borderBottom={idx < TECHNICAL_METRICS.length - 2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventorySection;
