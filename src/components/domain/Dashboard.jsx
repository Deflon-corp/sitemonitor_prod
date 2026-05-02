import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import ScanHistoryPopover from "@/components/dashboard/ScanHistoryPopover";
import CountdownTimer from "@/components/dashboard/CountdownTimer";
import { getDomainsApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const Dashboard = () => {
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [domainData, setDomainData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good Morning";
        if (hour >= 12 && hour < 17) return "Good Afternoon";
        if (hour >= 17 && hour < 21) return "Good Evening";
        return "Good Night";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    useEffect(() => {
        const fetchDomainDetails = async () => {
            let selectedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

            try {
                setIsLoading(true);
                const response = await getDomainsApi(1, 100);
                
                if (response && response.success && response.data?.domains) {
                    const domains = response.data.domains;
                    
                    // If no ID is selected, fallback to the first domain (same as Sidebar)
                    if (!selectedId && domains.length > 0) {
                        selectedId = domains[0]._id;
                    }

                    if (selectedId) {
                        const domain = domains.find((d) => d._id === selectedId);
                        setDomainData(domain);
                    }
                }
            } catch (error) {
                console.error("Error fetching domain details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDomainDetails();
    }, []);

    return (
        <div className="content">
            {/* Breadcrumb */}
            <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div>
                    <h6>Dashboard</h6>
                </div>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                    {/* Report Range Picker */}
                    <div className="reportrange-picker d-flex align-items-center" id="reportrange">
                        <i className="isax isax-calendar text-gray-5 fs-14 me-1"></i>
                        <span className="reportrange-picker-field">16 Apr 25 - 16 Apr 25</span>
                    </div>

                    {/* Create New Dropdown */}
                    <div className="dropdown">
                        <a
                            className="btn btn-primary d-flex align-items-center justify-content-center dropdown-toggle"
                            data-bs-toggle="dropdown"
                            href="#"
                            role="button"
                        >
                            Create New
                        </a>
                        <ul className="dropdown-menu dropdown-menu-start">
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-invoice">
                                    <i className="isax isax-document-text-1 me-2"></i> Invoice
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/expenses">
                                    <i className="isax isax-money-send me-2"></i> Expense
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-credit-notes">
                                    <i className="isax isax-money-add me-2"></i> Credit Notes
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-debit-notes">
                                    <i className="isax isax-money-recive me-2"></i> Debit Notes
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-purchases-orders">
                                    <i className="isax isax-document me-2"></i> Purchase Order
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-quotation">
                                    <i className="isax isax-document-download me-2"></i> Quotation
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item d-flex align-items-center" to="/add-delivery-challan">
                                    <i className="isax isax-document-forward me-2"></i> Delivery Challan
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Export Dropdown */}
                    <div className="dropdown">
                        <a
                            className="btn btn-outline-white d-inline-flex align-items-center"
                            data-bs-toggle="dropdown"
                            href="#"
                        >
                            <i className="isax isax-export-1 me-1"></i> Export
                        </a>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="#">Download as PDF</a></li>
                            <li><a className="dropdown-item" href="#">Download as Excel</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="bg-primary rounded welcome-wrap position-relative mb-3">
                <div className="row">
                    <div className="col-lg-8 col-md-9 col-sm-10">
                        <div>
                            <h5 className="text-white mb-1">
                                {getGreeting()}, {user?.name || "User"}
                            </h5>
                            
                            {isLoading ? (
                                <div className="text-white-50 mt-2">Loading domain details...</div>
                            ) : domainData ? (
                                <>
                                    <div className="text-white mt-2">
                                        <div className="d-flex align-items-center gap-2 mb-2 fs-15">
                                            <i className="isax isax-global"></i>
                                            <span className="fw-bold">{domainData.dm_title}</span>
                                            <span className="text-white-50">({domainData.dm_url})</span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap gap-4 mt-2">
                                        <div className="d-flex align-items-center fs-13 text-white">
                                            <i className="isax isax-radar me-1"></i>
                                            <span className="me-2">Last Scan: {domainData.dm_last_scan_at ? `${formatDate(domainData.dm_last_scan_at)} ${formatTime(domainData.dm_last_scan_at)}` : "Never"}</span>
                                            <span className="mx-2 text-white-50">|</span>
                                            <span className="me-2">Next Scan:</span>
                                            <CountdownTimer targetDate={domainData.dm_next_scan_at} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-white-50 mt-2">No domain selected. Please select a domain from the sidebar.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="position-absolute end-0 top-50 translate-middle-y p-2 d-none d-sm-block">
                    <img alt="img" src="/assets/images/dashboard.svg" />
                </div>
            </div>



            <div className="row g-4 mb-4">
                <div className="col-md-6 d-flex">
                    <div className="card flex-fill border-0 shadow-sm">
                        <div className="card-body pb-0">
                            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
                                <div>
                                    <h6 className="mb-1">Scan History</h6>
                                    <ScanHistoryPopover />
                                </div>
                                <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                                    <i className="isax isax-refresh-2"></i> Start new scan
                                </button>
                            </div>
                            <div id="scan_history_chart" style={{ minHeight: "200px" }}></div>
                            <div className="d-flex justify-content-end mt-2 pb-2">
                                <Link to="#" className="text-primary fs-13 fw-medium">Show history</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 d-flex">
                    <div className="card flex-fill dashboard-metric-card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                    <i className="isax isax-heart5 dashboard-metric-icon fs-18 text-primary"></i> Heartbeat
                                </h6>
                                <Link to="#" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray="385 389" transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">98.76 %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Uptime last 30 days</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <p className="fs-13 text-muted mb-1">
                                        <span className="text-body fw-medium">Checkpoint:</span> <Link to="#" className="text-primary text-decoration-none">https://example.com</Link>
                                    </p>
                                    <p className="fs-13 text-muted mb-0 d-flex align-items-center gap-2">
                                        <span className="text-body fw-medium">Current status:</span>
                                        <span className="d-inline-flex align-items-center gap-1 text-success">
                                            <i className="isax isax-tick-circle fs-16"></i>
                                            <span>Active</span>
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="#" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Row 1: Content Policies & Quality Assurance */}
            <div className="row g-4 mb-4">
                <div className="col-md-6 d-flex">
                    <div className="card flex-fill dashboard-metric-card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                    <i className="isax isax-tick-circle5 dashboard-metric-icon fs-18 text-primary"></i> Content Policies
                                </h6>
                                <Link to="#" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg className="content-policies-ring" width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray="384 389" transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">98.6 %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">Policies with violations</h6>
                                    <p className="fs-2 fw-bold text-body mb-2">1</p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13">
                                            <i className="isax isax-close-circle fs-18"></i>
                                            <span>0</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13">
                                            <i className="isax isax-danger fs-18"></i>
                                            <span>0</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13">
                                            <i className="isax isax-search-normal-1 fs-18"></i>
                                            <span>1</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="#" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 d-flex">
                    <div className="card flex-fill dashboard-metric-card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                    <i className="isax isax-document-text5 dashboard-metric-icon fs-18 text-primary"></i> Quality Assurance
                                </h6>
                                <Link to="#" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray="1 389" transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">0 %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">QA Issues</h6>
                                    <p className="fs-2 fw-bold text-body mb-1">45</p>
                                    <p className="fs-13 text-muted mb-2">Affects <strong className="text-body">500</strong> pages and <strong className="text-body">0</strong> documents</p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <div className="d-flex align-items-center gap-2 text-danger fs-13">
                                            <i className="isax isax-danger fs-18"></i>
                                            <span>37</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13">
                                            <i className="isax isax-document-text fs-18"></i>
                                            <span>8</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-danger fs-13">
                                            <i className="isax isax-text fs-18"></i>
                                            <span>0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="#" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Row 2: Accessibility & SEO */}
            <div className="row g-4 mb-4">
                <div className="col-md-6 d-flex">
                    <div className="card flex-fill dashboard-metric-card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                    <i className="isax isax-people5 dashboard-metric-icon fs-18 text-primary"></i> Accessibility
                                </h6>
                                <Link to="#" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" strokeDasharray="240 389" transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">61.75 %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">Failing accessibility checks</h6>
                                    <p className="fs-2 fw-bold text-body mb-0">51</p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="#" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 d-flex">
                    <div className="card flex-fill dashboard-metric-card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                    <i className="isax isax-chart-215 dashboard-metric-icon fs-18 text-primary"></i> Search Engine Optimization (SEO)
                                </h6>
                                <Link to="#" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray="306 389" transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">78.63 %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1 d-flex align-items-center gap-1">
                                        SEO opportunities
                                        <i className="isax isax-info-circle text-muted fs-14" title="More information"></i>
                                    </h6>
                                    <p className="fs-2 fw-bold text-body mb-0">2</p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="#" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Charts Component */}
            <DashboardCharts />

        </div>
    );
}

export default Dashboard;