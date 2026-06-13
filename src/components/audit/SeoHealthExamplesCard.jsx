import React, { useState, useMemo, useCallback } from "react";

const buildRows = (totalCount) => {
  const dates = [
    "Dec 11, 2025",
    "Nov 15, 2025",
    "Nov 13, 2025",
    "Nov 12, 2025",
    "Nov 11, 2025",
    "Nov 10, 2025",
    "Nov 9, 2025",
    "Nov 8, 2025",
    "Oct 28, 2025",
    "Oct 20, 2025",
  ];
  return Array.from({ length: totalCount }, (_, i) => ({
    url: `https://example.com/page-${i + 1}`,
    lastCrawled: dates[i % dates.length],
    targetedIssueCount: 1,
  }));
};

const safeFilename = (title) => {
  return (
    title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/gi, "")
      .toLowerCase() || "report"
  );
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
  totalCount = 0,
  reportTitle = "Report",
  rows: rowsProp = null,
  isLoading = false,
  onPageChange = null,
  currentPage = 1,
  pageSize = 10,
  serverSide = false,
}) => {
  const [localPage, setLocalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const allRows = useMemo(() => {
    if (Array.isArray(rowsProp)) return rowsProp;
    return buildRows(totalCount);
  }, [rowsProp, totalCount]);

  const sortedRows = useMemo(() => {
    if (serverSide) return allRows;
    const byDate = [...allRows].sort((a, b) => {
      const d = (s) => new Date(s).getTime();
      return sortDesc
        ? d(b.lastCrawled) - d(a.lastCrawled)
        : d(a.lastCrawled) - d(b.lastCrawled);
    });
    return byDate;
  }, [allRows, sortDesc, serverSide]);

  const effectivePage = serverSide ? currentPage : localPage;
  const start = (effectivePage - 1) * rowsPerPage;
  const pageRows = serverSide
    ? sortedRows
    : sortedRows.slice(start, start + rowsPerPage);
  const totalRowsCount = serverSide ? totalCount : sortedRows.length;
  const totalPagesCount = Math.ceil(totalRowsCount / rowsPerPage);
  const baseName = safeFilename(reportTitle);

  const handlePageChange = (newPage) => {
    if (serverSide && onPageChange) {
      onPageChange(newPage, rowsPerPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const exportCSV = useCallback(() => {
    const header = "URL,Issues,Last crawled\n";
    const body = sortedRows
      .map(
        (r) =>
          `"${r.url.replace(/"/g, '""')}","${r.targetedIssueCount || 0}","${r.lastCrawled}"`,
      )
      .join("\n");
    const csv = header + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedRows.map((r) => ({
        URL: r.url,
        Issues: r.targetedIssueCount || 0,
        "Last crawled": r.lastCrawled,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Examples");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["URL", "Issues", "Last crawled"]];
    const body = sortedRows.map((r) => [
      r.url,
      r.targetedIssueCount || 0,
      r.lastCrawled,
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "wrap" },
        1: { cellWidth: 20 },
        2: { cellWidth: 28 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [sortedRows, baseName]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header border-0 d-flex align-items-center justify-content-between flex-wrap gap-2 bg-transparent py-3">
        <h6 className="mb-0 d-flex align-items-center fw-semibold">
          Examples
          <span
            className="ms-1 opacity-75"
            title="Pages where this issue was found"
          >
            <i className="isax isax-info-circle fs-14" />
          </span>
        </h6>
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="isax isax-document-download me-1" /> Download Report
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportCSV}
              >
                <i className="isax isax-document-text me-2" /> CSV
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportPDF}
              >
                <i className="isax isax-document-text me-2" /> PDF
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                onClick={exportExcel}
              >
                <i className="isax isax-document-text me-2" /> Excel
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold text-body fs-13 border-0 py-3">
                  URL
                </th>
                <th
                  className="fw-semibold text-body fs-13 border-0 py-3 text-center"
                  style={{ width: "100px" }}
                >
                  Issues
                </th>
                <th
                  className="fw-semibold text-body text-end fs-13 border-0 py-3"
                  style={{ minWidth: "140px" }}
                >
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center ms-auto fw-semibold fs-13"
                    onClick={() => setSortDesc((v) => !v)}
                  >
                    Last crawled
                    <i
                      className={`isax ms-1 fs-12 ${sortDesc ? "isax-arrow-down-1" : "isax-arrow-up-1"}`}
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="text-center py-5">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    />
                    <span className="text-muted fs-13">Loading pages...</span>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted fs-13">
                    No pages found matching this issue.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => {
                  const hasDetails =
                    (row.brokenLinks && row.brokenLinks.length > 0) ||
                    (row.misspellings && row.misspellings.length > 0);
                  const isExpanded = !!expandedRows[i];
                  return (
                    <React.Fragment key={i}>
                      <tr>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            {hasDetails && (
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light p-0 border-0 d-flex align-items-center justify-content-center"
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                }}
                                onClick={() => toggleRow(i)}
                              >
                                <i
                                  className={`isax ${isExpanded ? "isax-arrow-down-1" : "isax-arrow-right-3"} fs-12`}
                                />
                              </button>
                            )}
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-decoration-none text-break fs-13 fw-semibold"
                            >
                              {row.url}
                            </a>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-danger-subtle text-danger rounded-pill px-2">
                            {row.targetedIssueCount || 0}
                          </span>
                        </td>
                        <td className="text-end text-muted fs-13 py-3">
                          {row.lastCrawled
                            ? new Date(row.lastCrawled).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>

                      {hasDetails && isExpanded && (
                        <tr>
                          <td
                            colSpan="3"
                            className="bg-light-subtle p-3 border-bottom"
                          >
                            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                              <h6
                                className="fs-12 text-muted fw-bold mb-3 text-uppercase ls-1"
                                style={{ letterSpacing: "0.05em" }}
                              >
                                {row.brokenLinks && row.brokenLinks.length > 0
                                  ? "Broken Links Found on Page"
                                  : "Spelling Mistakes Found on Page"}
                              </h6>
                              <div className="table-responsive">
                                <table className="table table-sm table-hover mb-0 fs-12">
                                  <thead className="bg-light">
                                    <tr>
                                      {row.brokenLinks &&
                                      row.brokenLinks.length > 0 ? (
                                        <>
                                          <th className="fw-semibold py-2">
                                            Broken Link URL
                                          </th>
                                          <th className="fw-semibold py-2">
                                            Anchor / Link Text
                                          </th>
                                          <th
                                            className="fw-semibold py-2 text-center"
                                            style={{ width: 100 }}
                                          >
                                            Status
                                          </th>
                                        </>
                                      ) : (
                                        <>
                                          <th className="fw-semibold py-2">
                                            Misspelled Word
                                          </th>
                                          <th className="fw-semibold py-2">
                                            Suggestions
                                          </th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.brokenLinks &&
                                    row.brokenLinks.length > 0
                                      ? row.brokenLinks.map((link, idx) => (
                                          <tr key={idx}>
                                            <td className="py-2">
                                              <a
                                                href={link.url || link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-danger text-decoration-none text-break"
                                              >
                                                {link.url || link.href}
                                              </a>
                                            </td>
                                            <td className="py-2 text-muted italic">
                                              {link.anchorText ||
                                                link.text ||
                                                "(No text)"}
                                            </td>
                                            <td className="py-2 text-center">
                                              <span className="badge bg-danger-subtle text-danger">
                                                {link.status ||
                                                  link.statusCode ||
                                                  404}
                                              </span>
                                            </td>
                                          </tr>
                                        ))
                                      : row.misspellings.map((mistake, idx) => (
                                          <tr key={idx}>
                                            <td className="py-2 fw-semibold text-danger">
                                              {mistake.word}
                                            </td>
                                            <td className="py-2 text-muted">
                                              {Array.isArray(
                                                mistake.suggestions,
                                              )
                                                ? mistake.suggestions.join(", ")
                                                : mistake.suggestions || "None"}
                                            </td>
                                          </tr>
                                        ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 border-top bg-transparent">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-13 text-muted">Rows per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={rowsPerPage}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setRowsPerPage(newLimit);
                if (onPageChange) onPageChange(1, newLimit);
                else setLocalPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <span className="fs-13 text-muted">
            {totalRowsCount > 0 ? start + 1 : 0}-
            {Math.min(start + rowsPerPage, totalRowsCount)} of {totalRowsCount}
          </span>
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border-0"
              disabled={effectivePage <= 1}
              onClick={() => handlePageChange(effectivePage - 1)}
              aria-label="Previous page"
            >
              <i className="isax isax-arrow-left-1" />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light border-0"
              disabled={effectivePage >= totalPagesCount}
              onClick={() => handlePageChange(effectivePage + 1)}
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
