import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { downloadBlob, safeFilename } from "../../lib/download";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";
import ContentWithPolicyMatchesPagesView from "./ContentWithPolicyMatchesPagesView";
import ContentWithPolicyMatchesPdfView from "./ContentWithPolicyMatchesPdfView";
import ContentWithPolicyMatchesOtherView from "./ContentWithPolicyMatchesOtherView";
import { getPolicyContentMatchesApi } from "@/api/policyApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import toast from "react-hot-toast";

const TABS = [
  { key: "all", label: "All", icon: "isax-folder" },
  { key: "pages", label: "Pages", icon: "isax-document-text" },
  { key: "pdf", label: "PDF Documents", icon: "isax-document-text" },
  { key: "other", label: "Other Documents", icon: "isax-document-copy" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

/** Sample data – replaced with API */
// const SAMPLE_ROWS = Array.from({ length: 499 }, (_, i) => ({
//   id: `row-${i + 1}`,
//   title: i % 5 === 0 ? "(No title found)" : "Search",
//   url: `https://example.com/search${i > 0 ? `?q=${i}` : ""}`,
//   unwanted: 0,
//   required: 0,
//   matches: 1,
//   priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
//   views: 0,
// }));

const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 };

const toPageDetailsPage = (row) => {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
};

const ContentWithPolicyMatchesView = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const viewsTooltipRef = useRef(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const selectedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
      const res = await getPolicyContentMatchesApi({ domainId: selectedId });
      console.log("[ContentMatches] API Response:", res);
      if (res.success && res.data) {
        setPolicies(
          res.data.map((m) => ({
            ...m,
            id: m._id || m.id,
            title: m.url || "Untitled",
            url: m.url || "#",
            unwanted: m.unwanted || 0,
            required: m.required || 0,
            matches: m.matches || 0,
            priority: m.priority || "Low",
            views: m.views || 0,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch matches for content matches view:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const openPageDetails = useCallback((row) => {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }, []);

  useEffect(() => {
    const el = viewsTooltipRef.current;
    if (!el || typeof window === "undefined") return;
    const bootstrap = window.bootstrap;
    if (!bootstrap?.Tooltip) return;
    const t = new bootstrap.Tooltip(el, { placement: "top" });
    return () => t.dispose();
  }, []);

  const filteredRows = useMemo(() => {
    let rows = policies || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [search, policies]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "priority") {
        const va = PRIORITY_ORDER[a.priority];
        const vb = PRIORITY_ORDER[b.priority];
        return dir * (va - vb);
      }
      return dir * (a.views - b.views);
    });
  }, [filteredRows, sortBy, sortDir, policies]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const totalPages =
    rowsPerPage === -1
      ? 1
      : Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return sortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const reportName = "Content-with-Policy-Matches";
  const baseName = safeFilename(reportName);

  const exportCSV = useCallback(() => {
    const header = "Title,URL,Unwanted,Required,Matches,Priority,Views\n";
    const body = sortedRows
      .map((r) =>
        [
          `"${(r.title || "").replace(/"/g, '""')}"`,
          `"${(r.url || "").replace(/"/g, '""')}"`,
          r.unwanted,
          r.required,
          r.matches,
          r.priority,
          r.views,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${baseName}.csv`);
  }, [sortedRows, baseName]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const rows = sortedRows.map((r) => ({
      Title: r.title,
      URL: r.url,
      Unwanted: r.unwanted,
      Required: r.required,
      Matches: r.matches,
      Priority: r.priority,
      Views: r.views,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Content with Policy Matches");
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  }, [sortedRows, baseName]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [
      ["Title", "URL", "Unwanted", "Required", "Matches", "Priority", "Views"],
    ];
    const body = paginatedRows.map((r) => [
      (r.title || "").slice(0, 30),
      (r.url || "").slice(0, 40),
      String(r.unwanted),
      String(r.required),
      String(r.matches),
      r.priority,
      String(r.views),
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 7 },
    });
    doc.save(`${baseName}.pdf`);
  }, [paginatedRows, baseName]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="mb-3">
        <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
          <i
            className="isax isax-document-copy fs-20 text-primary"
            aria-hidden="true"
          />
          Content with Policy Matches
        </h5>
        <p className="text-muted fs-13 mb-0">
          Found {filteredRows.length} pages
        </p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs border-0 border-bottom border-secondary border-opacity-25 mb-3">
        {TABS.map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-0 pb-2 px-3 d-flex align-items-center gap-2 ${activeTab === tab.key ? "text-primary border-bottom border-2 border-primary bg-transparent" : "text-body"}`}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
            >
              <i className={`isax ${tab.icon} fs-16`} aria-hidden="true" />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "all" && (
        <>
          {/* Action bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-3 mb-3">
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm bg-primary text-white rounded-2 border-0 d-inline-flex align-items-center gap-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Download Report"
              >
                <i className="isax isax-document-download" aria-hidden="true" />
                <span>Download Report</span>
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
                    />
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
                    />
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
                    />
                    Excel
                  </button>
                </li>
              </ul>
            </div>
            <div className="position-relative" style={{ width: 280 }}>
              <i
                className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
                style={{ fontSize: "1rem" }}
                aria-hidden="true"
              />
              <input
                type="search"
                className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover table-striped table-borderless align-middle mb-0">
                <thead>
                  <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                    <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                      Title and URL
                      <i
                        className="isax isax-sort ms-1 text-muted"
                        aria-hidden="true"
                      />
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Unwanted
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Required
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      Matches
                    </th>
                    <th className="py-3 text-body fs-13 fw-semibold">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                        onClick={() => handleSort("priority")}
                        aria-label={
                          sortBy === "priority"
                            ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.`
                            : "Sort by Priority"
                        }
                      >
                        Priority
                        {sortBy === "priority" ? (
                          <i
                            className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <i
                            className="isax isax-arrow-down ms-1 text-muted opacity-50"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                    <th className="py-3 pe-4 text-body fs-13 fw-semibold">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                        onClick={() => handleSort("views")}
                        aria-label={
                          sortBy === "views"
                            ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.`
                            : "Sort by Views"
                        }
                      >
                        Views
                        <span
                          ref={viewsTooltipRef}
                          className="ms-1 d-inline-flex"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          data-bs-title="Total page views over the last 30 days"
                          onClick={(e) => e.stopPropagation()}
                          role="img"
                          aria-label="Total page views over the last 30 days"
                        >
                          <i
                            className="isax isax-information text-muted"
                            aria-hidden="true"
                          />
                        </span>
                        {sortBy === "views" ? (
                          <i
                            className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <i
                            className="isax isax-sort ms-1 text-muted opacity-50"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 ps-4">
                        <div className="d-flex flex-column">
                          <span className="text-body fs-13">{row.title}</span>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1"
                          >
                            <span className="flex-shrink-0 d-inline-flex text-primary">
                              <ExternalLinkIcon size={12} />
                            </span>
                            {row.url}
                          </a>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                          <i
                            className="isax isax-close-circle text-secondary"
                            aria-hidden="true"
                          />
                          {row.unwanted}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                          <i
                            className="isax isax-danger text-warning"
                            aria-hidden="true"
                          />
                          {row.required}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="d-inline-flex align-items-center gap-1 text-body fs-13">
                          <i
                            className="isax isax-search-normal-1 text-primary"
                            aria-hidden="true"
                          />
                          {row.matches}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge rounded-pill ${row.priority === "High" ? "bg-danger" : row.priority === "Medium" ? "bg-warning text-dark" : "bg-secondary"}`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 pe-4">
                        <div className="d-flex align-items-center gap-1">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: 56 }}
                            value={row.views}
                            readOnly
                            aria-label="Views"
                          />
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light"
                            title="Open page details"
                            onClick={() => openPageDetails(row)}
                          >
                            <i
                              className="isax isax-document-text text-primary"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top bg-light bg-opacity-50 mt-auto">
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
                  <option value={-1}>All</option>
                </select>
                <span className="text-muted small">
                  {rowsPerPage === -1
                    ? `1–${sortedRows.length} of ${sortedRows.length}`
                    : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, sortedRows.length)} of ${sortedRows.length}`}
                </span>
              </div>
              {rowsPerPage !== -1 && totalPages > 1 && (
                <nav aria-label="Content with policy matches pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from(
                      { length: Math.min(totalPages, 10) },
                      (_, i) => {
                        const p =
                          currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
                      },
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
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "pages" && (
        <ContentWithPolicyMatchesPagesView
          data={policies.filter(
            (p) =>
              !p.url.toLowerCase().endsWith(".pdf") &&
              !p.url.toLowerCase().endsWith(".docx"),
          )}
        />
      )}
      {activeTab === "pdf" && (
        <ContentWithPolicyMatchesPdfView
          data={policies.filter((p) => p.url.toLowerCase().endsWith(".pdf"))}
        />
      )}
      {activeTab === "other" && (
        <ContentWithPolicyMatchesOtherView
          data={policies.filter(
            (p) =>
              p.url.toLowerCase().endsWith(".docx") ||
              p.url.toLowerCase().endsWith(".xlsx"),
          )}
        />
      )}

      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toPageDetailsPage(selectedPage) : null}
        defaultTab="policies"
      />
    </div>
  );
};

export default ContentWithPolicyMatchesView;
