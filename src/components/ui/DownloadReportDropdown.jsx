import React from "react";
export default function DownloadReportDropdown({
  reportBaseName,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  variant,
  dropup,
  className = "",
  buttonLabel,
}) {
  const isIcon = variant === "icon";
  const defaultButtonClass = isIcon
    ? "btn btn-icon btn-sm btn-light border-0"
    : "btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle";
  const buttonClass = className
    ? `${defaultButtonClass} ${className}`
    : defaultButtonClass;
  const dropdownClass = dropup ? "dropdown dropup" : "dropdown";
  const label = buttonLabel != null ? buttonLabel : "Download";

  return (
    <div className={dropdownClass}>
      <button
        type="button"
        className={buttonClass}
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title={label}
        aria-label={label}
      >
        {isIcon ? (
          <i
            className="isax isax-document-download text-primary fs-18"
            aria-hidden={true}
          />
        ) : (
          label
        )}
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <button
            type="button"
            className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
            onClick={onExportCSV}
          >
            <i className="isax isax-document-text me-2" aria-hidden={true} />
            CSV
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
            onClick={onExportExcel}
          >
            <i className="isax isax-document-text me-2" aria-hidden={true} />
            Excel
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
            onClick={onExportPDF}
          >
            <i className="isax isax-document-text me-2" aria-hidden={true} />
            PDF
          </button>
        </li>
      </ul>
    </div>
  );
}
