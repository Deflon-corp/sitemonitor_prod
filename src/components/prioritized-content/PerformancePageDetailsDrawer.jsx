import React, { useEffect, useState  } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PerformanceSection from "./PerformanceSection";
import AccessibilitySection from "./AccessibilitySection";
import SeoSection from "./SeoSection";
import InventorySection from "./InventorySection";
import { useQaDomainId } from "@/hooks/useQaDomainId";

 

const DRAWER_Z_BACKDROP = 1065;
const DRAWER_Z_PANEL = 1070;

/** Top nav items – same as Page Details / Content with QA errors pattern */
const TOP_NAV_TABS = [
  { key: "dashboard", label: "Page dashboard", icon: "isax-document-text" },
  { key: "policies", label: "Policies", icon: "isax-shield-tick" },
  { key: "qa", label: "Quality Assurance", icon: "isax-tick-circle" },
  { key: "accessibility", label: "Accessibility", icon: "isax-people5" },
  { key: "seo", label: "SEO Audit", icon: "isax-chart-215" },
  { key: "inventory", label: "Inventory", icon: "isax-book5" },
  { key: "performance", label: "Performance", icon: "isax-chart-215" },
];







/** Page dashboard – same content as Page Details drawer (Content Policies, QA, Accessibility, SEO cards) */
function PageDashboardContent() {
  return (
    React.createElement('div', { className: "row g-4 page-details-drawer-dashboard"  }
      , React.createElement('div', { className: "col-md-6 d-flex" }
        , React.createElement('div', { className: "card flex-fill border-0 shadow-sm"   }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3"   }
              , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2"   }
                , React.createElement('i', { className: "isax isax-tick-circle5 fs-18 text-primary"   , 'aria-hidden': true} ), "Content Policies"

              )
              , React.createElement(Link, { to: "#", className: "text-primary"}, React.createElement('i', { className: "isax isax-arrow-right-1" , 'aria-hidden': true} ))
            )
            , React.createElement('div', { className: "row align-items-center g-3"  }
              , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1"      }
                , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center"   }
                  , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140"   , 'aria-hidden': true}
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12"} )
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "384 389" , transform: "rotate(-90 70 70)"  } )
                  )
                  , React.createElement('div', { className: "position-absolute text-center px-1"  , style: { maxWidth: 70, lineHeight: 1.2 }}
                    , React.createElement('span', { className: "d-block fs-4 fw-bold text-body"   }, "98.6 %" )
                    , React.createElement('span', { className: "d-block text-muted" , style: { fontSize: "0.65rem" }}, "overall compliance" )
                  )
                )
              )
              , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0"    }
                , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1"   }, "Policies with violations"  )
                , React.createElement('p', { className: "fs-2 fw-bold text-body mb-2"   }, "1")
                , React.createElement('div', { className: "d-flex flex-wrap gap-3 text-muted fs-13"    }
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2"  }, React.createElement('i', { className: "isax isax-close-circle fs-18"  , 'aria-hidden': true} ), "0")
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2"  }, React.createElement('i', { className: "isax isax-danger fs-18"  , 'aria-hidden': true} ), "0")
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2"  }, React.createElement('i', { className: "isax isax-search-normal-1 fs-18"  , 'aria-hidden': true} ), "1")
                )
              )
            )
            , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-25"      }
              , React.createElement(Link, { to: "#", className: "d-inline-flex align-items-center text-primary fs-13"   }, "Show history" , React.createElement('i', { className: "isax isax-arrow-right-1 ms-1"  , 'aria-hidden': true} ))
            )
          )
        )
      )
      , React.createElement('div', { className: "col-md-6 d-flex" }
        , React.createElement('div', { className: "card flex-fill border-0 shadow-sm"   }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3"   }
              , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2"   }
                , React.createElement('i', { className: "isax isax-document-text5 fs-18 text-primary"   , 'aria-hidden': true} ), "Quality Assurance"

              )
              , React.createElement(Link, { to: "#", className: "text-primary"}, React.createElement('i', { className: "isax isax-arrow-right-1" , 'aria-hidden': true} ))
            )
            , React.createElement('div', { className: "row align-items-center g-3"  }
              , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1"      }
                , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center"   }
                  , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140"   , 'aria-hidden': true}
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12"} )
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "1 389" , transform: "rotate(-90 70 70)"  } )
                  )
                  , React.createElement('div', { className: "position-absolute text-center px-1"  , style: { maxWidth: 70, lineHeight: 1.2 }}
                    , React.createElement('span', { className: "d-block fs-4 fw-bold text-body"   }, "0 %" )
                    , React.createElement('span', { className: "d-block text-muted" , style: { fontSize: "0.65rem" }}, "overall compliance" )
                  )
                )
              )
              , React.createElement('div', { className: "col-12 col-md-7 order-1 order-md-2 min-w-0"    }
                , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1"   }, "QA Issues" )
                , React.createElement('p', { className: "fs-2 fw-bold text-body mb-1"   }, "45")
                , React.createElement('p', { className: "fs-13 text-muted mb-2"  }, "Affects " , React.createElement('strong', { className: "text-body"}, "500"), " pages and "   , React.createElement('strong', { className: "text-body"}, "0"), " documents" )
                , React.createElement('div', { className: "d-flex flex-wrap gap-3 fs-13"   }
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2 text-danger"   }, React.createElement('i', { className: "isax isax-danger fs-18"  , 'aria-hidden': true} ), "37")
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2 text-muted"   }, React.createElement('i', { className: "isax isax-document-text fs-18"  , 'aria-hidden': true} ), "8")
                  , React.createElement('span', { className: "d-inline-flex align-items-center gap-2 text-danger"   }, React.createElement('i', { className: "isax isax-text fs-18"  , 'aria-hidden': true} ), "0")
                )
              )
            )
            , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-25"      }
              , React.createElement(Link, { to: "#", className: "d-inline-flex align-items-center text-primary fs-13"   }, "Show history" , React.createElement('i', { className: "isax isax-arrow-right-1 ms-1"  , 'aria-hidden': true} ))
            )
          )
        )
      )
      , React.createElement('div', { className: "col-md-6 d-flex" }
        , React.createElement('div', { className: "card flex-fill border-0 shadow-sm"   }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3"   }
              , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2"   }
                , React.createElement('i', { className: "isax isax-people5 fs-18 text-primary"   , 'aria-hidden': true} ), "Accessibility"

              )
              , React.createElement(Link, { to: "#", className: "text-primary"}, React.createElement('i', { className: "isax isax-arrow-right-1" , 'aria-hidden': true} ))
            )
            , React.createElement('div', { className: "row align-items-center g-3"  }
              , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start"    }
                , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center"   }
                  , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140"   , 'aria-hidden': true}
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12"} )
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#7c3aed", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "240 389" , transform: "rotate(-90 70 70)"  } )
                  )
                  , React.createElement('div', { className: "position-absolute text-center px-1"  , style: { maxWidth: 70, lineHeight: 1.2 }}
                    , React.createElement('span', { className: "d-block fs-4 fw-bold text-body"   }, "61.75 %" )
                    , React.createElement('span', { className: "d-block text-muted" , style: { fontSize: "0.65rem" }}, "Overall compliance" )
                  )
                )
              )
              , React.createElement('div', { className: "col-12 col-md-7 min-w-0"  }
                , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1"   }, "Failing accessibility checks"  )
                , React.createElement('p', { className: "fs-2 fw-bold text-body mb-0"   }, "51")
              )
            )
            , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-25"      }
              , React.createElement(Link, { to: "#", className: "d-inline-flex align-items-center text-primary fs-13"   }, "Show history" , React.createElement('i', { className: "isax isax-arrow-right-1 ms-1"  , 'aria-hidden': true} ))
            )
          )
        )
      )
      , React.createElement('div', { className: "col-md-6 d-flex" }
        , React.createElement('div', { className: "card flex-fill border-0 shadow-sm"   }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('div', { className: "d-flex align-items-center justify-content-between mb-3"   }
              , React.createElement('h6', { className: "mb-0 d-flex align-items-center gap-2"   }
                , React.createElement('i', { className: "isax isax-chart-215 fs-18 text-primary"   , 'aria-hidden': true} ), "SEO Performance Overview"

              )
              , React.createElement(Link, { to: "#", className: "text-primary"}, React.createElement('i', { className: "isax isax-arrow-right-1" , 'aria-hidden': true} ))
            )
            , React.createElement('div', { className: "row align-items-center g-3"  }
              , React.createElement('div', { className: "col-12 col-md-5 d-flex justify-content-center justify-content-md-start"    }
                , React.createElement('div', { className: "position-relative d-inline-flex align-items-center justify-content-center"   }
                  , React.createElement('svg', { width: "120", height: "120", viewBox: "0 0 140 140"   , 'aria-hidden': true}
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#e5e7eb", strokeWidth: "12"} )
                    , React.createElement('circle', { cx: "70", cy: "70", r: "62", fill: "none", stroke: "#14b8a6", strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "306 389" , transform: "rotate(-90 70 70)"  } )
                  )
                  , React.createElement('div', { className: "position-absolute text-center px-1"  , style: { maxWidth: 70, lineHeight: 1.2 }}
                    , React.createElement('span', { className: "d-block fs-4 fw-bold text-body"   }, "78.63 %" )
                    , React.createElement('span', { className: "d-block text-muted" , style: { fontSize: "0.65rem" }}, "Overall compliance" )
                  )
                )
              )
              , React.createElement('div', { className: "col-12 col-md-7 min-w-0"  }
                , React.createElement('h6', { className: "fs-13 fw-semibold text-body mb-1"   }, "Improvement opportunities" )
                , React.createElement('p', { className: "fs-2 fw-bold text-body mb-0"   }, "2")
              )
            )
            , React.createElement('div', { className: "d-flex justify-content-end mt-3 pt-2 border-top border-secondary border-opacity-25"      }
              , React.createElement(Link, { to: "#", className: "d-inline-flex align-items-center text-primary fs-13"   }, "Show history" , React.createElement('i', { className: "isax isax-arrow-right-1 ms-1"  , 'aria-hidden': true} ))
            )
          )
        )
      )
    )
  );
}

