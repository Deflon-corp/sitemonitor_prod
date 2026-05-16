import React, { useState, useMemo, useCallback, useEffect } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import AccessibilityIssueDrawer from "./AccessibilityIssueDrawer";

const COMPLIANCE_LEVELS = [
  { key: "all", label: "All levels" },
  { key: "a", label: "Level A" },
  { key: "aa", label: "Level AA" },
];

const LEVEL_A_CHECKS = [
  { id: "1", level: "A", name: "Image has non-empty accessible name", roles: "Content Authoring, Front-end Development", successCriteria: "Part of success criteria 1.1.1", individualIssues: 2 },
  { id: "2", level: "A", name: "Image not in the accessibility tree is decorative", roles: "Content Authoring, Front-end Development", successCriteria: "Part of success criteria 1.1.1", individualIssues: 10 },
  { id: "3", level: "A", name: "Image accessible name is descriptive", roles: "Content Authoring, Front-end Development", successCriteria: "Part of success criteria 1.1.1", individualIssues: 11 },
  { id: "4", level: "A", name: "All p elements are not used as headers.", roles: "Content Authoring, Front-end Development", successCriteria: "Part of success criteria 1.3.1", individualIssues: 1 },
  { id: "5", level: "A", name: "Use a quote element to mark up quotations.", roles: "Content Authoring, Front-end Development", successCriteria: "Part of success criteria 1.3.1", individualIssues: 2 },
];

const LEVEL_AA_CHECKS = [
  { id: "aa1", level: "AA", name: "Scrolling in more than one direction is not necessary for small displays and zoomed content.", roles: "Front-end Development, UX Design", successCriteria: "Part of success criteria 1.4.10", individualIssues: 1 },
  { id: "aa2", level: "AA", name: "The visual presentation of UI and graphics components have a contrast ratio of at least 3:1 against adjacent color(s).", roles: "Visual Design", successCriteria: "Part of success criteria 1.4.11", individualIssues: 1 },
  { id: "aa3", level: "AA", name: "No loss of content or functionality occurs when changing certain text style properties.", roles: "Front-end Development, Visual Design", successCriteria: "Part of success criteria 1.4.12", individualIssues: 1 },
  { id: "aa4", level: "AA", name: "Additional content that appears and disappears in coordination with keyboard focus or pointer hover does not obstruct operation.", roles: "Front-end Development", successCriteria: "Part of success criteria 1.4.13", individualIssues: 1 },
  { id: "aa5", level: "AA", name: "The luminosity contrast ratio between text and background color in all images is at least 4.5:1.", roles: "UX Design, Visual Design", successCriteria: "Part of success criteria 1.4.3", individualIssues: 36 },
];

const SAMPLE_INSTANCES = [
  { id: "i1", snippet: '<section class="listing-icons carousel-style " role="img"><div class="listing-icons__header-wrapper "><div class="listing-icons__inner-wrapper"><h2 c...' },
  { id: "i2", snippet: '<img src="/icons/car.svg" alt="">' },
  { id: "i3", snippet: '<img src="/icons/scooter.svg">' },
];

const ISSUE_DRAWER_SNIPPET_HTML = `<section class="listing-icons carousel-style " role="img">
  <div class="listing-icons__header-wrapper ">
    <div class="listing-icons__inner-wrapper">
      <h2 class="listing-icons__title">...</h2>
    </div>
  </div>
  <div class="swiper-wrap-container">
    <div class="swiper-wrapper">
      <div class="swiper-slide" style="margin-right: 16px;">
        <a title="Health">
          <img src="https://cms-assets.bajajfinserv.in/is/image/.../health-insurance-2?scl=1&amp;fmt=png-alpha" alt="Health" width="50" height="50" loading="lazy">
          <h3>Health</h3>
        </a>
      </div>
    </div>
  </div>
</section>`;

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

