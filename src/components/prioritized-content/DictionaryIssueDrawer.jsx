import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import DictionaryPageDetailsDrawer from "@/components/prioritized-content/DictionaryPageDetailsDrawer";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DictionaryIssueDrawer = ({
  open,
  onClose,
  issue,
  pagesWithEntry = [],
  page,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);

  const resolvedPagesWithEntry = useMemo(() => {
    if (pagesWithEntry && pagesWithEntry.length > 0) return pagesWithEntry;
    if (page)
      return [
        {
          title: page.title || "Untitled Page",
          url: page.url,
          language: "N/A",
          pages: 0,
          views: 0,
        },
      ];
    return [];
  }, [pagesWithEntry, page]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return resolvedPagesWithEntry;
    const q = searchQuery.toLowerCase();
    return resolvedPagesWithEntry.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q),
    );
  }, [resolvedPagesWithEntry, searchQuery]);

  const sortedPages = useMemo(() => {
    if (!sortBy) return filteredPages;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredPages].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "pages") return dir * (a.pages - b.pages);
      return dir * (a.views - b.views);
    });
  }, [filteredPages, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPages.slice(start, start + rowsPerPage);
  }, [sortedPages, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const baseName = safeFilename(
    issue ? `Dictionary-${issue.word}-Pages` : "Dictionary-Pages-Report",
  );

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Language,Pages,Views\n";
    const body = sortedPages
      .map(
        (p) =>
          `"${(p.title || "").replace(/"/g, '""')}","${p.url.replace(/"/g, '""')}","${(p.language || "").replace(/"/g, '""')}",${p.pages || 0},${p.views || 0}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [baseName, sortedPages]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedPages.map((p) => ({
      Title: p.title || "",
      URL: p.url,
      Language: p.language || "",
      Pages: p.pages || 0,
      Views: p.views || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pages");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [baseName, sortedPages]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [["Title", "URL", "Language", "Pages", "Views"]];
    const body = sortedPages.map((p) => [
      (p.title || "").slice(0, 30),
      p.url.slice(0, 50),
      p.language || "",
      String(p.pages || 0),
      String(p.views || 0),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 55 },
        2: { cellWidth: 28 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
      },
    });
    doc.save(`${baseName}.pdf`);
  }, [baseName, sortedPages]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    setSearchQuery("");
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !issue) return null;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(issue.word)}`;
  const DRAWER_Z_BACKDROP = 1070;
  const DRAWER_Z_PANEL = 1075;

  const drawerContent = (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{
          zIndex: DRAWER_Z_PANEL,
          width: "min(100%, 960px)",
          maxWidth: "960px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dictionary-issue-drawer-title"
      >
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle text-body"
                  aria-hidden="true"
                />
              </button>
              <div>
                <h6
                  className="mb-0 fw-semibold text-body d-flex align-items-center gap-2"
                  id="dictionary-issue-drawer-title"
                >
                  Pages with this dictionary entry - {issue.word}
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                    title="Lookup in Google"
                    aria-label={`Lookup ${issue.word} in Google`}
                  >
                    <span className="fw-bold">G</span>
                  </a>
                </h6>
                <p className="text-muted fs-13 mb-0 mt-1">
                  Total pages: {filteredPages.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 px-4 py-3 border-bottom border-secondary border-opacity-25">
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
          <DownloadReportDropdown
            reportBaseName={baseName}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
            variant="icon"
            className="border border-secondary border-opacity-25 rounded-2"
          />
          <div className="position-relative" style={{ width: 220 }}>
            <i
              className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
              style={{ fontSize: "1rem" }}
              aria-hidden="true"
            />
            <input
              type="search"
              className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search"
              style={{ paddingLeft: "2rem" }}
            />
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      {sortBy === "title" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>

                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("pages")}
                    >
                      Pages
                      {sortBy === "pages" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("views")}
                    >
                      Views
                      {sortBy === "views" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th
                    className="py-3 pe-4 text-body fs-13 fw-semibold"
                    style={{ width: 56 }}
                    aria-label="Open page details"
                  />
                </tr>
              </thead>
              <tbody>
                {resolvedPagesWithEntry.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-5 text-center text-muted">
                      No pages found
                    </td>
                  </tr>
                )}
                {paginatedPages.map((p, idx) => (
                  <tr key={`${p.url}-${idx}`}>
                    <td className="py-3 ps-4">
                      <div className="d-flex flex-column">
                        <span className="text-body fs-13">{p.title}</span>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                        >
                          <span className="flex-shrink-0 d-inline-flex text-primary">
                            <ExternalLinkIcon size={12} />
                          </span>
                          {p.url}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 text-body fs-13">{p.language}</td>
                    <td className="py-3">
                      <span className="fs-13 fw-medium">{p.pages}</span>
                    </td>

                    <td className="py-3 pe-4">
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 text-primary"
                        title="Open page details"
                        onClick={() => setSelectedPageForDetails(p)}
                        aria-label={`Open page details for ${p.title}`}
                      >
                        <i
                          className="isax isax-document-text fs-14"
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page</span>
              <select
                className="form-select form-select-sm rounded-2"
                style={{ width: "auto", minWidth: 60 }}
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
                {sortedPages.length === 0
                  ? 0
                  : (currentPage - 1) * rowsPerPage + 1}
                –{Math.min(currentPage * rowsPerPage, sortedPages.length)} of{" "}
                {sortedPages.length}
              </span>
            </div>
            <nav aria-label="Pages with dictionary entry pagination">
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1}
                    aria-label="First"
                  >
                    «
                  </button>
                </li>
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                </li>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (currentPage <= 4) p = i + 1;
                  else if (currentPage >= totalPages - 3)
                    p = totalPages - 6 + i;
                  else p = currentPage - 3 + i;
                  if (p < 1 || p > totalPages) return null;
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
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <li className="page-item disabled">
                    <span className="page-link rounded-2">…</span>
                  </li>
                )}
                {totalPages > 7 && (
                  <li className="page-item">
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </li>
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
                    aria-label="Next"
                  >
                    ›
                  </button>
                </li>
                <li
                  className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link rounded-2"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    aria-label="Last"
                  >
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <DictionaryPageDetailsDrawer
        open={selectedPageForDetails != null}
        onClose={() => setSelectedPageForDetails(null)}
        page={
          selectedPageForDetails
            ? {
                title: selectedPageForDetails.title,
                url: selectedPageForDetails.url,
              }
            : null
        }
        defaultQaSubView="dictionary"
      />
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};

export default DictionaryIssueDrawer;
