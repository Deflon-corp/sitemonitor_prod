import React, { useEffect, useState } from "react";
import CreatePolicyContentTypeView from "./CreatePolicyContentTypeView";
import CreatePolicyAllAssetsView from "./CreatePolicyAllAssetsView";
import CreatePolicyHtmlPagesView from "./CreatePolicyHtmlPagesView";
import CreatePolicyDocumentsView from "./CreatePolicyDocumentsView";

import PREDEFINED_POLICIES from "../../data/defaultRules.json";

const NewPolicyDrawer = ({ open, onClose, variant = "drawer", policyId = null, readOnly = false }) => {
  const isPage = variant === "page";
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [drawerView, setDrawerView] = useState("grid");
  const [selectedPredefinedPolicy, setSelectedPredefinedPolicy] = useState(null);

  const getInitialRule = (policy) => {
    if (policy.ruleConfig) {
      return {
        ...policy.ruleConfig,
        id: Date.now()
      };
    }

    let type = "text";
    if (policy?.icon?.includes("image")) type = "image-size";
    else if (policy?.icon?.includes("link")) type = "link";
    else if (policy?.icon?.includes("document-text") || policy?.icon?.includes("text")) type = "text";
    
    const baseRule = {
      id: Date.now(),
      type: type,
      ruleName: policy?.title || "New Rule",
    };

    if (type === "image-size") {
      return {
        ...baseRule,
        comparison: "Greater than",
        value: "",
        unit: "KB"
      };
    } else if (type === "link") {
      return {
        ...baseRule,
        searchType: "Starts with",
        searchValue: "",
        containing: "containing"
      };
    } else {
      return {
        ...baseRule,
        searchType: "Contains Words",
        searchValue: "",
        containing: "containing",
        selectors: []
      };
    }
  };

  const filteredPolicies = PREDEFINED_POLICIES.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (policyId) onClose();
        else if (drawerView === "all-assets" || drawerView === "html-pages" || drawerView === "documents") setDrawerView("create");
        else if (drawerView === "create") setDrawerView("grid");
        else onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, drawerView, policyId]);

  useEffect(() => {
    if (!open) {
      setDrawerView("grid");
    } else if (policyId) {
      setDrawerView("all-assets");
    }
  }, [open, policyId]);

  const handleContentTypeNext = (contentType) => {
    if (contentType === "all") setDrawerView("all-assets");
    else if (contentType === "html") setDrawerView("html-pages");
    else if (contentType === "documents") setDrawerView("documents");
    else setDrawerView("grid");
  };

  if (!open) return null;

  const panel = (
    <div
      key="new-policy-panel"
      className={isPage
        ? "bg-white d-flex flex-column overflow-hidden rounded-3 border border-secondary border-opacity-25 shadow-sm w-100"
        : "bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column overflow-hidden"}
      style={isPage
        ? { minHeight: "min(85vh, 920px)" }
        : { zIndex: 1065, width: "min(100%, 1200px)" }}
      role={isPage ? "region" : "dialog"}
      aria-modal={isPage ? undefined : "true"}
      aria-labelledby="new-policy-drawer-title"
    >
      {/* Header */}
      <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
        <div className={`d-flex align-items-center justify-content-between gap-3 ${drawerView === "grid" ? "mb-3" : ""}`}>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="isax isax-close-circle fs-20" aria-hidden="true" />
            </button>
            <h5 id="new-policy-drawer-title" className="mb-0 fw-semibold text-body">New Policy</h5>
          </div>
          {drawerView === "grid" && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted fs-13 d-none d-sm-inline">Filter</span>
              <button type="button" className="btn btn-sm btn-light" aria-label="Filter">
                <i className="isax isax-filter fs-18" aria-hidden="true" />
              </button>
              <span className="text-muted fs-13 d-none d-sm-inline ms-2">View</span>
              <div className="btn-group btn-group-sm" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-light"}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <i className="isax isax-element-3 fs-18" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === "list" ? "btn-primary" : "btn-light"}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <i className="isax isax-menu fs-18" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
        {drawerView === "grid" && (
          <input
            type="search"
            className="form-control"
            placeholder="Search for a predefined policy in the Policy Exchange Center"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search policies"
          />
        )}
      </div>

      {/* Body */}
      {drawerView === "all-assets" ? (
        <CreatePolicyAllAssetsView 
          onBack={policyId ? onClose : () => {
            setDrawerView("create");
            setSelectedPredefinedPolicy(null);
          }} 
          onSuccess={onClose}
          policyId={policyId} 
          readOnly={readOnly}
          initialData={selectedPredefinedPolicy ? { title: selectedPredefinedPolicy.title, rules: [getInitialRule(selectedPredefinedPolicy)] } : null}
        />
      ) : drawerView === "html-pages" ? (
        <CreatePolicyHtmlPagesView onBack={() => setDrawerView("create")} onSuccess={onClose} />
      ) : drawerView === "documents" ? (
        <CreatePolicyDocumentsView onBack={() => setDrawerView("create")} onSuccess={onClose} />
      ) : drawerView === "create" ? (
        <CreatePolicyContentTypeView
          onBack={() => setDrawerView("grid")}
          onNext={handleContentTypeNext}
        />
      ) : (
        <div className="flex-grow-1 overflow-auto p-4">
          <div className={viewMode === "grid" ? "row g-3" : "d-flex flex-column gap-2"}>
            {/* Create your own policy card */}
            <div className={viewMode === "grid" ? "col-12 col-sm-6 col-lg-4" : ""}>
              <div
                className="card h-100 border-2 border-primary border-opacity-25 border-dashed bg-transparent"
                style={{ minHeight: viewMode === "grid" ? 140 : "auto", cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onClick={() => setDrawerView("create")}
                onKeyDown={(e) => e.key === "Enter" && setDrawerView("create")}
              >
                <div className="card-body d-flex flex-column justify-content-center align-items-center text-center py-4">
                  <span className="text-primary fw-semibold fs-13">Create your own policy</span>
                  <span className="text-muted fs-12 mt-1">Build it from scratch</span>
                </div>
              </div>
            </div>

            {/* Predefined policy cards */}
            {filteredPolicies.map((policy) => (
              <div key={policy.id} className={viewMode === "grid" ? "col-12 col-sm-6 col-lg-4 col-xl-3" : ""}>
                <div className="card border border-secondary border-opacity-25 shadow-sm h-100 position-relative">
                  {policy.isNew && (
                    <span className="position-absolute top-0 end-0 badge bg-danger rounded-0 rounded-start px-2 py-1 fs-11 text-white">New</span>
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span className="avatar avatar-32 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                        <i className={`isax ${policy.icon} fs-16`} aria-hidden="true" />
                      </span>
                      <p className="text-body fs-13 mb-0 flex-grow-1">{policy.title}</p>
                    </div>
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedPredefinedPolicy(policy);
                          setDrawerView("all-assets");
                        }}
                      >
                        Add Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredPolicies.length === 0 && (
            <p className="text-muted text-center py-4 mb-0">No policies match your search.</p>
          )}
        </div>
      )}
    </div>
  );

  if (isPage) {
    return panel;
  }

  return (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: 1060 }}
        aria-hidden="true"
        onClick={onClose}
      />
      {panel}
    </>
  );
};

export default NewPolicyDrawer;
