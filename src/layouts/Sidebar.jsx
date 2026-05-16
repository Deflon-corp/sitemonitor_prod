import { Link, useLocation, useSearchParams } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { getDomainsApi } from "../api/domainApi";

export const SELECTED_DOMAIN_KEY = "selectedDomainId";

export function getDomainLabel(url) {
    try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, "") || url;
    } catch {
        return url;
    }
}

/** Landing/pill routes use the compact sidebar (Select Domain, Settings, Auth) in this file. */
export function isLandingPillsPath(pathname) {
    // Only paths starting with /domain show the "Main" sidebar. All others show the compact landing select sidebar.
    return !pathname.startsWith("/domain");
}

function getStoredDomainId() {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(SELECTED_DOMAIN_KEY) || "";
}



function handleSubmenuClick(e) {
    const target = e.currentTarget;
    const parentLi = target.closest("li.submenu");
    if (!parentLi) return;
    e.preventDefault();
    const parentUl = target.closest("ul");
    if (parentUl) {
        parentUl.querySelectorAll("li.submenu a.subdrop").forEach((a) => {
            if (a !== target) {
                a.classList.remove("subdrop", "active");
            }
        });
    }
    const isOpen = target.classList.contains("active");
    if (isOpen) {
        target.classList.remove("subdrop", "active");
    } else {
        target.classList.add("subdrop", "active");
    }
}

