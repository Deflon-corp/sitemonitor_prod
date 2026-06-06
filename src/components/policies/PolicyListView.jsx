import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import PolicyListEmptyState from "./PolicyListEmptyState";
import UnwantedPoliciesEmptyView from "./UnwantedPoliciesEmptyView";
import RequiredPolicyListRow from "./RequiredPolicyListRow";
import MatchedPolicyListRow from "./MatchedPolicyListRow";
import { getPoliciesApi, createPolicyApi, deletePolicyApi, getPolicyByIdApi } from "@/api/policyApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import toast from "react-hot-toast";
import PolicyReportHitsDrawer from "./PolicyReportHitsDrawer";


const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unwanted", label: "Unwanted", icon: "isax-close-circle", iconClass: "text-danger" },
  { key: "required", label: "Required", icon: "isax-danger", iconClass: "text-primary" },
  { key: "matches", label: "Matches", icon: "isax-search-normal-1", iconClass: "text-primary" },
];

/** Sample data – replaced with API */
// const SAMPLE_POLICIES = [
//   {
//     id: "1",
//     title: "Text",
//     searchScope: "Everything",
//     status: "hits",
//     compliancePercent: 0.2,
//     policyHits: 499,
//     category: "matches",
//   },
//   ...
// ];


const PolicyListView = ({ onAddNewPolicy, onEditPolicy, onViewPolicy, hideGlobalButton = false, refreshTrigger, isLanding = false }) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hitsDrawerOpen, setHitsDrawerOpen] = useState(false);
  const [selectedPolicyForHits, setSelectedPolicyForHits] = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const query = {};
      if (!isLanding) {
        const selectedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);
        if (selectedId) query.domainId = selectedId;
      }
      const res = await getPoliciesApi(query);
      if (res.success && res.data) {
        // Normalize data: ensure fields exist and map _id to id
        const normalized = res.data.map(p => ({
          ...p,
          id: p._id || p.id,
          title: p.title || "Untitled Policy",
          searchScope: p.searchScope || "Everything",
          compliancePercent: p.compliancePercent || 0,
          status: p.status || "compliant",
          category: p.category || "matches",
          addDate: p.createdAt ? (() => {
            const d = new Date(p.createdAt);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
          })() : "N/A"
        }));
        setPolicies(normalized);
      } else {
        setPolicies([]);
      }


    } catch (err) {
      console.error("Failed to fetch policies:", err);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies, refreshTrigger]);

  const filteredBySearch = useMemo(() => {
    let rows = policies || [];
    if (search.trim()) {

      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || (r.searchScope || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [search, policies]);


  const filteredRows = useMemo(() => {
    if (activeTab === "all") return filteredBySearch;
    return filteredBySearch.filter((r) => r.category === activeTab);
  }, [filteredBySearch, activeTab]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title") {
        return dir * a.title.localeCompare(b.title);
      }
      if (sortBy === "date") {
        return dir * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      }
      return dir * (a.compliancePercent - b.compliancePercent);
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
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const reportName = "Policy-List";

  const exportCSV = useCallback(() => {
    const header = "Title,Search Scope,Compliance %,Policy Hits\n";
    const body = sortedRows
      .map((r) =>
        [
          `"${(r.title || "").replace(/"/g, '""')}"`,
          `"${(r.searchScope || "").replace(/"/g, '""')}"`,
          r.compliancePercent,
          r.policyHits ?? "",
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedRows]);

  const exportExcel = useCallback(() => {
    alert("Excel export functionality will be implemented soon.");
  }, []);

  const exportPDF = useCallback(() => {
    alert("PDF export functionality will be implemented soon.");
  }, []);

  const handleDuplicate = async (id) => {
    try {
      // Fetch full policy to get its rules
      const policyRes = await getPolicyByIdApi(id);
      if (!policyRes.success || !policyRes.data) return;

      const policy = policyRes.data;
      const newPolicy = {
        ...policy,
        title: `${policy.title} (Copy)`,
      };
      
      // Clean up fields
      delete newPolicy._id;
      delete newPolicy.id;
      delete newPolicy.createdAt;
      delete newPolicy.updatedAt;
      
      // Clean up rules IDs
      if (newPolicy.rules) {
        newPolicy.rules = newPolicy.rules.map(r => {
          const newRule = { ...r };
          delete newRule._id;
          delete newRule.id;
          delete newRule.policyId;
          delete newRule.createdAt;
          delete newRule.updatedAt;
          return newRule;
        });
      }

      const createRes = await createPolicyApi(newPolicy); 
      if (createRes.success) {
        toast.success("Policy duplicated successfully");
        fetchPolicies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate policy");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      const res = await deletePolicyApi(id);
      if (res.success) {
        toast.success("Policy deleted successfully");
        fetchPolicies();
      }
    } catch (err) {
      toast.error("Failed to delete policy");
    }
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2 text-body">
            <i className="isax isax-hammer fs-20 text-primary" aria-hidden="true" />
            Policy List
          </h5>
          <p className="text-muted fs-13 mb-0">{sortedRows.length} policies found</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {!hideGlobalButton && (
            <Link
              to={`${pathname}?view=global`}
              className="btn btn-primary btn-sm rounded-2 d-inline-flex align-items-center gap-2 text-decoration-none"
            >
              <i className="isax isax-hammer" aria-hidden="true" />
              Global Policy List
            </Link>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-2 d-inline-flex align-items-center"
            onClick={onAddNewPolicy}
          >
            <i className="isax isax-add-circle fs-18 me-1" aria-hidden="true" />
            Add new policy
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

      {/* Action bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-3 mb-3">
        <div className="dropdown">
          <button
            className="btn btn-primary btn-sm rounded-2 d-flex align-items-center gap-2 dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="isax isax-export" />
            Export
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" onClick={exportCSV}>
                Export as CSV
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={exportExcel}>
                Export as Excel
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={exportPDF}>
                Export as PDF
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
          ) : (
            <PolicyListEmptyState />
          )
        ) : (
          <div className="table-responsive flex-grow-1">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold" style={{ minWidth: 280 }}>
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                      onClick={() => handleSort("title")}
                      aria-label={sortBy === "title" ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.` : "Sort by Title"}
                    >
                      Title
                      {sortBy === "title" ? (
                        <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
                      ) : (
                        <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                      onClick={() => handleSort("date")}
                    >
                      Add Date
                      {sortBy === "date" ? (
                        <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
                      ) : (
                        <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold" style={{ minWidth: 140 }}>
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center"
                      onClick={() => handleSort("compliance")}
                      aria-label={sortBy === "compliance" ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to change.` : "Sort by Compliance"}
                    >
                      Compliance
                      {sortBy === "compliance" ? (
                        <i className={`isax ms-1 text-muted ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down"}`} aria-hidden="true" />
                      ) : (
                        <i className="isax isax-arrow-down ms-1 text-muted opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">Policy Hits</th>
                  
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) =>
                  activeTab === "required" ? (
                    <RequiredPolicyListRow key={row.id} row={row} onDuplicate={handleDuplicate} onDelete={handleDelete} onEdit={onEditPolicy} onView={onViewPolicy} onViewHits={(r) => {
                      setSelectedPolicyForHits(r);
                      setHitsDrawerOpen(true);
                    }} />
                  ) : activeTab === "matches" ? (
                    <MatchedPolicyListRow key={row.id} row={row} onDuplicate={handleDuplicate} onDelete={handleDelete} onEdit={onEditPolicy} onView={onViewPolicy} onViewHits={(r) => {
                      setSelectedPolicyForHits(r);
                      setHitsDrawerOpen(true);
                    }} />
                  ) : (
                    <tr key={row.id}>
                      <td className="py-3 ps-4">
                        <div className="d-flex align-items-start gap-2">
                          <span
                            className={`d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle ${row.status === "hits" ? "bg-secondary bg-opacity-25" : "bg-success bg-opacity-25"}`}
                            style={{ width: 32, height: 32 }}
                          >
                            {row.status === "hits" ? (
                              <i className="isax isax-search-normal-1 text-secondary fs-16" aria-hidden="true" />
                            ) : (
                              <i className="isax isax-tick-circle text-success fs-16" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <span className="fw-semibold text-body d-block fs-13">{row.title}</span>
                            <span className="text-muted fs-12 d-block">
                              Search in: {row.searchScope}
                              {row.isGlobal ? (
                                <span className="ms-2 badge bg-success bg-opacity-10 text-success fw-normal" style={{ fontSize: '10px' }}>Global</span>
                              ) : row.domainIds?.length > 0 ? (
                                <span className="ms-2 text-primary" style={{ fontSize: '11px' }} title={row.domainIds.map(d => d.dm_title || d.dm_url).join(', ')}>
                                  Applied to {row.domainIds.length} {row.domainIds.length === 1 ? 'domain' : 'domains'}
                                </span>
                              ) : null}
                            </span>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <i className="isax isax-information text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
                              <i className="isax isax-timer-1 text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
                              <i className="isax isax-refresh-2 text-muted" style={{ fontSize: "0.7rem" }} aria-hidden="true" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-body fs-13">{row.addDate}</td>
                      <td className="py-3">
                        <span className="text-primary fw-medium fs-13">
                          {row.compliancePercent}% COMPLIANCE
                        </span>
                      </td>
                      <td className="py-3">
                        {row.policyHits != null ? (
                          <span className="text-primary fw-medium fs-13">{row.policyHits} HITS</span>
                        ) : (
                          <span className="text-success fs-13">No hits found</span>
                        )}
                      </td>
                      <td className="py-3 pe-4">
                        <div className="dropdown">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light rounded-circle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            aria-label="Policy actions"
                          >
                            <i className="isax isax-more" aria-hidden="true" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li><button type="button" className="dropdown-item" onClick={() => onEditPolicy && onEditPolicy(row.id)}>Edit policy</button></li>
                            <li><button type="button" className="dropdown-item" onClick={() => {
                              setSelectedPolicyForHits(row);
                              setHitsDrawerOpen(true);
                            }}>View hits</button></li>
                            <li><button type="button" className="dropdown-item" onClick={() => onViewPolicy && onViewPolicy(row.id)}>View details</button></li>
                            <li><button type="button" className="dropdown-item" onClick={() => handleDuplicate(row.id)}>Duplicate</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button type="button" className="dropdown-item text-danger" onClick={() => handleDelete(row.id)}>Delete</button></li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {/* Pagination UI */}
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

      <PolicyReportHitsDrawer
        open={hitsDrawerOpen}
        onClose={() => setHitsDrawerOpen(false)}
        policyId={selectedPolicyForHits?.id}
        policyTitle={selectedPolicyForHits?.title}
      />
    </div>
  );
};

export default PolicyListView;
