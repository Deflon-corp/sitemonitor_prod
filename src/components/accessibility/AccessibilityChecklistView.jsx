import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import ChecklistPagesDrawer from "./ChecklistPagesDrawer";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const LEVEL_A_CHECKS = [
  { id: "1", check: "Elements intended as presentation-only contain focusable content", responsibility: "Front-end Development", successCriteria: "4.1.2", compliancePercent: 4.2, affectedPages: 479 },
  { id: "2", check: "Form field is missing an accessible name", responsibility: "Front-end Development", successCriteria: "4.1.2", compliancePercent: 4.4, affectedPages: 478 },
  { id: "3", check: "Scrollable content is not accessible using the keyboard", responsibility: "Front-end Development, UX Design", successCriteria: "2.1.1", compliancePercent: 5.1, affectedPages: 475 },
  { id: "4", check: "Image is missing alternative text", responsibility: "Content Authoring, Front-end Development", successCriteria: "1.1.1", compliancePercent: 12.3, affectedPages: 438 },
  { id: "5", check: "Link is missing an accessible name", responsibility: "Content Authoring, Front-end Development", successCriteria: "2.4.4", compliancePercent: 8.7, affectedPages: 456 },
  { id: "6", check: "Button is missing an accessible name", responsibility: "Front-end Development", successCriteria: "4.1.2", compliancePercent: 6.2, affectedPages: 469 },
  { id: "7", check: "Heading order is not logical", responsibility: "Content Authoring, Front-end Development", successCriteria: "1.3.1", compliancePercent: 15.4, affectedPages: 422 },
  { id: "8", check: "Color is not used as the only visual means of conveying information", responsibility: "Visual Design, UX Design", successCriteria: "1.4.1", compliancePercent: 22.1, affectedPages: 390 },
];

const LEVEL_AA_CHECKS = [
  { id: "aa1", check: "The visual presentation of UI and graphics components have a contrast ratio of at least 3:1", responsibility: "Visual Design", successCriteria: "1.4.11", compliancePercent: 18.5, affectedPages: 408 },
  { id: "aa2", check: "The luminosity contrast ratio between text and background is at least 4.5:1", responsibility: "UX Design, Visual Design", successCriteria: "1.4.3", compliancePercent: 31.2, affectedPages: 344 },
];

const ComplianceRing = ({ percent, size = 36 }) => {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent)) / 100 * circumference;
  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bs-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} />
      </svg>
    </div>
  );
};