function PoliciesTabContent() {
  return (
    React.createElement('div', { className: "card border-0 shadow-sm"  }
      , React.createElement('div', { className: "card-body"}
        , React.createElement('h6', { className: "fw-semibold text-body mb-3"  }, "Policies")
        , React.createElement('p', { className: "text-muted fs-13 mb-3"  }, "View policy matches and compliance for this page."       )
        , React.createElement('div', { className: "d-flex flex-wrap gap-2"  }
          , React.createElement('span', { className: "badge rounded-pill bg-success bg-opacity-10 text-success"    }, "Unwanted: 0" )
          , React.createElement('span', { className: "badge rounded-pill bg-danger bg-opacity-10 text-danger"    }, "Required: 0" )
          , React.createElement('span', { className: "badge rounded-pill bg-primary bg-opacity-10 text-primary"    }, "Matches: 0" )
        )
      )
    )
  );
}

function QualityAssuranceTabContent() {
  return (
    React.createElement('div', { className: "card border-0 shadow-sm"  }
      , React.createElement('div', { className: "card-body"}
        , React.createElement('h6', { className: "fw-semibold text-body mb-3"  }, "Quality Assurance" )
        , React.createElement('p', { className: "text-muted fs-13 mb-3"  }, "QA issues and checks for this page."      )
        , React.createElement('div', { className: "d-flex flex-wrap gap-2"  }
          , React.createElement('span', { className: "badge rounded-pill bg-danger bg-opacity-10 text-danger"    }, "Broken Links: 0"  )
          , React.createElement('span', { className: "badge rounded-pill bg-warning bg-opacity-10 text-warning"    }, "Misspellings: 0" )
          , React.createElement('span', { className: "badge rounded-pill bg-primary bg-opacity-10 text-primary"    }, "Readability: —" )
        )
      )
    )
  );
}

