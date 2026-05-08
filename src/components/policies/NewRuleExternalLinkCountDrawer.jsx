import React, { useState, useEffect } from "react";

const COMPARISON_OPTIONS = [
  "Less than",
  "Less than or equal",
  "Greater than",
  "Greater than or Equal",
  "Equal",
];

const NewRuleExternalLinkCountDrawer = ({ open, onClose, onSave, initialData }) => {
  const [ruleName, setRuleName] = useState("");
  const [comparison, setComparison] = useState("Less than");
  const [linkCount, setLinkCount] = useState("");


  useEffect(() => {
    if (open && initialData) {
      setRuleName(initialData?.ruleName !== undefined ? initialData.ruleName : "");
      setComparison(initialData?.comparison !== undefined ? initialData.comparison : "");
      setLinkCount(initialData?.linkCount !== undefined ? initialData.linkCount : "");
    } else if (open && !initialData) {
      setRuleName("");
      setComparison("");
      setLinkCount("");
    }
  }, [open, initialData]);

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
      comparison,
      linkCount,
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
        aria-labelledby="new-rule-external-link-count-title"
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
              <h5 id="new-rule-external-link-count-title" className="mb-0 fw-semibold text-body">New rule - External link count</h5>
              <p className="text-muted fs-13 mb-0 mt-1">Define when the rule should apply for external links</p>
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
            <label className="form-label text-body fs-13">Links (Number of external links):</label>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <select
                className="form-select flex-shrink-0"
                style={{ width: "auto", minWidth: 180 }}
                value={comparison}
                onChange={(e) => setComparison(e.target.value)}
              >
                {COMPARISON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="number"
                className="form-control flex-shrink-0"
                style={{ width: 120 }}
                placeholder="Count"
                value={linkCount}
                onChange={(e) => setLinkCount(e.target.value)}
                min={0}
              />
            </div>
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

export default NewRuleExternalLinkCountDrawer;
