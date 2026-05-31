import React, { useState, useMemo, useRef, useEffect } from "react";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageIssuesIcon from "../icons/PageIssuesIcon";
import PageDetailsMisspellingsDrawer from "../prioritized-content/PageDetailsMisspellingsDrawer";
import { useQaPagesList } from "../../hooks/useQaPagesList";
import { QaTableStatusRow } from "./QaDataStates";
import { QA_EMPTY, QA_TABLE } from "./qaConstants";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

function toDrawerPage(row) {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
}

/**
 * Shared pages table for spellcheck tabs (misspellings / potential).
 * @param {"misspellings"|"potential-misspellings"} filter
 */
export default function QaSpellcheckPagesTable({
  filter = "misspellings",
  search: searchProp,
  onSearchChange,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchProp ?? internalSearch;
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState("misspellings");
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const viewsTooltipRef = useRef(null);

  useEffect(() => {
    if (searchProp !== undefined) setCurrentPage(1);
  }, [searchProp]);

  const { rows, pagination, loading, error } = useQaPagesList({
    filter,
    page: currentPage,
    limit: rowsPerPage,
    search,
    sortBy: "issues",
    sortOrder: sortDir,
    enabled: true,
  });

  useEffect(() => {
    function init(el) {
      if (!el || typeof window === "undefined") return;
      const bootstrap = window.bootstrap;
      if (!bootstrap?.Tooltip) return;
      const t = new bootstrap.Tooltip(el, { placement: "top", customClass: "tooltip-views" });
      return () => t.dispose();
    }
    init(viewsTooltipRef.current);
  }, []);

  function openPageDetails(row) {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }

  function handleSort(key) {
    setCurrentPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortBy) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || (a.url || "").localeCompare(b.url || ""));
      if (sortBy === "language") return dir * (a.language || "").localeCompare(b.language || "");
      if (sortBy === "misspellings") return dir * ((a.misspellings || 0) - (b.misspellings || 0));
      if (sortBy === "potentialMisspellings") return dir * ((a.potentialMisspellings || 0) - (b.potentialMisspellings || 0));
      return dir * ((a.views || 0) - (b.views || 0));
    });
  }, [rows, sortBy, sortDir]);

  const totalPages = pagination.pages || 1;
  const totalCount = pagination.total ?? sortedRows.length;
  const paginatedRows = sortedRows;

  return (
    <>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped align-middle mb-0 table-borderless">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4 text-body fw-semibold fs-13">
                  <button type="button" className="btn btn-link p-0 border-0 text-body fw-semibold text-decoration-none d-inline-flex align-items-center" onClick={() => handleSort("title")}>
                    {QA_TABLE.pageTitleUrl}
                  </button>
                </th>
                <th className="py-3 text-body fs-13 fw-semibold">{QA_TABLE.language}</th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">{QA_TABLE.misspellingCount}</th>
                <th className="py-3 text-body fs-13 fw-semibold text-center">{QA_TABLE.potentialCount}</th>
                <th className="py-3 text-body fs-13 fw-semibold">{QA_TABLE.views}</th>
                <th className="py-3 pe-4 text-end" style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              <QaTableStatusRow
                colSpan={6}
                loading={loading}
                error={error}
                isEmpty={!loading && !error && paginatedRows.length === 0}
                emptyMessage={QA_EMPTY.noScan}
              />
              {!loading &&
                !error &&
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <div className="d-flex flex-column gap-1">
                        <span className="text-body fs-13">{row.title}</span>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break">
                          <ExternalLinkIcon size={12} />
                          <span className="text-truncate" style={{ maxWidth: 320 }}>{row.url}</span>
                        </a>
                      </div>
                    </td>
                    <td className="py-3 fs-13 text-body">{row.language}</td>
                    <td className="py-3 text-center fs-13">{row.misspellings}</td>
                    <td className="py-3 text-center fs-13">{row.potentialMisspellings}</td>
                    <td className="py-3 fs-13 text-body">{row.views}</td>
                    <td className="py-3 pe-4 text-end">
                      <button type="button" className="btn btn-sm bg-transparent border border-secondary border-opacity-25 rounded-2" title="View page details" onClick={() => openPageDetails(row)}>
                        <PageIssuesIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 bg-body-tertiary bg-opacity-50 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 flex-wrap">
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
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-muted small">
              {totalCount === 0
                ? "0 of 0"
                : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, totalCount)} of ${totalCount}`}
            </span>
          </div>
          <nav aria-label="Pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  Previous
                </button>
              </li>
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <PageDetailsMisspellingsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toDrawerPage(selectedPage) : null}
        defaultQaSubView={filter === "potential-misspellings" ? "potential-misspellings" : "misspellings"}
      />
    </>
  );
}
