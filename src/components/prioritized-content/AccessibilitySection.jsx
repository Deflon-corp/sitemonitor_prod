import React, { useState, useMemo, useCallback, useEffect } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import AccessibilityIssueDrawer from "./AccessibilityIssueDrawer";
import { getAccessibilityPageDetailApi } from "@/api/accessibilityApi";

const COMPLIANCE_LEVELS = [
  { key: "all", label: "All issues" },
  { key: "a", label: "High Priority (Level A)" },
  { key: "aa", label: "Medium Priority (Level AA)" },
];



const ComplianceRing = ({ percent, size = 48 }) => {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bs-light, #e9ecef)" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bs-primary, #0d6efd)"
        strokeWidth="4"
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

const LevelHeaderBlock = ({ badgeLabel, title, percent }) => {
  const displayPercent = typeof percent === "number" && !isNaN(percent) ? Math.round(percent) : 0;
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
      <div className="d-flex align-items-center gap-2">
        <span
          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
          style={{ width: 36, height: 36, backgroundColor: "#7c3aed" }}
          aria-hidden="true"
        >
          {badgeLabel}
        </span>
        <span className="fw-semibold">{title}</span>
      </div>
      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        <ComplianceRing percent={displayPercent} size={40} />
        <div>
          <span className="fw-semibold">{displayPercent}%</span>
          <p className="text-muted fs-12 mb-0" style={{ lineHeight: 1.2 }}>Score for this priority level.</p>
        </div>
      </div>
    </div>
  );
};

