import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Full-page style sample list (replace with API via `pages` prop). */
export function getSamplePagesForEmail(
  email,
  domainUrl = "https://example.com",
) {
  const safe = (email || "contact").replace(/@/g, "-at-").replace(/\./g, "-");
  const local = email || "contact@example.com";

  const paths = [
    { title: "Careers — Contact", path: "/careers/contact", views: 42 },
    { title: "(No title found)", path: "/careers/apply", views: 18 },
    { title: "Investor relations", path: "/investor-relations", views: 120 },
    { title: "Contact us", path: "/contact-us", views: 890 },
    { title: "Privacy policy", path: "/privacy-policy", views: 56 },
    { title: "Footer — Get in touch", path: "/footer-links", views: 12 },
    { title: `(No title found)`, path: `/pages/${safe}`, views: 3 },
    { title: "Sitemap", path: "/sitemap", views: 201 },
    { title: "(No title found)", path: "/about/leadership", views: 64 },
    { title: "Help centre", path: "/support/help", views: 445 },
    { title: "(No title found)", path: "/support/faq", views: 92 },
    { title: "Terms & conditions", path: "/legal/terms", views: 33 },
    { title: "Grievance redressal", path: "/grievance", views: 7 },
    { title: "(No title found)", path: "/news/press", views: 28 },
    {
      title: `Email reference — ${local}`,
      path: `/mentions/${safe}`,
      views: 1,
    },
    { title: "Branch locator", path: "/locator", views: 512 },
    { title: "(No title found)", path: "/emi-calculator", views: 2100 },
    { title: "Loan products", path: "/loans", views: 3400 },
    { title: "Credit card landing", path: "/cards", views: 890 },
    { title: "(No title found)", path: "/cards/apply", views: 156 },
    { title: "Insurance overview", path: "/insurance", views: 678 },
    { title: "Blog — Money tips", path: "/blog/money-tips", views: 45 },
    { title: "(No title found)", path: "/blog/archive", views: 22 },
    { title: "Accessibility statement", path: "/accessibility", views: 9 },
  ];

  return paths.map((p, i) => ({
    id: String(i + 1),
    title: p.title,
    url: `${domainUrl}${p.path}`,
    views: p.views,
  }));
}

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ms-1"
      style={{ verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

/**
 * Drawer: full-page layout matching “Pages with this frame” (download, search, sortable Views, pagination).
 */
export default function PagesThatContainEmailDrawer({
  open,
  onClose,
  email,
  pages = [],
  onOpenPageDetails,
  ariaLabelledBy = "pages-that-contain-email-drawer-title",
  reportBaseName: reportBaseNameProp = "Pages-Email-Report",
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortViewsAsc, setSortViewsAsc] = useState(true);
  const [domainUrl, setDomainUrl] = useState("https://example.com");

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const selDomainId = sessionStorage.getItem("SELECTED_DOMAIN_KEY");
        if (selDomainId) {
          const { getDomainsApi } = await import("@/api/domainApi");
          const domainRes = await getDomainsApi();
          const domainList = Array.isArray(domainRes.data)
            ? domainRes.data
            : domainRes.data?.domains || [];
          const domain = domainList.find(
            (d) => d._id === selDomainId || String(d.dm_id) === selDomainId,
          );
          if (domain?.dm_url) {
            setDomainUrl(domain.dm_url.replace(/\/$/, ""));
          }
        }
      } catch (err) {
        console.error(
          "Failed to load dynamic domain URL in email drawer:",
          err,
        );
      }
    };
    if (open) {
      fetchDomain();
    }
  }, [open]);

  const sourcePages = useMemo(() => {
    if (pages.length > 0) return pages;
    if (email) return getSamplePagesForEmail(email, domainUrl);
    return [];
  }, [pages, email, domainUrl]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return sourcePages;
    const q = search.trim().toLowerCase();
    return sourcePages.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.url && r.url.toLowerCase().includes(q)),
    );
  }, [sourcePages, search]);

  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) =>
        sortViewsAsc ? a.views - b.views : b.views - a.views,
      ),
    [filteredRows, sortViewsAsc],
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportBase = safeFilename(reportBaseNameProp);
  const exportCSV = useCallback(() => {
    const header = "Title and URL,Views\n";
    const body = sortedRows
      .map(
        (r) =>
          `"${(r.title || "").replace(/"/g, '""')}","${(r.url || "").replace(/"/g, '""')}",${r.views}`,
      )
      .join("\n");
    downloadBlob(
      new Blob([header + body], { type: "text/csv;charset=utf-8;" }),
      `${reportBase}.csv`,
    );
  }, [sortedRows, reportBase]);
  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      sortedRows.map((r) => ({
        "Title and URL": r.title || r.url,
        URL: r.url,
        Views: r.views,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [sortedRows, reportBase]);
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["Title", "URL", "Views"]],
      body: sortedRows.map((r) => [
        r.title || "",
        r.url || "",
        String(r.views),
      ]),
      startY: 10,
      styles: { fontSize: 8 },
    });
    doc.save(`${reportBase}.pdf`);
  }, [sortedRows, reportBase]);

  const reportBaseNameForDropdown = reportBaseNameProp;

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCurrentPage(1);
    }
  }, [open]);

  if (!open) return null;

  const mailto = email ? `mailto:${email}` : null;

  const content = (
    <>
      <div
        className="bg-dark bg-opacity-50 position-fixed top-0 start-0 end-0 bottom-0"
        style={{ zIndex: 1050 }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className="bg-white position-fixed top-0 end-0 bottom-0 shadow d-flex flex-column"
        style={{
          zIndex: 1055,
          width: "min(100%, 1200px)",
          overflow: "visible",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        <div className="drawer-header-with-dropdown border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="min-w-0 flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border-0"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <i
                    className="isax isax-close-circle fs-20 text-body"
                    aria-hidden
                  />
                </button>
                <h5 id={ariaLabelledBy} className="mb-0 fw-semibold text-body">
                  Pages that contain the Email
                </h5>
              </div>
              {email &&
                (mailto ? (
                  <a
                    href={mailto}
                    className="text-primary text-decoration-none small ms-4 d-inline-block text-break"
                  >
                    {email}
                  </a>
                ) : (
                  <p className="text-muted small mb-0 ms-4 ps-1">{email}</p>
                ))}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <DownloadReportDropdown
                reportBaseName={reportBaseNameForDropdown}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                onExportPDF={exportPDF}
                variant="icon"
                dropup
              />
              <div
                className="input-group input-group-sm"
                style={{ width: 200 }}
              >
                <span className="input-group-text bg-transparent border-end-0">
                  <i
                    className="isax isax-search-normal-1 text-muted"
                    aria-hidden
                  />
                </span>
                <input
                  type="search"
                  className="form-control border-start-0"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search pages"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto">
          {sortedRows.length === 0 ? (
            <div
              className="d-flex align-items-center justify-content-center text-muted py-5 px-4"
              style={{ minHeight: 240 }}
            >
              No content was found
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-borderless mb-0 align-middle">
                <thead className="sticky-top bg-white">
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="py-3 ps-4 fw-semibold text-body fs-13 text-nowrap">
                      Title and URL
                    </th>
                    <th className="py-3 fw-semibold text-body fs-13 text-nowrap text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center text-nowrap"
                        onClick={() => setSortViewsAsc((v) => !v)}
                      >
                        Views{" "}
                        <i
                          className={`isax ms-1 fs-12 ${sortViewsAsc ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden
                        />
                      </button>
                    </th>
                    <th className="py-3 pe-4" style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id || row.url}>
                      <td className="py-3 ps-4">
                        <div className="d-flex flex-column">
                          <span className="text-primary small">
                            {row.title || "(No title found)"}
                          </span>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-decoration-none small d-inline-flex align-items-center gap-1 mt-1 text-break"
                          >
                            {row.url}
                            <ExternalLinkIcon />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 text-body text-end">{row.views}</td>
                      <td className="py-3 pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-primary rounded-2"
                          aria-label="Open page details"
                          title="Open page details"
                          onClick={() =>
                            onOpenPageDetails && onOpenPageDetails(row)
                          }
                        >
                          <i className="isax isax-document-text" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sortedRows.length > 0 && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top flex-shrink-0">
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
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-muted small">
                {(currentPage - 1) * rowsPerPage + 1}–
                {Math.min(currentPage * rowsPerPage, sortedRows.length)} of{" "}
                {sortedRows.length}
              </span>
            </div>
            <nav aria-label="Pages pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    «
                  </button>
                </li>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = currentPage <= 4 ? i + 1 : currentPage - 3 + i;
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
                })}
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
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
