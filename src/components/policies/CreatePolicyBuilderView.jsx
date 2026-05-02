import React, { useState, useRef, useEffect } from "react";
import AddRuleToPolicyView from "./AddRuleToPolicyView";
import NewRulePageHtmlDrawer from "./NewRulePageHtmlDrawer";
import NewRuleTextDrawer from "./NewRuleTextDrawer";
import NewRulePageTitleDrawer from "./NewRulePageTitleDrawer";
import NewRulePageTitleLengthDrawer from "./NewRulePageTitleLengthDrawer";
import NewRulePageUrlDrawer from "./NewRulePageUrlDrawer";
import NewRuleLinkDrawer from "./NewRuleLinkDrawer";
import NewRuleLinkTextDrawer from "./NewRuleLinkTextDrawer";
import NewRuleLinkTextLengthDrawer from "./NewRuleLinkTextLengthDrawer";
import NewRuleFileSizeDrawer from "./NewRuleFileSizeDrawer";
import NewRuleImageSizeDrawer from "./NewRuleImageSizeDrawer";
import NewRuleImageTextDrawer from "./NewRuleImageTextDrawer";
import NewRuleImageTextLengthDrawer from "./NewRuleImageTextLengthDrawer";
import NewRuleExternalLinkCountDrawer from "./NewRuleExternalLinkCountDrawer";
import NewRuleIncomingLinkCountDrawer from "./NewRuleIncomingLinkCountDrawer";
import NewRuleHeadingTextDrawer from "./NewRuleHeadingTextDrawer";
import NewRuleHeaderTextLengthDrawer from "./NewRuleHeaderTextLengthDrawer";
import NewRuleReadabilityLevelDrawer from "./NewRuleReadabilityLevelDrawer";
import NewRuleMetaHeaderDrawer from "./NewRuleMetaHeaderDrawer";
import NewRuleMetaHeaderLengthDrawer from "./NewRuleMetaHeaderLengthDrawer";

const AVAILABLE_DOMAINS = [
  { id: "1", label: "Bajaj FinServ -500" },
  { id: "2", label: "aarogyaabharat.com" },
  { id: "3", label: "gmdindia.com" },
  { id: "4", label: "metoraa.com" },
];

/** Rule ids for Documents: exclude Page html, Image size, Image text, Image text length, Link text, Link text length, Readability level. */
const DOCUMENTS_RULE_IDS = [
  "text",
  "page-title",
  "page-title-length",
  "page-url",
  "link",
  "file-size",
  "external-link-count",
  "incoming-link-count",
  "heading-text",
  "header-text-length",
  "meta-header",
  "meta-header-length",
];

