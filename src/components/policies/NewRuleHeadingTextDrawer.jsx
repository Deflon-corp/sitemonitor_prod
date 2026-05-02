import React, { useState, useEffect } from "react";

const SEARCH_OPTIONS = [
  "Starts with",
  "Contains",
  "Contains Words",
  "Contains sentence",
  "Ends with",
  "Equal",
  "Regex",
];

const HEADING_OPTIONS = [
  { id: "all", label: "All headings" },
  { id: "h1", label: "<H1>" },
  { id: "h2", label: "<H2>" },
  { id: "h3", label: "<H3>" },
  { id: "h4", label: "<H4>" },
  { id: "h5", label: "<H5>" },
  { id: "h6", label: "<H6>" },
];

const NewRuleHeadingTextDrawer = ({ open, onClose, onSave }) => {
  const [ruleName, setRuleName] = useState("");
  const [headingTypes, setHeadingTypes] = useState([]);
  const [searchType, setSearchType] = useState("Starts with");
  const [searchValue, setSearchValue] = useState("");
  const [containing, setContaining] = useState("containing");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const toggleHeading = (id) => {
    if (id === "all") {
      setHeadingTypes((prev) => (prev.includes("all") ? [] : ["all"]));
      return;
    }
    setHeadingTypes((prev) => {
      const withoutAll = prev.filter((x) => x !== "all");
      if (withoutAll.includes(id)) {
        const next = withoutAll.filter((x) => x !== id);
        return next;
      }
      return [...withoutAll, id];
    });
  };

  const handleSave = () => {
    onSave?.({
      ruleName,
      headingTypes,
      searchType,
      searchValue,
      containing,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: 1070 }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column overflow-hidden"
        style={{ zIndex: 1075, width: "min(100%, 720px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-rule-heading-text-title"
      >
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="isax isax-close-circle fs-20" aria-hidden="true" />
            </button>
            <div>
              <h5 id="new-rule-heading-text-title" className="mb-0 fw-semibold text-body">New rule - Heading text</h5>
              <p className="text-muted fs-13 mb-0 mt-1">Search for text in headers (h1,h2,h3,h4,h5,h6)</p>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto p-4">
          <div className="mb-4">
            <label className="form-label text-body fs-13">
              Rule name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Enter rule name"
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-body fs-13">Heading type</label>
            <div className="d-flex flex-wrap gap-3">
              {HEADING_OPTIONS.map((opt) => (
                <div key={opt.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`heading-${opt.id}`}
                    checked={headingTypes.includes(opt.id)}
                    onChange={() => toggleHeading(opt.id)}
                  />
                  <label className="form-check-label fs-13" htmlFor={`heading-${opt.id}`}>{opt.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-body fs-13">
              Search for content that <span className="text-danger">*</span>
            </label>
            <div className="d-flex gap-2 mb-2">
              <select
                className="form-select flex-shrink-0"
                style={{ width: "auto" }}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                {SEARCH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                className="form-control flex-grow-1"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search query"
              />
            </div>
            <div className="d-flex align-items-start gap-2 flex-wrap">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="headingTextContaining"
                  id="headingTextContaining"
                  checked={containing === "containing"}
                  onChange={() => setContaining("containing")}
                />
                <label className="form-check-label fs-13" htmlFor="headingTextContaining">Containing</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="headingTextContaining"
                  id="headingTextNotContaining"
                  checked={containing === "not-containing"}
                  onChange={() => setContaining("not-containing")}
                />
                <label className="form-check-label fs-13" htmlFor="headingTextNotContaining">Not containing</label>
              </div>
            </div>
            <p className="text-muted fs-12 mt-1 mb-0">Do you want to find pages which match the query or pages which does not match the query</p>
          </div>

          <div className="mb-4">
            <label className="form-label text-body fs-13 d-flex align-items-center gap-1">
              Case sensitivity
              <i className="isax isax-information text-muted fs-14" title="Case sensitivity" aria-hidden="true" />
            </label>
            <p className="text-muted fs-12 mb-0">Please remember that every rule behaves as case-sensitive!</p>
          </div>
        </div>

        <div className="border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-white">
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewRuleHeadingTextDrawer;
