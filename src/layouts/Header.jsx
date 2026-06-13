import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/auth/authSlice";

const STATIC_NOTIFICATIONS = [
  {
    id: 1,
    name: "John Smith",
    message: "A new sale has been recorded.",
    time: "4 min ago",
    avatar: "/assets/images/avatar-05.jpg",
  },
  {
    id: 2,
    name: "Donoghue Susan",
    message: "Switched to a lower-tier package",
    time: "4 min ago",
    avatar: null, // uses initial
    initial: "D",
    bgColor: "bg-soft-info text-info",
  },
];

const STATIC_QUICK_ADD_ITEMS = [
  { to: "/add-invoice", icon: "isax-document-text-1", label: "Invoice" },
  { to: "/expenses", icon: "isax-money-send", label: "Expense" },
  { to: "/add-credit-notes", icon: "isax-money-add", label: "Credit Notes" },
  { to: "/add-debit-notes", icon: "isax-money-recive", label: "Debit Notes" },
  {
    to: "/add-purchases-orders",
    icon: "isax-document",
    label: "Purchase Order",
  },
  { to: "/add-quotation", icon: "isax-document-download", label: "Quotation" },
  {
    to: "/add-delivery-challan",
    icon: "isax-document-forward",
    label: "Delivery Challan",
  },
];

