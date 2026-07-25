import React, { useState, useCallback, useEffect } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob } from "@/lib/download";
import { getDarkPatternIssuesApi, generateRemediationCodeApi } from "../../api/darkPatternApi";
import { getDomainByIdApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";

const DarkPatternIssuesView = () => {
  const [urlIssues, setUrlIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [remediationCode, setRemediationCode] = useState(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchIssues = useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const domainRes = await getDomainByIdApi(domainId);
      if (domainRes.success && domainRes.data) {
        const dmName = domainRes.data.dm_name || domainRes.data.dm_url;
        const issuesRes = await getDarkPatternIssuesApi(dmName);
        if (issuesRes.success) {
          const formattedIssues = (issuesRes.data || []).map(issue => {
            const dateObj = new Date(issue.scanDate || issue.createdAt || Date.now());
            return {
              ...issue,
              date: dateObj.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
            };
          });
          setUrlIssues(formattedIssues);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Dark Pattern issues:", error);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = urlIssues.filter((issue) =>
    issue.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredIssues.length / rowsPerPage);

  const currentIssues = filteredIssues.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const reportBaseName = "dark-pattern-issues";

  const exportCSV = useCallback(() => {
    try {
      const header = ["Page URL", "Dark Pattern Type", "Severity", "Description", "Suggestion / Fix", "Legal Risk", "Date Detected"];
      const csvRows = [header.join(",")];
      for (const issue of filteredIssues) {
        const row = [
          `"${issue.url.replace(/"/g, '""')}"`,
          `"${issue.type.replace(/"/g, '""')}"`,
          `"${issue.severity.replace(/"/g, '""')}"`,
          `"${issue.description.replace(/"/g, '""')}"`,
          `"${issue.suggestion.replace(/"/g, '""')}"`,
          `"${(issue.legalRisk || 'Not available').replace(/"/g, '""')}"`,
          `"${issue.date.replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      }
      const csvContent = csvRows.join("\n");
      downloadBlob(
        new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
        `${reportBaseName}.csv`
      );
    } catch (err) {
      console.error("CSV Export failed:", err);
    }
  }, [filteredIssues]);

  const exportExcel = useCallback(async () => {
    try {
      const rows = filteredIssues.map((issue) => ({
        "Page URL": issue.url,
        "Dark Pattern Type": issue.type,
        "Severity": issue.severity,
        "Description": issue.description,
        "Suggestion / Fix": issue.suggestion,
        "Legal Risk": issue.legalRisk || "Not available",
        "Date Detected": issue.date,
      }));
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Issues");
      XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
    } catch (err) {
      console.error("Excel Export failed:", err);
    }
  }, [filteredIssues]);

  const exportPDF = useCallback(async () => {
    try {
      const rows = filteredIssues.map((issue) => [
        issue.url,
        issue.type,
        issue.severity,
        issue.description,
        issue.suggestion,
        issue.legalRisk || "Not available",
        issue.date,
      ]);
      const jsPDF = (await import("jspdf")).default;
      await import("jspdf-autotable");
      const doc = new jsPDF("l", "pt", "a4");
      doc.setFontSize(16);
      doc.text("Dark Pattern Issues Report", 40, 40);
      doc.autoTable({
        startY: 60,
        head: [["URL", "Type", "Severity", "Description", "Suggestion", "Legal Risk", "Date Detected"]],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 50 },
          3: { cellWidth: 70 },
          4: { cellWidth: 70 },
        },
      });
      doc.save(`${reportBaseName}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  }, [filteredIssues]);

  const handleGenerateCode = async () => {
    if (!selectedIssue) return;
    setIsGeneratingCode(true);
    setRemediationCode(null);
    try {
      const res = await generateRemediationCodeApi(selectedIssue.type, selectedIssue.description, selectedIssue.suggestion);
      if (res.success && res.data?.code) {
        setRemediationCode(res.data.code);
      } else {
        setRemediationCode("// Failed to generate code. Please try again.");
      }
    } catch (error) {
      setRemediationCode("// Error connecting to AI.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i className="isax isax-danger fs-20 text-primary" />
          Detected Issues by URL
        </h5>
        <p className="text-muted fs-13 mb-0">
          A detailed list of all dark patterns found across individual URLs.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fs-15 fw-semibold">Affected URLs</h6>
          <div className="d-flex gap-2">
            <div className="input-group" style={{ width: '250px' }}>
              <span className="input-group-text bg-light border-end-0">
                <i className="isax isax-search-normal-1 fs-16 text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search URLs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <DownloadReportDropdown
              reportBaseName={reportBaseName}
              onExportCSV={exportCSV}
              onExportExcel={exportExcel}
              onExportPDF={exportPDF}
            />
          </div>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Page URL</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Dark Pattern Type</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Severity</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Date Detected</th>
                  <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-4 py-3">
                      <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-primary fw-medium fs-14 text-decoration-none d-flex align-items-center gap-2">
                        {issue.url}
                        <i className="isax isax-eye fs-14"></i>
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body fw-medium fs-13">
                        {issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge rounded-pill px-3 py-2 fs-12 fw-medium ${issue.severityClass}`} style={{ width: "90px" }}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 fs-13 text-muted">
                      {issue.date}
                    </td>
                    <td className="px-4 py-3 fs-13 text-end">
                      <button 
                        className="btn btn-sm btn-light d-inline-flex align-items-center gap-1"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <i className="isax isax-eye fs-14"></i>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredIssues.length > 0 && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Rows per page</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 25, 50, 100, 500].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <span className="text-muted small">
                  {(currentPage - 1) * rowsPerPage + 1}–
                  {Math.min(currentPage * rowsPerPage, filteredIssues.length)} of{" "}
                  {filteredIssues.length}
                </span>
              </div>

              <nav aria-label="Dark pattern list pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li
                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from(
                    { length: Math.min(totalPages, 10) },
                    (_, i) => {
                      const p =
                        currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                      if (p > totalPages) return null;
                      return (
                        <li key={p} className="page-item">
                          <button
                            type="button"
                            className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    },
                  )}

                  <li
                    className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fs-16 fw-semibold d-flex align-items-center gap-2">
                    <i className="isax isax-warning-2 text-warning fs-20"></i>
                    Issue Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    aria-label="Close"
                    onClick={() => {
                      setSelectedIssue(null);
                      setRemediationCode(null);
                      setIsGeneratingCode(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body p-4 custom-scrollbar" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="mb-4">
                    <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Page URL</div>
                    <a href={selectedIssue.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-14 fw-medium text-break">
                      {selectedIssue.url}
                    </a>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Dark Pattern Type</div>
                      <div className="fs-14 fw-medium text-body">{selectedIssue.type}</div>
                    </div>
                    <div className="col-md-6 mt-3 mt-md-0">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Severity</div>
                      <span className={`badge rounded-pill px-3 py-2 fs-12 fw-medium ${selectedIssue.severityClass}`}>
                        {selectedIssue.severity}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-muted fs-12 text-uppercase fw-semibold mb-2">Description</div>
                    <div className="p-3 bg-light rounded-3 fs-13 text-body" style={{ lineHeight: '1.6' }}>
                      {selectedIssue.description}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-muted fs-12 text-uppercase fw-semibold mb-2">Suggestion / Fix</div>
                    <div className="p-3 bg-success bg-opacity-10 rounded-3 fs-13 text-success d-flex gap-2" style={{ lineHeight: '1.6' }}>
                      <i className="isax isax-verify fs-18 mt-1 flex-shrink-0"></i>
                      <div>{selectedIssue.suggestion}</div>
                    </div>
                  </div>

                  {selectedIssue.legalRisk && (
                    <div className="mt-4">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-2 d-flex align-items-center gap-1">
                        <i className="isax isax-judge fs-14 text-danger"></i>
                        Legal & Compliance Risk
                      </div>
                      <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 fs-13 text-danger" style={{ lineHeight: '1.6' }}>
                        {selectedIssue.legalRisk}
                      </div>
                    </div>
                  )}

                  {selectedIssue.htmlSnippet && selectedIssue.htmlSnippet.startsWith('data:image/') && (
                    <div className="mt-4">
                      <div className="text-muted fs-12 text-uppercase fw-semibold mb-2 d-flex align-items-center gap-1">
                        <i className="isax isax-image fs-14 text-primary"></i>
                        Visual Evidence (Screenshot)
                      </div>
                      <div className="p-2 border rounded-3 bg-light text-center">
                        <img 
                          src={selectedIssue.htmlSnippet} 
                          alt="Dark Pattern Evidence" 
                          className="img-fluid rounded" 
                          style={{ maxHeight: '300px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="text-muted fs-12 text-uppercase fw-semibold d-flex align-items-center gap-1">
                        <i className="isax isax-magic-pen fs-14 text-primary"></i>
                        Automated Remediation
                      </div>
                      {!remediationCode && (
                        <button 
                          className="btn btn-sm btn-primary d-flex align-items-center gap-2"
                          onClick={handleGenerateCode}
                          disabled={isGeneratingCode}
                        >
                          {isGeneratingCode ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              Generating Fix...
                            </>
                          ) : (
                            <>
                              <i className="isax isax-code fs-16"></i>
                              Generate Code Fix
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {remediationCode && (
                      <div className="bg-dark rounded-3 p-3 position-relative">
                        <div className="text-white-50 fs-11 mb-2 d-flex justify-content-between">
                          <span>Generated Fix (AI)</span>
                          <button 
                            className="btn btn-link text-white-50 p-0 text-decoration-none fs-11"
                            onClick={() => navigator.clipboard.writeText(remediationCode)}
                          >
                            <i className="isax isax-copy fs-14 me-1"></i>Copy Code
                          </button>
                        </div>
                        <pre className="text-light m-0 fs-13" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          <code>{remediationCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light px-4" onClick={() => {
                    setSelectedIssue(null);
                    setRemediationCode(null);
                  }}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

    </div>
  );
};

export default DarkPatternIssuesView;
