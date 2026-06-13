import React, { useState, useMemo, useEffect, useCallback } from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import { getQaBrokenLinkPagesApi } from "../../api/qaApi";
import { useQaDomainId } from "../../hooks/useQaDomainId";

export default function DocumentsWithBrokenLinkDrawer({
  open,
  onClose,
  sourceUrl = null,
  titleVariant = "link",
  title: titleProp,
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const domainId = useQaDomainId();
  const drawerTitle =
    titleProp ??
    (titleVariant === "images"
      ? "Documents with Broken Images"
      : "Documents with Broken Link");

  const displayUrl = sourceUrl ?? "";

  useEffect(() => {
    if (!open || !domainId || !sourceUrl) {
      setRows([]);
      return;
    }
    setLoading(true);
    getQaBrokenLinkPagesApi(domainId, sourceUrl)
      .then((res) => {
        if (res.success) {
          const docs = (res.data?.pages || [])
            .filter((p) => /\.pdf($|\?)/i.test(p.url || ""))
            .map((p, i) => ({
              id: p.id || String(i + 1),
              title: p.title || p.url,
              url: p.url,
              type: "PDF",
              views: p.views || 0,
            }));
          setRows(docs);
        } else {
          setRows([]);
        }
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open, domainId, sourceUrl]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
    );
  }, [search, rows]);

  const reportName = "Documents-with-Broken-Link-Report";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(
    function () {
      const header = "Title,URL,Type\n";
      const body = filteredRows
        .map(
          (r) =>
            `"${r.title.replace(/"/g, '""')}","${r.url.replace(/"/g, '""')}","${r.type}",${r.views}`,
        )
        .join("\n");
      const blob = new Blob([header + body], {
        type: "text/csv;charset=utf-8;",
      });
      downloadBlob(blob, `${baseName}.csv`);
    },
    [filteredRows, baseName],
  );

  const exportExcel = useCallback(
    async function () {
      const XLSX = await import("xlsx");
      const rows = filteredRows.map((r) => ({
        Title: r.title,
        URL: r.url,
        Type: r.type,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Documents");
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    },
    [filteredRows, baseName],
  );

  const exportPDF = useCallback(
    async function () {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape" });
      const head = [["Title", "URL", "Type"]];
      const body = filteredRows.map((r) => [r.title, r.url, r.type]);
      autoTable(doc, {
        head,
        body,
        startY: 10,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: "wrap" },
          1: { cellWidth: "wrap" },
          2: { cellWidth: 20 },
          3: { cellWidth: 18 },
        },
      });
      doc.save(`${baseName}.pdf`);
    },
    [filteredRows, baseName],
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <React.Fragment>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: 1050 }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow overflow-hidden d-flex flex-column"
        style={{ zIndex: 1055, width: "min(100%, 900px)", maxWidth: "900px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="documents-with-broken-link-drawer-title"
      >
        {/* Header */}
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start gap-3 justify-content-between flex-wrap">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light flex-shrink-0"
                title="Close"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <i
                  className="isax isax-close-square fs-20"
                  aria-hidden="true"
                ></i>
              </button>
              <div className="min-w-0">
                <h5
                  id="documents-with-broken-link-drawer-title"
                  className="mb-1 fw-semibold text-body"
                >
                  {drawerTitle}
                </h5>
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                  title="Open in new tab"
                >
                  {displayUrl}
                </a>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Download Report"
                >
                  <i
                    className="isax isax-document-download text-primary fs-18"
                    aria-hidden="true"
                  ></i>{" "}
                  Download Report
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                      onClick={exportCSV}
                    >
                      <i
                        className="isax isax-document-text me-2"
                        aria-hidden="true"
                      ></i>{" "}
                      CSV
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                      onClick={exportPDF}
                    >
                      <i
                        className="isax isax-document-text me-2"
                        aria-hidden="true"
                      ></i>{" "}
                      PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center w-100 border-0 bg-transparent text-start"
                      onClick={exportExcel}
                    >
                      <i
                        className="isax isax-document-text me-2"
                        aria-hidden="true"
                      ></i>{" "}
                      Excel
                    </button>
                  </li>
                </ul>
              </div>
              <div className="position-relative" style={{ width: 200 }}>
                <i
                  className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
                  style={{ fontSize: "0.875rem" }}
                  aria-hidden="true"
                ></i>
                <input
                  type="search"
                  className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search"
                  style={{ paddingLeft: "2rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto p-4">
          {filteredRows.length === 0 ? (
            <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
              <div className="card-body py-5 text-center text-muted">
                No content was found
              </div>
            </div>
          ) : (
            <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-striped table-borderless align-middle mb-0">
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                        <th className="fw-semibold text-body py-3 ps-4">
                          Title and URL
                        </th>
                        <th className="fw-semibold text-body py-3">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td className="py-3 ps-4">
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-body">
                                {row.title}
                              </span>
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted small text-decoration-none d-inline-flex align-items-center gap-1 mt-1"
                                title="Open in new tab"
                              >
                                <span
                                  className="d-inline-flex text-primary"
                                  aria-hidden="true"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M15 3h6v6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M10 14L21 3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                                {row.url}
                              </a>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                              {row.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