const LevelHeaderBlock = ({ badgeLabel, title, percent }) => (
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
      <ComplianceRing percent={percent} size={40} />
      <div>
        <span className="fw-semibold">{percent}%</span>
        <p className="text-muted fs-12 mb-0" style={{ lineHeight: 1.2 }}>Overall accessibility compliance for this level.</p>
      </div>
    </div>
  </div>
);

const ChecksTable = ({ checks, selectedCheckId, onSelectCheck, iconType }) => (
  <div className="table-responsive">
    <table className="table table-hover table-striped table-borderless align-middle mb-0">
      <thead>
        <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
          <th className="fw-semibold text-body py-2">Checks</th>
          <th className="fw-semibold text-body py-2 text-end" style={{ width: 100 }}>Individual issues</th>
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

const AccessibilitySection = ({ data, score }) => {
  const [levelFilter, setLevelFilter] = useState("all");
  const [showIgnored, setShowIgnored] = useState(false);
  const [showPassed, setShowPassed] = useState(true);
  
  // Use dynamic data if available, otherwise fallback to static samples
  const dynamicIssues = useMemo(() => {
    if (!data?.issues || !Array.isArray(data.issues)) return null;
    return data.issues.map(issue => ({
      id: issue.id,
      level: "A", // Default to A if not specified
      name: issue.title,
      roles: "Front-end Development",
      successCriteria: issue.description || "WCAG Check",
      individualIssues: issue.nodes?.length || 0,
      nodes: issue.nodes || []
    }));
  }, [data]);

  const levelA = dynamicIssues ? dynamicIssues.filter(i => i.level === "A") : LEVEL_A_CHECKS;
  const levelAA = dynamicIssues ? dynamicIssues.filter(i => i.level === "AA") : LEVEL_AA_CHECKS;

  const [selectedCheckId, setSelectedCheckId] = useState(null);

  useEffect(() => {
    if (!selectedCheckId) {
      if (levelFilter === "all" || levelFilter === "a") setSelectedCheckId(levelA[0]?.id);
      else if (levelFilter === "aa") setSelectedCheckId(levelAA[0]?.id);
    }
  }, [levelFilter, levelA, levelAA, selectedCheckId]);

  const overallPercent = score !== undefined ? score : 64.49;
  const levelAPercent = dynamicIssues ? score : 69.23; // Approximation
  const levelAAPercent = dynamicIssues ? score : 51.72;

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
                <h6 className="mb-0 fw-semibold">WCAG 2.2 Accessibility Compliance</h6>
                <p className="text-muted fs-13 mb-0">Accessibility compliance for this page.</p>
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
                <ComplianceRing percent={overallPercent} size={44} />
                <div>
                  <span className="fw-semibold fs-15">{overallPercent}%</span>
                  <p className="text-muted fs-12 mb-0" style={{ lineHeight: 1.2 }}>Overall accessibility compliance level for this page.</p>
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
            <nav className="nav nav-tabs border-0 gap-2" aria-label="Compliance level filter">
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
            <div className="d-flex align-items-center gap-2 ms-auto">
              <i className="isax isax-filter text-primary" style={{ fontSize: "1.1rem" }} aria-hidden="true" />
              <button
                type="button"
                className={`btn btn-sm btn-link p-0 text-decoration-none ${showIgnored ? "text-primary fw-medium" : "text-muted"}`}
                onClick={() => setShowIgnored(!showIgnored)}
              >
                Ignored checks
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1 ${showPassed ? "text-primary fw-medium" : "text-muted"}`}
                onClick={() => setShowPassed(!showPassed)}
              >
                <i className="isax isax-tick-circle fs-16" /> Passed checks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Level A header */}
      {levelFilter === "a" && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <LevelHeaderBlock badgeLabel="A" title="Level A accessibility checks." percent={levelAPercent} />
          </div>
        </div>
      )}

      {/* Level AA header */}
      {levelFilter === "aa" && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <LevelHeaderBlock badgeLabel="AA" title="Level AA accessibility checks." percent={levelAAPercent} />
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
                  <LevelHeaderBlock badgeLabel="A" title="Level A accessibility checks." percent={levelAPercent} />
                  <ChecksTable checks={levelA} selectedCheckId={selectedCheckId} onSelectCheck={setSelectedCheckId} iconType="danger" />
                </div>
              </div>
              <div className="card border-0 shadow-sm mt-3">
                <div className="card-body">
                  <LevelHeaderBlock badgeLabel="AA" title="Level AA accessibility checks." percent={levelAAPercent} />
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
                    <h6 className="fw-semibold mb-0 text-body">Individual issues</h6>
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
                    <span className="fs-13 text-muted">Learn more about this check</span>
                  </div>
                  <nav className="nav nav-tabs border-0 gap-2 mb-3">
                    <button
                      type="button"
                      className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${issueTab === "pending" ? "border-primary text-primary" : "border-transparent text-body"}`}
                      onClick={() => setIssueTab("pending")}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      className={`nav-link border-0 px-3 py-2 border-bottom border-2 fw-medium ${issueTab === "ignored" ? "border-primary text-primary" : "border-transparent text-body"}`}
                      onClick={() => setIssueTab("ignored")}
                    >
                      Ignored
                    </button>
                  </nav>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button type="button" className="btn btn-sm btn-light text-primary border">
                      {issueTab === "ignored" ? "Unignore all issues" : "Ignore all issues"}
                    </button>
                    <button type="button" className="btn btn-sm btn-light text-primary border">Ignore check</button>
                    <button type="button" className="btn btn-sm btn-light text-primary border">Mark check as fixed</button>
                  </div>
                  <div className="border-top pt-3">
                    {(selectedCheck?.nodes?.length > 0 ? selectedCheck.nodes : SAMPLE_INSTANCES).map((inst, idx) => (
                      <div key={inst.id || idx} className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-light" style={{ width: 40, height: 40 }}>
                            <i className="isax isax-shield-tick text-primary fs-18" aria-hidden="true" />
                          </span>
                          <div className="d-flex align-items-center gap-2 ms-auto">
                            <button type="button" className="btn btn-icon btn-sm btn-link text-primary p-0" title="View in page">
                              <i className="isax isax-route-square fs-18" />
                            </button>
                            <button type="button" className="btn btn-sm btn-light">Ignore</button>
                            <button type="button" className="btn btn-sm btn-light">Mark as fixed</button>
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-link text-primary p-0 text-decoration-none border-0"
                              title="View issue details"
                              onClick={() => {
                                if (selectedCheck) {
                                  setIssueDrawerData({
                                    id: inst.id || `node-${idx}`,
                                    checkName: selectedCheck.name,
                                    element: inst.selector || "Element",
                                    dateFound: new Date().toLocaleDateString(),
                                    effectOnCompliance: "0.00 %",
                                    snippetHtml: inst.snippet || ISSUE_DRAWER_SNIPPET_HTML,
                                    pageTitle: "Search",
                                    pageUrl: "https://www.bajajfinserv.in/search",
                                    responsibility: selectedCheck.roles,
                                    successCriteria: selectedCheck.successCriteria?.replace(/^Part of success criteria\s*/i, "").trim() || "1.1.1",
                                    difficulty: "Easy",
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
                          <pre
                            className="p-3 text-danger small mb-0 overflow-auto"
                            style={{ fontSize: "0.75rem", maxHeight: expandedSnippets.has(inst.id || idx) ? "none" : 80 }}
                          >
                            <code>{inst.snippet}</code>
                          </pre>
                          <div className="px-3 pb-2">
                            {!expandedSnippets.has(inst.id || idx) ? (
                              <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none" onClick={() => toggleSnippet(inst.id || idx)}>
                                Show more
                              </button>
                            ) : (
                              <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none" onClick={() => toggleSnippet(inst.id || idx)}>
                                Show less
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">Select a check from the list to view details.</p>
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
