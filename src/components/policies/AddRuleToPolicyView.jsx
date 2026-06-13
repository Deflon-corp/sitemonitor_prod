import React from "react";

/** Rule types for drag-and-drop – replace with API if needed */
export const RULE_TYPES = [
  { id: "page-html", label: "Page html", icon: "isax-document-text" },
  { id: "text", label: "Text", icon: "isax-text" },
  { id: "page-title", label: "Page title", icon: "isax-text-bold" },
  { id: "page-title-length", label: "Page title length", icon: "isax-text" },
  { id: "page-url", label: "Page url", icon: "isax-global" },
  { id: "link", label: "Link", icon: "isax-link-2" },
  { id: "link-text", label: "Link text", icon: "isax-link-2" },
  { id: "link-text-length", label: "Link text length", icon: "isax-link-2" },
  { id: "file-size", label: "File size", icon: "isax-document-download" },
  { id: "image-size", label: "Image size", icon: "isax-image" },
  { id: "image-text", label: "Image text", icon: "isax-image" },
  { id: "image-text-length", label: "Image text length", icon: "isax-image" },
  {
    id: "external-link-count",
    label: "External link count",
    icon: "isax-export",
  },
  {
    id: "incoming-link-count",
    label: "Incoming link count",
    icon: "isax-import",
  },
  { id: "heading-text", label: "Heading text", icon: "isax-text" },
  { id: "header-text-length", label: "Header text length", icon: "isax-text" },
  { id: "readability-level", label: "Readability level", icon: "isax-eye" },
  { id: "meta-header", label: "Meta header", icon: "isax-text" },
  { id: "meta-header-length", label: "Meta header length", icon: "isax-text" },
];

const AddRuleToPolicyView = ({ allowedRuleIds, onRuleSelect }) => {
  const rulesToShow = allowedRuleIds
    ? RULE_TYPES.filter((r) => allowedRuleIds.includes(r.id))
    : RULE_TYPES;

  return (
    <div>
      <p className="text-body fs-13 text-muted mb-3">
        Drag and drop the rule to add rules to the policy.
      </p>
      <div
        className="overflow-auto custom-scrollbar pe-1"
        style={{ maxHeight: "calc(72px * 3 + 30px)" }}
      >
        <div className="row g-2">
          {rulesToShow.map((rule) => (
            <div key={rule.id} className="col-4">
              <div
                className="card border border-secondary border-opacity-25 rounded-2 shadow-sm position-relative bg-light bg-opacity-50 h-100"
                style={{ cursor: "grab", minHeight: 72 }}
                role="button"
                tabIndex={0}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("rule-id", rule.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onRuleSelect?.(rule)}
                onKeyDown={(e) => e.key === "Enter" && onRuleSelect?.(rule)}
              >
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center py-2 px-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 position-absolute top-0 end-0 text-primary opacity-75"
                    style={{ fontSize: "0.7rem" }}
                    title="More info"
                    aria-label={`Info for ${rule.label}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="isax isax-information" aria-hidden="true" />
                  </button>
                  <span className="avatar avatar-32 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0 mb-1">
                    <i
                      className={`isax ${rule.icon} fs-16`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-body fs-12 text-break">
                    {rule.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddRuleToPolicyView;
