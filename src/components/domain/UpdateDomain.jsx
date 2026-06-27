import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { showToast } from "@/components/common/alerts/ToastAlert";

const UpdateDomain = () => {
  const { dm_id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [crawlAuto, setCrawlAuto] = useState(false);
  const [connectionsPerMin, setConnectionsPerMin] = useState("normal");
  const [maxScannedPages, setMaxScannedPages] = useState("");
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
  const [status, setStatus] = useState("active");
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
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        setIsFetching(true);
        const response = await axiosInstance.get(`/domains/${dm_id}`);
        if (response.data && response.data.success) {
          const data = response.data.data;
          setTitle(data.dm_title || "");
          setUrl(data.dm_url || "");
          setCrawlAuto(data.dm_crawl_auto || false);
          setConnectionsPerMin(data.dm_connections_per_min || "normal");
          setMaxScannedPages(data.dm_max_scanned_pages?.toString() || "");
          setScanSubdomains(data.dm_scan_subdomains ?? true);
          setSpellingIgnoreCaps(data.dm_spelling_ignore_caps || false);
          setCaseSensitiveUrls(data.dm_case_sensitive_urls ?? true);
          setRenderPagesExecuteJs(data.dm_render_pages_execute_js || false);
          setMark403AsBroken(data.dm_mark_403_as_broken || false);
          setIgnoreCanonicalUrls(data.dm_ignore_canonical_urls || false);
          setUseLanguageAttribute(data.dm_use_language_attribute ?? true);
          setPathConstraints(data.dm_path_constraints || []);
          setExcludePatterns(data.dm_exclude_patterns || []);
          setInternalUrls(data.dm_internal_urls || []);
          setAccessibility(data.dm_accessibility || "none");
          setSourceCodeExcludes(data.dm_source_code_excludes || "");
          setReadability(data.dm_readability || "none");
          setScanFrequency(data.dm_scan_frequency?.toString() || "1");
          setFrequencyType(data.dm_frequency_type || "day");
          setStatus(data.dm_status || "active");
          setIgnoredSpellings(data.dm_ignored_spellings || []);
          setTermsConditions(data.dm_terms_conditions || []);
        }
      } catch (error) {
        console.error("Error fetching domain details:", error);
        // showToast handled by interceptor
        navigate("/home");
      } finally {
        setIsFetching(false);
      }
    };

    if (dm_id) {
      fetchDomain();
    }
  }, [dm_id, navigate]);

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

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    // URL validation
    if (!url.trim()) {
      newErrors.url = "URL is required";
    } else {
      try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          newErrors.url = "URL must start with http:// or https://";
        }
      } catch (err) {
        newErrors.url = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    // Max scanned pages validation
    if (
      maxScannedPages !== "" &&
      (isNaN(maxScannedPages) || Number(maxScannedPages) < 0)
    ) {
      newErrors.maxScannedPages = "Must be a non-negative number";
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
      const payload = {
        dm_id: Number(dm_id),
        dm_title: title,
        dm_url: url,
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
        dm_status: status,
        dm_ignored_spellings: ignoredSpellings,
        dm_terms_conditions: termsConditions,
      };

      const response = await axiosInstance.put(`/domains/${dm_id}`, payload);

      if (response.data && response.data.success) {
        showToast(
          response.data.message || "Domain updated successfully",
          "success",
        );
        window.dispatchEvent(new CustomEvent("sitemonitor:domains-updated"));
        navigate("/home");
      }
    } catch (error) {
      console.error("Error updating domain:", error);
      // Error toast is already handled by axiosInstance interceptor
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div
        className="content d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content update-domain-content">
      {/* Header */}
      <div className="update-domain-header mb-4 d-flex align-items-start justify-content-between gap-3">
        <div>
          <h1 className="update-domain-title mb-1">Update Domain</h1>
          <p className="update-domain-subtitle text-muted mb-0">
            Update the details for this domain.
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
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                      min="0"
                    />
                    {errors.maxScannedPages && (
                      <div className="invalid-feedback">
                        {errors.maxScannedPages}
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
      <div className="update-domain-actions d-flex gap-2 mt-4 pt-3 border-top">
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
              Updating...
            </>
          ) : (
            "Update domain"
          )}
        </button>
        <Link className="btn btn-light border text-body" to="/home">
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default UpdateDomain;
