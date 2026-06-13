import React, { useCallback, useEffect, useState } from "react";
import DownloadReportDropdown from "../ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "../../lib/download";
import { getQaSpellcheckSummaryApi } from "../../api/qaApi";
import { useQaDomainId } from "../../hooks/useQaDomainId";
import { useQaRefreshKey } from "../../contexts/QaScanContext";

/** Trend: unique (orange, flat low) and potential (blue, high to mid). Y 0–1000, X time. */
function MisspellingsTrendChart() {
  const w = 400;
  const h = 180;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxY = 1000;
  const uniquePts =
    "0 175 50 174 100 173 150 172 200 171 250 170 300 169 350 168 400 167";
  const potentialPts =
    "0 12 50 95 100 178 150 245 200 312 250 378 300 434 350 489 400 545";
  const scaleY = (v) => padding.top + chartH - (v / maxY) * chartH;
  const parseLine = (pts) => {
    const pairs = pts.split(" ").map(Number);
    return pairs
      .reduce((acc, _, i, arr) => {
        if (i % 2 === 0 && arr[i + 1] != null) {
          const x = padding.left + (Number(arr[i]) / 400) * chartW;
          const y = scaleY(Number(arr[i + 1]));
          acc.push(`${acc.length ? "L" : "M"} ${x} ${y}`);
        }
        return acc;
      }, [])
      .join(" ");
  };
  const uniquePath = parseLine(uniquePts);
  const potentialPath = parseLine(potentialPts);

  const yTicks = [0, 500, 1000];
  const gridColor = "#e2e8f0";

  return (
    <div className="position-relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-100"
        style={{ height: 200 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartH}
          stroke={gridColor}
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke={gridColor}
          strokeWidth="1"
        />
        {/* Y-axis tick labels (0, 500, 1,000) and horizontal grid lines */}
        {yTicks.map((tick) => {
          const y = scaleY(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
              />
              <text
                x={padding.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fs-10 text-muted"
                fill="currentColor"
                style={{ fontSize: 10 }}
              >
                {tick === 1000 ? "1,000" : String(tick)}
              </text>
            </g>
          );
        })}
        <path
          d={uniquePath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={potentialPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x={padding.left + chartW / 2}
          y={h - 4}
          textAnchor="middle"
          className="fs-10 text-muted"
          fill="currentColor"
          style={{ fontSize: 10 }}
        >
          Dec 09 — Feb 15
        </text>
      </svg>
      <div className="d-flex flex-wrap justify-content-center gap-4 mt-2">
        <span className="d-inline-flex align-items-center gap-1 fs-12 text-muted">
          <span
            className="rounded"
            style={{ width: 10, height: 10, backgroundColor: "#f59e0b" }}
          />{" "}
          Unique misspellings
        </span>
        <span className="d-inline-flex align-items-center gap-1 fs-12 text-muted">
          <span
            className="rounded"
            style={{ width: 10, height: 10, backgroundColor: "#3b82f6" }}
          />{" "}
          Potential misspellings
        </span>
      </div>
    </div>
  );
}

function SpellcheckMetricRow({ label, value, icon }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary border-opacity-25">
      <span className="d-inline-flex align-items-center gap-2 text-body fs-13">
        <i className={`isax ${icon} text-primary fs-18`} aria-hidden="true" />
        {label}
      </span>
      <span className="fw-semibold text-body">{value}</span>
    </div>
  );
}

const baseName = safeFilename("Spellcheck-Summary-Report");

export default function SpellcheckSummaryView() {
  const domainId = useQaDomainId();
  const refreshKey = useQaRefreshKey();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domainId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getQaSpellcheckSummaryApi(domainId)
      .then((res) => {
        if (res.success) setData(res.data ?? null);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [domainId, refreshKey]);

  const UNIQUE_MISSPELLINGS = data?.uniqueMisspellings ?? 0;
  const POTENTIAL_MISSPELLINGS =
    data?.uniquePotentialMisspellings ?? data?.potentialMisspellings ?? 0;
  const PAGES_WITH_POTENTIAL = data?.pagesWithPotentialMisspellings ?? 0;
  const LANGUAGES_FOUND = 1;
  const MOST_COMMON_LANGUAGE = "English";
  const MOST_COMMON_MISSPELLINGS = (data?.mostCommonMisspellings || []).map(
    (r) => ({
      word: r.word,
      language: MOST_COMMON_LANGUAGE,
      pages: r.pagesCount,
    }),
  );
  const MOST_COMMON_POTENTIAL = (data?.mostCommonPotential || []).map((r) => ({
    word: r.word,
    language: MOST_COMMON_LANGUAGE,
    pages: r.pagesCount,
  }));

  const exportCSV = useCallback(() => {
    const summaryRows = [
      ["Metric", "Value"],
      ["Unique misspellings found", String(UNIQUE_MISSPELLINGS)],
      ["Potential misspellings found", String(POTENTIAL_MISSPELLINGS)],
      ["Languages found", String(LANGUAGES_FOUND)],
      ["Most common language", MOST_COMMON_LANGUAGE],
      [],
      ["Word", "Language", "Pages"],
      ...MOST_COMMON_MISSPELLINGS.map((r) => [
        `"${r.word.replace(/"/g, '""')}"`,
        `"${r.language.replace(/"/g, '""')}"`,
        String(r.pages),
      ]),
      [],
      ["Word", "Language", "Pages"],
      ...MOST_COMMON_POTENTIAL.map((r) => [
        `"${r.word.replace(/"/g, '""')}"`,
        `"${r.language.replace(/"/g, '""')}"`,
        String(r.pages),
      ]),
    ];
    const csv = summaryRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, []);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const summaryRows = [
      { Metric: "Unique misspellings found", Value: UNIQUE_MISSPELLINGS },
      { Metric: "Potential misspellings found", Value: POTENTIAL_MISSPELLINGS },
      { Metric: "Languages found", Value: LANGUAGES_FOUND },
      { Metric: "Most common language", Value: MOST_COMMON_LANGUAGE },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    const ws2 = XLSX.utils.json_to_sheet(MOST_COMMON_MISSPELLINGS);
    const ws3 = XLSX.utils.json_to_sheet(MOST_COMMON_POTENTIAL);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    XLSX.utils.book_append_sheet(wb, ws2, "Most common misspellings");
    XLSX.utils.book_append_sheet(wb, ws3, "Most common potential");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, []);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const head = [["Metric", "Value"]];
    const body = [
      ["Unique misspellings found", String(UNIQUE_MISSPELLINGS)],
      ["Potential misspellings found", String(POTENTIAL_MISSPELLINGS)],
      ["Languages found", String(LANGUAGES_FOUND)],
      ["Most common language", MOST_COMMON_LANGUAGE],
    ];
    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 10 } });
    let startY = doc.lastAutoTable.finalY + 12;
    autoTable(doc, {
      head: [["Word", "Language", "Pages"]],
      body: MOST_COMMON_MISSPELLINGS.map((r) => [
        r.word,
        r.language,
        String(r.pages),
      ]),
      startY,
      styles: { fontSize: 9 },
    });
    startY = doc.lastAutoTable.finalY + 12;
    autoTable(doc, {
      head: [["Word", "Language", "Pages"]],
      body: MOST_COMMON_POTENTIAL.map((r) => [
        r.word,
        r.language,
        String(r.pages),
      ]),
      startY,
      styles: { fontSize: 9 },
    });
    doc.save(`${baseName}.pdf`);
  }, []);

  if (loading) {
    return <p className="text-muted py-4">Loading spellcheck summary…</p>;
  }

  if (!data) {
    return (
      <div className="card border border-secondary border-opacity-25 rounded-3 p-5 text-center text-muted">
        <p className="mb-0 fs-13">
          No spellcheck data yet. Run a QA scan to see summary metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="spellcheck-summary-view">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
            style={{ width: 40, height: 40 }}
          >
            <i className="isax isax-home-2 fs-20" aria-hidden="true" />
          </span>
          <h5 className="mb-0 fw-semibold text-body">Spellcheck Summary</h5>
        </div>
        <DownloadReportDropdown
          reportBaseName={baseName}
          onExportCSV={exportCSV}
          onExportExcel={exportExcel}
          onExportPDF={exportPDF}
          className="border border-secondary border-opacity-25 rounded-2"
        />
      </div>

      {/* Misspellings history */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <h6 className="fw-semibold text-body mb-4">Misspellings history</h6>
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-3">
                <SpellcheckMetricRow
                  label="Unique misspellings"
                  value={UNIQUE_MISSPELLINGS}
                  icon="isax-edit-2"
                />
                <SpellcheckMetricRow
                  label="Possible misspellings (unique words)"
                  value={POTENTIAL_MISSPELLINGS}
                  icon="isax-text"
                />
                <SpellcheckMetricRow
                  label="Pages with possible misspellings"
                  value={PAGES_WITH_POTENTIAL}
                  icon="isax-document-text"
                />
                <SpellcheckMetricRow
                  label="Languages found"
                  value={LANGUAGES_FOUND}
                  icon="isax-flag"
                />
                <div className="d-flex align-items-center justify-content-between py-2 border-bottom-0">
                  <span className="d-inline-flex align-items-center gap-2 text-body fs-13">
                    <i
                      className="isax isax-flag text-primary fs-18"
                      aria-hidden="true"
                    />
                    Most common language
                  </span>
                  <span className="fw-semibold text-body fs-13">
                    {MOST_COMMON_LANGUAGE}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <MisspellingsTrendChart />
            </div>
          </div>
        </div>
      </div>

      {/* Most common misspellings + potential */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border border-secondary border-opacity-25 shadow-sm rounded-3 h-100 overflow-hidden">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-body mb-3">
                Most common misspellings
              </h6>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th
                        className="border-0 py-2 ps-0"
                        style={{ width: 32 }}
                        aria-hidden="true"
                      />
                      <th className="border-0 py-2 fw-semibold text-body">
                        Word
                      </th>

                      <th className="border-0 py-2 fw-semibold text-body text-end">
                        Pages
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && MOST_COMMON_MISSPELLINGS.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-muted fs-13"
                        >
                          No misspellings found.
                        </td>
                      </tr>
                    )}
                    {MOST_COMMON_MISSPELLINGS.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 ps-0">
                          <span
                            className="rounded-circle d-inline-block"
                            style={{
                              width: 8,
                              height: 8,
                              backgroundColor: "#f59e0b",
                            }}
                            aria-hidden="true"
                          />
                        </td>
                        <td className="py-2 fw-medium text-body">{row.word}</td>

                        <td className="py-2 text-muted fs-13 text-end">
                          {row.pages} {row.pages === 1 ? "PAGE" : "PAGES"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border border-secondary border-opacity-25 shadow-sm rounded-3 h-100 overflow-hidden">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-body mb-3">
                Most common potential misspellings
              </h6>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th
                        className="border-0 py-2 ps-0"
                        style={{ width: 32 }}
                        aria-hidden="true"
                      />
                      <th className="border-0 py-2 fw-semibold text-body">
                        Word
                      </th>

                      <th className="border-0 py-2 fw-semibold text-body text-end">
                        Pages
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && MOST_COMMON_POTENTIAL.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-muted fs-13"
                        >
                          No possible misspellings found. Run a QA scan to
                          refresh.
                        </td>
                      </tr>
                    )}
                    {MOST_COMMON_POTENTIAL.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 ps-0">
                          <span
                            className="rounded-circle d-inline-block"
                            style={{
                              width: 8,
                              height: 8,
                              backgroundColor: "#3b82f6",
                            }}
                            aria-hidden="true"
                          />
                        </td>
                        <td className="py-2 fw-medium text-body">{row.word}</td>

                        <td className="py-2 text-muted fs-13 text-end">
                          {row.pages} PAGES
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