/** Shared policy builder UI: Settings, Add rule to policy, drop zone, and all rule drawers. Used by All assets, HTML pages, and Documents. */
const CreatePolicyBuilderView = ({ onBack, contentType }) => {
  const [leftTab, setLeftTab] = useState("settings");
  const [displayAs, setDisplayAs] = useState("unwanted");
  const [priority, setPriority] = useState("Low");
  const [scheduled, setScheduled] = useState(true);
  const [applyScope, setApplyScope] = useState("domains");
  const [ruleOperator, setRuleOperator] = useState("or");
  const [selectedDomains, setSelectedDomains] = useState([{ id: "1", label: "Bajaj FinServ -500" }]);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const [newRuleDrawerOpen, setNewRuleDrawerOpen] = useState(false);
  const [newRuleTextDrawerOpen, setNewRuleTextDrawerOpen] = useState(false);
  const [newRulePageTitleDrawerOpen, setNewRulePageTitleDrawerOpen] = useState(false);
  const [newRulePageTitleLengthDrawerOpen, setNewRulePageTitleLengthDrawerOpen] = useState(false);
  const [newRulePageUrlDrawerOpen, setNewRulePageUrlDrawerOpen] = useState(false);
  const [newRuleLinkDrawerOpen, setNewRuleLinkDrawerOpen] = useState(false);
  const [newRuleLinkTextDrawerOpen, setNewRuleLinkTextDrawerOpen] = useState(false);
  const [newRuleLinkTextLengthDrawerOpen, setNewRuleLinkTextLengthDrawerOpen] = useState(false);
  const [newRuleFileSizeDrawerOpen, setNewRuleFileSizeDrawerOpen] = useState(false);
  const [newRuleImageSizeDrawerOpen, setNewRuleImageSizeDrawerOpen] = useState(false);
  const [newRuleImageTextDrawerOpen, setNewRuleImageTextDrawerOpen] = useState(false);
  const [newRuleImageTextLengthDrawerOpen, setNewRuleImageTextLengthDrawerOpen] = useState(false);
  const [newRuleExternalLinkCountDrawerOpen, setNewRuleExternalLinkCountDrawerOpen] = useState(false);
  const [newRuleIncomingLinkCountDrawerOpen, setNewRuleIncomingLinkCountDrawerOpen] = useState(false);
  const [newRuleHeadingTextDrawerOpen, setNewRuleHeadingTextDrawerOpen] = useState(false);
  const [newRuleHeaderTextLengthDrawerOpen, setNewRuleHeaderTextLengthDrawerOpen] = useState(false);
  const [newRuleReadabilityLevelDrawerOpen, setNewRuleReadabilityLevelDrawerOpen] = useState(false);
  const [newRuleMetaHeaderDrawerOpen, setNewRuleMetaHeaderDrawerOpen] = useState(false);
  const [newRuleMetaHeaderLengthDrawerOpen, setNewRuleMetaHeaderLengthDrawerOpen] = useState(false);
  const domainDropdownRef = useRef(null);
  const dropZoneRef = useRef(null);

  const removeDomain = (id) => {
    setSelectedDomains((prev) => prev.filter((d) => d.id !== id));
  };

  const addDomain = (domain) => {
    if (selectedDomains.some((d) => d.id === domain.id)) return;
    setSelectedDomains((prev) => [...prev, domain]);
    setDomainDropdownOpen(false);
    setDomainSearch("");
  };

  const dropdownDomains = AVAILABLE_DOMAINS.filter((d) =>
    d.label.toLowerCase().includes(domainSearch.toLowerCase().trim())
  );
  const isSelected = (id) => selectedDomains.some((s) => s.id === id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (domainDropdownRef.current && !domainDropdownRef.current.contains(e.target)) {
        setDomainDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
      <div className="flex-grow-1 overflow-auto d-flex min-h-0">
        <div className="flex-shrink-0 border-end border-secondary border-opacity-25 p-4 d-flex flex-column" style={{ width: 400, minHeight: "140vh" }}>
          <div className="d-flex flex-column gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 text-start ${leftTab === "settings" ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
              onClick={() => setLeftTab("settings")}
            >
              <i className="isax isax-setting-2 fs-18" aria-hidden="true" /> Settings
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 text-start ${leftTab === "add-rule" ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
              onClick={() => setLeftTab("add-rule")}
            >
              <i className="isax isax-add-circle fs-18" aria-hidden="true" /> Add rule to the policy
            </button>
          </div>

          {leftTab === "settings" && (
            <>
              <p className="text-body fs-13 fw-semibold mb-2">Display this policy as:</p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  { key: "unwanted", label: "Unwanted", icon: "isax-close-circle" },
                  { key: "required", label: "Required", icon: "isax-danger" },
                  { key: "matches", label: "Matches", icon: "isax-search-normal-1" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1 ${displayAs === opt.key ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
                    onClick={() => setDisplayAs(opt.key)}
                  >
                    <i className={`isax ${opt.icon} fs-16`} aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="form-label text-body fs-13 mb-1">Priority</label>
              <select
                className="form-select form-select-sm mb-4"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <div className="mb-4">
                <p className="text-body fs-13 fw-semibold mb-2 d-flex align-items-center gap-1">
                  <i className="isax isax-clock fs-16" aria-hidden="true" /> Scheduled
                </p>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="policyScheduled"
                    checked={scheduled}
                    onChange={(e) => setScheduled(e.target.checked)}
                  />
                  <label className="form-check-label fs-13 text-muted" htmlFor="policyScheduled">
                    Do you want the policy to run every time your website is crawled?
                  </label>
                </div>
              </div>

              <p className="text-body fs-13 fw-semibold mb-2">Choose where the policy should apply</p>
              <div className="d-flex flex-column gap-2 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="applyScope"
                    id="applyGlobal"
                    checked={applyScope === "global"}
                    onChange={() => setApplyScope("global")}
                  />
                  <label className="form-check-label fs-13" htmlFor="applyGlobal">Global - All Domains</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="applyScope"
                    id="applyDomains"
                    checked={applyScope === "domains"}
                    onChange={() => setApplyScope("domains")}
                  />
                  <label className="form-check-label fs-13" htmlFor="applyDomains">Choose domains</label>
                </div>
              </div>

              {applyScope === "domains" && (
                <div className="position-relative" ref={domainDropdownRef}>
                  <label className="form-label text-body fs-13 mb-1">Select domains and groups</label>
                  <div className="d-flex gap-3 align-items-flex-start flex-wrap">
                    <div className="flex-shrink-0 position-relative" style={{ width: 220 }}>
                      <input
                        type="text"
                        className="form-control form-control-sm border border-primary border-opacity-25 rounded-2"
                        placeholder="Choose domains"
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        onFocus={() => setDomainDropdownOpen(true)}
                        aria-label="Choose domains"
                        aria-expanded={domainDropdownOpen}
                        aria-haspopup="listbox"
                      />
                      {domainDropdownOpen && (
                        <ul
                          className="position-absolute start-0 end-0 mt-1 list-unstyled bg-white border border-secondary border-opacity-25 rounded-2 shadow-sm py-1 mb-0 overflow-auto"
                          style={{ maxHeight: 240, zIndex: 1050 }}
                          role="listbox"
                        >
                          {dropdownDomains.length === 0 ? (
                            <li className="px-3 py-2 text-muted fs-13">No matching domains</li>
                          ) : (
                            dropdownDomains.map((d) => {
                              const selected = isSelected(d.id);
                              return (
                                <li key={d.id} role="option" aria-selected={selected}>
                                  <button
                                    type="button"
                                    className={`btn btn-link w-100 text-start text-decoration-none d-flex align-items-center justify-content-start gap-2 py-2 px-3 fs-13 ${selected ? "text-muted" : "text-body"}`}
                                    onClick={() => !selected && addDomain(d)}
                                    disabled={selected}
                                  >
                                    <span className="avatar avatar-24 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                                      <i className="isax isax-global fs-14" aria-hidden="true" />
                                    </span>
                                    {d.label}
                                    {selected && (
                                      <span className="ms-auto fs-12 text-primary">
                                        <i className="isax isax-tick-circle" aria-hidden="true" />
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center flex-grow-1 min-w-0">
                      {selectedDomains.length === 0 ? (
                        <span className="text-muted fs-13">Selected domains appear here</span>
                      ) : (
                        selectedDomains.map((d) => (
                          <span
                            key={d.id}
                            className="badge bg-primary text-white rounded-pill d-inline-flex align-items-center gap-1 fw-normal"
                            style={{ padding: "2px 6px 2px 8px", fontSize: "0.75rem" }}
                          >
                            <span className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-white bg-opacity-25" style={{ width: 16, height: 16 }}>
                              <i className="isax isax-global text-white" style={{ fontSize: "0.6rem" }} aria-hidden="true" />
                            </span>
                            <span className="text-nowrap" style={{ fontSize: "0.75rem" }}>{d.label}</span>
                            <button
                              type="button"
                              className="btn btn-link p-0 border-0 text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                              style={{ fontSize: "0.65rem", width: 14, height: 14, minWidth: 14 }}
                              onClick={(e) => { e.stopPropagation(); removeDomain(d.id); }}
                              aria-label={`Remove ${d.label}`}
                            >
                              <i className="isax isax-close-circle" aria-hidden="true" />
                            </button>
                          </span>
                        )))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {leftTab === "add-rule" && (
            <AddRuleToPolicyView
              allowedRuleIds={contentType === "documents" ? DOCUMENTS_RULE_IDS : undefined}
            />
          )}
        </div>

        <div
          className="flex-grow-1 min-w-0 p-4 overflow-auto"
          onDragEnter={() => {
            dropZoneRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
          }}
        >
          <h6 className="fw-semibold text-body mb-3">Policy rules</h6>
          <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
            <span className="text-muted fs-13">Rule operator</span>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="ruleOp"
                id="ruleOr"
                checked={ruleOperator === "or"}
                onChange={() => setRuleOperator("or")}
              />
              <label className="form-check-label fs-13" htmlFor="ruleOr">Or</label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="ruleOp"
                id="ruleAnd"
                checked={ruleOperator === "and"}
                onChange={() => setRuleOperator("and")}
              />
              <label className="form-check-label fs-13" htmlFor="ruleAnd">And</label>
            </div>
          </div>
          <div
            ref={dropZoneRef}
            className="border-2 border-secondary border-opacity-25 border-dashed rounded-3 d-flex align-items-center justify-content-center bg-light bg-opacity-25 min-vh-50"
            style={{ minHeight: 280 }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={(e) => {
              e.preventDefault();
              const ruleId = e.dataTransfer.getData("rule-id");
              if (ruleId === "page-html") setNewRuleDrawerOpen(true);
              if (ruleId === "text") setNewRuleTextDrawerOpen(true);
              if (ruleId === "page-title") setNewRulePageTitleDrawerOpen(true);
              if (ruleId === "page-title-length") setNewRulePageTitleLengthDrawerOpen(true);
              if (ruleId === "page-url") setNewRulePageUrlDrawerOpen(true);
              if (ruleId === "link") setNewRuleLinkDrawerOpen(true);
              if (ruleId === "link-text") setNewRuleLinkTextDrawerOpen(true);
              if (ruleId === "link-text-length") setNewRuleLinkTextLengthDrawerOpen(true);
              if (ruleId === "file-size") setNewRuleFileSizeDrawerOpen(true);
              if (ruleId === "image-size") setNewRuleImageSizeDrawerOpen(true);
              if (ruleId === "image-text") setNewRuleImageTextDrawerOpen(true);
              if (ruleId === "image-text-length") setNewRuleImageTextLengthDrawerOpen(true);
              if (ruleId === "external-link-count") setNewRuleExternalLinkCountDrawerOpen(true);
              if (ruleId === "incoming-link-count") setNewRuleIncomingLinkCountDrawerOpen(true);
              if (ruleId === "heading-text") setNewRuleHeadingTextDrawerOpen(true);
              if (ruleId === "header-text-length") setNewRuleHeaderTextLengthDrawerOpen(true);
              if (ruleId === "readability-level") setNewRuleReadabilityLevelDrawerOpen(true);
              if (ruleId === "meta-header") setNewRuleMetaHeaderDrawerOpen(true);
              if (ruleId === "meta-header-length") setNewRuleMetaHeaderLengthDrawerOpen(true);
            }}
          >
            <button
              type="button"
              className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-2 fs-13"
              onClick={() => setLeftTab("add-rule")}
            >
              <i className="isax isax-add-circle fs-20" aria-hidden="true" /> Add rule to policy
            </button>
          </div>
        </div>
      </div>

      <div className="border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-white">
        <div className="d-flex justify-content-end align-items-center gap-2">
          <button type="button" className="btn rounded-2 border border-primary border-opacity-25 bg-white text-primary" onClick={onBack}>
            <i className="isax isax-arrow-left-1 me-1" aria-hidden="true" /> Previous
          </button>
          <button
            type="button"
            className="btn rounded-2 bg-primary text-white border-0 d-flex align-items-center gap-1"
            onClick={() => setLeftTab("add-rule")}
          >
            <i className="isax isax-add-circle fs-18" aria-hidden="true" /> Add rule to the policy
          </button>
        </div>
      </div>

      <NewRulePageHtmlDrawer open={newRuleDrawerOpen} onClose={() => setNewRuleDrawerOpen(false)} onSave={() => {}} />
      <NewRuleTextDrawer open={newRuleTextDrawerOpen} onClose={() => setNewRuleTextDrawerOpen(false)} onSave={() => {}} />
      <NewRulePageTitleDrawer open={newRulePageTitleDrawerOpen} onClose={() => setNewRulePageTitleDrawerOpen(false)} onSave={() => {}} />
      <NewRulePageTitleLengthDrawer open={newRulePageTitleLengthDrawerOpen} onClose={() => setNewRulePageTitleLengthDrawerOpen(false)} onSave={() => {}} />
      <NewRulePageUrlDrawer open={newRulePageUrlDrawerOpen} onClose={() => setNewRulePageUrlDrawerOpen(false)} onSave={() => {}} />
      <NewRuleLinkDrawer open={newRuleLinkDrawerOpen} onClose={() => setNewRuleLinkDrawerOpen(false)} onSave={() => {}} />
      <NewRuleLinkTextDrawer open={newRuleLinkTextDrawerOpen} onClose={() => setNewRuleLinkTextDrawerOpen(false)} onSave={() => {}} />
      <NewRuleLinkTextLengthDrawer open={newRuleLinkTextLengthDrawerOpen} onClose={() => setNewRuleLinkTextLengthDrawerOpen(false)} onSave={() => {}} />
      <NewRuleFileSizeDrawer open={newRuleFileSizeDrawerOpen} onClose={() => setNewRuleFileSizeDrawerOpen(false)} onSave={() => {}} />
      <NewRuleImageSizeDrawer open={newRuleImageSizeDrawerOpen} onClose={() => setNewRuleImageSizeDrawerOpen(false)} onSave={() => {}} />
      <NewRuleImageTextDrawer open={newRuleImageTextDrawerOpen} onClose={() => setNewRuleImageTextDrawerOpen(false)} onSave={() => {}} />
      <NewRuleImageTextLengthDrawer open={newRuleImageTextLengthDrawerOpen} onClose={() => setNewRuleImageTextLengthDrawerOpen(false)} onSave={() => {}} />
      <NewRuleExternalLinkCountDrawer open={newRuleExternalLinkCountDrawerOpen} onClose={() => setNewRuleExternalLinkCountDrawerOpen(false)} onSave={() => {}} />
      <NewRuleIncomingLinkCountDrawer open={newRuleIncomingLinkCountDrawerOpen} onClose={() => setNewRuleIncomingLinkCountDrawerOpen(false)} onSave={() => {}} />
      <NewRuleHeadingTextDrawer open={newRuleHeadingTextDrawerOpen} onClose={() => setNewRuleHeadingTextDrawerOpen(false)} onSave={() => {}} />
      <NewRuleHeaderTextLengthDrawer open={newRuleHeaderTextLengthDrawerOpen} onClose={() => setNewRuleHeaderTextLengthDrawerOpen(false)} onSave={() => {}} />
      <NewRuleReadabilityLevelDrawer open={newRuleReadabilityLevelDrawerOpen} onClose={() => setNewRuleReadabilityLevelDrawerOpen(false)} onSave={() => {}} />
      <NewRuleMetaHeaderDrawer open={newRuleMetaHeaderDrawerOpen} onClose={() => setNewRuleMetaHeaderDrawerOpen(false)} onSave={() => {}} />
      <NewRuleMetaHeaderLengthDrawer open={newRuleMetaHeaderLengthDrawerOpen} onClose={() => setNewRuleMetaHeaderLengthDrawerOpen(false)} onSave={() => {}} />
    </div>
  );
};

export default CreatePolicyBuilderView;
