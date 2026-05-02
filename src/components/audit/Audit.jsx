import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { SEO_HEALTH_ISSUES } from "@/lib/seo-health-config";
import { SPELL_CHECKER_AUDIT_CONFIG, SPELL_CHECKER_SLUGS_ORDER } from "@/lib/spell-checker-audit-data";

export default function RunWebsiteAuditPage() {
  return (
    React.createElement(DashboardLayout, {
      breadcrumbTitle: "Run Website Audit"  ,
      breadcrumbParentHref: "/domain/audit"}

      , React.createElement('div', { className: "content"}
        /* Page Title */
        , React.createElement('h5', { className: "mb-4"}, "Run Website Audit"  )

        /* Audit Input Section */
        , React.createElement('div', { className: "card mb-4" }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('div', { className: "row align-items-end g-3"  }
              , React.createElement('div', { className: "col-lg-6 col-md-8" }
                , React.createElement('label', { className: "form-label"}, "Website URL" )
                , React.createElement('div', { className: "input-icon-start position-relative" }
                  , React.createElement('span', { className: "input-icon-addon"}
                    , React.createElement('i', { className: "isax isax-search-normal text-muted"  })
                  )
                  , React.createElement('input', {
                    type: "url",
                    className: "form-control",
                    placeholder: "https://example.com",
                    defaultValue: "https://example.com"}
                  )
                )
              )
              , React.createElement('div', { className: "col-lg-4 col-md-4 d-flex flex-wrap gap-2 align-items-end"     }
                , React.createElement('button', { type: "button", className: "btn btn-primary d-flex align-items-center"   }
                  , React.createElement('i', { className: "isax isax-search-normal me-1"  }), "Analyze"
                )
              )
            )
            , React.createElement('div', { className: "mt-3"}
              , React.createElement('label', { className: "form-label d-block mb-2"  }, "Audit type" )
              , React.createElement('div', { className: "d-flex flex-wrap gap-3"  }
                , React.createElement('div', { className: "form-check"}
                  , React.createElement('input', { className: "form-check-input", type: "radio", name: "auditType", id: "auditMobile", value: "mobile"} )
                  , React.createElement('label', { className: "form-check-label", htmlFor: "auditMobile"}, "Mobile")
                )
                , React.createElement('div', { className: "form-check"}
                  , React.createElement('input', { className: "form-check-input", type: "radio", name: "auditType", id: "auditDesktop", value: "desktop"} )
                  , React.createElement('label', { className: "form-check-label", htmlFor: "auditDesktop"}, "Desktop")
                )
                , React.createElement('div', { className: "form-check"}
                  , React.createElement('input', { className: "form-check-input", type: "radio", name: "auditType", id: "auditBoth", value: "both", defaultChecked: true} )
                  , React.createElement('label', { className: "form-check-label", htmlFor: "auditBoth"}, "Both")
                )
              )
            )
          )
        )

        /* Results Header */
        , React.createElement('div', { className: "d-flex d-block align-items-center justify-content-between flex-wrap gap-2 mb-3"      }
          , React.createElement('h6', { className: "mb-0"}, "Result for https://example.com"  )
          , React.createElement('p', { className: "fs-13 text-muted mb-0"  }, "Today: 11:00 AM"  )
        )

        /* Results Cards Grid */
        , React.createElement('div', { className: "row"}
          /* Performance */
          , React.createElement('div', { className: "col-xl-4 col-lg-6 d-flex"  }
            , React.createElement('div', { className: "card flex-fill" }
              , React.createElement('div', { className: "card-header border-0 d-flex align-items-center"    }
                , React.createElement('h6', { className: "mb-0 d-flex align-items-center"  }
                  , React.createElement('span', { className: "avatar avatar-36 avatar-rounded bg-success-subtle text-success flex-shrink-0 me-2 d-flex align-items-center justify-content-center"         }
                    , React.createElement('i', { className: "isax isax-tick-circle fs-18"  })
                  ), "Performance"

                )
              )
              , React.createElement('div', { className: "card-body"}
                , React.createElement('div', { className: "text-center mb-3" }
                  , React.createElement('div', { className: "position-relative d-inline-block" }
                    , React.createElement('svg', { className: "progress-ring", width: "100", height: "100", viewBox: "0 0 100 100"   }
                      , React.createElement('circle', { className: "text-light", stroke: "currentColor", strokeWidth: "8", fill: "transparent", r: "42", cx: "50", cy: "50"} )
                      , React.createElement('circle', { className: "text-success", stroke: "currentColor", strokeWidth: "8", fill: "transparent", r: "42", cx: "50", cy: "50",
                        strokeDasharray: "264", strokeDashoffset: "21", strokeLinecap: "round", transform: "rotate(-90 50 50)"  } )
                    )
                    , React.createElement('span', { className: "position-absolute top-50 start-50 translate-middle fw-bold fs-20 text-success"      }, "92")
                  )
                )
                , React.createElement('p', { className: "text-center fw-medium text-success mb-2"   }, "Good")
                , React.createElement('p', { className: "fs-13 text-muted text-center mb-3"   }, "LCP 11.8s "  , React.createElement('i', { className: "isax isax-arrow-right-3 ms-1 fs-12"   }), " 1.8s" )
                , React.createElement('ul', { className: "list-unstyled mb-0" }
                  , React.createElement('li', { className: "d-flex align-items-center justify-content-between py-1 border-bottom border-light"     }
                    , React.createElement('span', { className: "d-flex align-items-center" }
                      , React.createElement('i', { className: "fa-solid fa-circle text-success fs-8 me-2"    })
                      , React.createElement('span', { className: "fs-13"}, "Largest Contentful Paint"  )
                    )
                    , React.createElement('span', { className: "fs-13 fw-medium" }, "0.05 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10"  }))
                  )
                  , React.createElement('li', { className: "d-flex align-items-center justify-content-between py-1"   }
                    , React.createElement('span', { className: "d-flex align-items-center" }
                      , React.createElement('i', { className: "fa-solid fa-circle text-success fs-8 me-2"    })
                      , React.createElement('span', { className: "fs-13"}, "Interaction to Next Paint"   )
                    )
                    , React.createElement('span', { className: "fs-13 fw-medium" }, "144ms " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10"  }))
                  )
                )
              )
            )
          )

          /* Pages Analyzed */
          , React.createElement('div', { className: "col-xl-4 col-lg-6 d-flex"  }
            , React.createElement('div', { className: "card flex-fill" }
              , React.createElement('div', { className: "card-header border-0 d-flex align-items-center"    }
                , React.createElement('h6', { className: "mb-0 d-flex align-items-center"  }
                  , React.createElement('span', { className: "avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center"         }
                    , React.createElement('i', { className: "isax isax-folder fs-18"  })
                  ), "Pages Analyzed"

                )
              )
              , React.createElement('div', { className: "card-body"}
                , React.createElement('div', { className: "row g-3" }
                  , React.createElement('div', { className: "col-6"}
                    , React.createElement('div', { className: "d-flex align-items-center mb-2"  }
                      , React.createElement('i', { className: "isax isax-folder text-primary me-2"   })
                      , React.createElement('span', { className: "fs-13"}, "Total Pages" )
                    )
                    , React.createElement('p', { className: "fw-semibold mb-2" }, "856")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "200 Code" )
                    , React.createElement('p', { className: "fw-medium mb-1" }, "812")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "301 Code" )
                    , React.createElement('p', { className: "fw-medium mb-1" }, "23")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "404 Code" )
                    , React.createElement('p', { className: "fw-medium mb-1" }, "9")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "500 Code" )
                    , React.createElement('p', { className: "fw-medium mb-0" }, "12")
                  )
                  , React.createElement('div', { className: "col-6"}
                    , React.createElement('div', { className: "d-flex align-items-center mb-2"  }
                      , React.createElement('i', { className: "isax isax-document-text text-primary me-2"   })
                      , React.createElement('span', { className: "fs-13"}, "Status codes" )
                    )
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "200 Code" )
                    , React.createElement('p', { className: "fw-medium mb-2" }, "812")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "301 Code" )
                    , React.createElement('p', { className: "fw-medium mb-2" }, "23")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "404 Code" )
                    , React.createElement('p', { className: "fw-medium mb-2" }, "9")
                    , React.createElement('p', { className: "fs-13 text-muted mb-1"  }, "500 Code" )
                    , React.createElement('p', { className: "fw-medium mb-0" }, "12")
                  )
                )
              )
            )
          )

          /* SEO Health */
          , React.createElement('div', { className: "col-xl-4 col-lg-6 d-flex"  }
            , React.createElement('div', { className: "card flex-fill" }
              , React.createElement('div', { className: "card-header border-0 d-flex align-items-center"    }
                , React.createElement('h6', { className: "mb-0 d-flex align-items-center"  }
                  , React.createElement('span', { className: "avatar avatar-36 avatar-rounded bg-warning-subtle text-warning flex-shrink-0 me-2 d-flex align-items-center justify-content-center"         }
                    , React.createElement('i', { className: "isax isax-search-normal fs-18"  })
                  ), "SEO Health"

                )
              )
              , React.createElement('div', { className: "card-body"}
                , React.createElement('ul', { className: "list-unstyled mb-0" }
                  , SEO_HEALTH_ISSUES.map((issue) => (
                    React.createElement('li', { key: issue.slug, className: "border-bottom border-light" }
                      , React.createElement(Link, { to: `/domain/audit/seo-health/${issue.slug}`,
                        className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }

                        , React.createElement('span', { className: "d-flex align-items-center" }
                          , React.createElement('i', { className: "isax isax-document-text text-muted me-2"   })
                          , React.createElement('span', { className: "fs-13"}, issue.label)
                        )
                        , React.createElement('span', { className: "fw-medium"}, issue.count, " " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                      )
                    )
                  ))
                )
              )
            )
          )

          /* Response Status - Card 1 */
          , React.createElement('div', { className: "col-xl-6 col-lg-6 d-flex"  }
            , React.createElement('div', { className: "card flex-fill" }
              , React.createElement('div', { className: "card-header border-0 d-flex align-items-center"    }
                , React.createElement('h6', { className: "mb-0 d-flex align-items-center"  }
                  , React.createElement('span', { className: "avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center"         }
                    , React.createElement('i', { className: "isax isax-refresh fs-18"  })
                  ), "Response Status"

                )
              )
              , React.createElement('div', { className: "card-body"}
                , React.createElement('ul', { className: "list-unstyled mb-0" }
                  , React.createElement('li', { key: "valid-urls", className: "border-bottom border-light" }
                    , React.createElement(Link, { to: "/domain/audit/response-status/valid-urls", className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }
                      , React.createElement('span', { className: "fs-13"}, "Valid URLs" )
                      , React.createElement('span', { className: "fw-medium"}, "812 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                    )
                  )
                  , React.createElement('li', { key: "200", className: "border-bottom border-light" }
                    , React.createElement(Link, { to: "/domain/audit/response-status/200", className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }
                      , React.createElement('span', { className: "fs-13"}, "200 Code" )
                      , React.createElement('span', { className: "fw-medium"}, "426 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                    )
                  )
                  , React.createElement('li', { key: "301", className: "border-bottom border-light" }
                    , React.createElement(Link, { to: "/domain/audit/response-status/301", className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }
                      , React.createElement('span', { className: "fs-13"}, "301 Code" )
                      , React.createElement('span', { className: "fw-medium"}, "23 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                    )
                  )
                  , React.createElement('li', { key: "404", className: "border-bottom border-light" }
                    , React.createElement(Link, { to: "/domain/audit/response-status/404", className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }
                      , React.createElement('span', { className: "fs-13"}, "404 Code" )
                      , React.createElement('span', { className: "fw-medium"}, "9 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                    )
                  )
                  , React.createElement('li', { key: "500" }
                    , React.createElement(Link, { to: "/domain/audit/response-status/500", className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none"     }
                      , React.createElement('span', { className: "fs-13"}, "500 Code" )
                      , React.createElement('span', { className: "fw-medium"}, "12 " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                    )
                  )
                )
              )
            )
          )

          /* Response Status - Card 2 (summary) */
          , React.createElement('div', { className: "col-xl-6 col-lg-6 d-flex"  }
            , React.createElement('div', { className: "card flex-fill" }
              , React.createElement('div', { className: "card-header border-0 d-flex align-items-center"    }
                , React.createElement('h6', { className: "mb-0 d-flex align-items-center"  }
                  , React.createElement('span', { className: "avatar avatar-36 avatar-rounded bg-primary-subtle text-primary flex-shrink-0 me-2 d-flex align-items-center justify-content-center"         }
                    , React.createElement('i', { className: "isax isax-refresh fs-18"  })
                  ), "Spell Checker"

                )
              )
              , React.createElement('div', { className: "card-body"}
                , React.createElement('ul', { className: "list-unstyled mb-0" }
                  , SPELL_CHECKER_SLUGS_ORDER.map((slug, index) => {
                    const cfg = SPELL_CHECKER_AUDIT_CONFIG[slug];
                    if (!cfg) return null;
                    const isLast = index === SPELL_CHECKER_SLUGS_ORDER.length - 1;
                    return React.createElement('li', {
                      key: slug,
                      className: isLast
                        ? ""
                        : "border-bottom border-light",
                    }
                      , React.createElement(Link, {
                        to: `/domain/audit/spell-checker/${slug}`,
                        className: "d-flex align-items-center justify-content-between py-2 text-body text-decoration-none",
                      }
                        , React.createElement('span', { className: "fs-13"}, cfg.title)
                        , React.createElement('span', { className: "fw-medium"}, cfg.affectedCount, " " , React.createElement('i', { className: "isax isax-arrow-right-3 fs-10 ms-1"   }))
                      )
                    );
                  })
                )
              )
            )
          )
        )
      )
    )
  );
}