const AccessibilityChecklistView = () => {
  const [activeTab, setActiveTab] = useState("level-a");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerRow, setDrawerRow] = useState(null);
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const openPageDetails = useCallback((page) => {
    setDrawerRow(null);
    setSelectedPageForDetails({ id: 0, title: page.title, url: page.url });
    setPageDetailsDrawerOpen(true);
  }, []);

  const tabs = [
    { key: "level-a", label: "Level A" },
    { key: "level-aa", label: "Level AA" },
    { key: "ignored", label: "Ignored" },
    { key: "passed", label: "Passed Checks" },
  ];

  const rowsByTab = useMemo(() => {
    if (activeTab === "level-a") return LEVEL_A_CHECKS;
    if (activeTab === "level-aa") return LEVEL_AA_CHECKS;
    return [];
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rowsByTab;
    const q = searchQuery.toLowerCase();
    return rowsByTab.filter(
      (r) =>
        r.check.toLowerCase().includes(q) ||
        r.responsibility.toLowerCase().includes(q) ||
        r.successCriteria.toLowerCase().includes(q)
    );
  }, [rowsByTab, searchQuery]);

  const reportBaseName = safeFilename(
    activeTab === "level-a"
      ? "Accessibility-Checklist-WCAG-2.2-Level-A"
      : activeTab === "level-aa"
        ? "Accessibility-Checklist-WCAG-2.2-Level-AA"
        : "Accessibility-Checklist-WCAG-2.2"
  );

  const exportCSV = useCallback(() => {
    const header = "Check,Responsibility,Success criteria,Compliance %,Affected pages\n";
    const body = filteredRows
      .map((r) =>
        [
          `"${r.check.replace(/"/g, '""')}"`,
          `"${r.responsibility.replace(/"/g, '""')}"`,
          `"${r.successCriteria}"`,
          r.compliancePercent.toFixed(1),
          r.affectedPages,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${reportBaseName}.csv`);
  }, [reportBaseName, filteredRows]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = filteredRows.map((r) => ({
      Check: r.check,
      Responsibility: r.responsibility,
      "Success criteria": r.successCriteria,
      "Compliance %": r.compliancePercent,
      "Affected pages": r.affectedPages,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Checklist");
    XLSX.writeFile(wb, `${reportBaseName}.xlsx`);
  }, [reportBaseName, filteredRows]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Check", "Responsibility", "Success criteria", "Compliance %", "Affected pages"]];
    const body = filteredRows.map((r) => [
      r.check.slice(0, 50),
      r.responsibility.slice(0, 30),
      r.successCriteria,
      `${r.compliancePercent.toFixed(1)}%`,
      String(r.affectedPages),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 40 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 22 } },
    });
    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, filteredRows]);

  const levelLabel = activeTab === "level-a" ? "A" : activeTab === "level-aa" ? "AA" : "";
  const levelTitle =
    activeTab === "level-a"
      ? "All level A accessibility checks"
      : activeTab === "level-aa"
        ? "All level AA accessibility checks"
        : "Accessibility checks";

  return (
    <div className="accessibility-checklist-view">
      <div className="mb-4">
        <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
          <i className="isax isax-people5 text-primary fs-22" aria-hidden="true" />
          Accessibility Checklist (WCAG 2.2)
        </h5>
        <p className="text-muted fs-13 mb-0">List of checks with and without issues</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <nav className="nav nav-tabs border-0 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`nav-link border-0 px-3 py-2 rounded-2 fw-medium ${
                activeTab === tab.key ? "bg-primary text-white" : "text-body bg-body-tertiary bg-opacity-50"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <DownloadReportDropdown
            reportBaseName={reportBaseName}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            className="border border-secondary border-opacity-25 rounded-2"
          />
          <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2" title="Filter" aria-label="Filter">
            <i className="isax isax-filter text-primary fs-18" aria-hidden="true" />
          </button>
          <div
            className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
            style={{ width: 220 }}
          >
            <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
              <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} aria-hidden="true" />
            </span>
            <input
              type="search"
              className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              style={{ paddingLeft: "0.5rem" }}
            />
          </div>
        </div>
      </div>

      {(activeTab === "level-a" || activeTab === "level-aa") && (
        <>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
              style={{ width: 40, height: 40, backgroundColor: "#dc3545" }}
              aria-hidden="true"
            >
              {levelLabel}
            </span>
            <span className="fw-semibold fs-15">{levelTitle}</span>
          </div>
          <p className="text-muted fs-13 mb-3">
            <strong className="text-body">Issues to Fix</strong> — Errors must be fixed for compliance.
          </p>
        </>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 px-3 text-body fs-13 fw-semibold text-nowrap">Check</th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">Responsibility</th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">Success criteria</th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">Help center</th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">Domain compliance</th>
                  <th className="py-3 px-3 pe-4 text-body fs-13 fw-semibold text-nowrap" style={{ width: 100 }} aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-danger"
                          style={{ width: 28, height: 28, backgroundColor: "rgba(220, 53, 69, 0.15)" }}
                          aria-hidden="true"
                        >
                          <i className="isax isax-danger fs-14" aria-hidden="true" />
                        </span>
                        <span className="fs-13 text-body">{row.check}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 fs-13 text-body">{row.responsibility}</td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-1 fs-13 text-body">
                        <i className="isax isax-document-text text-muted fs-14" aria-hidden="true" />
                        {row.successCriteria}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button type="button" className="btn btn-icon btn-sm btn-link text-primary p-0" title="Help center" aria-label="Help center">
                        <i className="isax isax-teacher fs-18" aria-hidden="true" />
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-semibold fs-14 text-primary">{row.compliancePercent.toFixed(1)}%</span>
                          <span className="text-muted fs-12 text-nowrap">COMPLIANCE</span>
                        </div>
                        <ComplianceRing percent={row.compliancePercent} size={36} />
                        <button
                          type="button"
                          className="d-flex flex-column align-items-center border-0 bg-transparent p-0 text-primary text-decoration-none"
                          onClick={() => setDrawerRow(row)}
                          aria-label={`${row.affectedPages} pages with this issue`}
                        >
                          <span className="fw-semibold fs-14 text-primary">{row.affectedPages}</span>
                          <span className="text-muted fs-12 text-nowrap">PAGES</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 pe-4">
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          aria-label="Action"
                        >
                          Action
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button type="button" className="dropdown-item">View pages</button>
                          </li>
                          <li>
                            <button type="button" className="dropdown-item">Ignore check</button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 && (
            <div className="text-center text-muted py-5">No checks to display for this tab.</div>
          )}
        </div>
      </div>

      <ChecklistPagesDrawer
        open={drawerRow != null}
        onClose={() => setDrawerRow(null)}
        checkName={drawerRow?.check ?? ""}
        compliancePercent={drawerRow?.compliancePercent ?? 0}
        totalPages={drawerRow?.affectedPages ?? 0}
        onOpenPageDetails={openPageDetails}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={selectedPageForDetails}
        defaultTab="accessibility"
        backdropZIndex={1075}
        panelZIndex={1080}
      />
    </div>
  );
};

export default AccessibilityChecklistView;
