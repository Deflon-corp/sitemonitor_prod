import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import ScanHistoryPopover from "@/components/dashboard/ScanHistoryPopover";
import CountdownTimer from "@/components/dashboard/CountdownTimer";
import { getDomainsApi, getDomainScanHistoryApi, getDomainLatestSummaryApi, triggerDomainScanApi } from "@/api/domainApi";
import { getPolicyStatsApi } from "@/api/policyApi";
import toast from "react-hot-toast";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const Dashboard = () => {
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [domainData, setDomainData] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [latestSummary, setLatestSummary] = useState(null);
    const [policyStats, setPolicyStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

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

    const calculateDashArray = (percentage) => {
        const radius = 62;
        const circumference = 389; // Approx 2 * PI * 62
        const value = (Math.min(100, Math.max(0, percentage || 0)) / 100) * circumference;
        return `${value} ${circumference}`;
    };

    const getUptimeStatus = () => {
        if (!latestSummary) return {
            text: domainData?.dm_status === 'active' ? 'OK' : 'Down',
            className: domainData?.dm_status === 'active' ? 'text-success' : 'text-danger',
            icon: domainData?.dm_status === 'active' ? 'isax-tick-circle' : 'isax-close-circle'
        };

        const isUp = latestSummary.rootHttpStatus >= 200 && latestSummary.rootHttpStatus < 400;
        return {
            text: isUp ? 'OK' : 'Down',
            className: isUp ? 'text-success' : 'text-danger',
            icon: isUp ? 'isax-tick-circle' : 'isax-close-circle'
        };
    };

    const uptimeStatus = getUptimeStatus();

    const getLastDowntime = () => {
        if (!scanHistory || scanHistory.length === 0) return "Never";
        const failures = scanHistory.filter(h => h.rootHttpStatus < 200 || h.rootHttpStatus >= 400);
        if (failures.length === 0) return "None";
        
        // Get the most recent failure
        const lastFailure = failures[0];
        const date = new Date(lastFailure.lastScanDate);
        return date.toLocaleDateString("en-GB", {
            weekday: 'long',
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const lastDowntime = getLastDowntime();

    const calculateUptime = () => {
        if (!scanHistory || scanHistory.length === 0) return 100;
        const successfulScans = scanHistory.filter(h => h.rootHttpStatus >= 200 && h.rootHttpStatus < 400).length;
        return Math.round((successfulScans / scanHistory.length) * 100);
    };

    const uptimePercentage = calculateUptime();

    const fetchScanData = async (dmId, objectId) => {
        try {
            const [historyRes, summaryRes, policyRes] = await Promise.all([
                getDomainScanHistoryApi(dmId),
                getDomainLatestSummaryApi(dmId),
                getPolicyStatsApi({ domainId: objectId || dmId })
            ]);

            if (historyRes.success) setScanHistory(historyRes.data || []);
            if (summaryRes.success) setLatestSummary(summaryRes.data);
            if (policyRes.success) setPolicyStats(policyRes.data);
        } catch (error) {
            console.error("Error fetching scan data:", error);
        }
    };

    const fetchDomainDetails = async (isRefresh = false) => {
        let selectedId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

        try {
            if (!isRefresh) setIsLoading(true);
            const response = await getDomainsApi(1, 100);
            
            if (response && response.success && response.data?.domains) {
                const domains = response.data.domains;
                
                if (!selectedId && domains.length > 0) {
                    selectedId = domains[0]._id;
                }

                if (selectedId) {
                    const domain = domains.find((d) => d._id === selectedId);
                    setDomainData(domain);
                    if (domain) {
                        fetchScanData(domain.dm_id, domain._id);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching domain details:", error);
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomainDetails();
    }, []);

    // Polling for scan completion
    useEffect(() => {
        let interval;
        if (domainData?.dm_seo_status === 'pending' || domainData?.dm_seo_status === 'scanning') {
            interval = setInterval(() => {
                fetchDomainDetails(true);
            }, 10000); // Poll every 10 seconds
        }
        return () => clearInterval(interval);
    }, [domainData?.dm_seo_status]);

    const handleStartScan = async () => {
        if (!domainData) return;
        try {
            setIsScanning(true);
            const response = await triggerDomainScanApi(domainData.dm_id);
            if (response.success) {
                toast.success("Scan triggered successfully!");
                setDomainData({ ...domainData, dm_seo_status: 'pending' });
            }
        } catch (error) {
            console.error("Error triggering scan:", error);
            toast.error("Failed to trigger scan");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="content">
            {/* Breadcrumb */}
            <div className="d-flex d-block align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div>
                    <h6>Dashboard</h6>
                </div>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
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

            {domainData?.dm_seo_status === 'failed' && (
                <div className="alert alert-danger d-flex align-items-center gap-3 mb-4 border-0 shadow-sm" role="alert">
                    <i className="isax isax-danger fs-22"></i>
                    <div>
                        <h6 className="alert-heading mb-1">Last Scan Failed</h6>
                        <p className="mb-0 fs-13">The domain <strong>{domainData.dm_url}</strong> could not be reached during the last scan. Please check if the domain is live and accessible.</p>
                    </div>
                </div>
            )}



            <div className="row g-4 mb-4">
                <div className="col-md-6 d-flex">
                    <div className="card flex-fill border-0 shadow-sm">
                        <div className="card-body pb-0">
                            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
                                <div>
                                    <h6 className="mb-1">Scan History</h6>
                                    <ScanHistoryPopover latestSummary={latestSummary} />
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                                    onClick={handleStartScan}
                                    disabled={isScanning || domainData?.dm_seo_status === 'scanning' || domainData?.dm_seo_status === 'pending'}
                                >
                                    <i className={`isax isax-refresh-2 ${isScanning ? 'fa-spin' : ''}`}></i> 
                                    {domainData?.dm_seo_status === 'scanning' || domainData?.dm_seo_status === 'pending' ? 'Scanning...' : 'Start new scan'}
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
                                <Link to="/domain/heartbeat" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray={calculateDashArray(uptimePercentage)} transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">{uptimePercentage} %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Uptime last 30 days</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <p className="fs-13 text-muted mb-1">
                                        <span className="text-body fw-medium">Checkpoint:</span> <a href={domainData?.dm_url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">{domainData?.dm_url}</a>
                                    </p>
                                    <p className="fs-13 text-muted mb-1 d-flex align-items-center gap-2">
                                        <span className="text-body fw-medium">Current status:</span>
                                        <span className={`d-inline-flex align-items-center gap-1 ${uptimeStatus.className}`}>
                                            <i className={`isax ${uptimeStatus.icon} fs-16`}></i>
                                            <span className="text-capitalize fw-bold">{uptimeStatus.text}</span>
                                        </span>
                                    </p>
                                    <p className="fs-13 text-muted mb-0">
                                        <span className="text-body fw-medium">Last downtime:</span> {lastDowntime}
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="/domain/heartbeat" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
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
                                <Link to="/domain/policies" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg className="content-policies-ring" width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray={calculateDashArray(policyStats?.compliancePercent || 0)} transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">{Math.round(policyStats?.compliancePercent || 0)} %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">Policies with violations</h6>
                                    <p className="fs-2 fw-bold text-body mb-2">{policyStats?.policiesWithViolations || 0}</p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13" title="Unwanted">
                                            <i className="isax isax-close-circle fs-18 text-danger"></i>
                                            <span>{policyStats?.distribution?.find(d => d.label === 'Unwanted')?.value || 0}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13" title="Required">
                                            <i className="isax isax-danger fs-18 text-primary"></i>
                                            <span>{policyStats?.distribution?.find(d => d.label === 'Required')?.value || 0}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13" title="Matches">
                                            <i className="isax isax-search-normal-1 fs-18 text-primary"></i>
                                            <span>{policyStats?.distribution?.find(d => d.label === 'Matches')?.value || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="/domain/policies" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
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
                                <Link to="/domain/quality-assurance" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray={calculateDashArray(latestSummary?.performanceMetrics?.avgPerformanceScore)} transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">{latestSummary?.performanceMetrics?.avgPerformanceScore || 0} %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">QA Issues</h6>
                                    <p className="fs-2 fw-bold text-body mb-1">{ (latestSummary?.issueBreakdown?.high || 0) + (latestSummary?.issueBreakdown?.medium || 0) + (latestSummary?.issueBreakdown?.low || 0) }</p>
                                    <p className="fs-13 text-muted mb-2">Affects <strong className="text-body">{latestSummary?.totalPages || 0}</strong> pages</p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <div className="d-flex align-items-center gap-2 text-danger fs-13">
                                            <i className="isax isax-danger fs-18"></i>
                                            <span>{latestSummary?.issueBreakdown?.high || 0}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted fs-13">
                                            <i className="isax isax-document-text fs-18"></i>
                                            <span>{latestSummary?.issueBreakdown?.medium || 0}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-danger fs-13">
                                            <i className="isax isax-text fs-18"></i>
                                            <span>{latestSummary?.issueBreakdown?.low || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="/domain/quality-assurance" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
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
                                <Link to="/domain/accessibility" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" strokeDasharray={calculateDashArray(latestSummary?.performanceMetrics?.avgAccessibilityScore)} transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">{latestSummary?.performanceMetrics?.avgAccessibilityScore || 0} %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1">Failing accessibility checks</h6>
                                    <p className="fs-2 fw-bold text-body mb-0">0</p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="/domain/accessibility" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
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
                                <Link to="/domain/seo" className="text-primary">
                                    <i className="isax isax-arrow-right-1"></i>
                                </Link>
                            </div>
                            <div className="row align-items-center g-3">
                                <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-start order-2 order-md-1">
                                    <div className="position-relative d-inline-flex align-items-center justify-content-center">
                                        <svg width="120" height="120" viewBox="0 0 140 140">
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                            <circle cx="70" cy="70" r="62" fill="none" stroke="#14b8a6" strokeWidth="12" strokeLinecap="round" strokeDasharray={calculateDashArray(latestSummary?.finalSeoScore)} transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="position-absolute text-center px-1" style={{ maxWidth: 70, lineHeight: 1.2 }}>
                                            <span className="d-block fs-4 fw-bold text-body">{latestSummary?.finalSeoScore || 0} %</span>
                                            <span className="d-block text-muted" style={{ fontSize: "0.65rem" }}>Overall compliance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-7 order-1 order-md-2 min-w-0">
                                    <h6 className="fs-13 fw-semibold text-body mb-1 d-flex align-items-center gap-1">
                                        SEO opportunities
                                        <i className="isax isax-info-circle text-muted fs-14" title="More information"></i>
                                    </h6>
                                    <p className="fs-2 fw-bold text-body mb-0">{latestSummary?.topIssues?.length || 0}</p>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-3 pt-2 border-top">
                                <Link to="/domain/seo" className="show-history-link d-inline-flex align-items-center fs-13 text-primary text-decoration-none">
                                    Show history <i className="isax isax-arrow-right-1 ms-1"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Charts Component */}
            <DashboardCharts historyData={scanHistory} />

        </div>
    );
}

export default Dashboard;