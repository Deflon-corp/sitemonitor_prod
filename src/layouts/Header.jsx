import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/auth/authSlice";
import { getLogsApi, deleteLogsApi } from "../api/logsApi";
import { getDomainsApi } from "../api/domainApi";
import { getDomainLabel } from "./Sidebar";
import axiosInstance from "../api/axiosInstance";
import Swal from "sweetalert2";

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

  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Global Search States & Hooks
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState({ domains: [], users: [], policies: [], scandata: [] });
  const [isSearchingGlobal, setIsSearchingGlobal] = React.useState(false);
  const [domains, setDomains] = React.useState([]);
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    const loadDomains = async () => {
      try {
        const res = await getDomainsApi(1, 100);
        if (res && res.success && res.data?.domains) {
          setDomains(res.data.domains);
        }
      } catch (err) {
        console.error("Error fetching domains for header search:", err);
      }
    };
    loadDomains();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults({ domains: [], users: [], policies: [], scandata: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const response = await axiosInstance.get(`/global-search?q=${encodeURIComponent(query)}`);
        if (response.data && response.data.success) {
          setSearchResults(response.data.data);
        }
      } catch (err) {
        console.error("Failed to query global search:", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const filteredSuggestions = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    // 1. Navigation Shortcuts
    const staticPages = [
      { label: "All Domain Show / Home", href: "/home", category: "Navigation", icon: "isax-global", keywords: ["all domain", "all domain show", "domain overview", "home"] },
      { label: "Add Domain", href: "/home/add-domain", category: "Navigation", icon: "isax-add", keywords: ["add domain", "new domain", "create domain"] },
      { label: "User List", href: "/home/users", category: "Navigation", icon: "isax-people", keywords: ["user list", "users", "all users"] },
      { label: "Add User", href: "/home/users/add-user", category: "Navigation", icon: "isax-user", keywords: ["add user", "new user", "create user"] }
    ];

    const pageMatches = staticPages.filter(p => 
      p.keywords.some(kw => kw.includes(query) || query.includes(kw))
    ).map(p => ({ ...p, type: "page" }));

    // 2. Dynamic Domain-Wise Module Shortcuts (Policy, QA, SEO, Accessibility, Heartbeat, Performance, Inventory, Audit)
    const moduleShortcuts = [];
    const moduleList = [
      { name: "Policy", path: "/domain/policies", keywords: ["policy", "policies"], icon: "isax-shield-tick" },
      { name: "Quality Assurance", path: "/domain/quality-assurance?view=summary", keywords: ["quality assurance", "qa", "quality assurance summary"], icon: "isax-tick-circle5" },
      { name: "Accessibility", path: "/domain/accessibility?view=summary", keywords: ["accessibility", "accessibility summary", "assecbility", "access"], icon: "isax-tick-circle" },
      { name: "SEO", path: "/domain/seo?view=summary", keywords: ["seo", "seo summary", "search engine optimization"], icon: "isax-chart-215" },
      { name: "Heartbeat", path: "/domain/heartbeat", keywords: ["heartbeat", "heatbeat", "status", "monitoring"], icon: "isax-heart5" },
      { name: "Performance", path: "/domain/performance", keywords: ["performance", "performac", "speed", "score"], icon: "isax-shield-tick5" },
      { name: "Inventory", path: "/domain/inventory?view=summary", keywords: ["inventory", "pages", "assets"], icon: "isax-book5" },
      { name: "Run Website Audit", path: "/domain/audit", keywords: ["run website audit", "website audit", "audit"], icon: "isax-search-status" }
    ];

    const matchedModules = moduleList.filter(m => 
      m.keywords.some(k => k.includes(query) || query.includes(k))
    );

    if (matchedModules.length > 0 && domains.length > 0) {
      matchedModules.forEach(mod => {
        domains.forEach(d => {
          moduleShortcuts.push({
            label: `${d.dm_title || getDomainLabel(d.dm_url)} - ${mod.name}`,
            href: mod.path,
            id: d._id,
            url: d.dm_url,
            category: "Module Shortcuts",
            icon: mod.icon,
            type: "module_shortcut"
          });
        });
      });
    }

    // 3. User & Domain matches from Backend Search
    const domainMatches = (searchResults.domains || []).map(d => ({
      label: d.name,
      href: "/domain",
      id: d.id,
      url: d.url,
      category: "Domains",
      icon: "isax-global",
      type: "domain"
    }));

    const userMatches = (searchResults.users || []).map(u => ({
      label: u.name,
      href: `/home/users/edit-user/${u.user_id}`,
      email: u.email,
      category: "Users",
      icon: "isax-people",
      type: "user"
    }));

    return [
      ...pageMatches,
      ...moduleShortcuts,
      ...domainMatches,
      ...userMatches
    ];
  }, [searchQuery, searchResults, domains]);

  const groupedSuggestions = React.useMemo(() => {
    const groups = {};
    filteredSuggestions.forEach(item => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredSuggestions]);

  const handleSuggestionClick = (item) => {
    setSearchQuery("");

    let targetDomainId = item.id;
    if (item.type === "scandata" && !targetDomainId && item.domainUrl) {
      const match = domains.find(d => d.dm_url === item.domainUrl || d.dm_title === item.domainUrl);
      if (match) targetDomainId = match._id;
    }

    if (targetDomainId) {
      const currentId = sessionStorage.getItem("selectedDomainId");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedDomainId", targetDomainId);
      }
      window.dispatchEvent(
        new CustomEvent("sitemonitor:select-domain", {
          detail: { id: targetDomainId },
        })
      );
      
      if (currentId !== targetDomainId && window.location.pathname.startsWith("/domain")) {
        navigate(item.href);
        // Force a page reload to refresh all context/charts for the new domain
        setTimeout(() => {
          window.location.reload();
        }, 50);
        return;
      }
    }

    // Force page reload on user edit redirect to reload initial state cleanly
    if (item.type === "user") {
      navigate(item.href);
      setTimeout(() => {
        window.location.reload();
      }, 50);
      return;
    }

    navigate(item.href);
  };

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await getLogsApi();
      if (res && res.success) {
        const logsList = Array.isArray(res.data) ? res.data : [];
        setNotifications(logsList);

        // Calculate unread
        const lastRead = localStorage.getItem("lastReadNotificationTime");
        if (lastRead) {
          const lastReadTime = new Date(lastRead).getTime();
          const count = logsList.filter(n => {
            const time = n.createdAt ? new Date(n.createdAt).getTime() : 0;
            return time > lastReadTime;
          }).length;
          setUnreadCount(count);
        } else {
          setUnreadCount(logsList.length);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem("lastReadNotificationTime", new Date().toISOString());
    setUnreadCount(0);
  };

  const handleBellClick = async (e) => {
    try {
      const res = await getLogsApi();
      if (res && res.success) {
        const logsList = Array.isArray(res.data) ? res.data : [];
        setNotifications(logsList);
      }
    } catch (err) {
      console.error("Error fetching notifications on click:", err);
    }
    localStorage.setItem("lastReadNotificationTime", new Date().toISOString());
    setUnreadCount(0);
  };

  const handleDeleteAll = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await deleteLogsApi();
      if (res && res.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  };

  const handleNotificationClick = (e, notification) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const metadata = notification.metadata || {};

    // 1. Determine Operation Name
    let operationTitle = "System Event";
    const action = notification.action || "";
    if (action === "TRIGGER_SCAN") operationTitle = "Start Domain Scanning";
    else if (action === "TRIGGER_POLICY_SCAN") operationTitle = "Start Policy Scanning";
    else if (action === "SCAN_COMPLETED") {
      const type = metadata.scanType || "seo";
      operationTitle = `${type.toUpperCase()} Scan Completed`;
    }
    else if (action === "SCAN_FAILED") {
      const type = metadata.scanType || "seo";
      operationTitle = `${type.toUpperCase()} Scan Failed`;
    }
    else if (action === "CREATE_DOMAIN") operationTitle = "Domain Created";
    else if (action === "UPDATE_DOMAIN") operationTitle = "Domain Updated";
    else if (action === "DELETE_DOMAIN" || action === "HARD_DELETE_DOMAIN") operationTitle = "Domain Deleted";
    else if (action === "ARCHIVE_DOMAIN") operationTitle = "Domain Archived";
    else if (action === "RESTORE_DOMAIN") operationTitle = "Domain Restored";
    else if (action === "CREATE_USER") operationTitle = "User Created";
    else if (action === "UPDATE_USER") operationTitle = "User Updated";
    else if (action === "DELETE_USER" || action === "HARD_DELETE_USER") operationTitle = "User Deleted";
    else if (action === "CREATE_POLICY") operationTitle = "Policy Created";
    else if (action === "UPDATE_POLICY") operationTitle = "Policy Updated";
    else if (action === "DELETE_POLICY") operationTitle = "Policy Deleted";
    else {
      operationTitle = action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    // 2. Determine Domain Name and clean it up
    let domainValue = "N/A";
    if (metadata.isGlobal === true) {
      domainValue = "All Domain";
    } else if (Array.isArray(metadata.domainNames) && metadata.domainNames.length > 0) {
      domainValue = metadata.domainNames.map(d => {
        if (d === "All Domains" || d === "All Domain") return "All Domain";
        return d.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
      }).join(" | ");
    } else {
      const singleDomain = metadata.domainName || metadata.domainTitle || metadata.domainUrl;
      if (singleDomain && singleDomain !== "N/A") {
        domainValue = singleDomain
          .replace(/^https?:\/\//i, '')
          .split('/')[0]
          .split(':')[0];
      }
    }

    // 2.5 Determine Domain URL(s) and make them clean links
    let urlValue = "N/A";
    if (metadata.isGlobal === true) {
      urlValue = "All Domain URLs";
    } else if (Array.isArray(metadata.domainUrls) && metadata.domainUrls.length > 0) {
      urlValue = metadata.domainUrls.map(link => {
        const href = link.startsWith("http") ? link : `https://${link}`;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; word-break: break-all;">${link}</a>`;
      }).join(" | ");
    } else {
      const singleUrl = metadata.domainUrl || metadata.domainName;
      if (singleUrl && singleUrl !== "N/A" && singleUrl.includes(".")) {
        const href = singleUrl.startsWith("http") ? singleUrl : `https://${singleUrl}`;
        urlValue = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; word-break: break-all;">${singleUrl}</a>`;
      }
    }

    // 3. Determine Report / Details
    let reportValue = notification.details || "Details not specified.";
    if (action === "TRIGGER_SCAN") {
      reportValue = "SEO Scan";
    } else if (action === "TRIGGER_POLICY_SCAN") {
      reportValue = "Policy";
    } else if (action === "SCAN_COMPLETED") {
      const type = metadata.scanType || "seo";
      if (type === "policy") reportValue = "Policy";
      else if (type === "qa") reportValue = "Quality Assurance";
      else if (type === "accessibility") reportValue = "Accessibility";
      else reportValue = "SEO Scan";
    } else if (action === "SCAN_FAILED") {
      const type = metadata.scanType || "seo";
      if (type === "policy") reportValue = "Policy (Failed)";
      else if (type === "qa") reportValue = "Quality Assurance (Failed)";
      else if (type === "accessibility") reportValue = "Accessibility (Failed)";
      else reportValue = "SEO Scan (Failed)";
    }

    // 4. Format Date
    const dateValue = new Date(notification.createdAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Build the simple key-value listing
    const entries = [
      { label: "Operation", value: operationTitle },
      { label: "Domain", value: domainValue }
    ];

    if (urlValue && urlValue !== "N/A") {
      entries.push({ label: "URL", value: urlValue });
    }

    entries.push(
      { label: "Report", value: reportValue },
      { label: "Date", value: dateValue }
    );

    const metadataHtml = `
      <div style="text-align: left; background: #ffffff; padding: 18px; border-radius: 12px; border: 1px solid #eef2f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${entries.map(item => `
          <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            <div style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">
              ${item.label}
            </div>
            <div style="color: #1E293B; font-size: 13px; font-weight: 500; line-height: 1.4;">
              ${item.value}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    Swal.fire({
      title: `<h5 style="margin: 0; font-weight: 700; color: #0F172A; font-family: sans-serif;">Activity Log Details</h5>`,
      html: metadataHtml,
      icon: 'info',
      confirmButtonText: 'Close',
      customClass: {
        confirmButton: 'btn btn-primary btn-md w-100 rounded-3 mt-2'
      },
      buttonsStyling: false
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getIconForAction = (action) => {
    switch (action) {
      case "SCAN_COMPLETED":
        return <i className="bi bi-check-circle-fill text-success fs-18" />;
      case "SCAN_FAILED":
        return <i className="bi bi-exclamation-triangle-fill text-danger fs-18" />;
      case "CREATE_DOMAIN":
        return <i className="bi bi-globe2 text-primary fs-18" />;
      case "UPDATE_DOMAIN":
        return <i className="bi bi-pencil-square text-warning fs-18" />;
      case "DELETE_DOMAIN":
      case "HARD_DELETE_DOMAIN":
        return <i className="bi bi-trash text-danger fs-18" />;
      case "ARCHIVE_DOMAIN":
        return <i className="bi bi-archive text-muted fs-18" />;
      case "RESTORE_DOMAIN":
        return <i className="bi bi-arrow-counterclockwise text-info fs-18" />;
      case "TRIGGER_SCAN":
        return <i className="bi bi-play-circle text-primary fs-18" />;
      case "CREATE_USER":
        return <i className="bi bi-person-plus text-success fs-18" />;
      case "UPDATE_USER":
        return <i className="bi bi-person-gear text-warning fs-18" />;
      case "DELETE_USER":
      case "HARD_DELETE_USER":
        return <i className="bi bi-person-minus text-danger fs-18" />;
      case "ARCHIVE_USER":
        return <i className="bi bi-person-workspace text-muted fs-18" />;
      case "RESTORE_USER":
        return <i className="bi bi-person-check text-info fs-18" />;
      case "CREATE_POLICY":
        return <i className="bi bi-shield-check text-success fs-18" />;
      case "UPDATE_POLICY":
        return <i className="bi bi-shield-exclamation text-warning fs-18" />;
      case "DELETE_POLICY":
        return <i className="bi bi-shield-slash text-danger fs-18" />;
      case "TRIGGER_POLICY_SCAN":
        return <i className="bi bi-play-circle text-primary fs-18" />;
      default:
        return <i className="bi bi-bell text-secondary fs-18" />;
    }
  };

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
            <img
              src="/assets/images/logo-dark.jpeg"
              alt="Sitemonitor Logo"
              className="img-fluid"
              style={{ maxHeight: "32px", objectFit: "contain" }}
            />
          </Link>
          <Link className="dark-logo d-flex align-items-center" to="/">
            <img
              src="/assets/images/logo-dark.jpeg"
              alt="Sitemonitor Logo"
              className="img-fluid"
              style={{ maxHeight: "32px", objectFit: "contain" }}
            />
          </Link>
        </div>



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
              <div ref={searchRef} className="input-icon-end position-relative me-2" style={{ zIndex: 1050 }}>
                <input
                  className="form-control"
                  placeholder="Search domains or pages..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "240px" }}
                />
                <span className="input-icon-addon">
                  <i className="isax isax-search-normal" />
                </span>

                {searchQuery.trim() && (
                  <div
                    className="position-absolute bg-white border rounded shadow-lg mt-1 p-2"
                    style={{
                      top: "100%",
                      right: 0,
                      width: "320px",
                      maxHeight: "380px",
                      overflowY: "auto"
                    }}
                  >
                    {filteredSuggestions.length === 0 ? (
                      <div className="text-center p-3 text-muted fs-13">
                        No results found for "{searchQuery}"
                      </div>
                    ) : (
                      <div>
                        {Object.entries(groupedSuggestions).map(([category, items]) => (
                          <div key={category} className="mb-2">
                            <div className="text-muted small fw-bold px-2 py-1 bg-light rounded-2 mb-1 text-uppercase" style={{ fontSize: "9px", letterSpacing: "0.5px" }}>
                              {category}
                            </div>
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="d-flex align-items-center gap-2 p-2 rounded cursor-pointer hover-bg-light transition-all text-start"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleSuggestionClick(item)}
                              >
                                <span className="avatar avatar-30 rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
                                  <i className={`isax ${item.icon} fs-14`} />
                                </span>
                                <div className="flex-grow-1 min-w-0">
                                  <div className="fw-medium text-body fs-13 text-truncate">
                                    {item.label}
                                  </div>
                                  {item.email && (
                                    <div className="text-muted fs-11 text-truncate">
                                      {item.email} (User)
                                    </div>
                                  )}
                                  {item.desc && (
                                    <div className="text-muted fs-11 text-truncate">
                                      {item.desc}
                                    </div>
                                  )}
                                  {item.url && (
                                    <div className="text-muted fs-11 text-truncate">
                                      {item.url}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="notification_item me-2">
                <a
                  className="btn btn-menubar position-relative d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: "38px", height: "38px", padding: "0" }}
                  data-bs-auto-close="outside"
                  data-bs-toggle="dropdown"
                  href="#"
                  id="notification_popup"
                  onClick={handleBellClick}
                >
                  <i className="isax isax-notification-bing5" style={{ fontSize: "30px" }} />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute badge rounded-circle bg-danger border border-white d-flex align-items-center justify-content-center text-white"
                      style={{
                        top: '1px',
                        right: '1px',
                        fontSize: '9px',
                        width: '16px',
                        height: '16px',
                        padding: '0',
                        fontWeight: '600',
                        lineHeight: '1'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </a>

                <div
                  className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                  style={{ minWidth: "320px" }}
                >
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
                            <a className="dropdown-item" href="#" onClick={handleMarkAsRead}>
                              <i className="bi bi-check2-all me-1" />
                              Mark as Read
                            </a>
                            <a className="dropdown-item" href="#" onClick={handleDeleteAll}>
                              <i className="bi bi-trash me-1" />
                              Delete All
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="notification-body position-relative z-2 rounded-0"
                    style={{ maxHeight: "350px", overflowY: "auto" }}
                  >
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        <i className="bi bi-bell-slash fs-24 mb-2 d-block text-secondary opacity-50" />
                        <p className="mb-0 fs-13">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className="dropdown-item notification-item py-3 text-wrap border-bottom transition-all hover:bg-light"
                          style={{ transition: "all 0.2s", cursor: "pointer" }}
                          onClick={(e) => handleNotificationClick(e, notif)}
                        >
                          <div className="d-flex align-items-start">
                            <div className="me-3 flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-light" style={{ width: "36px", height: "36px" }}>
                              {getIconForAction(notif.action)}
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-1 text-wrap fs-13 text-dark fw-medium" style={{ whiteSpace: "normal" }}>
                                {notif.details}
                              </p>
                              <span className="fs-12 text-muted d-flex align-items-center">
                                <i className="isax isax-clock me-1 fs-12" />
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 rounded-bottom border-top text-center bg-light">
                    <span className="fw-medium fs-12 text-muted">
                      Showing last 50 activities
                    </span>
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
                    <div className="min-w-0 mt-2">
                      <h6 className="fs-14 fw-semibold text-body mb-0">
                        {user?.name ||
                          (user?.user_first_name
                            ? `${user.user_first_name} ${user.user_last_name || ""}`
                            : "User")}
                      </h6>
                    </div>
                  </div>

                  <Link
                    className="dropdown-item d-flex align-items-center py-2"
                    to="/home/users/update-profile"
                  >
                    <i className="isax isax-user me-2 text-body" />{" "}
                    my profile
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
                    </div>
                  </div>

                  <Link
                    className="dropdown-item d-flex align-items-center py-2"
                    to="/home/users/update-profile"
                  >
                    <i className="isax isax-user me-2" /> Edit my profile
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
