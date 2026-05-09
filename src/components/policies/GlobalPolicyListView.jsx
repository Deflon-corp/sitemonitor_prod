import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PolicyListEmptyState from "./PolicyListEmptyState";
import UnwantedPoliciesEmptyView from "./UnwantedPoliciesEmptyView";
import ArchivedPoliciesEmptyView from "./ArchivedPoliciesEmptyView";
import PolicyListTableRow from "./PolicyListTableRow";

const getGlobalNav = (basePath) => [
  { key: "dashboard", label: "Global Policy Dashboard", icon: "isax-hammer", href: `${basePath}?view=global` },
  { key: "list", label: "Policy List", icon: "isax-category-2", href: `${basePath}?view=global-list` },
  { key: "assistant", label: "Policy Assistant", icon: "isax-magic-star", href: `${basePath}?view=global-assistant` },
];

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unwanted", label: "Unwanted", icon: "isax-close-circle", iconClass: "text-danger" },
  { key: "required", label: "Required", icon: "isax-danger", iconClass: "text-primary" },
  { key: "matches", label: "Matches", icon: "isax-search-normal-1", iconClass: "text-primary" },
  { key: "archived", label: "Archived", icon: "isax-trash", iconClass: "text-muted" },
];

const HITS_BAR_MAX = 500;

const SAMPLE_POLICIES = [
  {
    id: "1",
    title: "Text",
    searchScope: "Everything",
    status: "hits",
    addedBy: "Irfan Shaikh",
    creationDate: "Dec 9, 2025",
    hits: 499,
    category: "matches",
  },
  {
    id: "2",
    title: "Text that starts with Lorem ipsum",
    searchScope: "Only HTML pages",
    status: "compliant",
    addedBy: "Irfan Shaikh",
    creationDate: "Dec 9, 2025",
    hits: 0,
    category: "matches",
  },
  {
    id: "3",
    title: "Text that starts with Lorem ipsum",
    searchScope: "Only HTML pages",
    status: "compliant",
    addedBy: "Irfan Shaikh",
    creationDate: "Dec 9, 2025",
    hits: 0,
    category: "matches",
  },
  {
    id: "4",
    title: "Text that starts with FD",
    searchScope: "Only HTML pages",
    status: "compliant",
    addedBy: "Irfan Shaikh",
    creationDate: "Feb 14, 2026",
    hits: 0,
    category: "required",
  },
];

const GlobalPolicyListView = ({
  onAddNewPolicy,
  onEditPolicy,
  onViewPolicy,
  basePath = "/policies",
  currentView = "global-list",
}) => {
  const GLOBAL_NAV = getGlobalNav(basePath);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredBySearch = useMemo(() => {
    let rows = SAMPLE_POLICIES;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.searchScope.toLowerCase().includes(q) ||
          r.addedBy.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [search]);

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return filteredBySearch;
    return filteredBySearch.filter((r) => r.category === activeTab);
  }, [filteredBySearch, activeTab]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title") return dir * a.title.localeCompare(b.title);
      if (sortBy === "addedBy") return dir * a.addedBy.localeCompare(b.addedBy);
      if (sortBy === "creationDate") return dir * a.creationDate.localeCompare(b.creationDate);
      return dir * (a.hits - b.hits);
    });
  }, [filteredRows, sortBy, sortDir]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return sortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setCurrentPage(1);
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, sortKey, className = "" }) => (
    <th className={className}>
      <button
        type="button"
        className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
        onClick={() => handleSort(sortKey)}
        aria-label={
          sortBy === sortKey
            ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.`
            : `Sort by ${label}`
        }
      >
        {label}
        {sortBy === sortKey ? (
          <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
        ) : (
          <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true" />
        )}
      </button>
    </th>
  );

  return (
    <div className="d-flex flex-column h-100">
      {/* Top nav (same as Global Policies) */}
      <ul className="nav nav-tabs border-0 border-bottom border-secondary border-opacity-25 mb-4">
        {GLOBAL_NAV.map((item) => {
          const isActive =
            (item.key === "dashboard" && currentView === "global") ||
            (item.key === "list" && (currentView === "global-list" || !currentView)) ||
            (item.key === "assistant" && currentView === "global-assistant");
          return (
            <li key={item.key} className="nav-item">
              <Link
                to={item.href}
                className={`nav-link border-0 rounded-0 pb-2 px-3 d-flex align-items-center gap-2 ${isActive ? "text-primary border-bottom border-2 border-primary bg-transparent" : "text-body"}`}
              >
                <i className={`isax ${item.icon} fs-16`} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
            <i className="isax isax-category-2 fs-20 text-primary" aria-hidden="true" />
            Policy List
          </h5>
          <p className="text-muted fs-13 mb-0">Found {sortedRows.length} policies</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-2 d-inline-flex align-items-center"
            onClick={onAddNewPolicy}
          >
            <i className="isax isax-add-circle fs-18 me-1" aria-hidden="true" />
            Add new policy
          </button>
          <button type="button" className="btn btn-primary btn-sm rounded-2 d-inline-flex align-items-center gap-2">
            <i className="isax isax-magic-star fs-18" aria-hidden="true" />
            Add Policy with AI
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <ul className="nav nav-tabs border-0 border-bottom border-secondary border-opacity-25 mb-3">
        {FILTER_TABS.map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-0 pb-2 px-3 d-flex align-items-center gap-2 ${activeTab === tab.key ? "text-primary border-bottom border-2 border-primary bg-transparent" : "text-body"}`}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
            >
              {tab.icon && (
                <i className={`isax ${tab.icon} fs-16 ${tab.iconClass ?? ""}`} aria-hidden="true" />
              )}
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Search */}
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
        <div className="position-relative" style={{ maxWidth: 280 }}>
          <i
            className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
            style={{ fontSize: "1rem" }}
            aria-hidden="true"
          />
          <input
            type="text"
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

      {/* Table or empty state */}
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        {sortedRows.length === 0 ? (
          activeTab === "unwanted" ? (
            <UnwantedPoliciesEmptyView />
          ) : activeTab === "archived" ? (
            <ArchivedPoliciesEmptyView />
          ) : (
            <PolicyListEmptyState />
          )
        ) : (
          <div className="table-responsive flex-grow-1">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <SortHeader sortKey="title" label="Title" className="py-3 ps-4 text-body fs-13 fw-semibold" />
                  <SortHeader sortKey="addedBy" label="Added by" className="py-3 text-body fs-13 fw-semibold" />
                  <SortHeader sortKey="creationDate" label="Creation date" className="py-3 text-body fs-13 fw-semibold" />
                  <SortHeader sortKey="hits" label="Hits across all domains and modules" className="py-3 text-body fs-13 fw-semibold" />
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <PolicyListTableRow 
                    key={row.id} 
                    row={row} 
                    hitsBarMax={HITS_BAR_MAX} 
                    onEdit={onEditPolicy}
                    onView={onViewPolicy}
                  />
                ))}
              </tbody>
            </table>

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
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value={-1}>All</option>
                </select>
                <span className="text-muted small">
                  {rowsPerPage === -1 
                    ? `1–${sortedRows.length} of ${sortedRows.length}`
                    : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, sortedRows.length)} of ${sortedRows.length}`
                  }
                </span>
              </div>
              {rowsPerPage !== -1 && totalPages > 1 && (
                <nav aria-label="Policy list pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                        <button
                          type="button"
                          className="page-link rounded-2"
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalPolicyListView;
