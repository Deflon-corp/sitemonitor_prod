import React, { useState, useCallback } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";

const reportName = "Pages-with-ignored-checks";
const baseName = safeFilename(reportName);

const PagesWithIgnoredChecksView = () => {
  const [search, setSearch] = useState("");
  const count = 0; // Replace with API: pages with ignored checks count

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Ignored Checks\n";
    const body = ""; // Replace with actual data
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, []);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Ignored Checks"]];
    const body = []; // Replace with actual data
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 8 } });
    doc.save(`${baseName}.pdf`);
  }, []);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = []; // Replace with actual data
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages with ignored checks");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, []);

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
            <i className="isax isax-eye-slash fs-20 text-primary" aria-hidden="true" />
            Pages with ignored checks
          </h5>
          <p className="text-muted fs-13 mb-0">{count} pages with ignored checks</p>
        </div>
      </div>

      {/* Action bar: Download Report, Search (right-aligned) */}
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-3 mb-3">
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm bg-primary text-white rounded-2 border-0 d-inline-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="Download Report"
          >
            <i className="isax isax-document-download" aria-hidden="true" />
            <span>Download Report</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportCSV}
              >
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                CSV
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportPDF}
              >
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                PDF
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportExcel}
              >
                <i className="isax isax-document-text me-2" aria-hidden="true" />
                Excel
              </button>
            </li>
          </ul>
        </div>
        <div className="position-relative" style={{ width: 280 }}>
          <i
            className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
            style={{ fontSize: "1rem" }}
            aria-hidden="true"
          />
          <input
            type="text"
            className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>
      </div>

      {/* Content area - empty state */}
      <div className="card border-0 shadow-sm flex-grow-1 min-h-0 d-flex flex-column">
        <div className="card-body d-flex align-items-center justify-content-center flex-grow-1 py-5">
          <p className="text-muted mb-0 fs-15">No content was found</p>
        </div>
      </div>
    </div>
  );
};

export default PagesWithIgnoredChecksView;
