import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import PageDetailsDrawer from "../prioritized-content/PageDetailsDrawer";
import ContentWithPolicyMatchesHtmlTabContent from "./ContentWithPolicyMatchesHtmlTabContent";
import ContentWithPolicyMatchesPdfTabContent from "./ContentWithPolicyMatchesPdfTabContent";
import ContentWithPolicyMatchesDocumentsTabContent from "./ContentWithPolicyMatchesDocumentsTabContent";

const DRAWER_Z_BACKDROP = 1075;
const DRAWER_Z_PANEL = 1080;

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const CONTENT_TABS = [
  { key: "all", label: "All", icon: "isax-document-text" },
  { key: "html", label: "HTML Pages", icon: "isax-code" },
  { key: "pdf", label: "PDFs", icon: "isax-document" },
  { key: "documents", label: "Documents", icon: "isax-document-text" },
];

const SAMPLE_ROWS = [
  {
    id: "1",
    title: "(No title found)",
    url: "https://example.com/bmall/lenovo-intel-core-i3-6th-gen-4-gb-ram-1-tb-hdd-dos-15-6-inch-laptop-black-rel-491297624-ip310/p/29185",
    unwanted: 0,
    required: 0,
    matches: 1,
    priority: "High",
    views: 0,
  },
  {
    id: "2",
    title: "(No title found)",
    url: "https://example.com/search",
    unwanted: 0,
    required: 0,
    matches: 1,
    priority: "Medium",
    views: 0,
  },
  {
    id: "3",
    title: "(No title found)",
    url: "https://example.com/",
    unwanted: 0,
    required: 0,
    matches: 1,
    priority: "High",
    views: 0,
  },
];

const toPageDetailsPage = (row) => {
  const id = Number.parseInt(String(row.id).replace(/\D/g, ""), 10) || 0;
  return { id, title: row.title, url: row.url };
};

