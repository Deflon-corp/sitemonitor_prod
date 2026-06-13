import React, { useState, useMemo, useCallback } from "react";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";
import ChecklistPagesDrawer from "./ChecklistPagesDrawer";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import { getAccessibilitySummaryApi } from "@/api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

// Using API data instead of static checks

const ComplianceRing = ({ percent, size = 36 }) => {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  return (
    <div
      className="position-relative d-inline-flex align-items-center justify-content-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bs-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
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

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
    if (!domainId) return;
    setIsLoading(true);
    try {
      const res = await getAccessibilitySummaryApi(domainId);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch accessibility checklist data", err);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openPageDetails = useCallback((page) => {
    setDrawerRow(null);
    setSelectedPageForDetails({ id: 0, title: page.title, url: page.url });
    setPageDetailsDrawerOpen(true);
  }, []);

  const tabs = [
    { key: "level-a", label: "Level A" },
    { key: "level-aa", label: "Level AA" },
    { key: "other", label: "Other Issues" },
    { key: "passed", label: "Passed Checks" },
  ];

  const totalPagesScanned = summary?.totalPagesScanned || 1;

  const rowsByTab = useMemo(() => {
    if (!summary || !summary.allChecks) return [];

    const mapAxeCheck = (c) => {
      const failCount = c.passed ? 0 : c.count;
      const compliancePercent =
        ((totalPagesScanned - failCount) / totalPagesScanned) * 100;
      return {
        id: c.id,
        check: c.help || c.description || c.id,
        responsibility: "Development", // axe doesn't natively map responsibility
        successCriteria:
          (c.tags || []).find((t) => t.startsWith("wcag")) || "best-practice",
        compliancePercent: Math.max(0, Math.min(100, compliancePercent)),
        affectedPages: Math.min(totalPagesScanned, c.count),
        passed: c.passed,
        helpUrl: c.helpUrl,
      };
    };

    if (activeTab === "passed") {
      return summary.allChecks.filter((c) => c.passed).map(mapAxeCheck);
    }

    // For failed checks
    const failedChecks = summary.allChecks
      .filter((c) => !c.passed)
      .map(mapAxeCheck);

    if (activeTab === "level-a") {
      return failedChecks.filter(
        (c) =>
          c.successCriteria === "wcag2a" ||
          c.successCriteria === "wcag21a" ||
          c.successCriteria === "wcag22a",
      );
    }
    if (activeTab === "level-aa") {
      return failedChecks.filter(
        (c) =>
          c.successCriteria === "wcag2aa" ||
          c.successCriteria === "wcag21aa" ||
          c.successCriteria === "wcag22aa",
      );
    }
    if (activeTab === "other") {
      return failedChecks.filter(
        (c) =>
          ![
            "wcag2a",
            "wcag21a",
            "wcag22a",
            "wcag2aa",
            "wcag21aa",
            "wcag22aa",
          ].includes(c.successCriteria),
      );
    }

    // Fallback if none matches exactly
    return failedChecks;
  }, [activeTab, summary]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rowsByTab;
    const q = searchQuery.toLowerCase();
    return rowsByTab.filter(
      (r) =>
        r.check.toLowerCase().includes(q) ||
        r.responsibility.toLowerCase().includes(q) ||
        r.successCriteria.toLowerCase().includes(q),
    );
  }, [rowsByTab, searchQuery]);

  const reportBaseName = safeFilename(
    activeTab === "level-a"
      ? "Accessibility-Checklist-WCAG-2.2-Level-A"
      : activeTab === "level-aa"
        ? "Accessibility-Checklist-WCAG-2.2-Level-AA"
        : activeTab === "other"
          ? "Accessibility-Checklist-Other"
          : "Accessibility-Checklist-WCAG-2.2",
  );

  const exportCSV = useCallback(() => {
    const header =
      "Check,Responsibility,Success criteria,Compliance %,Affected pages\n";
    const body = filteredRows
      .map((r) =>
        [
          `"${r.check.replace(/"/g, '""')}"`,
          `"${r.responsibility.replace(/"/g, '""')}"`,
          `"${r.successCriteria}"`,
          r.compliancePercent.toFixed(1),
          r.affectedPages,
        ].join(","),
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
    const head = [
      [
        "Check",
        "Responsibility",
        "Success criteria",
        "Compliance %",
        "Affected pages",
      ],
    ];
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
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 40 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
      },
    });
    doc.save(`${reportBaseName}.pdf`);
  }, [reportBaseName, filteredRows]);

  const levelLabel =
    activeTab === "level-a"
      ? "A"
      : activeTab === "level-aa"
        ? "AA"
        : activeTab === "other"
          ? "O"
          : "";
  const levelTitle =
    activeTab === "level-a"
      ? "All level A accessibility checks"
      : activeTab === "level-aa"
        ? "All level AA accessibility checks"
        : activeTab === "other"
          ? "Other accessibility checks (Best Practices)"
          : "Accessibility checks";

  return (
    <div className="accessibility-checklist-view">
      <div className="mb-4">
        <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
          <i
            className="isax isax-people5 text-primary fs-22"
            aria-hidden="true"
          />
          Accessibility Checklist (WCAG 2.2)
        </h5>
        <p className="text-muted fs-13 mb-0">
          List of checks with and without issues
        </p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <nav className="nav nav-tabs border-0 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`nav-link border-0 px-3 py-2 rounded-2 fw-medium ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "text-body bg-body-tertiary bg-opacity-50"
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
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
            title="Filter"
            aria-label="Filter"
          >
            <i
              className="isax isax-filter text-primary fs-18"
              aria-hidden="true"
            />
          </button>
          <div
            className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
            style={{ width: 220 }}
          >
            <span
              className="d-flex align-items-center ps-3 flex-shrink-0 text-muted"
              aria-hidden="true"
            >
              <i
                className="isax isax-search-normal-1"
                style={{ fontSize: "1rem" }}
                aria-hidden="true"
              />
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

      {(activeTab === "level-a" ||
        activeTab === "level-aa" ||
        activeTab === "other") && (
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
            <strong className="text-body">Issues to Fix</strong> — Errors should
            be reviewed and fixed.
          </p>
        </>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 px-3 text-body fs-13 fw-semibold text-nowrap">
                    Check
                  </th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">
                    Responsibility
                  </th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap">
                    Success criteria
                  </th>
                  <th className="py-3 px-3 pe-4 text-body fs-13 fw-semibold text-nowrap">
                    Domain compliance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-danger"
                          style={{
                            width: 28,
                            height: 28,
                            backgroundColor: "rgba(220, 53, 69, 0.15)",
                          }}
                          aria-hidden="true"
                        >
                          <i
                            className="isax isax-danger fs-14"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="fs-13 text-body">{row.check}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 fs-13 text-body">
                      {row.responsibility}
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-1 fs-13 text-body">
                        <i
                          className="isax isax-document-text text-muted fs-14"
                          aria-hidden="true"
                        />
                        {row.successCriteria}
                      </div>
                    </td>
                    <td className="py-3 px-3 pe-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-semibold fs-14 text-primary">
                            {row.compliancePercent.toFixed(1)}%
                          </span>
                          <span className="text-muted fs-12 text-nowrap">
                            COMPLIANCE
                          </span>
                        </div>
                        <ComplianceRing
                          percent={row.compliancePercent}
                          size={36}
                        />
                        <button
                          type="button"
                          className="d-flex flex-column align-items-center border-0 bg-transparent p-0 text-primary text-decoration-none"
                          onClick={() => setDrawerRow(row)}
                          aria-label={`${row.affectedPages} pages with this issue`}
                        >
                          <span className="fw-semibold fs-14 text-primary">
                            {row.affectedPages}
                          </span>
                          <span className="text-muted fs-12 text-nowrap">
                            PAGES
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 && (
            <div className="text-center text-muted py-5">
              No checks to display for this tab.
            </div>
          )}
        </div>
      </div>

      <ChecklistPagesDrawer
        open={drawerRow != null}
        onClose={() => setDrawerRow(null)}
        checkName={drawerRow?.check ?? ""}
        checkId={drawerRow?.id ?? null}
        isPassed={drawerRow?.passed ?? false}
        compliancePercent={drawerRow?.compliancePercent ?? 0}
        affectedPages={drawerRow?.affectedPages ?? 0}
        totalPagesScanned={totalPagesScanned}
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