export default function PerformancePageDetailsDrawer({
  open,
  onClose,
  page,
}) {
  const domainId = useQaDomainId();
  const [activeTab, setActiveTab] = useState("performance");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setActiveTab("performance");
  }, [open]);

  if (!open || !page || typeof document === "undefined") return null;

  return createPortal(
    React.createElement(React.Fragment, null
      , React.createElement('div', {
        className: "position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"      ,
        style: { zIndex: DRAWER_Z_BACKDROP },
        'aria-hidden': true,
        onClick: onClose}
      )
      , React.createElement('div', {
        className: "position-fixed top-0 end-0 bottom-0 bg-white shadow d-flex flex-column overflow-hidden"        ,
        style: { zIndex: DRAWER_Z_PANEL, width: "min(100%, 1600px)", maxWidth: "1600px" },
        role: "dialog",
        'aria-modal': "true",
        'aria-labelledby': "performance-page-details-drawer-title"}

        /* Header: Close, title, URL, actions (like Page Details / QA) */
        , React.createElement('div', { className: "border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0"     }
          , React.createElement('div', { className: "d-flex align-items-flex-start gap-3 justify-content-between"   }
            , React.createElement('button', {
              type: "button",
              className: "btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"        ,
              onClick: onClose,
              title: "Close",
              'aria-label': "Close"}

              , React.createElement('i', { className: "isax isax-close-circle fs-22 text-body"   , 'aria-hidden': true} )
            )
            , React.createElement('div', { className: "min-w-0 flex-grow-1 text-start"  }
              , React.createElement('h5', { id: "performance-page-details-drawer-title", className: "mb-1 fw-semibold text-body text-break"   }
                , page.title
              )
              , React.createElement('a', {
                href: page.url,
                target: "_blank",
                rel: "noopener noreferrer" ,
                className: "text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1 text-break"      }

                , React.createElement(ExternalLinkIcon, { size: 12, className: "flex-shrink-0"} )
                , page.url
              )
            )
            , React.createElement('div', { className: "d-flex align-items-center gap-1 flex-shrink-0"   }
              , React.createElement('button', { type: "button", className: "btn btn-sm btn-light"  , title: "CMS", 'aria-label': "CMS"}, "CMS"

              )
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light"   , title: "Search", 'aria-label': "Search"}
                , React.createElement('i', { className: "isax isax-search-normal-1" , 'aria-hidden': true} )
              )
              , React.createElement('button', { type: "button", className: "btn btn-icon btn-sm btn-light"   , title: "Refresh", 'aria-label': "Refresh"}
                , React.createElement('i', { className: "isax isax-refresh-25" , 'aria-hidden': true} )
              )
            )
          )
        )

        /* Top nav items – same pattern as Content with QA errors / Page Details */
        , React.createElement('div', { className: "border-bottom bg-white px-4 flex-shrink-0"   }
          , React.createElement('div', { className: "row g-2 py-2"  }
            , TOP_NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                React.createElement('div', { key: tab.key, className: "col-6 col-md-3" }
                  , React.createElement('button', {
                    type: "button",
                    className: `btn btn-sm w-100 d-inline-flex align-items-center justify-content-center justify-content-md-start ${isActive ? "btn-primary" : "bg-transparent border border-secondary border-opacity-25 text-dark"}`,
                    onClick: () => setActiveTab(tab.key),
                    'aria-current': isActive ? "page" : undefined,
                    'aria-label': `${tab.label} tab`}

                    , React.createElement('i', { className: `isax ${tab.icon} me-1 fs-14 flex-shrink-0`, 'aria-hidden': true} )
                    , React.createElement('span', { className: "text-truncate"}, tab.label)
                  )
                )
              );
            })
          )
        )

        /* Content – switch by active tab with full functionality */
        , React.createElement('div', { className: "flex-grow-1 overflow-auto p-4"  }
          , activeTab === "dashboard" && React.createElement(PageDashboardContent, {} )
          , activeTab === "policies" && React.createElement(PoliciesTabContent, {} )
          , activeTab === "qa" && React.createElement(QualityAssuranceTabContent, {} )
          , activeTab === "accessibility" && React.createElement(AccessibilitySection, { page: page, embeddedInDrawer: true } )
          , activeTab === "seo" && React.createElement(SeoSection, { page: page, embeddedInDrawer: true } )
          , activeTab === "inventory" && React.createElement(InventorySection, { page: page, embeddedInDrawer: true, domainId: domainId } )
          , activeTab === "performance" && (
            React.createElement(PerformanceSection, { page: page, embeddedInDrawer: true} )
          )
        )
      )
    ),
    document.body
  );
}
