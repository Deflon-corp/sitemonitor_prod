import React, { useState, useEffect } from "react";

const EXPR_OPTIONS = [
  "Starts with",
  "Contains",
  "Contains Words",
  "Contains sentence",
  "Ends with",
  "Equal",
  "Regex",
  "Date age greater than",
  "Date age less than",
];

const NewRuleMetaHeaderDrawer = ({ open, onClose, onSave }) => {
  const [ruleName, setRuleName] = useState("");
  const [metaName, setMetaName] = useState("");
  const [exprType, setExprType] = useState("Starts with");
  const [exprValue, setExprValue] = useState("");


  useEffect(() => {
    if (open && initialData) {
      setRuleName(initialData?.ruleName !== undefined ? initialData.ruleName : "");
      setMetaName(initialData?.metaName !== undefined ? initialData.metaName : "");
      setExprType(initialData?.exprType !== undefined ? initialData.exprType : "");
      setExprValue(initialData?.exprValue !== undefined ? initialData.exprValue : "");
    } else if (open && !initialData) {
      setRuleName("");
      setMetaName("");
      setExprType("");
      setExprValue("");
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
      metaName,
      exprType,
      exprValue,
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
        aria-labelledby="new-rule-meta-header-title"
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
              <h5 id="new-rule-meta-header-title" className="mb-0 fw-semibold text-body">New rule - Meta header</h5>
              <p className="text-muted fs-13 mb-0 mt-1">Search for meta header tags, that matches query</p>
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
              Meta Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
              placeholder="Enter meta name"
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-body fs-13">Meta Header Expr</label>
            <div className="d-flex gap-2 mb-1">
              <select
                className="form-select flex-shrink-0"
                style={{ width: "auto" }}
                value={exprType}
                onChange={(e) => setExprType(e.target.value)}
              >
                {EXPR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                className="form-control flex-grow-1"
                value={exprValue}
                onChange={(e) => setExprValue(e.target.value)}
                placeholder="Expression value"
              />
            </div>
            <p className="text-muted fs-12 mb-0">Define meta headers to match</p>
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

export default NewRuleMetaHeaderDrawer;