const ChecksTable = ({ checks, selectedCheckId, onSelectCheck, iconType }) => (
  <div className="table-responsive">
    <table className="table table-hover table-striped table-borderless align-middle mb-0">
      <thead>
        <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
          <th className="fw-semibold text-body py-2">Types of Issues</th>
          <th className="fw-semibold text-body py-2 text-end" style={{ width: 100 }}>Occurrences</th>
        </tr>
      </thead>
      <tbody>
        {checks.map((check) => (
          <tr
            key={check.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectCheck(check.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelectCheck(check.id)}
            className={selectedCheckId === check.id ? "table-primary" : ""}
          >
            <td className="py-2">
              <div className="d-flex align-items-start gap-2">
                <span
                  className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${iconType === "danger" ? "text-danger" : "text-primary"}`}
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: iconType === "danger" ? "rgba(220, 53, 69, 0.15)" : "rgba(13, 110, 253, 0.15)",
                  }}
                  aria-hidden="true"
                >
                  {iconType === "danger" ? (
                    <i className="isax isax-danger fs-14" aria-hidden="true" />
                  ) : (
                    <i className="isax isax-eye fs-14" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <span className="fw-medium fs-13">{check.name}</span>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-1 text-muted fs-12">
                    <i className="isax isax-people fs-14" aria-hidden="true" />
                    <span>{check.roles}</span>
                    <i className="isax isax-document-text fs-14 ms-1" aria-hidden="true" />
                    <span>{check.successCriteria}</span>
                  </div>
                </div>
              </div>
            </td>
            <td className="py-2 text-end fw-medium">{check.individualIssues}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AccessibilitySection = ({ data, score, domainId, pageUrl }) => {
  const [levelFilter, setLevelFilter] = useState("all");
  const [showIgnored, setShowIgnored] = useState(false);
  const [showPassed, setShowPassed] = useState(true);
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    if (domainId && pageUrl) {
      getAccessibilityPageDetailApi(domainId, pageUrl)
        .then(res => {
          if (res.success && res.data) {
            setApiData(res.data);
          }
        })
        .catch(console.error);
    }
  }, [domainId, pageUrl]);

  const effectiveData = apiData || data;

  const dynamicIssues = useMemo(() => {
    if (!effectiveData?.issues || !Array.isArray(effectiveData.issues)) return [];
    
    const passed = effectiveData.passedCount || 0;
    const failed = effectiveData.failedCount || effectiveData.issues.length || 0;
    const totalChecks = passed + failed;
    const computedEffect = totalChecks > 0 ? (100 / totalChecks).toFixed(2) + " %" : "0.00 %";

    return effectiveData.issues.map(issue => ({
      id: issue.id,
      level: issue.tags?.includes("wcag2aa") ? "AA" : "A",
      name: issue.help || issue.title || issue.name || issue.id || "Accessibility Issue",
      roles: "Front-end Development", // Roles usually static or mapped
      successCriteria: issue.description || issue.successCriteria || "WCAG Check",
      description: issue.description || issue.help || "No description available.",
      individualIssues: issue.nodes?.length || issue.individualIssues || 0,
      effectOnCompliance: computedEffect,
      impact: issue.impact || "moderate",
      nodes: (issue.nodes || []).map(node => ({
        id: node.id || Math.random().toString(),
        snippet: node.html || node.snippet || "No snippet available",
        failureSummary: node.failureSummary || "",
        target: node.target || []
      }))
    }));
  }, [effectiveData]);

  const levelA = useMemo(() => dynamicIssues.filter(i => i.level === "A"), [dynamicIssues]);
  const levelAA = useMemo(() => dynamicIssues.filter(i => i.level === "AA"), [dynamicIssues]);

  const [selectedCheckId, setSelectedCheckId] = useState(null);

  useEffect(() => {
    if (!selectedCheckId) {
      if (levelFilter === "all" || levelFilter === "a") setSelectedCheckId(levelA[0]?.id || null);
      else if (levelFilter === "aa") setSelectedCheckId(levelAA[0]?.id || null);
    }
  }, [levelFilter, levelA, levelAA, selectedCheckId]);

  const overallPercent = score !== undefined ? score : (effectiveData?.score || 100);
  const levelAPercent = effectiveData?.levelAScore !== undefined ? effectiveData.levelAScore : overallPercent;
  const levelAAPercent = effectiveData?.levelAAScore !== undefined ? effectiveData.levelAAScore : overallPercent;

  const [issueTab, setIssueTab] = useState("pending");
  const [expandedSnippets, setExpandedSnippets] = useState(new Set());
  const [issueDrawerOpen, setIssueDrawerOpen] = useState(false);
  const [issueDrawerData, setIssueDrawerData] = useState(null);

  const selectedCheck = selectedCheckId
    ? ([...levelA, ...levelAA].find((c) => c.id === selectedCheckId) ?? null)
    : null;

  useEffect(() => {
    if (levelFilter === "a") setSelectedCheckId(levelA[0]?.id ?? null);
    else if (levelFilter === "aa") setSelectedCheckId(levelAA[0]?.id ?? null);
  }, [levelFilter, levelA, levelAA]);

  const toggleSnippet = (id) => {
    setExpandedSnippets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checksForExport = useMemo(() => {
    if (levelFilter === "all") return [...levelA, ...levelAA];
    if (levelFilter === "a") return levelA;
    return levelAA;
  }, [levelFilter, levelA, levelAA]);

  const reportNameByLevel =
    levelFilter === "all"
      ? "WCAG-Accessibility-Compliance-Report-All-Levels"
      : levelFilter === "a"
        ? "WCAG-Accessibility-Compliance-Report-Level-A"
        : "WCAG-Accessibility-Compliance-Report-Level-AA";
  const baseName = safeFilename(reportNameByLevel);

  const exportAccessibilityCSV = useCallback(() => {
    const header = "Check,Level,Roles,Success criteria,Individual issues\n";
    const body = checksForExport.map((r) =>
      `"${r.name.replace(/"/g, '""')}","${r.level}","${r.roles.replace(/"/g, '""')}","${r.successCriteria.replace(/"/g, '""')}","${r.individualIssues}"`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, checksForExport]);

  const exportAccessibilityExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = checksForExport.map((r) => ({
      Check: r.name,
      Level: r.level,
      Roles: r.roles,
      "Success criteria": r.successCriteria,
      "Individual issues": r.individualIssues,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, levelFilter === "all" ? "Accessibility" : levelFilter === "a" ? "Level A" : "Level AA");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, checksForExport, levelFilter]);

  const exportAccessibilityPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Check", "Level", "Roles", "Success criteria", "Individual issues"]];
    const body = checksForExport.map((r) => [r.name, r.level, r.roles, r.successCriteria, String(r.individualIssues)]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: "wrap" }, 1: { cellWidth: 18 }, 2: { cellWidth: "wrap" }, 3: { cellWidth: "wrap" }, 4: { cellWidth: 28 } },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName, checksForExport]);

  return (
    <>
      {/* Header */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                <i className="isax isax-people fs-22" aria-hidden="true" />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Accessibility Score</h6>
                <p className="text-muted fs-13 mb-0">How accessible this page is for everyone.</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <DownloadReportDropdown
                reportBaseName={baseName}
                onExportCSV={exportAccessibilityCSV}
                onExportExcel={exportAccessibilityExcel}
                onExportPDF={exportAccessibilityPDF}
              />
              <div className="d-flex align-items-center gap-2">
                <ComplianceRing percent={typeof overallPercent === 'number' && !isNaN(overallPercent) ? Math.round(overallPercent) : 0} size={44} />
                <div>
                  <span className="fw-semibold fs-15">{typeof overallPercent === 'number' && !isNaN(overallPercent) ? Math.round(overallPercent) : 0}%</span>
                  <p className="text-muted fs-12 mb-0" style={{ lineHeight: 1.2 }}>Overall score for how usable this page is.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level tabs + filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <nav className="nav nav-tabs border-0 gap-2" aria-label="Priority level filter">
              {COMPLIANCE_LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${levelFilter === l.key ? "border-primary text-primary" : "border-transparent text-body"}`}
                  onClick={() => setLevelFilter(l.key)}
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Level A header */}
      {levelFilter === "a" && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <LevelHeaderBlock badgeLabel="A" title="High Priority (Level A) issues." percent={levelAPercent} />
          </div>
        </div>
      )}

      {/* Level AA header */}
      {levelFilter === "aa" && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <LevelHeaderBlock badgeLabel="AA" title="Medium Priority (Level AA) issues." percent={levelAAPercent} />
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="row g-3">
        {/* Left: checks list */}
        <div className="col-lg-6">
          {levelFilter === "a" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <ChecksTable checks={levelA} selectedCheckId={selectedCheckId} onSelectCheck={setSelectedCheckId} iconType="danger" />
              </div>
            </div>
          )}
          {levelFilter === "aa" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <ChecksTable checks={levelAA} selectedCheckId={selectedCheckId} onSelectCheck={setSelectedCheckId} iconType="eye" />
              </div>
            </div>
          )}
          {levelFilter === "all" && (
            <>
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <LevelHeaderBlock badgeLabel="A" title="High Priority (Level A) issues." percent={levelAPercent} />
                  <ChecksTable checks={levelA} selectedCheckId={selectedCheckId} onSelectCheck={setSelectedCheckId} iconType="danger" />
                </div>
              </div>
              <div className="card border-0 shadow-sm mt-3">
                <div className="card-body">
                  <LevelHeaderBlock badgeLabel="AA" title="Medium Priority (Level AA) issues." percent={levelAAPercent} />
                  <ChecksTable checks={levelAA} selectedCheckId={selectedCheckId} onSelectCheck={setSelectedCheckId} iconType="eye" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Selected check detail */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              {selectedCheck ? (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-semibold mb-0 text-body">Occurrences on page</h6>
                    <span className="fw-semibold text-primary">{selectedCheck.individualIssues}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span
                      className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${selectedCheck.level === "AA" ? "text-primary" : "text-danger"}`}
                      style={{
                        width: 28,
                        height: 28,
                        backgroundColor: selectedCheck.level === "AA" ? "rgba(13, 110, 253, 0.15)" : "rgba(220, 53, 69, 0.15)",
                      }}
                      aria-hidden="true"
                    >
                      {selectedCheck.level === "AA" ? (
                        <i className="isax isax-eye fs-16" aria-hidden="true" />
                      ) : (
                        <i className="isax isax-danger fs-16" aria-hidden="true" />
                      )}
                    </span>
                    <h6 className="mb-0 fw-semibold">{selectedCheck.name}</h6>
                  </div>
                  <div className="mb-3">
                    <i className="isax isax-teacher text-primary me-1" aria-hidden="true" />
                    <span className="fs-13 text-muted">Learn why this matters and how to fix it</span>
                  </div>

                  <div className="border-top pt-3">
                    {(selectedCheck?.nodes || []).map((inst, idx) => (
                      <div key={inst.id || idx} className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-light" style={{ width: 40, height: 40 }}>
                            <i className="isax isax-shield-tick text-primary fs-18" aria-hidden="true" />
                          </span>
                          <div className="d-flex align-items-center gap-2 ms-auto">
                            <button type="button" className="btn btn-icon btn-sm btn-link text-primary p-0" title="View in page">
                              <i className="isax isax-route-square fs-18" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-link text-primary p-0 text-decoration-none border-0"
                              title="View issue details"
                              onClick={() => {
                                if (selectedCheck) {
                                  setIssueDrawerData({
                                    id: inst.id || `node-${idx}`,
                                    checkName: selectedCheck.name,
                                    element: (inst.target && inst.target.join(", ")) || "Element",
                                    dateFound: effectiveData?.scanDate ? new Date(effectiveData.scanDate).toLocaleDateString() : new Date().toLocaleDateString(),
                                    effectOnCompliance: selectedCheck.effectOnCompliance || "0.00 %",
                                    impact: selectedCheck.impact || "moderate",
                                    snippetHtml: inst.snippet || "No snippet available",
                                    pageTitle: effectiveData?.title || "Page",
                                    pageUrl: effectiveData?.url || pageUrl || "",
                                    responsibility: selectedCheck.roles,
                                    successCriteria: selectedCheck.successCriteria?.replace(/^Part of success criteria\s*/i, "").trim() || "1.1.1",
                                    difficulty: "Medium",
                                    description: selectedCheck.description,
                                    failureSummary: inst.failureSummary,
                                  });
                                  setIssueDrawerOpen(true);
                                }
                              }}
                            >
                              <i className="isax isax-info-circle fs-18" />
                            </button>
                          </div>
                        </div>
                        <div className="rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 overflow-hidden">
                          {inst.target && inst.target.length > 0 && (
                            <div className="px-3 pt-3 pb-1 fs-13 text-danger fw-semibold" style={{ wordBreak: "break-all" }}>
                              Element on page: {inst.target.join(", ")}
                            </div>
                          )}
                          <pre
                            className="px-3 pb-3 pt-1 text-danger small mb-0 overflow-auto"
                            style={{ fontSize: "0.75rem", maxHeight: expandedSnippets.has(inst.id || idx) ? "none" : 80 }}
                          >
                            <code>{inst.snippet}</code>
                          </pre>
                          {inst.failureSummary && (
                            <div className="px-3 py-2 border-top border-danger border-opacity-25 fs-13 text-danger bg-danger bg-opacity-10">
                              <strong>How to fix:</strong> {inst.failureSummary}
                            </div>
                          )}
                          {(inst.snippet?.length > 150 || (inst.snippet?.match(/\n/g) || []).length > 2) && (
                            <div className="px-3 py-2 border-top border-danger border-opacity-25 bg-danger bg-opacity-10">
                              {!expandedSnippets.has(inst.id || idx) ? (
                                <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none fw-medium fs-13" onClick={() => toggleSnippet(inst.id || idx)}>
                                  Show more
                                </button>
                              ) : (
                                <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none fw-medium fs-13" onClick={() => toggleSnippet(inst.id || idx)}>
                                  Show less
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">Select an issue from the list to view details.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AccessibilityIssueDrawer
        open={issueDrawerOpen}
        onClose={() => {
          setIssueDrawerOpen(false);
          setIssueDrawerData(null);
        }}
        issue={issueDrawerData}
      />
    </>
  );
};

export default AccessibilitySection;
