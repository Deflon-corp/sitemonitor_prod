import React, { useState, useMemo } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed/Ok" },
];

const SAMPLE_PDFS = [
  { id: "1", url: "https://cms-assets.example.com/is/content/examplefinance/framework-2.0-for-covid19-related-stressdocxpdf?scl=1&fmt=pdf" },
  { id: "2", url: "https://cms-assets.example.com/docs/accessibility-statement.pdf" },
  { id: "3", url: "https://example.com/external-policy.pdf" },
];

const Y_MAX_EXT = 20;
const BLUE_EXT = "#3b82f6";
const AMBER_EXT = "#eab308";
const AMBER_FILL_EXT = "rgba(234, 179, 8, 0.25)";

/** Area chart for external PDF trend: reviewed (blue line) and pending (yellow area with line). */
const ExternalPdfTrendChart = ({ reviewedData, pendingData }) => {
  const labels = ["Dec 09", "Feb 15"];
  const w = 640;
  const h = 200;
  const pad = { t: 16, r: 20, b: 32, l: 28 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;

  const x = (i) => pad.l + (i / Math.max(1, labels.length - 1)) * chartW;
  const y = (v) => pad.t + (1 - v / Y_MAX_EXT) * chartH;

  const pendingAreaD = `M ${x(0)},${pad.t + chartH} L ${pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" L ")} L ${x(pendingData.length - 1)},${pad.t + chartH} Z`;
  const pendingPoints = pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const reviewedPoints = reviewedData.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm bg-white overflow-hidden">
      <div className="p-4">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxHeight: 220, minWidth: 280 }} aria-hidden="true">
          {[0, 5, 10, 15, 20].map((val) => (
            <line key={val} x1={pad.l} y1={y(val)} x2={w - pad.r} y2={y(val)} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          <path d={pendingAreaD} fill={AMBER_FILL_EXT} />
          <polyline points={pendingPoints} fill="none" stroke={AMBER_EXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pendingData.map((v, i) => (
            <circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={4} fill={AMBER_EXT} />
          ))}
          <polyline points={reviewedPoints} fill="none" stroke={BLUE_EXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {reviewedData.map((v, i) => (
            <circle key={`r-${i}`} cx={x(i)} cy={y(v)} r={4} fill={BLUE_EXT} />
          ))}
          {[0, 5, 10, 15, 20].map((val) => (
            <text key={val} x={pad.l - 8} y={y(val) + 4} textAnchor="end" fill="#6b7280" style={{ fontSize: 11 }}>
              {val}
            </text>
          ))}
          {labels.map((label, i) => (
            <text key={label} x={x(i)} y={h - 8} textAnchor="middle" fill="#6b7280" style={{ fontSize: 11 }}>
              {label}
            </text>
          ))}
        </svg>
        <div className="d-flex justify-content-center gap-4 mt-3">
          <span className="d-inline-flex align-items-center gap-2 small text-body">
            <span className="rounded-circle d-block" style={{ width: 10, height: 10, backgroundColor: BLUE_EXT }} aria-hidden="true"></span>
            PDF files reviewed
          </span>
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
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMarkAsReviewedConfirm, setShowMarkAsReviewedConfirm] = useState(false);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_PDFS;
    const q = searchQuery.toLowerCase();
    return SAMPLE_PDFS.filter((r) => r.url.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className="external-pdfs-view">
      <div className="mb-4">
        <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
          <i className="isax isax-document-text text-primary fs-22" aria-hidden="true"></i>
          External PDF Compliance
        </h5>
      </div>

      <ul className="nav nav-tabs border-0 gap-1 mb-4">
        {TABS.map(({ key, label }) => (
          <li key={key} className="nav-item">
            <button
              type="button"
              className={`nav-link rounded-2 border-0 py-2 px-3 ${activeTab === key ? "bg-primary text-white" : "text-body"}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
            <i className="isax isax-document-text text-primary fs-24" aria-hidden="true"></i>
          </div>
          <div>
            <h5 className="mb-1 fw-semibold text-body">All Pending External PDF files</h5>
            <p className="text-muted fs-13 mb-0">A list of all external PDF files that you need to check for accessibility issues.</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <ExternalPdfTrendChart reviewedData={[0, 0]} pendingData={[16, 14]} />
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
                        onClick={() => setShowMarkAsReviewedConfirm(true)}
                      >
                        Review
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

      {showMarkAsReviewedConfirm && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1080 }}>
          <div className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50" aria-hidden="true" onClick={() => setShowMarkAsReviewedConfirm(false)}></div>
          <div className="position-relative bg-white rounded-3 shadow p-4" style={{ maxWidth: 480, minWidth: 420 }} role="dialog" aria-modal="true" aria-labelledby="mark-reviewed-confirm-title">
            <button
              type="button"
              className="btn btn-icon btn-sm position-absolute top-0 end-0 m-2 rounded-2 border-0 bg-transparent text-body"
              onClick={() => setShowMarkAsReviewedConfirm(false)}
              title="Close"
              aria-label="Close"
            >
              <i className="isax isax-close-circle fs-18" aria-hidden="true"></i>
            </button>
            <p id="mark-reviewed-confirm-title" className="mb-4 pe-4 mt-2 text-body fs-13" style={{ whiteSpace: "nowrap" }}>
              Are you sure you want to set this document as reviewed?
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-2"
                onClick={() => setShowMarkAsReviewedConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-2"
                onClick={() => setShowMarkAsReviewedConfirm(false)}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalPdfsView;
