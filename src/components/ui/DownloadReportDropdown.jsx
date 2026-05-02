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
  const buttonClass = className ? `${defaultButtonClass} ${className}` : defaultButtonClass;
  const dropdownClass = dropup ? "dropdown dropup" : "dropdown";
  const label = buttonLabel != null ? buttonLabel : "Download";

  return (
    React.createElement('div', { className: dropdownClass}
      , React.createElement('button', {
        type: "button",
        className: buttonClass,
        'data-bs-toggle': "dropdown",
        'aria-expanded': "false",
        title: label,
        'aria-label': label }

        , isIcon ? (
          React.createElement('i', { className: "isax isax-document-download text-primary fs-18"   , 'aria-hidden': true} )
        ) : (
          label
        )
      )
      , React.createElement('ul', { className: "dropdown-menu dropdown-menu-end" }
        , React.createElement('li', {}
          , React.createElement('button', {
            type: "button",
            className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      ,
            onClick: onExportCSV}

            , React.createElement('i', { className: "isax isax-document-text me-2"  , 'aria-hidden': true} ), "CSV"

          )
        )
        , React.createElement('li', {}
          , React.createElement('button', {
            type: "button",
            className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      ,
            onClick: onExportExcel}

            , React.createElement('i', { className: "isax isax-document-text me-2"  , 'aria-hidden': true} ), "Excel"

          )
        )
        , React.createElement('li', {}
          , React.createElement('button', {
            type: "button",
            className: "dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"      ,
            onClick: onExportPDF}

            , React.createElement('i', { className: "isax isax-document-text me-2"  , 'aria-hidden': true} ), "PDF"

          )
        )
      )
    )
  );
}
