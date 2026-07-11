import React, { useState, useEffect, useRef } from "react";
import { getAuditSearchPerformanceApi, getDomainByIdApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import axiosInstance from "@/api/axiosInstance";

const SearchPerformanceView = ({ domainId, scanning }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gscData, setGscData] = useState(null);
  const [dateFilter, setDateFilter] = useState("last_28_days");
  const [errorType, setErrorType] = useState(null); // "NO_CONNECTION" or "UNVERIFIED_SITE"
  const [googleEmail, setGoogleEmail] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/auth/google/url");
      if (res.data?.success && res.data?.data?.url) {
        window.open(res.data.data.url, "_blank");
        setLoading(false);
      } else {
        setError("Failed to get Google authorization URL.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error getting google auth url:", err);
      setError("Failed to connect to Google account.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPerformance = async () => {
      const activeDomainId = domainId || sessionStorage.getItem(SELECTED_DOMAIN_KEY);
      if (!activeDomainId) {
        setIsConnected(false);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setErrorType(null);
        
        // Fetch domain details for warnings
        try {
          const domRes = await getDomainByIdApi(activeDomainId);
          if (domRes?.success && domRes?.data) {
            setDomainUrl(domRes.data.dm_url);
          }
        } catch (domErr) {
          console.error("Failed to fetch domain details:", domErr);
        }

        const res = await getAuditSearchPerformanceApi(activeDomainId);
        if (res?.success && res?.data) {
          setGscData(res.data);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setErrorType(res?.errorType || "NO_CONNECTION");
          if (res?.googleEmail) setGoogleEmail(res.googleEmail);
        }
      } catch (err) {
        console.error("Error fetching Search Performance:", err);
        if (err.response && err.response.status === 404) {
          setIsConnected(false);
          const errorData = err.response.data;
          setErrorType(errorData?.errorType || "NO_CONNECTION");
          if (errorData?.googleEmail) setGoogleEmail(errorData.googleEmail);
        } else {
          setError("Failed to load search performance data.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!scanning) {
      fetchPerformance();
    }
  }, [domainId, scanning]);

  // --- CHART INITIALIZATION ---
  useEffect(() => {
    if (!isConnected || loading || !gscData || error || !chartRef.current) return;
    
    let mounted = true;
    const initChart = () => {
      const ApexCharts = typeof window !== "undefined" ? window.ApexCharts : undefined;
      if (!ApexCharts || !mounted) return;

      const options = {
        series: [
          {
            name: "Clicks",
            data: gscData.chartData.clicks,
          },
          {
            name: "Impressions",
            data: gscData.chartData.impressions,
          }
        ],
        chart: {
          height: 350,
          type: "area",
          fontFamily: "inherit",
          toolbar: { show: false },
          zoom: { enabled: false }
        },
        colors: ["#4f46e5", "#0ea5e9"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.05,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: gscData.chartData.dates,
          labels: {
            style: { colors: "#6c757d", fontSize: "12px" }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: [
          {
            title: { text: "Clicks", style: { color: "#4f46e5", fontWeight: 500 } },
            labels: { style: { colors: "#6c757d" } }
          },
          {
            opposite: true,
            title: { text: "Impressions", style: { color: "#0ea5e9", fontWeight: 500 } },
            labels: { style: { colors: "#6c757d" } }
          }
        ],
        grid: {
          borderColor: "rgba(0,0,0,0.05)",
          strokeDashArray: 4,
          yaxis: { lines: { show: true } }
        },
        legend: {
          position: "top",
          horizontalAlign: "right"
        },
        tooltip: { theme: "light" }
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();
    };

    if (window.ApexCharts) {
      initChart();
    } else {
      const interval = setInterval(() => {
        if (window.ApexCharts) {
          initChart();
          clearInterval(interval);
        }
      }, 500);
      setTimeout(() => clearInterval(interval), 5000);
    }

    return () => {
      mounted = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [isConnected, loading, gscData, error]);

  if (loading) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center my-4 glassmorphic-card">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted fw-medium mb-0">Loading Search Performance...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-0 shadow-sm p-5 text-center my-4 glassmorphic-card">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <i className="isax isax-warning-2 text-danger mb-3" style={{ fontSize: "48px" }}></i>
          <h5 className="text-danger fw-medium mb-0">{error}</h5>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE ---
  if (!isConnected) {
    if (errorType === "UNVERIFIED_SITE") {
      return (
        <div className="card border-0 shadow-sm text-center py-5 glassmorphic-card">
          <div className="card-body py-5 d-flex flex-column align-items-center justify-content-center">
            <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: "80px", height: "80px" }}>
              <i className="isax isax-warning-2 text-warning" style={{ fontSize: "40px" }}></i>
            </div>
            <h4 className="fw-semibold text-body mb-2">Google Search Console Verification Required</h4>
            <p className="text-muted mb-3" style={{ maxWidth: "550px" }}>
              Your Google account (<strong>{googleEmail}</strong>) was connected successfully, but Google Search Console reported that you do not have permission to access <strong>{domainUrl || "this website"}</strong>.
            </p>
            <p className="text-muted mb-4 fs-13" style={{ maxWidth: "500px" }}>
              Please ensure this website is added and verified in your Google Search Console account before running a new scan.
            </p>
            <div className="d-flex align-items-center justify-content-center gap-3">
              <a 
                href="https://search.google.com/search-console" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-warning text-dark d-inline-flex align-items-center gap-2 px-4 py-2 fw-medium"
              >
                <i className="isax isax-global"></i>
                Verify on Search Console
              </a>
              <button 
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-4 py-2"
                onClick={handleConnect}
              >
                <i className="isax isax-link-2"></i>
                Connect Different Account
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card border-0 shadow-sm py-5 glassmorphic-card">
        <div className="card-body py-4 d-flex flex-column align-items-center justify-content-center">
          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: "70px", height: "70px" }}>
            <i className="isax isax-search-status text-primary" style={{ fontSize: "36px" }}></i>
          </div>
          
          <h4 className="fw-bold text-body mb-2">3 Easy Steps to View Search Console Data</h4>
          <p className="text-muted mb-4 text-center" style={{ maxWidth: "500px" }}>
            Follow these steps to unlock real-time clicks, search keywords, rankings, and indexing performance for <strong>{domainUrl || "your domain"}</strong>.
          </p>

          <div className="text-start mb-4 px-3" style={{ maxWidth: "550px", width: "100%" }}>
            <div className="d-flex align-items-start mb-3 gap-3">
              <div className="badge bg-primary text-white fs-14 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "24px", height: "24px", minWidth: "24px" }}>1</div>
              <div>
                <h6 className="fw-semibold text-body mb-1">Connect Your Google Account</h6>
                <p className="text-muted fs-13 mb-0">Click the button below to log in and securely grant Google Search Console read-only access to our application.</p>
              </div>
            </div>

            <div className="d-flex align-items-start mb-3 gap-3">
              <div className="badge bg-primary text-white fs-14 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "24px", height: "24px", minWidth: "24px" }}>2</div>
              <div>
                <h6 className="fw-semibold text-body mb-1">Ensure Domain Verification</h6>
                <p className="text-muted fs-13 mb-0">Make sure <strong>{domainUrl || "your domain"}</strong> is verified under the Google account you are connecting. <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">Check Webmaster Console</a></p>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div className="badge bg-primary text-white fs-14 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "24px", height: "24px", minWidth: "24px" }}>3</div>
              <div>
                <h6 className="fw-semibold text-body mb-1">Run a Website Scan</h6>
                <p className="text-muted fs-13 mb-0">Go to your site dashboard and click the <strong>Scan</strong> button to fetch real keywords, rankings, and impressions.</p>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 mt-2 fw-medium shadow-sm"
            onClick={handleConnect}
          >
            <i className="isax isax-link-2"></i>
            Connect Google Search Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-performance-view">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i className="isax isax-search-status text-primary fs-22" aria-hidden="true" />
            Search Performance
          </h5>
          <p className="text-muted fs-13 mb-0">
            See how your website performs on Google Search.
          </p>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <select 
            className="form-select form-select-sm border-0 shadow-sm px-3 py-2 fw-medium"
            style={{ backgroundColor: "#f8f9fa", minWidth: "150px" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_28_days">Last 28 Days</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="custom">Custom Date</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted fw-medium fs-14 mb-0">Total Clicks</p>
                <div className="bg-primary bg-opacity-10 p-2 rounded-2 text-primary">
                  <i className="isax isax-mouse-circle fs-20"></i>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-2">{gscData.summaryMetrics.clicks.value}</h4>
              <div className="d-flex align-items-center fs-13 mt-1">
                <span className={`badge ${gscData.summaryMetrics.clicks.isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill px-2 py-1`}>
                  <i className={`isax ${gscData.summaryMetrics.clicks.isPositive ? 'isax-arrow-up-3' : 'isax-arrow-down'} me-1`}></i>
                  {gscData.summaryMetrics.clicks.trend}
                </span>
                <span className="text-muted ms-1">vs previous period</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted fw-medium fs-14 mb-0">Total Impressions</p>
                <div className="bg-info bg-opacity-10 p-2 rounded-2 text-info">
                  <i className="isax isax-eye fs-20"></i>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-2">{gscData.summaryMetrics.impressions.value}</h4>
              <div className="d-flex align-items-center fs-13 mt-1">
                <span className={`badge ${gscData.summaryMetrics.impressions.isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill px-2 py-1`}>
                  <i className={`isax ${gscData.summaryMetrics.impressions.isPositive ? 'isax-arrow-up-3' : 'isax-arrow-down'} me-1`}></i>
                  {gscData.summaryMetrics.impressions.trend}
                </span>
                <span className="text-muted ms-1">vs previous period</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted fw-medium fs-14 mb-0">Average CTR</p>
                <div className="bg-warning bg-opacity-10 p-2 rounded-2 text-warning">
                  <i className="isax isax-percentage-square fs-20"></i>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-2">{gscData.summaryMetrics.ctr.value}</h4>
              <div className="d-flex align-items-center fs-13 mt-1">
                <span className={`badge ${gscData.summaryMetrics.ctr.isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill px-2 py-1`}>
                  <i className={`isax ${gscData.summaryMetrics.ctr.isPositive ? 'isax-arrow-up-3' : 'isax-arrow-down'} me-1`}></i>
                  {gscData.summaryMetrics.ctr.trend}
                </span>
                <span className="text-muted ms-1">vs previous period</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-muted fw-medium fs-14 mb-0">Average Position</p>
                <div className="bg-success bg-opacity-10 p-2 rounded-2 text-success">
                  <i className="isax isax-ranking fs-20"></i>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-2">{gscData.summaryMetrics.position.value}</h4>
              <div className="d-flex align-items-center fs-13 mt-1">
                <span className={`badge ${gscData.summaryMetrics.position.isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill px-2 py-1`}>
                  <i className={`isax ${gscData.summaryMetrics.position.isPositive ? 'isax-arrow-up-3' : 'isax-arrow-down'} me-1`}></i>
                  {gscData.summaryMetrics.position.trend}
                </span>
                <span className="text-muted ms-1">vs previous period</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Chart */}
      <div className="card border-0 shadow-sm glassmorphic-card mb-4">
        <div className="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
          <div>
            <h6 className="fw-semibold text-body mb-1">Search Performance Overview</h6>
            <p className="text-muted fs-13 mb-0 fw-normal">A visual timeline of how often your site appeared in search and was clicked.</p>
          </div>
        </div>
        <div className="card-body px-4 pb-4 pt-0">
          <div ref={chartRef} style={{ minHeight: "350px" }}></div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Top Keywords */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-semibold text-body mb-1">Top Search Keywords</h6>
                <p className="text-muted fs-13 mb-0 fw-normal">The most popular terms people searched for to find your website.</p>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Search Keyword</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">Clicks</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">Impressions</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">CTR</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4 text-end">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscData.topKeywords.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-body fw-medium fs-14">{item.keyword}</td>
                        <td className="px-3 py-3 text-body text-end">{item.clicks}</td>
                        <td className="px-3 py-3 text-muted text-end">{item.impressions}</td>
                        <td className="px-3 py-3 text-muted text-end">{item.ctr}</td>
                        <td className="px-4 py-3 text-muted text-end">{item.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-semibold text-body mb-1">Top Pages</h6>
                <p className="text-muted fs-13 mb-0 fw-normal">The pages on your website that received the most traffic from search.</p>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4">Page URL</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">Clicks</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">Impressions</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-3 text-end">CTR</th>
                      <th className="border-0 fs-13 fw-semibold text-muted py-3 px-4 text-end">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscData.topPages.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary fw-medium fs-13 text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                            {item.url.replace('https://', '')}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-body text-end">{item.clicks}</td>
                        <td className="px-3 py-3 text-muted text-end">{item.impressions}</td>
                        <td className="px-3 py-3 text-muted text-end">{item.ctr}</td>
                        <td className="px-4 py-3 text-muted text-end">{item.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Device Performance */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
              <div>
                <h6 className="fw-semibold text-body mb-1">Device Performance</h6>
                <p className="text-muted fs-13 mb-0 fw-normal">See which devices your visitors are using when they find you.</p>
              </div>
            </div>
            <div className="card-body px-4 pb-4">
              {gscData.devicePerformance.map((item, idx) => (
                <div key={idx} className="mb-3 last-mb-none">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fs-14 fw-medium text-body d-flex align-items-center gap-2">
                      <i className={`isax ${item.icon} text-muted`}></i>
                      {item.device}
                    </span>
                    <span className="fs-13 fw-semibold">{item.percentage}%</span>
                  </div>
                  <div className="progress rounded-pill bg-light" style={{ height: "6px" }}>
                    <div 
                      className="progress-bar rounded-pill bg-primary" 
                      role="progressbar" 
                      style={{ width: `${item.percentage}%` }} 
                      aria-valuenow={item.percentage} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="text-muted fs-12 mt-1 text-end">{item.clicks} clicks</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Country Performance */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm glassmorphic-card h-100">
            <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4">
              <div>
                <h6 className="fw-semibold text-body mb-1">Top Countries</h6>
                <p className="text-muted fs-13 mb-0 fw-normal">The regions where your website appears most often.</p>
              </div>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {gscData.countryPerformance.map((item, idx) => (
                  <li key={idx} className="list-group-item px-4 py-3 border-0 border-bottom d-flex justify-content-between align-items-center bg-transparent">
                    <span className="fs-14 fw-medium text-body">{item.country}</span>
                    <div className="text-end">
                      <div className="fs-14 fw-medium">{item.clicks}</div>
                      <div className="fs-12 text-muted">{item.impressions} imp.</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Google Index Status */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm glassmorphic-card h-100 bg-primary bg-opacity-5 border border-primary border-opacity-10">
            <div className="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
              <div>
                <h6 className="fw-semibold text-primary mb-1 d-flex align-items-center gap-2">
                  <i className="isax isax-global-search"></i>
                  Google Index Status
                </h6>
                <p className="text-primary text-opacity-75 fs-13 mb-0 fw-normal">A quick health check of how many of your pages Google knows about.</p>
              </div>
            </div>
            <div className="card-body px-4 pb-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 shadow-sm border">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="isax isax-tick-circle"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold text-dark">Indexed Pages</h6>
                        <small className="text-muted">Currently in Google index</small>
                      </div>
                    </div>
                    <h5 className="mb-0 fw-bold">{gscData.indexStatus.indexed}</h5>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 shadow-sm border">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="isax isax-close-circle"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold text-dark">Not Indexed</h6>
                        <small className="text-muted">Crawled but not indexed</small>
                      </div>
                    </div>
                    <h5 className="mb-0 fw-bold">{gscData.indexStatus.notIndexed}</h5>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 shadow-sm border">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="isax isax-info-circle"></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-semibold text-dark">Total Known URLs</h6>
                        <small className="text-muted">Total URLs Google knows about</small>
                      </div>
                    </div>
                    <h5 className="mb-0 fw-bold">{gscData.indexStatus.checkedUrls}</h5>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPerformanceView;
