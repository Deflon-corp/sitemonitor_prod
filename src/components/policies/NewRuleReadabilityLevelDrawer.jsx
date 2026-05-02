import React, { useState, useEffect } from "react";

const SEARCH_OPTIONS = [
  "Greater than",
  "Greater than or Equal",
  "Less than",
  "Less than or equal",
  "Equal",
];

const READABILITY_GRADES = [
  "Below 5th grade",
  "5th grade",
  "6th grade",
  "7th grade",
  "8th to 9th grade",
  "10th to 12th grade",
  "College"
];

const NewRuleReadabilityLevelDrawer = ({ open, onClose, onSave }) => {
  const [ruleName, setRuleName] = useState("");
  const [searchFor, setSearchFor] = useState("Greater than");
  const [readabilityScore, setReadabilityScore] = useState("7th grade");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSave = () => {
    onSave?.({
      ruleName,
      searchFor,
      readabilityScore,
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
        aria-labelledby="new-rule-readability-level-title"
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
              <h5 id="new-rule-readability-level-title" className="mb-0 fw-semibold text-body">New rule - Readability level</h5>
              <p className="text-muted fs-13 mb-0 mt-1">Search for text that is in compliance with school degree</p>
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
              Want to search for <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={searchFor}
              onChange={(e) => setSearchFor(e.target.value)}
            >
              {SEARCH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label text-body fs-13">
              Readability score <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={readabilityScore}
              onChange={(e) => setReadabilityScore(e.target.value)}
            >
              {READABILITY_GRADES.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
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

export default NewRuleReadabilityLevelDrawer;