const ContentWithPolicyMatchesDrawer = ({
  open,
  onClose,
  domainName,
  domainUrl,
  pagesToFix = 499,
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const openPageDetails = useCallback((row) => {
    setSelectedPage(row);
    setPageDetailsOpen(true);
  }, []);

  const tableContent = useMemo(() => {
    if (activeTab === "html") {
      return (
        <ContentWithPolicyMatchesHtmlTabContent
          domainUrl={domainUrl}
          onOpenPageDetails={openPageDetails}
        />
      );
    }
    if (activeTab === "pdf") {
      return (
        <ContentWithPolicyMatchesPdfTabContent
          domainUrl={domainUrl}
          onOpenPageDetails={openPageDetails}
        />
      );
    }
    if (activeTab === "documents") {
      return (
        <ContentWithPolicyMatchesDocumentsTabContent
          domainUrl={domainUrl}
          onOpenPageDetails={openPageDetails}
        />
      );
    }
    return null;
  }, [activeTab, domainUrl, openPageDetails]);

  const filteredRows = useMemo(() => {
    let rows = SAMPLE_ROWS;
    const q = (search || titleSearch || "").toLowerCase().trim();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [search, titleSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, titleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleDownload = () => {
    // Placeholder
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow d-flex flex-column overflow-hidden"
        style={{
          zIndex: DRAWER_Z_PANEL,
          width: "min(95%, 1400px)",
          maxWidth: "1400px",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-policy-matches-title"
      >
        {/* Header */}
        <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2 flex-shrink-0"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i
                  className="isax isax-close-circle fs-22 text-body"
                  aria-hidden="true"
                />
              </button>
              <h2
                id="content-policy-matches-title"
                className="mb-0 fw-semibold text-body fs-5"
              >
                Content with Policy Matches
              </h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                onClick={handleDownload}
                title="Download"
                aria-label="Download"
              >
                <i
                  className="isax isax-document-download fs-18 text-body"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                title="Filter"
                aria-label="Filter"
              >
                <i
                  className="isax isax-filter fs-18 text-body"
                  aria-hidden="true"
                />
              </button>
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 160 }}
                aria-label="Search"
              />
            </div>
          </div>

          {/* Policy note + compliance */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3 pt-2 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small d-flex align-items-center gap-1">
                <i
                  className="isax isax-message-text fs-16"
                  aria-hidden="true"
                />
                Policy note
              </span>
              <span className="text-body small">Compliance 0%</span>
              <span className="text-muted small">
                0 Pages (0%) in compliance.
              </span>
            </div>
            <span className="text-body fw-medium small">
              {pagesToFix} Pages (0%) to fix
            </span>
          </div>

          {/* Content type tabs */}
          <ul className="nav nav-tabs border-0 gap-2 mt-3">
            {CONTENT_TABS.map((tab) => (
              <li key={tab.key} className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 rounded-2 px-3 py-2 d-flex align-items-center gap-2 ${activeTab === tab.key ? "bg-primary text-white" : "bg-body-tertiary text-body"}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={`isax ${tab.icon} fs-16`} aria-hidden="true" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Table: All = shared table; HTML / PDF / Documents = dedicated tab content */}
        <div className="flex-grow-1 overflow-auto p-4">
          {tableContent !== null ? (
            tableContent
          ) : (
            <div className="d-flex flex-column h-100">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                          <th
                            className="py-3 ps-4 text-body fs-13 fw-semibold"
                            style={{ minWidth: 320 }}
                          >
                            <div className="d-flex flex-column gap-1">
                              <span className="d-flex align-items-center gap-1">
                                Title and URL
                                <i
                                  className="isax isax-sort text-muted"
                                  aria-hidden="true"
                                />
                              </span>
                              <input
                                type="search"
                                className="form-control form-control-sm"
                                placeholder="Search"
                                value={titleSearch}
                                onChange={(e) => setTitleSearch(e.target.value)}
                                aria-label="Search title and URL"
                              />
                              <span className="text-muted small">
                                {domainUrl ?? "https://example.com/search"}
                              </span>
                            </div>
                          </th>
                          <th className="py-3 text-body fs-13 fw-semibold text-center">
                            Unwanted
                          </th>
                          <th className="py-3 text-body fs-13 fw-semibold text-center">
                            Required
                          </th>
                          <th className="py-3 text-body fs-13 fw-semibold">
                            <span className="d-flex align-items-center gap-1">
                              Matches{" "}
                              <i
                                className="isax isax-sort text-muted"
                                aria-hidden="true"
                              />
                            </span>
                          </th>
                          <th className="py-3 text-body fs-13 fw-semibold">
                            <span className="d-flex align-items-center gap-1">
                              Priority{" "}
                              <i
                                className="isax isax-sort text-muted"
                                aria-hidden="true"
                              />
                            </span>
                          </th>
                          <th className="py-3 text-body fs-13 fw-semibold">
                            <span className="d-flex align-items-center gap-1">
                              Views{" "}
                              <i
                                className="isax isax-sort text-muted"
                                aria-hidden="true"
                              />
                            </span>
                          </th>
                          <th
                            className="py-3 pe-4"
                            style={{ width: 100 }}
                            aria-label="View page"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row) => (
                          <tr key={row.id}>
                            <td className="py-3 ps-4">
                              <div className="d-flex flex-column gap-1">
                                <span className="text-body">{row.title}</span>
                                <a
                                  href={row.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1"
                                >
                                  {row.url}
                                  <ExternalLinkIcon
                                    size={12}
                                    className="flex-shrink-0"
                                  />
                                </a>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className="d-inline-flex align-items-center gap-1">
                                <i
                                  className="isax isax-circle text-secondary"
                                  style={{ fontSize: "0.5rem" }}
                                  aria-hidden="true"
                                />
                                {row.unwanted}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="d-inline-flex align-items-center gap-1">
                                <i
                                  className="isax isax-danger text-warning"
                                  style={{ fontSize: "0.75rem" }}
                                  aria-hidden="true"
                                />
                                {row.required}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="d-inline-flex align-items-center gap-1">
                                <i
                                  className="isax isax-search-normal-1 text-primary"
                                  style={{ fontSize: "0.75rem" }}
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
                            <td className="py-3">{row.views}</td>
                            <td className="py-3 pe-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary rounded-2"
                                title="View page"
                                aria-label="Open page details"
                                onClick={() => openPageDetails(row)}
                              >
                                <i
                                  className="isax isax-document-text fs-16"
                                  aria-hidden="true"
                                />
                              </button>
                            </td>
                            <td className="py-3 pe-4">
                              <div className="dropdown">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary rounded-2 d-inline-flex align-items-center gap-1"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-label="Action"
                                >
                                  Action
                                  <i
                                    className="isax isax-arrow-down-1 fs-14"
                                    aria-hidden="true"
                                  />
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                    >
                                      <i
                                        className="isax isax-refresh-25"
                                        aria-hidden="true"
                                      />
                                      Run policy again
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                    >
                                      <i
                                        className="isax isax-eye-slash"
                                        aria-hidden="true"
                                      />
                                      Ignore
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2 text-primary"
                                    >
                                      <i
                                        className="isax isax-tick-circle"
                                        aria-hidden="true"
                                      />
                                      Mark as fixed
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 px-0">
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
                    {Math.min(currentPage * rowsPerPage, filteredRows.length)}{" "}
                    of {filteredRows.length}
                  </span>
                </div>
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
              </div>
            </div>
          )}
        </div>
      </div>

      <PageDetailsDrawer
        open={pageDetailsOpen}
        onClose={() => setPageDetailsOpen(false)}
        page={selectedPage ? toPageDetailsPage(selectedPage) : null}
        defaultTab="policies"
        backdropZIndex={1085}
        panelZIndex={1090}
      />
    </>,
    document.body,
  );
};

export default ContentWithPolicyMatchesDrawer;
