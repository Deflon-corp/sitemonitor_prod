import React, { useState } from "react";

const CONTENT_TYPE_OPTIONS = [
  { key: "all", label: "All assets", subtitle: "(HTML and documents)", icon: "isax-global" },
  { key: "html", label: "HTML pages", subtitle: "", icon: "isax-document-copy" },
  { key: "documents", label: "Documents", subtitle: "", icon: "isax-document-text" },
];

const CreatePolicyContentTypeView = ({ onBack, onNext }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
      <div className="flex-grow-1 overflow-auto p-4">
        <p className="text-body fs-13 mb-4">Select what type of content the policy should search in:</p>
        <div className="row g-3">
          {CONTENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <div key={opt.key} className="col-12 col-md-4">
                <button
                  type="button"
                  className={`card w-100 h-100 border text-start shadow-sm ${isSelected ? "border-primary border-2" : "border-secondary border-opacity-25"}`}
                  style={{ cursor: "pointer", transition: "border-color 0.15s ease" }}
                  onClick={() => {
                    setSelected(opt.key);
                    if (opt.key === "all") onNext("all");
                    if (opt.key === "html") onNext("html");
                    if (opt.key === "documents") onNext("documents");
                  }}
                >
                  <div className="card-body d-flex flex-column align-items-center text-center py-4">
                    <span className="avatar avatar-48 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-2">
                      <i className={`isax ${opt.icon} fs-24`} aria-hidden="true" />
                    </span>
                    <span className="text-primary fw-semibold fs-13">{opt.label}</span>
                    {opt.subtitle && (
                      <span className="text-muted fs-12 mt-1">{opt.subtitle}</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-white">
        <div className="d-flex justify-content-end align-items-center gap-2">
          <button
            type="button"
            className="btn rounded-2 border border-primary border-opacity-25 bg-white text-primary hover:bg-primary hover:bg-opacity-10 hover:border-primary"
            onClick={onBack}
          >
            <i className="isax isax-arrow-left-1 me-1" aria-hidden="true" /> Previous
          </button>
          <button
            type="button"
            className="btn rounded-2 bg-primary text-white border-0 hover:opacity-90"
            disabled={selected === null}
            onClick={() => selected !== null && onNext(selected)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePolicyContentTypeView;
