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
import { getDomainsApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import { getDomainLabel } from "@/layouts/Sidebar";
import {
  createPolicyApi,
  getPolicyByIdApi,
  updatePolicyApi,
} from "@/api/policyApi";
import { showToast } from "@/components/common/alerts/ToastAlert";
import PREDEFINED_POLICIES from "../../data/defaultRules.json";

/** Hardcoded domains removed for API integration */

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
const CreatePolicyBuilderView = ({
  onBack,
  onSuccess,
  contentType,
  policyId,
  readOnly,
  initialData,
}) => {
  const [leftTab, setLeftTab] = useState("settings");
  const [title, setTitle] = useState(initialData?.title || "");
  const [displayAs, setDisplayAs] = useState("unwanted");

  const [priority, setPriority] = useState("Low");
  const [scheduled, setScheduled] = useState(true);
  const [applyScope, setApplyScope] = useState("domains");
  const [ruleOperator, setRuleOperator] = useState("or");
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rules, setRules] = useState(initialData?.rules || []);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);
  const [defaultRuleSearch, setDefaultRuleSearch] = useState("");

  useEffect(() => {
    if (policyId) {
      const fetchPolicy = async () => {
        setIsLoadingPolicy(true);
        try {
          const res = await getPolicyByIdApi(policyId);
          if (res.success && res.data) {
            const data = res.data;
            setTitle(data.title || "");
            setDisplayAs(data.category || "matches");
            setPriority(data.priority || "Low");
            setScheduled(data.scheduled ?? true);
            setApplyScope(data.isGlobal ? "global" : "domains");
            setRuleOperator(data.ruleOperator || "or");
            setRules(data.rules || []);
            // TODO: Match domainIds with availableDomains once domains load.
            // Simplified for now.
          }
        } catch (err) {
          showToast("Failed to load policy details", "error");
        } finally {
          setIsLoadingPolicy(false);
        }
      };
      fetchPolicy();
    }
  }, [policyId]);

  const [activeRuleType, setActiveRuleType] = useState(null);

  const handleRuleSave = (ruleData) => {
    if (readOnly) return;
    const isDuplicate = rules.some(
      (r) =>
        r.ruleName.toLowerCase() === ruleData.ruleName.toLowerCase() &&
        r.id !== editingRuleId,
    );
    if (isDuplicate) {
      showToast("A rule with this name already exists in this policy", "error");
      return;
    }

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRuleId
            ? { ...ruleData, type: activeRuleType, id: editingRuleId }
            : r,
        ),
      );
      setEditingRuleId(null);
    } else {
      setRules((prev) => [
        ...prev,
        { ...ruleData, type: activeRuleType, id: Date.now() },
      ]);
    }
    setActiveRuleType(null);
  };

  const openRuleDrawer = (type) => {
    if (readOnly) return;
    setActiveRuleType(type);
    if (type === "page-html") setNewRuleDrawerOpen(true);
    if (type === "text") setNewRuleTextDrawerOpen(true);
    if (type === "page-title") setNewRulePageTitleDrawerOpen(true);
    if (type === "page-title-length") setNewRulePageTitleLengthDrawerOpen(true);
    if (type === "page-url") setNewRulePageUrlDrawerOpen(true);
    if (type === "link") setNewRuleLinkDrawerOpen(true);
    if (type === "link-text") setNewRuleLinkTextDrawerOpen(true);
    if (type === "link-text-length") setNewRuleLinkTextLengthDrawerOpen(true);
    if (type === "file-size") setNewRuleFileSizeDrawerOpen(true);
    if (type === "image-size") setNewRuleImageSizeDrawerOpen(true);
    if (type === "image-text") setNewRuleImageTextDrawerOpen(true);
    if (type === "image-text-length") setNewRuleImageTextLengthDrawerOpen(true);
    if (type === "external-link-count")
      setNewRuleExternalLinkCountDrawerOpen(true);
    if (type === "incoming-link-count")
      setNewRuleIncomingLinkCountDrawerOpen(true);
    if (type === "heading-text") setNewRuleHeadingTextDrawerOpen(true);
    if (type === "header-text-length")
      setNewRuleHeaderTextLengthDrawerOpen(true);
    if (type === "readability-level")
      setNewRuleReadabilityLevelDrawerOpen(true);
    if (type === "meta-header") setNewRuleMetaHeaderDrawerOpen(true);
    if (type === "meta-header-length")
      setNewRuleMetaHeaderLengthDrawerOpen(true);
  };

  const removeRule = (id) => {
    if (readOnly) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const editRule = (rule) => {
    if (readOnly) return;
    setEditingRuleId(rule.id);
    openRuleDrawer(rule.type);
  };

  const handleSave = async () => {
    if (readOnly) return;

    if (!title.trim()) {
      showToast("Please enter a policy title", "error");
      return;
    }

    if (rules.length === 0) {
      showToast("Please add at least one rule to the policy", "error");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title: title.trim(),
        category: displayAs,
        priority: priority,
        scheduled: scheduled,
        domainIds:
          applyScope === "domains" ? selectedDomains.map((d) => d.id) : [],
        isGlobal: applyScope === "global",
        rules: rules,
        ruleOperator: ruleOperator,
      };

      let res;
      if (policyId) {
        res = await updatePolicyApi(policyId, payload);
      } else {
        res = await createPolicyApi(payload);
      }

      if (res.success) {
        showToast(
          policyId
            ? "Policy updated successfully!"
            : "Policy created successfully!",
        );
        if (onSuccess) onSuccess();
        else if (onBack) onBack();
      }
    } catch (err) {
      console.error("Failed to save policy:", err);
      showToast(
        err.response?.data?.message || "Failed to save policy",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [newRuleDrawerOpen, setNewRuleDrawerOpen] = useState(false);
  const [newRuleTextDrawerOpen, setNewRuleTextDrawerOpen] = useState(false);
  const [newRulePageTitleDrawerOpen, setNewRulePageTitleDrawerOpen] =
    useState(false);
  const [
    newRulePageTitleLengthDrawerOpen,
    setNewRulePageTitleLengthDrawerOpen,
  ] = useState(false);
  const [newRulePageUrlDrawerOpen, setNewRulePageUrlDrawerOpen] =
    useState(false);
  const [newRuleLinkDrawerOpen, setNewRuleLinkDrawerOpen] = useState(false);
  const [newRuleLinkTextDrawerOpen, setNewRuleLinkTextDrawerOpen] =
    useState(false);
  const [newRuleLinkTextLengthDrawerOpen, setNewRuleLinkTextLengthDrawerOpen] =
    useState(false);
  const [newRuleFileSizeDrawerOpen, setNewRuleFileSizeDrawerOpen] =
    useState(false);
  const [newRuleImageSizeDrawerOpen, setNewRuleImageSizeDrawerOpen] =
    useState(false);
  const [newRuleImageTextDrawerOpen, setNewRuleImageTextDrawerOpen] =
    useState(false);
  const [
    newRuleImageTextLengthDrawerOpen,
    setNewRuleImageTextLengthDrawerOpen,
  ] = useState(false);
  const [
    newRuleExternalLinkCountDrawerOpen,
    setNewRuleExternalLinkCountDrawerOpen,
  ] = useState(false);
  const [
    newRuleIncomingLinkCountDrawerOpen,
    setNewRuleIncomingLinkCountDrawerOpen,
  ] = useState(false);
  const [newRuleHeadingTextDrawerOpen, setNewRuleHeadingTextDrawerOpen] =
    useState(false);
  const [
    newRuleHeaderTextLengthDrawerOpen,
    setNewRuleHeaderTextLengthDrawerOpen,
  ] = useState(false);
  const [
    newRuleReadabilityLevelDrawerOpen,
    setNewRuleReadabilityLevelDrawerOpen,
  ] = useState(false);
  const [newRuleMetaHeaderDrawerOpen, setNewRuleMetaHeaderDrawerOpen] =
    useState(false);
  const [
    newRuleMetaHeaderLengthDrawerOpen,
    setNewRuleMetaHeaderLengthDrawerOpen,
  ] = useState(false);
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

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const res = await getDomainsApi(1, 100);
        if (res.success && res.data?.domains) {
          const mapped = res.data.domains.map((d) => ({
            id: d._id,
            label: d.dm_title || getDomainLabel(d.dm_url),
          }));
          setAvailableDomains(mapped);

          // Auto-select current domain if on domain-specific path
          const currentId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
          if (currentId) {
            const current = mapped.find((m) => m.id === currentId);
            if (current) setSelectedDomains([current]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch domains for policy builder:", err);
      } finally {
        setIsLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);

  const dropdownDomains = availableDomains.filter((d) =>
    d.label.toLowerCase().includes(domainSearch.toLowerCase().trim()),
  );
  const isSelected = (id) => selectedDomains.some((s) => s.id === id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        domainDropdownRef.current &&
        !domainDropdownRef.current.contains(e.target)
      ) {
        setDomainDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
      <div className="flex-grow-1 overflow-auto d-flex min-h-0">
        <div
          className="flex-shrink-0 border-end border-secondary border-opacity-25 p-4 d-flex flex-column"
          style={{ width: 400 }}
        >
          <div className="d-flex flex-column gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 text-start ${leftTab === "settings" ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
              onClick={() => setLeftTab("settings")}
            >
              <i className="isax isax-setting-2 fs-18" aria-hidden="true" />{" "}
              Settings
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 text-start ${leftTab === "add-rule" ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
              onClick={() => setLeftTab("add-rule")}
            >
              <i className="isax isax-add-circle fs-18" aria-hidden="true" />{" "}
              Add own rule
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 text-start ${leftTab === "default-rules" ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
              onClick={() => setLeftTab("default-rules")}
            >
              <i className="isax isax-task-square fs-18" aria-hidden="true" />{" "}
              Add default rule
            </button>
          </div>

          {leftTab === "settings" && (
            <>
              <div className="mb-4">
                <label className="form-label text-body fs-13 fw-semibold mb-1">
                  Policy Title
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm border border-primary border-opacity-25"
                  placeholder="e.g. My Custom Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <p className="text-body fs-13 fw-semibold mb-2">
                Display this policy as:
              </p>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  {
                    key: "unwanted",
                    label: "Unwanted",
                    icon: "isax-close-circle",
                  },
                  { key: "required", label: "Required", icon: "isax-danger" },
                  {
                    key: "matches",
                    label: "Matches",
                    icon: "isax-search-normal-1",
                  },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1 ${displayAs === opt.key ? "btn-primary" : "btn-light border border-primary border-opacity-25"}`}
                    onClick={() => setDisplayAs(opt.key)}
                  >
                    <i
                      className={`isax ${opt.icon} fs-16`}
                      aria-hidden="true"
                    />
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="form-label text-body fs-13 mb-1">
                Priority
              </label>
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
                  <i className="isax isax-clock fs-16" aria-hidden="true" />{" "}
                  Scheduled
                </p>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="policyScheduled"
                    checked={scheduled}
                    onChange={(e) => setScheduled(e.target.checked)}
                  />
                  <label
                    className="form-check-label fs-13 text-muted"
                    htmlFor="policyScheduled"
                  >
                    Do you want the policy to run every time your website is
                    crawled?
                  </label>
                </div>
              </div>

              <p className="text-body fs-13 fw-semibold mb-2">
                Choose where the policy should apply
              </p>
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
                  <label
                    className="form-check-label fs-13"
                    htmlFor="applyGlobal"
                  >
                    Global - All Domains
                  </label>
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
                  <label
                    className="form-check-label fs-13"
                    htmlFor="applyDomains"
                  >
                    Choose domains
                  </label>
                </div>
              </div>

              {applyScope === "domains" && (
                <div className="position-relative" ref={domainDropdownRef}>
                  <label className="form-label text-body fs-13 mb-1">
                    Select domains and groups
                  </label>
                  <div className="d-flex gap-3 align-items-flex-start flex-wrap">
                    <div
                      className="flex-shrink-0 position-relative"
                      style={{ width: 220 }}
                    >
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
                          {isLoadingDomains ? (
                            <li className="px-3 py-2 text-muted fs-13">
                              Loading domains...
                            </li>
                          ) : dropdownDomains.length === 0 ? (
                            <li className="px-3 py-2 text-muted fs-13">
                              No matching domains
                            </li>
                          ) : (
                            dropdownDomains.map((d) => {
                              const selected = isSelected(d.id);
                              return (
                                <li
                                  key={d.id}
                                  role="option"
                                  aria-selected={selected}
                                >
                                  <button
                                    type="button"
                                    className={`btn btn-link w-100 text-start text-decoration-none d-flex align-items-center justify-content-start gap-2 py-2 px-3 fs-13 ${selected ? "text-muted" : "text-body"}`}
                                    onClick={() => !selected && addDomain(d)}
                                    disabled={selected}
                                  >
                                    <span className="avatar avatar-24 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                                      <i
                                        className="isax isax-global fs-14"
                                        aria-hidden="true"
                                      />
                                    </span>
                                    {d.label}
                                    {selected && (
                                      <span className="ms-auto fs-12 text-primary">
                                        <i
                                          className="isax isax-tick-circle"
                                          aria-hidden="true"
                                        />
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
                        <span className="text-muted fs-13">
                          Selected domains appear here
                        </span>
                      ) : (
                        selectedDomains.map((d) => (
                          <span
                            key={d.id}
                            className="badge bg-primary text-white rounded-pill d-inline-flex align-items-center gap-1 fw-normal"
                            style={{
                              padding: "2px 6px 2px 8px",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span
                              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-white bg-opacity-25"
                              style={{ width: 16, height: 16 }}
                            >
                              <i
                                className="isax isax-global text-white"
                                style={{ fontSize: "0.6rem" }}
                                aria-hidden="true"
                              />
                            </span>
                            <span
                              className="text-nowrap"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {d.label}
                            </span>
                            <button
                              type="button"
                              className="btn btn-link p-0 border-0 text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                              style={{
                                fontSize: "0.65rem",
                                width: 14,
                                height: 14,
                                minWidth: 14,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDomain(d.id);
                              }}
                              aria-label={`Remove ${d.label}`}
                            >
                              <i
                                className="isax isax-close-circle"
                                aria-hidden="true"
                              />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {leftTab === "add-rule" && (
            <AddRuleToPolicyView
              allowedRuleIds={
                contentType === "documents" ? DOCUMENTS_RULE_IDS : undefined
              }
            />
          )}

          {leftTab === "default-rules" && (
            <div className="d-flex flex-column flex-grow-1 min-h-0 overflow-hidden">
              <input
                type="text"
                className="form-control form-control-sm mb-3 border-primary border-opacity-25"
                placeholder="Search default rules..."
                value={defaultRuleSearch}
                onChange={(e) => setDefaultRuleSearch(e.target.value)}
              />
              <div
                className="row g-2 flex-grow-1 overflow-auto m-0 pb-2 pe-1"
                style={{ alignContent: "flex-start" }}
              >
                {PREDEFINED_POLICIES.filter(
                  (p) =>
                    !contentType ||
                    contentType !== "documents" ||
                    DOCUMENTS_RULE_IDS.includes(p.ruleConfig.type),
                )
                  .filter((p) =>
                    p.title
                      .toLowerCase()
                      .includes(defaultRuleSearch.toLowerCase()),
                  )
                  .map((policy) => (
                    <div key={policy.id} className="col-6">
                      <button
                        type="button"
                        className="btn btn-light border border-secondary border-opacity-25 d-flex flex-column align-items-center justify-content-center gap-2 text-center p-3 h-100 w-100 hover-shadow-sm transition-all rounded-3"
                        onClick={() => {
                          if (readOnly) return;
                          const isDuplicate = rules.some(
                            (r) =>
                              r.ruleName.toLowerCase() ===
                              policy.ruleConfig.ruleName.toLowerCase(),
                          );
                          if (isDuplicate) {
                            showToast(
                              "A rule with this name already exists in this policy",
                              "error",
                            );
                            return;
                          }
                          setRules((prev) => [
                            ...prev,
                            { ...policy.ruleConfig, id: Date.now() },
                          ]);
                          showToast(
                            "Default rule added successfully",
                            "success",
                          );
                        }}
                      >
                        <span className="avatar avatar-32 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-1">
                          <i className={`isax ${policy.icon} fs-18`} />
                        </span>
                        <div className="d-flex flex-column gap-2 align-items-center w-100">
                          <span
                            className="fs-12 fw-semibold text-body text-wrap"
                            style={{ lineHeight: 1.3 }}
                          >
                            {policy.title}
                          </span>
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-normal fs-10 px-2 py-0.5 rounded-1 mt-auto">
                            {policy.ruleConfig.type}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                {PREDEFINED_POLICIES.filter((p) =>
                  p.title
                    .toLowerCase()
                    .includes(defaultRuleSearch.toLowerCase()),
                ).length === 0 && (
                  <div className="col-12 text-center text-muted fs-13 py-4">
                    No matching default rules
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex-grow-1 min-w-0 p-4 overflow-auto"
          onDragEnter={() => {
            dropZoneRef.current?.scrollIntoView({
              block: "center",
              behavior: "auto",
            });
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold text-body mb-0 fs-16">Policy rules</h6>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted fs-14">Rule operator</span>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="form-check form-check-inline m-0 p-0 d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                >
                  <input
                    className="form-check-input m-0"
                    type="radio"
                    name="ruleOp"
                    id="ruleOr"
                    checked={ruleOperator === "or"}
                    onChange={() => setRuleOperator("or")}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      borderWidth: "2px",
                    }}
                  />
                  <label
                    className="form-check-label fs-14 text-body"
                    htmlFor="ruleOr"
                    style={{ cursor: "pointer" }}
                  >
                    Or
                  </label>
                </div>
                <div
                  className="form-check form-check-inline m-0 p-0 d-flex align-items-center gap-2"
                  style={{ cursor: "pointer" }}
                >
                  <input
                    className="form-check-input m-0"
                    type="radio"
                    name="ruleOp"
                    id="ruleAnd"
                    checked={ruleOperator === "and"}
                    onChange={() => setRuleOperator("and")}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      borderWidth: "2px",
                    }}
                  />
                  <label
                    className="form-check-label fs-14 text-body"
                    htmlFor="ruleAnd"
                    style={{ cursor: "pointer" }}
                  >
                    And
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div
            ref={dropZoneRef}
            className="border-2 border-secondary border-opacity-25 border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center bg-white p-4 min-vh-50"
            style={{ minHeight: 280 }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const ruleId = e.dataTransfer.getData("rule-id");
              if (ruleId) openRuleDrawer(ruleId);
            }}
          >
            {rules.length > 0 ? (
              <div className="w-100 d-flex flex-column gap-3 position-relative">
                {rules
                  .reduce((acc, rule, index) => {
                    if (index % 2 === 0) acc.push([rule]);
                    else acc[acc.length - 1].push(rule);
                    return acc;
                  }, [])
                  .map((rowRules, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      {/* Horizontal Divider for Rows */}
                      {rowIndex > 0 && (
                        <div className="w-100 position-relative d-flex align-items-center justify-content-center py-1">
                          <div className="position-absolute start-0 end-0 border-top border-secondary border-opacity-10" />
                          <span
                            className="badge bg-white text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1 fs-12 fw-semibold text-uppercase position-relative z-1"
                            style={{ letterSpacing: "0.5px" }}
                          >
                            {ruleOperator}
                          </span>
                        </div>
                      )}

                      <div
                        className="d-flex align-items-stretch w-100"
                        style={{ gap: "1.5rem" }}
                      >
                        {rowRules.map((rule, colIndex) => (
                          <React.Fragment key={rule.id}>
                            {colIndex > 0 && (
                              <div
                                className="d-flex align-items-center justify-content-center flex-shrink-0 position-relative z-3"
                                style={{ width: "0px" }}
                              >
                                <span className="badge bg-white text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fs-11 fw-semibold text-uppercase shadow-sm position-absolute top-50 start-50 translate-middle">
                                  {ruleOperator}
                                </span>
                              </div>
                            )}
                            <div
                              className="flex-grow-1"
                              style={{ flexBasis: "0", minWidth: 0 }}
                            >
                              <div className="card border border-secondary border-opacity-25 shadow-sm hover-shadow-md transition-all rounded-3 h-100">
                                <div className="card-body d-flex align-items-center justify-content-between p-3 py-4">
                                  <div className="d-flex align-items-center gap-3 w-100 overflow-hidden">
                                    <div
                                      className="avatar avatar-48 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ width: "48px", height: "48px" }}
                                    >
                                      <i className="isax isax-judge fs-24" />
                                    </div>
                                    <div
                                      className="d-flex flex-column align-items-start gap-1 flex-grow-1 overflow-hidden"
                                      style={{ minWidth: 0 }}
                                    >
                                      <span
                                        className="mb-0 fw-semibold fs-14 text-body text-truncate w-100"
                                        title={rule.ruleName || "Untitled Rule"}
                                      >
                                        {rule.ruleName || "Untitled Rule"}
                                      </span>
                                      <span
                                        className="badge bg-primary bg-opacity-10 text-primary fw-medium fs-10 px-2 py-1 rounded-2"
                                        style={{ letterSpacing: "0.2px" }}
                                      >
                                        {rule.type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="dropdown flex-shrink-0 ms-2">
                                    <button
                                      type="button"
                                      className="btn btn-icon btn-sm rounded-3 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 border-0 text-muted hover:bg-opacity-20"
                                      style={{ width: "36px", height: "36px" }}
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="isax isax-element-plus fs-20" />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end border border-secondary border-opacity-25 shadow-sm py-1">
                                      <li>
                                        <button
                                          className="dropdown-item d-flex align-items-center gap-2 py-2 fs-14"
                                          onClick={() => editRule(rule)}
                                        >
                                          <i className="isax isax-edit text-muted" />{" "}
                                          Edit rule
                                        </button>
                                      </li>
                                      <li>
                                        <hr className="dropdown-divider border-secondary border-opacity-10" />
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item d-flex align-items-center gap-2 py-2 fs-14 text-danger"
                                          onClick={() => removeRule(rule.id)}
                                        >
                                          <i className="isax isax-trash" />{" "}
                                          Delete rule
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                        {/* Maintain 50% width layout if odd number of items */}
                        {rowRules.length === 1 && (
                          <div
                            className="flex-grow-1"
                            style={{
                              flexBasis: "0",
                              minWidth: 0,
                              visibility: "hidden",
                            }}
                          ></div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                <div className="col-12 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-2 fs-14 mt-4 fw-medium"
                    onClick={() => setLeftTab("add-rule")}
                  >
                    <i
                      className="isax isax-add-circle fs-24"
                      aria-hidden="true"
                    />{" "}
                    Add another rule
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-5">
                <div className="avatar avatar-64 avatar-rounded bg-light text-muted mb-3 mx-auto d-flex align-items-center justify-content-center border-2 border-dashed border-secondary border-opacity-25">
                  <i className="isax isax-add-circle fs-32" />
                </div>
                <p className="text-body fw-medium mb-1">
                  Drag and drop the rule to add rules to the policy.
                </p>
                <p className="text-muted fs-13 mb-0">
                  Select rules from the left panel and drag them here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-white">
        <div className="d-flex justify-content-end align-items-center gap-2">
          <button
            type="button"
            className="btn rounded-2 border border-primary border-opacity-25 bg-white text-primary"
            onClick={onBack}
            disabled={isSaving}
          >
            <i className="isax isax-arrow-left-1 me-1" aria-hidden="true" />{" "}
            Previous
          </button>
          <button
            type="button"
            className="btn rounded-2 bg-primary text-white border-0 d-flex align-items-center gap-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              <i className="isax isax-tick-circle fs-18" aria-hidden="true" />
            )}
            <span>Save Policy</span>
          </button>
        </div>
      </div>

      <NewRulePageHtmlDrawer
        open={newRuleDrawerOpen}
        onClose={() => {
          setNewRuleDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleTextDrawer
        open={newRuleTextDrawerOpen}
        onClose={() => {
          setNewRuleTextDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRulePageTitleDrawer
        open={newRulePageTitleDrawerOpen}
        onClose={() => {
          setNewRulePageTitleDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRulePageTitleLengthDrawer
        open={newRulePageTitleLengthDrawerOpen}
        onClose={() => {
          setNewRulePageTitleLengthDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRulePageUrlDrawer
        open={newRulePageUrlDrawerOpen}
        onClose={() => {
          setNewRulePageUrlDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleLinkDrawer
        open={newRuleLinkDrawerOpen}
        onClose={() => {
          setNewRuleLinkDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleLinkTextDrawer
        open={newRuleLinkTextDrawerOpen}
        onClose={() => {
          setNewRuleLinkTextDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleLinkTextLengthDrawer
        open={newRuleLinkTextLengthDrawerOpen}
        onClose={() => {
          setNewRuleLinkTextLengthDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleFileSizeDrawer
        open={newRuleFileSizeDrawerOpen}
        onClose={() => {
          setNewRuleFileSizeDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleImageSizeDrawer
        open={newRuleImageSizeDrawerOpen}
        onClose={() => {
          setNewRuleImageSizeDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleImageTextDrawer
        open={newRuleImageTextDrawerOpen}
        onClose={() => {
          setNewRuleImageTextDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleImageTextLengthDrawer
        open={newRuleImageTextLengthDrawerOpen}
        onClose={() => {
          setNewRuleImageTextLengthDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleExternalLinkCountDrawer
        open={newRuleExternalLinkCountDrawerOpen}
        onClose={() => {
          setNewRuleExternalLinkCountDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleIncomingLinkCountDrawer
        open={newRuleIncomingLinkCountDrawerOpen}
        onClose={() => {
          setNewRuleIncomingLinkCountDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleHeadingTextDrawer
        open={newRuleHeadingTextDrawerOpen}
        onClose={() => {
          setNewRuleHeadingTextDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleHeaderTextLengthDrawer
        open={newRuleHeaderTextLengthDrawerOpen}
        onClose={() => {
          setNewRuleHeaderTextLengthDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleReadabilityLevelDrawer
        open={newRuleReadabilityLevelDrawerOpen}
        onClose={() => {
          setNewRuleReadabilityLevelDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleMetaHeaderDrawer
        open={newRuleMetaHeaderDrawerOpen}
        onClose={() => {
          setNewRuleMetaHeaderDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
      <NewRuleMetaHeaderLengthDrawer
        open={newRuleMetaHeaderLengthDrawerOpen}
        onClose={() => {
          setNewRuleMetaHeaderLengthDrawerOpen(false);
          setEditingRuleId(null);
        }}
        onSave={handleRuleSave}
        initialData={rules.find((r) => r.id === editingRuleId)}
      />
    </div>
  );
};

export default CreatePolicyBuilderView;
