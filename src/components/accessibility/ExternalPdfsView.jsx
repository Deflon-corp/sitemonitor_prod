import React, { useState, useMemo } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";

import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const BLUE_EXT = "#3b82f6";
const AMBER_EXT = "#eab308";
const AMBER_FILL_EXT = "rgba(234, 179, 8, 0.25)";

/** Area chart for external PDF trend: reviewed (blue line) and pending (yellow area with line). */
const ExternalPdfTrendChart = ({ labels = ["Dec 09", "Feb 15"], reviewedData = [], pendingData = [] }) => {
  const Y_MAX_EXT = Math.max(20, ...pendingData, ...reviewedData);
  const w = 640;
  const h = 230;
  const pad = { t: 16, r: 20, b: 50, l: 28 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;

  const x = (i) => pad.l + (i / Math.max(1, labels.length - 1)) * chartW;
  const y = (v) => pad.t + (1 - v / Y_MAX_EXT) * chartH;

  const pendingAreaD = pendingData.length > 0 ? `M ${x(0)},${pad.t + chartH} L ${pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" L ")} L ${x(pendingData.length - 1)},${pad.t + chartH} Z` : "";
  const pendingPoints = pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const reviewedPoints = reviewedData.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm bg-white overflow-hidden">
      <div className="p-4">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxHeight: 280, minWidth: 280 }} aria-hidden="true">
          {[0, 5, 10, 15, 20].map((val) => (
            <line key={val} x1={pad.l} y1={y(val)} x2={w - pad.r} y2={y(val)} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          <path d={pendingAreaD} fill={AMBER_FILL_EXT} />
          <polyline points={pendingPoints} fill="none" stroke={AMBER_EXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pendingData.map((v, i) => (
            <circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={4} fill={AMBER_EXT} />
          ))}
          {[0, 5, 10, 15, 20].map((val) => (
            <text key={val} x={pad.l - 8} y={y(val) + 4} textAnchor="end" fill="#6b7280" style={{ fontSize: 11 }}>
              {val}
            </text>
          ))}
          {labels.map((label, i) => (
            <g key={i}>
              <text x={x(i)} y={h - 24} textAnchor="middle" fill="#6b7280" style={{ fontSize: 11 }}>
                {label.date}
              </text>
              <text x={x(i)} y={h - 10} textAnchor="middle" fill="#6b7280" style={{ fontSize: 10 }}>
                {label.time}
              </text>
            </g>
          ))}
        </svg>
        <div className="d-flex justify-content-center gap-4 mt-3">
          <span className="d-inline-flex align-items-center gap-2 small text-body">
            <span className="rounded-circle d-block" style={{ width: 10, height: 10, backgroundColor: AMBER_EXT }} aria-hidden="true"></span>
            PDF files pending
          </span>
        </div>
      </div>
    </div>
  );
};

const ExternalPdfsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], pending: [], reviewed: [] });
  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  React.useEffect(() => {
    if (!domainId) return;
    import("@/api/inventoryApi").then(({ default: inventoryApi }) => {
      // Fetch documents
      inventoryApi.getInventoryDetails(domainId, { type: "documents", limit: 500 }).then(res => {
        if (res.success && res.data) {
          const allDocs = res.data.items || [];
          const externalDocs = allDocs.filter(d => {
            try {
              return new URL(d.document_url).hostname !== new URL(d.page_url).hostname;
            } catch { return false; }
          }).map(d => ({
            id: d._id,
            url: d.document_url,
          }));
          setPdfs(externalDocs);
        }
      });

      inventoryApi.getInventoryHistory(domainId).then(res => {
        if (res.success && res.history) {
          const hist = res.history.slice(-10); // Last 10 scans
          const labels = hist.map(h => {
            const d = new Date(h.date);
            return {
              date: d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
              time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            };
          });
          const pending = hist.map(h => h.documents || 0); // We map total documents here for simplicity
          const reviewed = hist.map(() => 0); 
          setChartData({ labels, pending, reviewed });
        }
      });
    });
  }, [domainId]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return pdfs;
    const q = searchQuery.toLowerCase();
    return pdfs.filter((r) => r.url.toLowerCase().includes(q));
  }, [searchQuery, pdfs]);

  return (
    <div className="external-pdfs-view">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
              <i className="isax isax-document-text text-primary fs-20" aria-hidden="true"></i>
            </div>
            External PDF Documents
          </h5>
          <p className="text-muted fs-14 mb-0 ms-5" style={{ paddingLeft: '8px' }}>
            A list of all PDF documents hosted externally but linked from your site, identified during the website scan.
          </p>
        </div>
      </div>

      <div className="mb-4">
        {chartData.labels.length > 0 && (
          <ExternalPdfTrendChart labels={chartData.labels} reviewedData={chartData.reviewed} pendingData={chartData.pending} />
        )}
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
        <div className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white" style={{ width: 220 }}>
          <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
            <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
          </span>
          <input
            type="search"
            className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
            style={{ paddingLeft: "0.5rem" }}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                    Title <i className="isax isax-arrow-down-1 fs-12 opacity-50 ms-1" aria-hidden="true"></i>
                  </th>
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary fs-13 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                      >
                        <span className="flex-shrink-0 d-inline-flex text-primary">
                          <ExternalLinkIcon size={12} />
                        </span>
                        {row.url}
                      </a>
                    </td>
                    <td className="py-3 pe-4">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-2"
                        onClick={() => window.open(row.url, "_blank")}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 && (
            <div className="text-center text-muted py-5">No content was found.</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ExternalPdfsView;
