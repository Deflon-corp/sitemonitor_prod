import React, { useState, useMemo, useEffect, useCallback } from "react";
import { getQaBrokenLinksApi, patchQaLinkStatusApi } from "@/api/qaApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import toast from "react-hot-toast";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

export default function BrokenLinksIgnoredView({ onOpenContentDrawer, onOpenDocumentsDrawer }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortByUrl, setSortByUrl] = useState(null);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchIgnoredLinks = useCallback(async () => {
    if (!domainId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getQaBrokenLinksApi(domainId, { tab: "ignored", limit: "500" });
      if (res.success && res.data?.links) {
        setRows(res.data.links);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error("Error fetching ignored links:", err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchIgnoredLinks();
  }, [fetchIgnoredLinks]);

  const handleAction = async (row, actionType) => {
    if (!domainId) return;
    try {
      let res;
      if (actionType === "unignore") {
        res = await patchQaLinkStatusApi(domainId, { href: row.url, isIgnored: false });
      } else if (actionType === "fix") {
        res = await patchQaLinkStatusApi(domainId, { href: row.url, isFixed: true, isIgnored: false });
      }
      if (res?.success) {
        toast.success(actionType === "unignore" ? "Link unignored successfully" : "Link marked as fixed");
        fetchIgnoredLinks();
      } else {
        toast.error(res?.message || "Failed to update link status");
      }
    } catch (err) {
      console.error("Error updating link status:", err);
      toast.error("Failed to update link status");
    }
  };

  const filteredRows = rows;

  const sortedRows = useMemo(() => {
    if (!sortByUrl) return filteredRows;
    return [...filteredRows].sort((a, b) =>
      sortByUrl === "asc" ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url)
    );
  }, [filteredRows, sortByUrl]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  function handleSortUrl() {
    setCurrentPage(1);
    setSortByUrl((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <p className="text-muted fs-13 mb-0">{sortedRows.length} ignored links</p>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1">
          <table className="table table-hover table-striped table-borderless align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th className="py-3 ps-4" style={{ width: 40 }}>
                  <input type="checkbox" className="form-check-input" aria-label="Select all" />
                </th>
                <th className="fw-semibold text-body py-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center gap-1"
                    onClick={handleSortUrl}
                  >
                    Broken link
                    {sortByUrl != null && (
                      <i className={`isax fs-14 ${sortByUrl === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true"></i>
                    )}
                    {sortByUrl == null && <i className="isax isax-sort fs-14 opacity-50" aria-hidden="true"></i>}
                  </button>
                </th>
                <th className="fw-semibold text-body py-3">Response code</th>
                <th className="fw-semibold text-body py-3">Type</th>
                <th className="fw-semibold text-body py-3 text-center">Documents</th>
                <th className="fw-semibold text-body py-3 text-center">
                  <span className="d-inline-flex align-items-center">Pages
                    <i className="isax isax-arrow-down-1 ms-1 fs-12 opacity-75" aria-hidden="true"></i>
                  </span>
                </th>
                
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    <span className="text-muted">Loading ignored links...</span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <span className="text-muted">No ignored links found.</span>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id || row.url}>
                    <td className="ps-4 py-3">
                      <input type="checkbox" className="form-check-input" aria-label={`Select link ${row.id}`} />
                    </td>
                    <td className="py-3">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                        {row.url}
                      </a>
                    </td>
                    <td className="py-2">
                      <span className="text-body">{row.responseCode}</span>
                    </td>
                    <td className="py-2">
                      <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">{row.linkType || row.type}</span>
                    </td>
                    <td className="py-3 text-center">
                      {onOpenDocumentsDrawer ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-decoration-none"
                          onClick={() => onOpenDocumentsDrawer(row.url)}
                          title="View documents with this broken link"
                        >
                          <span className="text-primary fw-medium">{row.documentsCount}</span>
                        </button>
                      ) : (
                        <span className="text-primary fw-medium">{row.documentsCount}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {onOpenContentDrawer ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 border-0 text-decoration-none"
                          onClick={() => onOpenContentDrawer(row.url)}
                          title="View content with this broken link"
                        >
                          <span className="text-primary fw-medium">{row.pagesCount}</span>
                        </button>
                      ) : (
                        <span className="text-primary fw-medium">{row.pagesCount}</span>
                      )}
                    </td>
                    <td className="py-3 pe-4">
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn btn-sm btn-light d-inline-flex align-items-center gap-1"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          Action
                          <i className="isax isax-arrow-down-1 fs-12" aria-hidden="true"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => handleAction(row, "unignore")}
                            >
                              Unignore
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => handleAction(row, "fix")}
                            >
                              Mark as fixed
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
              {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}
            </span>
          </div>
          <nav aria-label="Ignored broken links pagination">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">
                  Previous
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
                if (p > totalPages) return null;
                return (
                  <li key={p} className="page-item">
                    <button type="button" className={`page-link rounded-2 ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  </li>
                );
              })}
              <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                <button type="button" className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

