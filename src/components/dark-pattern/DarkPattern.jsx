import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import DarkPatternSummaryView from "./DarkPatternSummaryView";
import DarkPatternIssuesView from "./DarkPatternIssuesView";
import { triggerDarkPatternScanApi } from "../../api/darkPatternApi";
import { getDomainByIdApi } from "../../api/domainApi";
import { SELECTED_DOMAIN_KEY } from "../../layouts/Sidebar";
import { showToast } from "../common/alerts/ToastAlert";

const DARK_PATTERN_NAV = [
  {
    key: "summary",
    label: "Audit Summary",
    description: "Overview and audit metrics",
    icon: "isax-chart-215",
    href: "/domain/dark-pattern?view=summary",
  },
  {
    key: "issues",
    label: "Detected Issues",
    description: "Detailed list by URL",
    icon: "isax-danger",
    href: "/domain/dark-pattern?view=issues",
  }
];

const DarkPattern = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "summary";
  
  const [domain, setDomain] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (domainId) {
      getDomainByIdApi(domainId).then((res) => {
        if (res.success) {
          setDomain(res.data);
          if (res.data.dm_dark_pattern_status === 'scanning') {
            setIsScanning(true);
          } else {
            setIsScanning(false);
          }
        }
      });
    }
  }, [domainId]);

  const handleScan = async () => {
    if (!domain || isScanning) return;
    const dmName = domain.dm_name || domain.dm_url;
    setIsScanning(true);
    try {
      const res = await triggerDarkPatternScanApi(dmName, 10, domain._id);
      if (res.success) {
        showToast(`Scan initiated for ${dmName}. This will run in the background.`, "success");
        // Update local state, which will persist until the backend status changes to completed
        setDomain(prev => ({ ...prev, dm_dark_pattern_status: 'scanning' }));
      } else {
        showToast("Failed to initiate scan", "error");
        setIsScanning(false);
      }
    } catch (error) {
      showToast("Error triggering scan", "error");
      setIsScanning(false);
    }
  };

  return (
    <div className="dark-pattern-page">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <h6 className="mb-0 fs-18 fw-semibold text-body">Dark Patterns</h6>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleScan}
            disabled={isScanning || !domain}
          >
            {isScanning ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Scanning...
              </>
            ) : (
              <>
                <i className="isax isax-scan-barcode" />
                Scan Dark Patterns
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <nav
            className="d-flex flex-wrap gap-3 align-items-stretch"
            aria-label="Dark Pattern navigation"
          >
            {DARK_PATTERN_NAV.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`d-flex flex-column text-decoration-none py-2 px-3 rounded transition-all ${currentView === item.key ? "bg-primary bg-opacity-10 text-primary shadow-sm border border-primary border-opacity-10" : "text-body hover-bg-light border border-transparent"}`}
                style={{ minWidth: "180px", flex: "1 1 0" }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i
                    className={`isax ${item.icon} fs-18 ${currentView === item.key ? "text-primary" : "text-muted"}`}
                    aria-hidden="true"
                  ></i>
                  <span className="fw-semibold fs-14">{item.label}</span>
                </div>
                <span
                  className={`fs-11 ${currentView === item.key ? "text-primary opacity-75" : "text-muted"}`}
                >
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="min-w-0 p-4 bg-body-tertiary rounded-3 overflow-auto">
        {currentView === "summary" && <DarkPatternSummaryView />}
        {currentView === "issues" && <DarkPatternIssuesView />}
      </div>
    </div>
  );
};

export default DarkPattern;