export default function Sidebar() {
    const pathname = useLocation().pathname;
    const [searchParams] = useSearchParams();

    const [domains, setDomains] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedDomainId, setSelectedDomainId] = useState(() => getStoredDomainId());
    const [dashboardDomainId, setDashboardDomainId] = useState(() => getStoredDomainId() || null);

    const fetchDomains = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getDomainsApi(1, 100);
            if (response.success) {
                const fetchedDomains = response.data.domains;
                setDomains(fetchedDomains);
            }
        } catch (error) {
            console.error("Failed to fetch domains in sidebar:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    useEffect(() => {
        window.addEventListener("sitemonitor:domains-updated", fetchDomains);
        return () => window.removeEventListener("sitemonitor:domains-updated", fetchDomains);
    }, [fetchDomains]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (isLandingPillsPath(pathname)) {
            // On landing/home paths, always default to "All Domains"
            setSelectedDomainId("");
            setDashboardDomainId(null);
        } else {
            // On domain-specific paths, use stored ID or first domain
            const id = getStoredDomainId();
            if (id) {
                setSelectedDomainId(id);
                setDashboardDomainId(id);
            } else if (domains.length > 0) {
                const defaultId = domains[0]._id;
                setSelectedDomainId(defaultId);
                setDashboardDomainId(defaultId);
            }
        }
    }, [pathname, domains]);

    useEffect(() => {
        const onSelectDomain = (e) => {
            const id = e.detail?.id ?? "";
            if (typeof window !== "undefined") {
                sessionStorage.setItem(SELECTED_DOMAIN_KEY, id);
            }
            setSelectedDomainId(id);
            setDashboardDomainId(id || null);
        };
        window.addEventListener("sitemonitor:select-domain", onSelectDomain);
        return () => window.removeEventListener("sitemonitor:select-domain", onSelectDomain);
    }, []);

    /** Landing/pill routes: compact sidebar. Other routes: full menu (e.g. Dashboard). */
    const showLandingSidebar = isLandingPillsPath(pathname);

    const isLinkActive = (href) => {
        const [pathOnly, queryString] = href.split("?");
        const path = pathOnly || href;
        const pathMatch = pathname === path || (path !== "/" && pathname.startsWith(path + "/"));
        if (!pathMatch) return false;
        if (!queryString) return true;
        const linkParams = new URLSearchParams(queryString);
        return Array.from(linkParams.keys()).every(
            (key) => searchParams.get(key) === linkParams.get(key)
        );
    };
    const isSectionActive = (paths) =>
        paths.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));

    const isAccountActive =
        pathname === "/home/users/update-profile" ||
        pathname.startsWith("/home/users") ||
        pathname === "/home/add-user" ||
        pathname === "/audit-log" ||
        pathname === "/scan-exclusions" ||
        pathname === "/add-scan-exclusion";

    return (
        <div className={`two-col-sidebar${showLandingSidebar ? " landing-sidebar" : ""}`} id="two-col-sidebar">
            {showLandingSidebar ? (
                <div className="sidebar-else-wrapper">
                    <div className="sidebar" id="sidebar-two">
                        <div className="sidebar-logo d-flex align-items-center gap-2 py-3 px-3">
                            <div className="sidebar-logo">
                                <Link to="/" className="logo logo-normal d-flex align-items-center">
                                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2c496e", letterSpacing: "-0.5px" }}>Sitemonitor</span>
                                </Link>
                                {/* <Link to="/" className="logo-small d-flex align-items-center justify-content-center">
                                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#343a40" }}>S</span>
                                </Link> */}
                                {/* <Link to="/" className="dark-logo d-flex align-items-center">
                                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" }}>Sitemonitor</span>
                                </Link>
                                <Link to="/" className="dark-small d-flex align-items-center justify-content-center">
                                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff" }}>S</span>
                                </Link> */}
                                <a href="#" id="toggle_btn">
                                    <i className="isax isax-menu-1"></i>
                                </a>
                            </div>
                        </div>
                        <div className="sidebar-inner" data-simplebar="">
                            <div className="sidebar-menu" id="sidebar-menu">
                                <ul>
                                    <li className="mt-3" />
                                    <li key="select-domain">
                                        <a
                                            href="#"
                                            className={`landing-domain-item d-flex align-items-center flex-nowrap gap-2 ${selectedDomainId === "" ? "active" : ""}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedDomainId("");
                                                setDashboardDomainId(null);
                                                if (typeof window !== "undefined") sessionStorage.setItem(SELECTED_DOMAIN_KEY, "");
                                            }}
                                        >
                                            <i className="isax isax-global landing-domain-item-icon flex-shrink-0" aria-hidden />
                                            <span className="text-truncate">All Domains</span>
                                        </a>
                                    </li>
                                    {domains.map((d) => (
                                        <li key={d._id}>
                                            <Link
                                                className={`landing-domain-item d-flex align-items-center flex-nowrap gap-2 ${selectedDomainId === d._id ? "active" : ""}`}
                                                to="/domain"
                                                onClick={() => {
                                                    setSelectedDomainId(d._id);
                                                    setDashboardDomainId(d._id);
                                                    if (typeof window !== "undefined") sessionStorage.setItem(SELECTED_DOMAIN_KEY, d._id);
                                                }}
                                            >
                                                <i className="isax isax-global landing-domain-item-icon flex-shrink-0" aria-hidden />
                                                <span className="text-truncate">{getDomainLabel(d.dm_url)}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sidebar-else-wrapper">
                    <div className="sidebar" id="sidebar-two">
                        <div className="sidebar-logo">
                            <Link to="/" className="logo logo-normal d-flex align-items-center">
                                <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2c496e", letterSpacing: "-0.5px" }}>Sitemonitor</span>
                            </Link>
                            {/* <Link to="/" className="logo-small d-flex align-items-center justify-content-center">
                                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#343a40" }}>S</span>
                            </Link>
                            <Link to="/" className="dark-logo d-flex align-items-center">
                                <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" }}>Sitemonitor</span>
                            </Link>
                            <Link to="/" className="dark-small d-flex align-items-center justify-content-center">
                                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff" }}>S</span>
                            </Link> */}
                            <a href="#" id="toggle_btn">
                                <i className="isax isax-menu-1"></i>
                            </a>
                        </div>
                        <div className="sidebar-search">
                            <div className="input-icon-end position-relative">
                                <input className="form-control" placeholder="Search" type="text" />
                                <span className="input-icon-addon">
                                    <i className="isax isax-search-normal" />
                                </span>
                            </div>
                        </div>
                        <div className="sidebar-inner" data-simplebar="">
                            <div className="sidebar-menu" id="sidebar-menu">
                                {dashboardDomainId && (() => {
                                    const domain = domains.find(d => d._id === dashboardDomainId);
                                    if (!domain) return null;
                                    return (
                                        <Link 
                                            to="/domain" 
                                            className="sidebar-selected-domain d-flex align-items-center gap-2 py-2 px-3 border-bottom text-decoration-none hover-bg-light"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="isax isax-global flex-shrink-0 text-body" style={{ fontSize: "1.2rem" }} aria-hidden />
                                            <span className="text-truncate fw-medium text-body sidebar-selected-domain-label">{getDomainLabel(domain.dm_url)}</span>
                                        </Link>
                                    );
                                })()}
                                <ul>
                                    {/* <li className="menu-title"><span>Main</span></li> */}
                                    <li className="submenu">
                                        <a href="#" className={`subdrop ${isSectionActive(["/domain/quality-assurance"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
                                            <i className="isax isax-tick-circle5 sidebar-module-icon" aria-hidden />
                                            <span className="text-truncate">Quality Assurance</span>
                                            <span className="menu-arrow" />
                                        </a>
                                        <ul>
                                            <li><Link to="/domain/quality-assurance?view=summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2" aria-hidden />Summary</Link></li>
                                            <li><Link to="/domain/quality-assurance?view=qa-errors" className="d-flex align-items-center"><i className="isax isax-document-copy me-2" aria-hidden />Content with QA Errors</Link></li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-link-2 sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Links</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/quality-assurance?view=content-broken-links" className="d-flex align-items-center"><i className="isax isax-link-2 me-2" aria-hidden />Content with Broken Links</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=broken-links" className="d-flex align-items-center"><i className="isax isax-link-2 me-2" aria-hidden />Broken Links</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=broken-images" className="d-flex align-items-center"><i className="isax isax-image me-2" aria-hidden />Broken Images</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=broken-links-sitemap" className="d-flex align-items-center"><i className="isax isax-menu me-2" aria-hidden />Broken Links on Sitemap</Link></li>
                                                </ul>
                                            </li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-edit-2 sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Spellcheck</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2" aria-hidden />Summary</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-pages" className="d-flex align-items-center"><i className="isax isax-document-text me-2" aria-hidden />Pages with Misspellings</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-misspellings" className="d-flex align-items-center"><i className="isax isax-edit-2 me-2" aria-hidden />Misspellings</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-potential" className="d-flex align-items-center"><i className="isax isax-edit-2 me-2" aria-hidden />Potential Misspellings</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-dictionary" className="d-flex align-items-center"><i className="isax isax-book-1 me-2" aria-hidden />Dictionary</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=spellcheck-ignored" className="d-flex align-items-center"><i className="isax isax-eye-slash me-2" aria-hidden />Ignored Misspellings</Link></li>
                                                </ul>
                                            </li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-book-1 sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Readability</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/quality-assurance?view=readability-summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2" aria-hidden />Summary</Link></li>
                                                    <li><Link to="/domain/quality-assurance?view=readability-checker" className="d-flex align-items-center"><i className="isax isax-discovery me-2" aria-hidden />Readability Checker</Link></li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    {/* <li className="submenu">
    <a href="#" className={`subdrop ${isSectionActive(["/domain/prioritized-content"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
        <i className="isax isax-notification-bing5 sidebar-module-icon" aria-hidden />
        <span>Prioritized Content</span>
        <span className="menu-arrow" />
    </a>
    <ul>
        <li><Link to="/domain/prioritized-content?filter=all" className={`d-flex align-items-center ${isLinkActive("/domain/prioritized-content?filter=all") ? "active" : ""}`}><i className="isax isax-document-copy me-2" aria-hidden />All</Link></li>
        <li><Link to="/domain/prioritized-content?filter=pages" className={`d-flex align-items-center ${isLinkActive("/domain/prioritized-content?filter=pages") ? "active" : ""}`}><i className="isax isax-document-text me-2" aria-hidden />Pages</Link></li>
        <li><Link to="/domain/prioritized-content?filter=pdf" className={`d-flex align-items-center ${isLinkActive("/domain/prioritized-content?filter=pdf") ? "active" : ""}`}><i className="isax isax-document-text me-2" aria-hidden />PDF Documents</Link></li>
        <li><Link to="/domain/prioritized-content?filter=other" className={`d-flex align-items-center ${isLinkActive("/domain/prioritized-content?filter=other") ? "active" : ""}`}><i className="isax isax-document-text me-2" aria-hidden />Other Documents</Link></li>
    </ul>
</li> */}
                                    <li className="submenu">
                                        <a href="#" className={`subdrop ${isSectionActive(["/policies"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
                                            <i className="isax isax-shield-tick sidebar-module-icon" aria-hidden />
                                            <span className="text-truncate">Policies</span>
                                            <span className="menu-arrow" />
                                        </a>
                                        <ul>
                                            <li><Link to="/domain/policies?view=summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2"></i>Summary</Link></li>
                                            <li><Link to="/domain/policies?view=content-matches" className="d-flex align-items-center"><i className="isax isax-document-copy me-2"></i>Content with Policy Matches</Link></li>
                                            <li><Link to="/domain/policies?view=list" className="d-flex align-items-center"><i className="isax isax-category-2 me-2"></i>Policy List</Link></li>
                                            <li><Link to="/domain/policies?view=ignored" className="d-flex align-items-center"><i className="isax isax-eye-slash me-2"></i>Pages with Ignored Checks</Link></li>
                                        </ul>
                                    </li>
                                    <li className="submenu">
                                        <a href="#" className={`subdrop ${isSectionActive(["/domain/accessibility"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
                                            <i className="isax isax-tick-circle sidebar-module-icon" aria-hidden />
                                            <span className="text-truncate">Accessibility</span>
                                            <span className="menu-arrow" />
                                        </a>
                                        <ul>
                                            <li><Link to="/domain/accessibility?view=summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2"></i>Summary</Link></li>
                                            <li><Link to="/domain/accessibility?view=fast-track" className="d-flex align-items-center"><i className="isax isax-driving me-2"></i>Fast Track</Link></li>
                                            <li><Link to="/domain/accessibility?view=failing-checks" className="d-flex align-items-center"><i className="isax isax-document me-2"></i>Pages with Failing Checks</Link></li>
                                            <li><Link to="/domain/accessibility?view=checklist" className="d-flex align-items-center"><i className="isax isax-tick-circle me-2"></i>Checklist</Link></li>
                                            <li><Link to="/domain/accessibility?view=guidelines" className="d-flex align-items-center"><i className="isax isax-menu me-2"></i>Guidelines</Link></li>
                                            <li><Link to="/domain/accessibility?view=ignored-checks" className="d-flex align-items-center"><i className="isax isax-eye-slash me-2"></i>Pages with Ignored Checks</Link></li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-document-text me-2" aria-hidden />
                                                    <span>PDFs</span>
                                                    <span className="menu-arrow" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/accessibility?view=internal-pdfs" className="d-flex align-items-center"><i className="isax isax-arrow-right-3 me-2"></i>Internal PDFs</Link></li>
                                                    <li><Link to="/domain/accessibility?view=external-pdfs" className="d-flex align-items-center"><i className="isax isax-link-2 me-2"></i>External PDFs</Link></li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="submenu">
                                        <a href="#" className={`subdrop ${isSectionActive(["/domain/seo"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
                                            <i className="isax isax-chart-215 sidebar-module-icon" aria-hidden />
                                            <span>SEO</span>
                                            <span className="menu-arrow" />
                                        </a>
                                        <ul>
                                            <li><Link to="/domain/seo?view=summary" className="d-flex align-items-center"><i className="isax isax-home-2 me-2"></i>Summary</Link></li>
                                            <li><Link to="/domain/seo?view=opportunities" className="d-flex align-items-center"><i className="isax isax-document-copy me-2"></i>Pages with Opportunities</Link></li>
                                            <li><Link to="/domain/seo?view=checkpoints" className="d-flex align-items-center"><i className="isax isax-tick-circle me-2"></i>SEO Checkpoints</Link></li>
                                        </ul>
                                    </li>
                                    <li>
                                        <Link to="/domain/heartbeat" className={isLinkActive("/domain/heartbeat") ? "active" : ""}>
                                            <i className="isax isax-heart5" aria-hidden /><span className="text-truncate">Heartbeat</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/domain/performance" className={isLinkActive("/domain/performance") ? "active" : ""}>
                                            <i className="isax isax-shield-tick5 sidebar-module-icon" aria-hidden /><span className="text-truncate">Performance</span>
                                        </Link>
                                    </li>
                                    <li className="submenu">
                                        <a href="#" className={`subdrop ${isSectionActive(["/domain/inventory"]) ? "active" : ""}`} onClick={handleSubmenuClick}>
                                            <i className="isax isax-book5 sidebar-module-icon" aria-hidden /><span className="text-truncate">Inventory</span>
                                            <span className="menu-arrow" />
                                        </a>
                                        <ul>
                                            <li><Link to="/domain/inventory?view=summary" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=summary") ? "active" : ""}`}><i className="isax isax-home-2 me-2" aria-hidden />Summary</Link></li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-document-copy sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Content</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/inventory?view=html-pages" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=html-pages") ? "active" : ""}`}><i className="isax isax-document-copy me-2" aria-hidden />HTML Pages</Link></li>
                                                    <li><Link to="/domain/inventory?view=documents" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=documents") ? "active" : ""}`}><i className="isax isax-document-text me-2" aria-hidden />Documents</Link></li>
                                                    <li><Link to="/domain/inventory?view=images" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=images") ? "active" : ""}`}><i className="isax isax-image me-2" aria-hidden />Images</Link></li>
                                                    <li><Link to="/domain/inventory?view=links" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=links") ? "active" : ""}`}><i className="isax isax-link-2 me-2" aria-hidden />Links</Link></li>
                                                </ul>
                                            </li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-setting-2 sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Technical</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/inventory?view=forms" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=forms") ? "active" : ""}`}><i className="isax isax-element-3 me-2" aria-hidden />Forms</Link></li>
                                                    <li><Link to="/domain/inventory?view=headlinks" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=headlinks") ? "active" : ""}`}><i className="isax isax-link-2 me-2" aria-hidden />Headlinks</Link></li>
                                                    <li><Link to="/domain/inventory?view=iframes" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=iframes") ? "active" : ""}`}><i className="isax isax-code-circle me-2" aria-hidden />IFrames</Link></li>
                                                    <li><Link to="/domain/inventory?view=frames" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=frames") ? "active" : ""}`}><i className="isax isax-code-circle me-2" aria-hidden />Frames</Link></li>
                                                    <li><Link to="/domain/inventory?view=css" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=css") ? "active" : ""}`}><i className="isax isax-code me-2" aria-hidden />CSS</Link></li>
                                                    <li><Link to="/domain/inventory?view=js" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=js") ? "active" : ""}`}><i className="isax isax-code-1 me-2" aria-hidden />JavaScript</Link></li>
                                                </ul>
                                            </li>
                                            <li className="submenu">
                                                <a href="#" className="subdrop d-flex align-items-center flex-nowrap gap-2" onClick={handleSubmenuClick}>
                                                    <i className="isax isax-people5 sidebar-module-icon flex-shrink-0" aria-hidden />
                                                    <span className="text-truncate">Personal</span>
                                                    <span className="menu-arrow flex-shrink-0 ms-auto" />
                                                </a>
                                                <ul>
                                                    <li><Link to="/domain/inventory?view=email-addresses" className={`d-flex align-items-center ${isLinkActive("/domain/inventory?view=email-addresses") ? "active" : ""}`}><i className="isax isax-sms me-2" aria-hidden />Email addresses</Link></li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <Link to="/domain/audit" className={isLinkActive("/domain/audit") ? "active" : ""}>
                                            <i className="isax isax-search-status" aria-hidden /><span className="text-truncate">Run WebsiteAudit</span>
                                        </Link>
                                    </li>

                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}