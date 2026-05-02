import React from "react";
import { Link } from "react-router-dom";

/** Quick info popover: Broken Links, Broken Images, Misspellings; optionally Policies, Accessibility, SEO, Data privacy. Each row links to the respective page. */
export default function QAQuickInfoMenu({
  brokenLinks,
  brokenImages = 0,
  misspellings = 0,
  policies,
  accessibility,
  seo,
  dataPrivacy,
}) {
  const showFull = policies !== undefined || accessibility !== undefined || seo !== undefined || dataPrivacy !== undefined;
  const rowClass = "d-flex align-items-center justify-content-between px-3 py-2 text-decoration-none border-0 bg-transparent w-100 text-start";

  return (
    <div className="dropdown-menu dropdown-menu-end shadow border border-secondary border-opacity-25 rounded-3 p-0" style={{ minWidth: 260 }}>
      <div className="px-3 py-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between bg-body-tertiary bg-opacity-50 rounded-top-3">
        <span className="fw-semibold text-body fs-13">Quick info here</span>
        <button type="button" className="btn btn-link p-0 text-primary border-0" aria-label="Options">
          <i className="isax isax-menu-1 fs-18" aria-hidden="true"></i>
        </button>
      </div>
      <div className="py-2">
        {showFull && policies !== undefined && (
          <Link to="/policies?view=summary" className={`dropdown-item ${rowClass} ${policies > 0 ? "text-danger" : "text-body"}`}>
            <span className="d-inline-flex align-items-center gap-2 fs-13">
              <i className="isax isax-shield-tick fs-16" aria-hidden="true"></i> Policies
            </span>
            <span className="fw-medium fs-13">{policies}</span>
          </Link>
        )}
        <Link to="/quality-assurance?view=broken-links" className={`dropdown-item ${rowClass} ${brokenLinks > 0 ? "text-danger" : "text-body"}`}>
          <span className="d-inline-flex align-items-center gap-2 fs-13">
            <i className="isax isax-link-2 fs-16" aria-hidden="true"></i> Broken Links
          </span>
          <span className="fw-medium fs-13">{brokenLinks}</span>
        </Link>
        <Link to="/quality-assurance?view=broken-images" className={`dropdown-item ${rowClass} text-body`}>
          <span className="d-inline-flex align-items-center gap-2 fs-13">
            <i className="isax isax-image fs-16" aria-hidden="true"></i> Broken Images
          </span>
          <span className="fw-medium fs-13">{brokenImages}</span>
        </Link>
        <Link to="/quality-assurance?view=spellcheck-misspellings" className={`dropdown-item ${rowClass} text-body`}>
          <span className="d-inline-flex align-items-center gap-2 fs-13">
            <i className="isax isax-edit-2 fs-16" aria-hidden="true"></i> Misspellings
          </span>
          <span className="fw-medium fs-13">{misspellings}</span>
        </Link>
        {showFull && accessibility !== undefined && (
          <Link to="/accessibility?view=summary" className={`dropdown-item ${rowClass} ${accessibility > 0 ? "text-danger" : "text-body"}`}>
            <span className="d-inline-flex align-items-center gap-2 fs-13">
              <i className="isax isax-people5 fs-16" aria-hidden="true"></i> Accessibility
            </span>
            <span className="fw-medium fs-13">{accessibility}</span>
          </Link>
        )}
        {showFull && seo !== undefined && (
          <Link to="/seo?view=summary" className={`dropdown-item ${rowClass} ${seo > 0 ? "text-danger" : "text-body"}`}>
            <span className="d-inline-flex align-items-center gap-2 fs-13">
              <i className="isax isax-chart-215 fs-16" aria-hidden="true"></i> SEO
            </span>
            <span className="fw-medium fs-13">{seo}</span>
          </Link>
        )}
        {showFull && dataPrivacy !== undefined && (
          <Link to="/account-settings" className={`dropdown-item ${rowClass} ${dataPrivacy > 0 ? "text-body" : "text-muted"}`}>
            <span className="d-inline-flex align-items-center gap-2 fs-13">
              <i className="isax isax-lock fs-16" aria-hidden="true"></i> Data privacy
            </span>
            <span className="fw-medium fs-13">{dataPrivacy}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
