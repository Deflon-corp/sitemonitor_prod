import { Link, useLocation } from "react-router-dom";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { getUsersApi, deleteUserApi, archiveUserApi, restoreUserApi, hardDeleteUserApi } from "../../api/userApi";
import { ConfirmAlert } from "../common/alerts/ConfirmAlert";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const LANDING_NAV = [
    { href: "/home", label: "Domain Overview", icon: "isax-global" },
    { href: "/home/users", label: "Users", icon: "isax-people" },
    { href: "/home/rules", label: "Rules", icon: "isax-setting-2" },
    { href: "/home/policies", label: "Policies", icon: "isax-shield-tick" },
    { href: "/home/history-center", label: "History center", icon: "isax-chart-2" },
];

export default function UserList() {
    const pathname = useLocation().pathname;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const [searchTerm, setSearchTerm] = useState("");
    const [isArchivedView, setIsArchivedView] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsersApi({
                page: currentPage,
                limit: rowsPerPage,
                search: searchTerm,
                is_archived: isArchivedView
            });
            if (response.success) {
                setUsers(response.data.users);
                setTotalUsers(response.data.pagination.total);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, searchTerm, isArchivedView]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (user) => {
        const confirmed = await ConfirmAlert(`Are you sure you want to remove the user ${user.user_first_name} ${user.user_last_name}? This action cannot be undone.`);
        if (confirmed) {
            try {
                const response = await deleteUserApi(user.user_id);
                if (response.success) {
                    fetchUsers();
                }
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    const handleArchiveUser = async (user) => {
        const confirmed = await ConfirmAlert(`Are you sure you want to archive ${user.user_first_name} ${user.user_last_name}?`);
        if (confirmed) {
            try {
                const response = await archiveUserApi(user.user_id);
                if (response.success) {
                    fetchUsers();
                }
            } catch (error) {
                console.error("Failed to archive user:", error);
            }
        }
    };

    const handleRestoreUser = async (user) => {
        const confirmed = await ConfirmAlert(`Are you sure you want to restore ${user.user_first_name} ${user.user_last_name}?`);
        if (confirmed) {
            try {
                const response = await restoreUserApi(user.user_id);
                if (response.success) {
                    fetchUsers();
                }
            } catch (error) {
                console.error("Failed to restore user:", error);
            }
        }
    };

    const handleHardDeleteUser = async (user) => {
        const confirmed = await ConfirmAlert(`Are you sure you want to PERMANENTLY delete ${user.user_first_name} ${user.user_last_name}? This cannot be undone.`);
        if (confirmed) {
            try {
                const response = await hardDeleteUserApi(user.user_id);
                if (response.success) {
                    fetchUsers();
                }
            } catch (error) {
                console.error("Failed to hard delete user:", error);
            }
        }
    };

    // Static Export Dropdown Handler
    const handleExport = (format) => {
        if (users.length === 0) {
            alert("No users available to export.");
            return;
        }

        if (format === "csv") {
            const header = "User,Email,Latest login,Status\n";
            const body = users
                .map(
                    (u) =>
                        `"${(u.user_first_name + " " + (u.user_last_name || "")).trim().replace(/"/g, '""')}","${u.user_email.replace(
                            /"/g,
                            '""'
                        )}","${u.user_last_login ? new Date(u.user_last_login).toLocaleString() : "-"}","${u.user_status}"`
                )
                .join("\n");

            const csv = header + body;
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "User List.csv";
            link.click();
            URL.revokeObjectURL(url);
        }
        else if (format === "excel") {
            alert("Excel export will be implemented later (xlsx dependency removed)");
            // You can add dynamic import("xlsx") here later if needed
        }
        else if (format === "pdf") {
            alert("PDF export will be implemented later (jspdf dependency removed)");
            // You can add dynamic import("jspdf") here later if needed
        }
    };

    // Format latest login date
    function formatLatestLogin(dateStr) {
        if (!dateStr) {
            return { month: "-", day: "--", year: "" };
        }
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return { month: "-", day: "--", year: "" };
            }
            const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            return {
                month: months[date.getMonth()],
                day: date.getDate().toString().padStart(2, '0'),
                year: date.getFullYear()
            };
        } catch (e) {
            return { month: "-", day: "--", year: "" };
        }
    }

    return (
        <div className="content landing-content">
            {/* Navigation Tabs */}
            <div className="landing-nav-tabs">
                <div className="landing-nav-tabs-inner">
                    {LANDING_NAV.map((item) => {
                        const isActive =
                            (pathname === "/home" && item.label === "Domain Overview") ||
                            (pathname === "/home/users" && item.label === "Users") ||
                            (pathname === "/home/rules" && item.label === "Rules") ||
                            (pathname === "/home/policies" && item.label === "Policies") ||
                            (pathname === "/home/history-center" && item.label === "History center");

                        return (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`landing-pill ${isActive ? "landing-pill-active" : "landing-pill-inactive"}`}
                            >
                                <i className={`isax ${item.icon} landing-pill-icon`} aria-hidden="true" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
            <div className="domain-overview-section">
                {/* Header */}
                <div className="domain-overview-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div>
                        <h1 className="domain-overview-title mb-1 d-flex align-items-center gap-2">
                            <i
                                className="isax isax-people text-primary"
                                style={{ fontSize: "1.5rem" }}
                                aria-hidden="true"
                            ></i>
                            User List
                        </h1>
                        <p className="domain-overview-subtitle text-muted mb-0">
                            You have {totalUsers} {isArchivedView ? "archived " : ""}user(s) on your account
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="btn-group btn-group-sm p-1 bg-light rounded-pill">
                            <button
                                type="button"
                                className={`btn rounded-pill px-3 ${!isArchivedView ? "btn-white shadow-sm" : "btn-light border-0"}`}
                                onClick={() => {
                                    setIsArchivedView(false);
                                    setCurrentPage(1);
                                }}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                className={`btn rounded-pill px-3 ${isArchivedView ? "btn-white shadow-sm" : "btn-light border-0"}`}
                                onClick={() => {
                                    setIsArchivedView(true);
                                    setCurrentPage(1);
                                }}
                            >
                                Archived
                            </button>
                        </div>
                        {/* Static Export Dropdown */}
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="isax isax-export"></i>
                                Export
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleExport("csv")}
                                    >
                                        Export as CSV
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleExport("excel")}
                                    >
                                        Export as Excel
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleExport("pdf")}
                                    >
                                        Export as PDF
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                        >
                            <i className="isax isax-filter"></i> Filter
                        </button>

                        <div className="input-group input-group-sm" style={{ maxWidth: "200px" }}>
                            <span className="input-group-text bg-white border-end-0">
                                <i className="isax isax-search-normal text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label="Search users"
                            />
                        </div>

                        <Link
                            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                            to="/home/users/add-user"
                        >
                            <i className="isax isax-add"></i> Add new user
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="card border-0 shadow-sm domain-overview-card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 domain-overview-table">
                                <thead>
                                    <tr>
                                        <th className="text-muted fw-medium">User</th>
                                        <th className="text-muted fw-medium">Latest login</th>
                                        <th className="text-muted fw-medium">Status</th>
                                        <th className="text-muted fw-medium text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5">
                                                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <span className="text-muted">Loading users...</span>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((user) => {
                                            const { month, day, year } = formatLatestLogin(user.user_last_login);
                                            const initials = (user.user_first_name?.[0] || "") + (user.user_last_name?.[0] || "");

                                            return (
                                                <tr key={user._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span
                                                                className={`avatar rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold flex-shrink-0`}
                                                                style={{ width: "40px", height: "40px", fontSize: "0.875rem" }}
                                                            >
                                                                {initials || "U"}
                                                            </span>
                                                            <div>
                                                                <span className="fw-medium text-body d-block">
                                                                    {user.user_first_name} {user.user_last_name}
                                                                </span>
                                                                <span className="small text-muted d-flex align-items-center gap-1">
                                                                    <i className="isax isax-sms" style={{ fontSize: "0.75rem" }}></i>
                                                                    {user.user_email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="domain-overview-date d-flex flex-column">
                                                            {user.user_last_login ? (
                                                                <>
                                                                    <span className="fw-medium">{month}</span>
                                                                    <span className="display-6 lh-1 fw-bold text-body">{day}</span>
                                                                    <span className="text-muted small">{year}</span>
                                                                </>
                                                            ) : (
                                                                <span className="fw-medium text-muted">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${user.user_status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'}`}>
                                                            {user.user_status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="dropdown">
                                                            <button
                                                                className="btn btn-sm btn-light border dropdown-toggle"
                                                                type="button"
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                            >
                                                                Actions
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li>
                                                                    <Link className="dropdown-item" to={`/home/users/edit-user/${user.user_id}`}>
                                                                        <i className="isax isax-setting-25 me-2" aria-hidden="true" /> Edit User
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item text-danger border-0 bg-transparent"
                                                                        onClick={() => isArchivedView ? handleHardDeleteUser(user) : handleArchiveUser(user)}
                                                                    >
                                                                        <i className={`isax ${isArchivedView ? "isax-trash" : "isax-archive-add"} me-2`} aria-hidden="true" /> {isArchivedView ? "Hard Delete" : "Archive User"}
                                                                    </button>
                                                                </li>
                                                                {isArchivedView && (
                                                                    <li>
                                                                        <button
                                                                            type="button"
                                                                            className="dropdown-item text-success border-0 bg-transparent"
                                                                            onClick={() => handleRestoreUser(user)}
                                                                        >
                                                                            <i className="isax isax-rotate-right me-2" aria-hidden="true" /> Restore User
                                                                        </button>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5">
                                                <div className="text-muted">
                                                    No {isArchivedView ? "archived " : ""}users found
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.length > 0 && (
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
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
                                        {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, totalUsers)} of{" "}
                                        {totalUsers}
                                    </span>
                                </div>

                                <nav aria-label="User list pagination">
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

                                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                                            const p = currentPage <= 5 ? i + 1 : currentPage - 5 + i;
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}