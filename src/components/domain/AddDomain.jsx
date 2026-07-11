import { Link, useNavigate, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { getDomainById } from "@/lib/domains-config";
import axiosInstance from "@/api/axiosInstance";
import { showToast } from "@/components/common/alerts/ToastAlert";

const AddDomain = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editDomain = editId ? getDomainById(editId) : undefined;
  const isEditMode = Boolean(editDomain);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [gscEmail, setGscEmail] = useState("");
  const [connectedEmails, setConnectedEmails] = useState([]);
  const [crawlAuto, setCrawlAuto] = useState(false);
  const [connectionsPerMin, setConnectionsPerMin] = useState("normal");
  const [maxScannedPages, setMaxScannedPages] = useState("");
  const [customUrlsText, setCustomUrlsText] = useState("");
  const [scanSubdomains, setScanSubdomains] = useState(true);
  const [spellingIgnoreCaps, setSpellingIgnoreCaps] = useState(false);
  const [caseSensitiveUrls, setCaseSensitiveUrls] = useState(true);
  const [renderPagesExecuteJs, setRenderPagesExecuteJs] = useState(false);
  const [mark403AsBroken, setMark403AsBroken] = useState(false);
  const [ignoreCanonicalUrls, setIgnoreCanonicalUrls] = useState(false);
  const [useLanguageAttribute, setUseLanguageAttribute] = useState(true);
  const [pathConstraint, setPathConstraint] = useState("");
  const [pathConstraints, setPathConstraints] = useState([]);
  const [excludePattern, setExcludePattern] = useState("");
  const [excludePatterns, setExcludePatterns] = useState([]);
  const [internalOperator, setInternalOperator] = useState("starts-with");
  const [internalUrl, setInternalUrl] = useState("");
  const [internalUrls, setInternalUrls] = useState([]);
  const [accessibility, setAccessibility] = useState("none");
  const [sourceCodeExcludes, setSourceCodeExcludes] = useState("");
  const [readability, setReadability] = useState("none");
  const [scanFrequency, setScanFrequency] = useState("1");
  const [frequencyType, setFrequencyType] = useState("day");
  const [ignoredSpelling, setIgnoredSpelling] = useState("");
  const [ignoredSpellings, setIgnoredSpellings] = useState([]);
  const [termsCondition, setTermsCondition] = useState("");
  const [termsConditions, setTermsConditions] = useState([]);

  // Section visibility states
  const [openDomainDetails, setOpenDomainDetails] = useState(true);
  const [openScanCrawl, setOpenScanCrawl] = useState(true);
  const [openFeatures, setOpenFeatures] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleAddPathConstraint = () => {
    if (pathConstraint.trim()) {
      setPathConstraints([...pathConstraints, pathConstraint.trim()]);
      setPathConstraint("");
    }
  };

  const handleRemovePathConstraint = (index) => {
    setPathConstraints(pathConstraints.filter((_, i) => i !== index));
  };

  const handleAddExcludePattern = () => {
    if (excludePattern.trim()) {
      setExcludePatterns([...excludePatterns, excludePattern.trim()]);
      setExcludePattern("");
    }
  };

  const handleRemoveExcludePattern = (index) => {
    setExcludePatterns(excludePatterns.filter((_, i) => i !== index));
  };

  const handleAddInternalUrl = () => {
    if (internalUrl.trim()) {
      setInternalUrls([
        ...internalUrls,
        { operator: internalOperator, url: internalUrl.trim() },
      ]);
      setInternalUrl("");
    }
  };

  const handleRemoveInternalUrl = (index) => {
    setInternalUrls(internalUrls.filter((_, i) => i !== index));
  };

  const handleAddIgnoredSpelling = () => {
    if (ignoredSpelling.trim()) {
      setIgnoredSpellings([...ignoredSpellings, ignoredSpelling.trim()]);
      setIgnoredSpelling("");
    }
  };

  const handleRemoveIgnoredSpelling = (index) => {
    setIgnoredSpellings(ignoredSpellings.filter((_, i) => i !== index));
  };

  const handleAddTermsCondition = () => {
    if (termsCondition.trim()) {
      setTermsConditions([...termsConditions, termsCondition.trim()]);
      setTermsCondition("");
    }
  };

  const handleRemoveTermsCondition = (index) => {
    setTermsConditions(termsConditions.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axiosInstance.get("/auth/google/connections");
        if (res.data?.success && res.data?.connections) {
          setConnectedEmails(res.data.connections);
        }
      } catch (err) {
        console.error("Error fetching google connections:", err);
      }
    };
    fetchConnections();
  }, []);

  useEffect(() => {
    if (editDomain) {
      setTitle(editDomain.name || "");
      setUrl(editDomain.url || "");
    }
  }, [editDomain]);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setGscEmail("");
    setCrawlAuto(false);
    setConnectionsPerMin("normal");
    setMaxScannedPages("");
    setCustomUrlsText("");
    setScanSubdomains(true);
    setSpellingIgnoreCaps(false);
    setCaseSensitiveUrls(true);
    setRenderPagesExecuteJs(false);
    setMark403AsBroken(false);
    setIgnoreCanonicalUrls(false);
    setUseLanguageAttribute(true);
    setPathConstraints([]);
    setExcludePatterns([]);
    setInternalUrls([]);
    setAccessibility("none");
    setSourceCodeExcludes("");
    setReadability("none");
    setScanFrequency("1");
    setFrequencyType("day");
    setIgnoredSpellings([]);
    setTermsConditions([]);
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    // URL validation
    let hostNorm = "";
    if (!url.trim()) {
      newErrors.url = "URL is required";
    } else {
      try {
        const parsedUrl = new URL(url.startsWith("http") ? url.trim() : `https://${url.trim()}`);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          newErrors.url = "URL must start with http:// or https://";
        } else {
          hostNorm = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
        }
      } catch (err) {
        newErrors.url = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    // Max scanned pages validation
    if (
      maxScannedPages !== "" &&
      (isNaN(maxScannedPages) || Number(maxScannedPages) < 1)
    ) {
      newErrors.maxScannedPages = "Must be a positive number";
    }

    // Custom scan URLs validation
    if (customUrlsText.trim()) {
      const urls = customUrlsText.split("\n").map(u => u.trim()).filter(Boolean);
      if (urls.length > 10) {
        newErrors.customUrls = "You can add a maximum of 10 custom URLs";
      } else {
        for (const u of urls) {
          try {
            const parsedUrl = new URL(u);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
              newErrors.customUrls = "All custom URLs must start with http:// or https://";
              break;
            }
            const customHost = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
            if (hostNorm && customHost !== hostNorm && !customHost.endsWith("." + hostNorm)) {
              newErrors.customUrls = `Custom URL "${u}" does not match the domain ${hostNorm}`;
              break;
            }
          } catch (err) {
            newErrors.customUrls = `Invalid URL: "${u}". Please enter valid absolute URLs.`;
            break;
          }
        }
      }
    }

    // Scan frequency validation
    if (
      scanFrequency !== "" &&
      (isNaN(scanFrequency) || Number(scanFrequency) < 1)
    ) {
      newErrors.scanFrequency = "Must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    if (!validateForm()) {
      showToast("Please correct the errors in the form", "error");
      return;
    }

    setIsLoading(true);

    try {
      const dm_custom_urls = customUrlsText.split("\n").map(u => u.trim()).filter(Boolean);
      const payload = {
        dm_title: title,
        dm_url: url,
        dm_gsc_email: gscEmail || null,
        dm_crawl_auto: crawlAuto,
        dm_connections_per_min: connectionsPerMin,
        dm_max_scanned_pages: Number(maxScannedPages) || 0,
        dm_scan_subdomains: scanSubdomains,
        dm_spelling_ignore_caps: spellingIgnoreCaps,
        dm_case_sensitive_urls: caseSensitiveUrls,
        dm_render_pages_execute_js: renderPagesExecuteJs,
        dm_mark_403_as_broken: mark403AsBroken,
        dm_ignore_canonical_urls: ignoreCanonicalUrls,
        dm_use_language_attribute: useLanguageAttribute,
        dm_custom_urls,
        dm_path_constraints: pathConstraints,
        dm_exclude_patterns: excludePatterns,
        dm_internal_urls: internalUrls.map((item) => ({
          operator: item.operator,
          url: item.url,
        })),
        dm_accessibility: accessibility,
        dm_source_code_excludes: sourceCodeExcludes,
        dm_readability: readability,
        dm_scan_frequency: Number(scanFrequency) || 1,
        dm_frequency_type: frequencyType,
        dm_ignored_spellings: ignoredSpellings,
        dm_terms_conditions: termsConditions,
      };

      const response = await axiosInstance.post("/domains", payload);

      if (response.data && response.data.success) {
        showToast(
          response.data.message ||
            (isEditMode
              ? "Domain updated successfully"
              : "Domain created successfully"),
          "success",
        );
        window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
        if (isEditMode) {
          navigate("/home");
        } else {
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error creating domain:", error);
      // Error toast is already handled by axiosInstance interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="content add-domain-content">
      {/* Header */}
      <div className="add-domain-header mb-4 d-flex align-items-start justify-content-between gap-3">
        <div>
          <h1 className="add-domain-title mb-1">
            {isEditMode ? "Edit Domain" : "Add New Domain"}
          </h1>
          <p className="add-domain-subtitle text-muted mb-0">
            {isEditMode
              ? "Update the details for this domain."
              : "Enter the details for the new domain you'd like to add"}
          </p>
        </div>

        <Link
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 flex-shrink-0"
          to="/home"
        >
          <i className="isax isax-arrow-left-1"></i> Back
        </Link>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-6">
          {/* Domain Details */}
          <div className="card add-domain-card border-0 shadow-sm mb-4">
            <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="isax isax-global text-primary"></i>
                <h5 className="mb-0 fw-semibold">Domain Details</h5>
              </div>
            </div>

            <div id="domain-details">
                <div className="card-body pt-0 px-4 pb-4">
                  <div className="mb-3">
                    <label className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? "is-invalid" : ""}`}
                      placeholder="Title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors({ ...errors, title: "" });
                      }}
                    />
                    {errors.title && (
                      <div className="invalid-feedback">{errors.title}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      URL <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.url ? "is-invalid" : ""}`}
                      placeholder="URL"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (errors.url) setErrors({ ...errors, url: "" });
                      }}
                    />
                    {errors.url && (
                      <div className="invalid-feedback">{errors.url}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Linked Google Search Console Email (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. user@gmail.com"
                      value={gscEmail}
                      onChange={(e) => setGscEmail(e.target.value)}
                    />
                    <div className="form-text text-muted">
                      Specify the Gmail address of the Google Search Console account associated with this domain.
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Scan & Crawl */}
          <div className="card add-domain-card border-0 shadow-sm mb-4">
            <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="isax isax-document-text text-primary"></i>
                <h5 className="mb-0 fw-semibold">Scan &amp; Crawl</h5>
              </div>
            </div>

            <div id="scan-crawl">
                <div className="card-body pt-0 px-4 pb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <label className="form-label mb-0">
                      Crawl Automatically
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={crawlAuto}
                          onChange={(e) => setCrawlAuto(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Connections per minute</label>
                    <select
                      className="form-select"
                      value={connectionsPerMin}
                      onChange={(e) => setConnectionsPerMin(e.target.value)}
                    >
                      <option value="normal">Normal - recommended</option>
                      <option value="slow">Slow</option>
                      <option value="faster">Faster</option>
                      <option value="very-fast">Very fast - Be cautious</option>
                      <option value="superfast">
                        Superfast - Don't use unless you know what you're doing
                      </option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Max scanned pages</label>
                    <input
                      type="number"
                      className={`form-control ${errors.maxScannedPages ? "is-invalid" : ""}`}
                      placeholder="Max scanned pages"
                      value={maxScannedPages}
                      onChange={(e) => {
                        setMaxScannedPages(e.target.value);
                        if (errors.maxScannedPages)
                          setErrors({ ...errors, maxScannedPages: "" });
                      }}
                      min="1"
                    />
                    {errors.maxScannedPages && (
                      <div className="invalid-feedback">
                        {errors.maxScannedPages}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Custom Scan URLs (optional, max 10, one per line)</label>
                    <textarea
                      className={`form-control ${errors.customUrls ? "is-invalid" : ""}`}
                      placeholder="e.g.&#10;https://example.com/page1&#10;https://example.com/page2"
                      value={customUrlsText}
                      onChange={(e) => {
                        setCustomUrlsText(e.target.value);
                        if (errors.customUrls)
                          setErrors({ ...errors, customUrls: "" });
                      }}
                      rows={4}
                    />
                    {errors.customUrls && (
                      <div className="invalid-feedback d-block">
                        {errors.customUrls}
                      </div>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Scan frequency</label>
                      <input
                        type="number"
                        className={`form-control ${errors.scanFrequency ? "is-invalid" : ""}`}
                        placeholder="1"
                        value={scanFrequency}
                        onChange={(e) => {
                          setScanFrequency(e.target.value);
                          if (errors.scanFrequency)
                            setErrors({ ...errors, scanFrequency: "" });
                        }}
                        min="1"
                      />
                      {errors.scanFrequency && (
                        <div className="invalid-feedback">
                          {errors.scanFrequency}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Frequency type</label>
                      <select
                        className="form-select"
                        value={frequencyType}
                        onChange={(e) => setFrequencyType(e.target.value)}
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="quarter">Quarter</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle Switches */}
                  {[
                    {
                      label: "Scan subdomains",
                      state: scanSubdomains,
                      setter: setScanSubdomains,
                    },
                    {
                      label: "Spelling ignore capitalized words",
                      state: spellingIgnoreCaps,
                      setter: setSpellingIgnoreCaps,
                    },
                    {
                      label: "Case sensitive URLs",
                      state: caseSensitiveUrls,
                      setter: setCaseSensitiveUrls,
                    },
                    {
                      label: "Render pages and execute JS while crawling",
                      state: renderPagesExecuteJs,
                      setter: setRenderPagesExecuteJs,
                    },
                    {
                      label: "Mark 403 as broken link",
                      state: mark403AsBroken,
                      setter: setMark403AsBroken,
                    },
                    {
                      label: "Ignore canonical URLs",
                      state: ignoreCanonicalUrls,
                      setter: setIgnoreCanonicalUrls,
                    },
                    {
                      label: "Use language attribute",
                      state: useLanguageAttribute,
                      setter: setUseLanguageAttribute,
                    },
                  ].map(({ label, state, setter }) => (
                    <div
                      key={label}
                      className="d-flex align-items-center justify-content-between mb-3"
                    >
                      <label className="form-label mb-0">{label}</label>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={state}
                          onChange={(e) => setter(e.target.checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-6">
          {/* Features */}
          <div className="card add-domain-card border-0 shadow-sm mb-4">
            <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="isax isax-category-2 text-primary"></i>
                <h5 className="mb-0 fw-semibold">Features</h5>
              </div>
            </div>

            <div id="features">
                <div className="card-body pt-0 px-4 pb-4">
                  {/* Accessibility, Readability, etc. */}
                  <div className="mb-3">
                    <label className="form-label">Accessibility</label>
                    <select
                      className="form-select"
                      value={accessibility}
                      onChange={(e) => setAccessibility(e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="wcag2a">WCAG 2.0 Level A</option>
                      <option value="wcag2aa">WCAG 2.0 Level AA</option>
                      <option value="wcag2aaa">WCAG 2.0 Level AAA</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Source Code Excludes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Choose an option"
                      value={sourceCodeExcludes}
                      onChange={(e) => setSourceCodeExcludes(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Readability</label>
                    <select
                      className="form-select"
                      value={readability}
                      onChange={(e) => setReadability(e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
          </div>

          {/* Advanced Domain Options */}
          <div className="card add-domain-card border-0 shadow-sm mb-4">
            <div className="card-header add-domain-card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="isax isax-setting-2 text-primary"></i>
                <h5 className="mb-0 fw-semibold">Advanced Domain Options</h5>
              </div>
            </div>

            <div id="advanced-options">
                <div className="card-body pt-0 px-4 pb-4">
                  {/* Path Constraints */}
                  <div className="mb-3">
                    <label className="form-label">Path constraints</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Constraint pattern"
                        value={pathConstraint}
                        onChange={(e) => setPathConstraint(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddPathConstraint())
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm p-1 flex-shrink-0"
                        title="Add"
                        onClick={handleAddPathConstraint}
                        disabled={!pathConstraint.trim()}
                      >
                        <i className="isax isax-add"></i>
                      </button>
                    </div>
                    {pathConstraints.length > 0 && (
                      <div className="mt-2">
                        {pathConstraints.map((p, idx) => (
                          <div
                            key={idx}
                            className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-2 mb-2 p-2 fw-normal"
                          >
                            <span>{p}</span>
                            <i
                              className="isax isax-close-circle text-danger"
                              style={{ cursor: "pointer", fontSize: "14px" }}
                              onClick={() => handleRemovePathConstraint(idx)}
                            ></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link Excludes */}
                  <div className="mb-3">
                    <label className="form-label">Link excludes</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Exclude pattern"
                        value={excludePattern}
                        onChange={(e) => setExcludePattern(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddExcludePattern())
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm p-1 flex-shrink-0"
                        title="Add"
                        onClick={handleAddExcludePattern}
                        disabled={!excludePattern.trim()}
                      >
                        <i className="isax isax-add"></i>
                      </button>
                    </div>
                    {excludePatterns.length > 0 && (
                      <div className="mt-2">
                        {excludePatterns.map((p, idx) => (
                          <div
                            key={idx}
                            className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-2 mb-2 p-2 fw-normal"
                          >
                            <span>{p}</span>
                            <i
                              className="isax isax-close-circle text-danger"
                              style={{ cursor: "pointer", fontSize: "14px" }}
                              onClick={() => handleRemoveExcludePattern(idx)}
                            ></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Internal URLs */}
                  <div className="mb-3">
                    <label className="form-label">Internal URLs</label>
                    <div className="row g-2 mb-2 align-items-center">
                      <div className="col-md-5">
                        <label className="form-label small mb-0">
                          Operator <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={internalOperator}
                          onChange={(e) => setInternalOperator(e.target.value)}
                        >
                          <option value="starts-with">Starts with</option>
                          <option value="contains">Contains</option>
                          <option value="regex">Regex</option>
                        </select>
                      </div>
                      <div className="col">
                        <label className="form-label small mb-0">
                          URL <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="URL"
                          value={internalUrl}
                          onChange={(e) => setInternalUrl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleAddInternalUrl())
                          }
                        />
                      </div>
                      <div className="col-auto pt-4">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm p-1"
                          onClick={handleAddInternalUrl}
                          disabled={!internalUrl.trim()}
                        >
                          <i className="isax isax-add"></i>
                        </button>
                      </div>
                    </div>
                    {internalUrls.length > 0 && (
                      <div className="mt-1">
                        {internalUrls.map((item, idx) => (
                          <div
                            key={idx}
                            className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-2 mb-2 p-2 fw-normal"
                          >
                            <span className="text-primary-emphasis fw-bold">
                              {item.operator}:
                            </span>
                            <span>{item.url}</span>
                            <i
                              className="isax isax-close-circle text-danger"
                              style={{ cursor: "pointer", fontSize: "14px" }}
                              onClick={() => handleRemoveInternalUrl(idx)}
                            ></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ignored spellings/Keywords */}
                  <div className="mb-3">
                    <label className="form-label">
                      Ignored spellings/Keywords
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Keyword"
                        value={ignoredSpelling}
                        onChange={(e) => setIgnoredSpelling(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddIgnoredSpelling())
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm p-1 flex-shrink-0"
                        title="Add"
                        onClick={handleAddIgnoredSpelling}
                        disabled={!ignoredSpelling.trim()}
                      >
                        <i className="isax isax-add"></i>
                      </button>
                    </div>
                    {ignoredSpellings.length > 0 && (
                      <div className="mt-2">
                        {ignoredSpellings.map((p, idx) => (
                          <div
                            key={idx}
                            className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-2 mb-2 p-2 fw-normal"
                          >
                            <span>{p}</span>
                            <i
                              className="isax isax-close-circle text-danger"
                              style={{ cursor: "pointer", fontSize: "14px" }}
                              onClick={() => handleRemoveIgnoredSpelling(idx)}
                            ></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Terms and condition check */}
                  <div className="mb-3">
                    <label className="form-label">
                      Terms and condition check
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Keyword"
                        value={termsCondition}
                        onChange={(e) => setTermsCondition(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddTermsCondition())
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm p-1 flex-shrink-0"
                        title="Add"
                        onClick={handleAddTermsCondition}
                        disabled={!termsCondition.trim()}
                      >
                        <i className="isax isax-add"></i>
                      </button>
                    </div>
                    {termsConditions.length > 0 && (
                      <div className="mt-2">
                        {termsConditions.map((p, idx) => (
                          <div
                            key={idx}
                            className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-2 mb-2 p-2 fw-normal"
                          >
                            <span>{p}</span>
                            <i
                              className="isax isax-close-circle text-danger"
                              style={{ cursor: "pointer", fontSize: "14px" }}
                              onClick={() => handleRemoveTermsCondition(idx)}
                            ></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="add-domain-actions d-flex gap-2 mt-4 pt-3 border-top">
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              {isEditMode ? "Updating..." : "Saving..."}
            </>
          ) : isEditMode ? (
            "Update domain"
          ) : (
            "Save Domain"
          )}
        </button>
        <Link className="btn btn-light border text-body" to="/home">
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default AddDomain;
