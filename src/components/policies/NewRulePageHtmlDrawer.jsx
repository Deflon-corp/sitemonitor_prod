import React, { useState, useEffect } from "react";

const SEARCH_OPTIONS = [
  "Starts with",
  "Contains",
  "Contains Words",
  "Contains sentence",
  "Ends with",
  "Equal",
  "Regex",
  "Conforms with",
  "CSS selector",
];

const NewRulePageHtmlDrawer = ({ open, onClose, onSave }) => {
  const [ruleName, setRuleName] = useState("");
  const [searchType, setSearchType] = useState("Starts with");
  const [searchValue, setSearchValue] = useState("");
  const [containing, setContaining] = useState("containing");
  const [selectors, setSelectors] = useState([{ type: "Limit search", value: "" }]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const addSelectorRow = () => {
    setSelectors((prev) => [...prev, { type: "Limit search", value: "" }]);
  };

  const removeSelectorRow = (index) => {
    setSelectors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSelector = (index, field, value) => {
    setSelectors((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSave = () => {
    onSave?.({
      ruleName,
      searchType,
      searchValue,
      containing,
      selectors: selectors.filter((s) => s.value.trim()),
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
        aria-labelledby="new-rule-page-html-title"
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
              <h5 id="new-rule-page-html-title" className="mb-0 fw-semibold text-body">New rule - Page html</h5>
              <p className="text-muted fs-13 mb-0 mt-1">Search for text in the entire domains html</p>
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
                  name="containing"
                  id="containing"
                  checked={containing === "containing"}
                  onChange={() => setContaining("containing")}
                />
                <label className="form-check-label fs-13" htmlFor="containing">Containing</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="containing"
                  id="notContaining"
                  checked={containing === "not-containing"}
                  onChange={() => setContaining("not-containing")}
                />
                <label className="form-check-label fs-13" htmlFor="notContaining">Not containing</label>
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

          <div className="mb-4">
            <label className="form-label text-body fs-13 fw-semibold d-flex align-items-center gap-1">
              Limit or exclude
              <i className="isax isax-information text-muted fs-14" title="Help" aria-hidden="true" />
            </label>
            <p className="text-muted fs-12 mb-3">Add CSS selectors to either limit the search within those values or exclude the snippets with the given inputs. You can add as many selectors as you wish.</p>
            <div className="bg-light bg-opacity-50 rounded-2 p-3 mb-3">
              <p className="fs-12 mb-1"><span className="text-muted">Example 1:</span> <span className="text-danger">.class-name1</span></p>
              <p className="fs-12 mb-1"><span className="text-muted">Example 2:</span> <span className="text-danger">#idname</span></p>
              <p className="fs-12 mb-1"><span className="text-muted">Example 3:</span> <span className="text-danger">div.container#main</span></p>
              <p className="fs-12 mb-0"><span className="text-muted">Example 4:</span> <span className="text-danger">a[href^="https"]</span></p>
            </div>
            {selectors.map((row, index) => (
              <div key={index} className="d-flex align-items-center gap-2 mb-2 flex-nowrap">
                <select
                  className="form-select form-select-sm flex-shrink-0"
                  style={{ width: 140 }}
                  value={row.type}
                  onChange={(e) => updateSelector(index, "type", e.target.value)}
                >
                  <option value="Limit search">Limit search</option>
                  <option value="Exclude">Exclude</option>
                </select>
                <span className="fs-13 text-body flex-shrink-0">Value:</span>
                <input
                  type="text"
                  className="form-control form-control-sm flex-shrink-0"
                  style={{ width: 400 }}
                  placeholder="Insert a CSS selector"
                  value={row.value}
                  onChange={(e) => updateSelector(index, "value", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light text-danger flex-shrink-0"
                  onClick={() => removeSelectorRow(index)}
                  aria-label="Remove selector"
                >
                  <i className="isax isax-trash" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-link text-primary text-decoration-none p-0 d-inline-flex align-items-center gap-1 fs-13"
              onClick={addSelectorRow}
            >
              <i className="isax isax-add-circle fs-18" aria-hidden="true" />
              Add selector
            </button>
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

export default NewRulePageHtmlDrawer;
