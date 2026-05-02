import React, { useState, useMemo, useCallback  } from "react";

const SAMPLE_ROWS = [
  { url: "https://uat.aarogyaabharat.com/categories/home-care/aarogyaa-bharat-tpe-threshold-ramp-rx973rx974rx975rx976", lastCrawled: "Dec 11, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/2388/what-is-i-v-cannula-and-how-is-it-used", lastCrawled: "Nov 15, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/1108/how-can-sedentary-patients-prevent-bedsores", lastCrawled: "Nov 13, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/2102/benefits-of-physiotherapy-after-surgery", lastCrawled: "Nov 12, 2025" },
  { url: "https://uat.aarogyaabharat.com/products/health-monitors", lastCrawled: "Nov 12, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/1890/importance-of-rehabilitation", lastCrawled: "Nov 12, 2025" },
  { url: "https://uat.aarogyaabharat.com/categories/personal-care", lastCrawled: "Nov 11, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/1500/patient-care-guidelines", lastCrawled: "Nov 10, 2025" },
  { url: "https://uat.aarogyaabharat.com/blog/wellness-tips", lastCrawled: "Nov 9, 2025" },
  { url: "https://community.aarogyaabharat.com/discussion/3200/physiotherapy-exercises", lastCrawled: "Nov 8, 2025" },
];

const buildRows = (totalCount) => {
  const dates = ["Dec 11, 2025", "Nov 15, 2025", "Nov 13, 2025", "Nov 12, 2025", "Nov 11, 2025", "Nov 10, 2025", "Nov 9, 2025", "Nov 8, 2025", "Oct 28, 2025", "Oct 20, 2025"];
  const baseUrls = SAMPLE_ROWS.map((r) => r.url);
  return Array.from({ length: totalCount }, (_, i) => ({
    url: baseUrls[i % baseUrls.length],
    lastCrawled: dates[i % dates.length],
  }));
};

const safeFilename = (title) => {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/gi, "").toLowerCase() || "report";
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const SeoHealthExamplesCard = ({
  totalCount = 91,
  reportTitle = "Report",
  /** When set, use these rows instead of generating from totalCount (e.g. Response Status reports). */
  rows: rowsProp = null,
}) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  const allRows = useMemo(() => {
    if (Array.isArray(rowsProp) && rowsProp.length > 0) return rowsProp;
    return buildRows(totalCount);
  }, [rowsProp, totalCount]);
  const sortedRows = useMemo(() => {
    const byDate = [...allRows].sort((a, b) => {
      const d = (s) => new Date(s).getTime();
      return sortDesc ? d(b.lastCrawled) - d(a.lastCrawled) : d(a.lastCrawled) - d(b.lastCrawled);
    });
    return byDate;
  }, [allRows, sortDesc]);

  const start = (page - 1) * rowsPerPage;
  const pageRows = sortedRows.slice(start, start + rowsPerPage);
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const baseName = safeFilename(reportTitle);

  const exportCSV = useCallback(() => {
    const header = "URL,Last crawled\n";
    const body = sortedRows.map((r) => `"${r.url.replace(/"/g, '""')}","${r.lastCrawled}"`).join("\n");
    const csv = header + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedRows.map((r) => ({ URL: r.url, "Last crawled": r.lastCrawled }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Examples");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["URL", "Last crawled"]];
    const body = sortedRows.map((r) => [r.url, r.lastCrawled]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 28 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [sortedRows, baseName]);

  return (
    <div className="card">
      <div className="card-header border-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 className="mb-0 d-flex align-items-center">
          Examples
          <span className="ms-1 opacity-75" title="Pages where this issue was found">
            <i className="isax isax-info-circle fs-14" />
          </span>
        </h6>
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-light d-flex align-items-center"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="isax isax-document-download me-1" /> Download Report
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportCSV}>
                <i className="isax isax-document-text me-2" /> CSV
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportPDF}>
                <i className="isax isax-document-text me-2" /> PDF
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start" onClick={exportExcel}>
                <i className="isax isax-document-text me-2" /> Excel
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0">
            <thead>
              <tr>
                <th className="fw-semibold text-body">URL</th>
                <th className="fw-semibold text-body text-end" style={{ minWidth: "140px" }}>
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center ms-auto"
                    onClick={() => setSortDesc((v) => !v)}
                  >
                    Last crawled
                    <i className={`isax ms-1 fs-12 ${sortDesc ? "isax-arrow-down-1" : "isax-arrow-up-1"}`} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={start + i}>
                  <td>
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline text-break">
                      {row.url}
                    </a>
                  </td>
                  <td className="text-end text-body">{row.lastCrawled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 border-top">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-13 text-muted">Rows per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
          <span className="fs-13 text-muted">
            {start + 1}-{Math.min(start + rowsPerPage, sortedRows.length)} of {sortedRows.length}
          </span>
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <i className="isax isax-arrow-left-1" />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <i className="isax isax-arrow-right-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoHealthExamplesCard;