export default function Header({
  breadcrumbTitle = "Dashboard",
  breadcrumbParent,
  breadcrumbParentHref = "#",
  breadcrumbRoot, // e.g. { label: "Super Admin", href: "/admin" }
  onMobileMenuToggle,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return (parts[0][0] + (parts[0][1] || "")).toUpperCase();
    }
    return "U";
  };
  // ==================== MAIN DASHBOARD HEADER ====================
  return (
    <div className="header landing-header">
      <div className="main-header landing-main-header">
        <div className="header-left">
          <Link className="logo d-flex align-items-center" to="/">
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#343a40",
                letterSpacing: "-0.5px",
              }}
            >
              Sitemonitor
            </span>
          </Link>
          <Link className="dark-logo d-flex align-items-center" to="/">
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#fff",
                letterSpacing: "-0.5px",
              }}
            >
              Sitemonitor
            </span>
          </Link>
        </div>

        <button
          type="button"
          className="mobile_btn"
          id="mobile_btn"
          aria-label="Open menu"
          onClick={() => onMobileMenuToggle?.()}
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div className="header-user">
          <div className="nav user-menu nav-list">
            <div
              className="me-auto d-flex align-items-center"
              id="header-search"
            >
              {/* Quick Add Dropdown */}
              <div className="dropdown me-3">
                <a
                  className="btn btn-primary bg-gradient btn-xs btn-icon rounded-circle d-flex align-items-center justify-content-center"
                  data-bs-toggle="dropdown"
                  href="#"
                  role="button"
                >
                  <i className="isax isax-add text-white" />
                </a>
                <ul className="dropdown-menu dropdown-menu-start p-2">
                  {STATIC_QUICK_ADD_ITEMS.map((item, index) => (
                    <li key={index}>
                      <Link
                        className="dropdown-item d-flex align-items-center"
                        to={item.to}
                      >
                        <i className={`isax ${item.icon} me-2`} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Breadcrumb */}
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb breadcrumb-divide mb-0">
                  {breadcrumbRoot ? (
                    <li className="breadcrumb-item d-flex align-items-center">
                      <Link to={breadcrumbRoot.href}>
                        {breadcrumbRoot.label}
                      </Link>
                    </li>
                  ) : (
                    <li className="breadcrumb-item d-flex align-items-center">
                      <Link to="/">
                        <i className="isax isax-home-2 me-1" /> Home
                      </Link>
                    </li>
                  )}

                  {breadcrumbParent && (
                    <>
                      <li className="breadcrumb-item">
                        <Link to={breadcrumbParentHref}>
                          {breadcrumbParent}
                        </Link>
                      </li>
                      <li
                        className="breadcrumb-item active"
                        aria-current="page"
                      >
                        {breadcrumbTitle}
                      </li>
                    </>
                  )}

                  {!breadcrumbParent &&
                    breadcrumbTitle !== (breadcrumbRoot?.label || "Home") && (
                      <li
                        className="breadcrumb-item active"
                        aria-current="page"
                      >
                        {breadcrumbTitle}
                      </li>
                    )}
                </ol>
              </nav>
            </div>

            {/* Right Side Controls */}
            <div className="d-flex align-items-center">
              {/* Search */}
              <div className="input-icon-end position-relative me-2">
                <input
                  className="form-control"
                  placeholder="Search"
                  type="text"
                />
                <span className="input-icon-addon">
                  <i className="isax isax-search-normal" />
                </span>
              </div>

              {/* Notifications */}
              <div className="notification_item me-2">
                <a
                  className="btn btn-menubar position-relative"
                  data-bs-auto-close="outside"
                  data-bs-toggle="dropdown"
                  href="#"
                  id="notification_popup"
                >
                  <i className="isax isax-notification-bing5" />
                  <span className="position-absolute badge bg-success border border-white" />
                </a>

                <div
                  className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                  style={{ minHeight: "300px" }}
                >
                  {/* Same notification body as landing - you can extract to a component if needed */}
                  <div className="p-2 border-bottom">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                      </div>
                      <div className="col-auto">
                        <div className="dropdown">
                          <a
                            className="dropdown-toggle drop-arrow-none link-dark"
                            data-bs-offset="0,15"
                            data-bs-toggle="dropdown"
                            href="#"
                          >
                            <i className="isax isax-setting-2 fs-16 text-body align-middle" />
                          </a>
                          <div className="dropdown-menu dropdown-menu-end">
                            <a className="dropdown-item" href="#">
                              <i className="ti ti-bell-check me-1" />
                              Mark as Read
                            </a>
                            <a className="dropdown-item" href="#">
                              <i className="ti ti-trash me-1" />
                              Delete All
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="notification-body position-relative z-2 rounded-0"
                    data-simplebar
                  >
                    {STATIC_NOTIFICATIONS.map((notif) => (
                      <div
                        key={notif.id}
                        className="dropdown-item notification-item py-2 text-wrap border-bottom"
                      >
                        <div className="d-flex">
                          <div className="me-2 position-relative flex-shrink-0">
                            {notif.avatar ? (
                              <img
                                alt="User"
                                className="avatar-md rounded-circle"
                                src={notif.avatar}
                              />
                            ) : (
                              <div
                                className={`avatar-sm me-2 ${notif.bgColor}`}
                              >
                                <span className="avatar-title rounded-circle">
                                  {notif.initial}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-0 fw-semibold text-dark">
                              {notif.name}
                            </p>
                            <p className="mb-1 text-wrap fs-14">
                              {notif.message}
                            </p>
                            <span className="fs-12">
                              <i className="isax isax-clock me-1" />
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded-bottom border-top text-center">
                    <Link
                      className="text-center fw-medium fs-14 mb-0"
                      to="/notifications"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="me-2 theme-item">
                <a
                  className="theme-toggle btn btn-menubar"
                  href="#"
                  id="dark-mode-toggle"
                >
                  <i className="isax isax-moon" />
                </a>
                <a
                  className="theme-toggle btn btn-menubar"
                  href="#"
                  id="light-mode-toggle"
                >
                  <i className="isax isax-sun-1" />
                </a>
              </div>

              {/* Profile Dropdown (same as landing) */}
              <div className="dropdown profile-dropdown">
                <a
                  className="dropdown-toggle d-flex align-items-center"
                  data-bs-auto-close="outside"
                  data-bs-toggle="dropdown"
                  href="#"
                >
                  {user?.profilePicture ? (
                    <span className="avatar online">
                      <img
                        alt="Profile"
                        className="img-fluid rounded-circle"
                        src={user.profilePicture}
                      />
                    </span>
                  ) : (
                    <span className="avatar online rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold fs-14">
                      {getInitials(user?.name)}
                    </span>
                  )}
                </a>

                <div className="dropdown-menu p-2 dropdown-menu-end">
                  <div className="d-flex align-items-start p-2 pb-2 mb-2 border-bottom">
                    <span className="avatar avatar-lg rounded-circle bg-primary text-white flex-shrink-0 me-2 d-flex align-items-center justify-content-center fw-semibold fs-14">
                      {getInitials(user?.name)}
                    </span>
                    <div className="min-w-0">
                      <h6 className="fs-14 fw-semibold text-body mb-0">
                        {user?.name ||
                          (user?.user_first_name
                            ? `${user.user_first_name} ${user.user_last_name || ""}`
                            : "User")}
                      </h6>
                      <p className="fs-13 text-muted mb-1">
                        {user?.email || user?.user_email || "user@example.com"}
                      </p>
                      <Link
                        className="text-primary fs-13 text-decoration-none"
                        to="/home/users/update-profile"
                      >
                        Edit my profile
                      </Link>
                    </div>
                  </div>

                  <Link
                    className="dropdown-item d-flex align-items-center py-2"
                    to="/my-exports"
                  >
                    <i className="isax isax-document-download me-2 text-body" />{" "}
                    My Exports
                  </Link>

                  <hr className="dropdown-divider my-2" />

                  <Link
                    className="dropdown-item d-flex align-items-center py-2 logout"
                    to="#"
                    onClick={handleLogout}
                  >
                    <i className="isax isax-logout me-2 text-body" /> Log out
                  </Link>
                </div>
              </div>

              {/* Mobile User Menu */}
              <div className="dropdown mobile-user-menu profile-dropdown">
                <a
                  className="dropdown-toggle d-flex align-items-center"
                  data-bs-auto-close="outside"
                  data-bs-toggle="dropdown"
                  href="#"
                >
                  {user?.profilePicture ? (
                    <span className="avatar avatar-md online">
                      <img
                        alt="Img"
                        className="img-fluid rounded-circle"
                        src={user.profilePicture}
                      />
                    </span>
                  ) : (
                    <span className="avatar avatar-md online rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold fs-14">
                      {getInitials(user?.name)}
                    </span>
                  )}
                </a>
                <div className="dropdown-menu p-2 mt-0 dropdown-menu-end">
                  <div className="d-flex align-items-start p-2 pb-2 mb-2 border-bottom">
                    <span className="avatar avatar-lg rounded-circle bg-primary text-white flex-shrink-0 me-2 d-flex align-items-center justify-content-center fw-semibold fs-14">
                      {getInitials(user?.name)}
                    </span>
                    <div className="min-w-0">
                      <h6 className="fs-14 fw-semibold mb-0">
                        {user?.name ||
                          (user?.user_first_name
                            ? `${user.user_first_name} ${user.user_last_name || ""}`
                            : "User")}
                      </h6>
                      <p className="fs-13 text-muted mb-1">
                        {user?.email || user?.user_email || "user@example.com"}
                      </p>
                      <Link
                        className="text-primary fs-13"
                        to="/home/users/update-profile"
                      >
                        Edit my profile
                      </Link>
                    </div>
                  </div>

                  <Link
                    className="dropdown-item d-flex align-items-center py-2"
                    to="/my-exports"
                  >
                    <i className="isax isax-document-download me-2" /> My
                    Exports
                  </Link>

                  <hr className="dropdown-divider my-2" />

                  <Link
                    className="dropdown-item d-flex align-items-center py-2 logout"
                    to="#"
                    onClick={handleLogout}
                  >
                    <i className="isax isax-logout me-2" /> Log out
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
