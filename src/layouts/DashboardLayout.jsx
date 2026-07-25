import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
  breadcrumbTitle = "Dashboard",
  breadcrumbParent,
  breadcrumbParentHref,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalIframeUrl, setGlobalIframeUrl] = useState(null);
  const pathname = useLocation().pathname;

  // Intercept all target="_blank" clicks globally to show them in the iframe popup
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const a = e.target.closest("a");
      if (a && a.getAttribute("target") === "_blank" && a.href && a.href.startsWith("http")) {
        // Do not intercept if it has the ignore-iframe class (like our fallback button)
        if (a.classList.contains("ignore-iframe")) {
          return;
        }
        e.preventDefault();
        setGlobalIframeUrl(a.href);
      }
    };
    
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle body overflow and menu class when mobile menu opens/closes
  useEffect(() => {
    if (mobileMenuOpen) {
      document.documentElement.classList.add("menu-opened");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("menu-opened");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    // Cleanup function
    return () => {
      document.documentElement.classList.remove("menu-opened");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <div className={`main-wrapper${mobileMenuOpen ? " slide-nav" : ""}`}>
        <Header
          breadcrumbTitle={breadcrumbTitle}
          breadcrumbParent={breadcrumbParent}
          breadcrumbParentHref={breadcrumbParentHref}
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        />

        <Sidebar />

        <div className="page-wrapper">
          <div className="content">{children}</div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay opened"
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileMenuOpen(false)}
        />
      )}

      {/* Global Iframe Preview Modal */}
      {globalIframeUrl && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} tabIndex="-1" aria-modal="true" role="dialog">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ height: "85vh" }}>
              <div className="modal-header border-bottom bg-light py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <h6 className="modal-title fs-15 fw-semibold mb-0 d-flex align-items-center gap-2">
                    <i className="isax isax-global text-primary"></i>
                    Page Preview
                  </h6>
                  <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1 fs-11 fw-normal border border-warning-subtle">
                    If page refuses to connect, open in new tab
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <a href={globalIframeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 py-1 ignore-iframe">
                    Open in New Tab
                    <i className="isax isax-export-1 ms-1"></i>
                  </a>
                  <button
                    type="button"
                    className="btn-close m-0"
                    onClick={() => setGlobalIframeUrl(null)}
                    aria-label="Close"
                  ></button>
                </div>
              </div>
              <div className="modal-body p-0 bg-white">
                <iframe
                  src={globalIframeUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Page Preview"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
