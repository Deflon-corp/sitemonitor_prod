import React, { useState, useMemo } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PdfAccessibilityDrawer from "./PdfAccessibilityDrawer";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed/Ok" },
  { key: "queued", label: "Queued" },
  { key: "failed", label: "Failed" },
];

const SAMPLE_PDFS = [
  { id: "1", title: "Lorem ipsum", url: "https://example.com/content/dam/lorem-ipsum.pdf", fileSize: "1.67 MB", pages: 27, words: 1281, created: "May 24, 2018" },
  { id: "2", title: "Ipsum dolor", url: "https://example.com/content/dam/ipsum-dolor.pdf", fileSize: "110.46 KB", pages: 4, words: 1040, created: "Jun 24, 2016" },
];

const Y_MAX = 20;
const BLUE = "#3b82f6";
const AMBER = "#eab308";
const AMBER_FILL = "rgba(234, 179, 8, 0.25)";

/** Area chart for PDF trend: reviewed (blue line) and pending (yellow area with line). */
const PdfTrendChart = ({ reviewedData, pendingData }) => {
  const labels = ["Dec 09", "Jan", "Feb 15"];
  const w = 840;
  const h = 200;
  const pad = { t: 16, r: 20, b: 32, l: 28 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;

  const x = (i) => pad.l + (i / Math.max(1, labels.length - 1)) * chartW;
  const y = (v) => pad.t + (1 - v / Y_MAX) * chartH;

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
          <path d={pendingAreaD} fill={AMBER_FILL} />
          <polyline points={pendingPoints} fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pendingData.map((v, i) => (
            <circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={4} fill={AMBER} />
          ))}
          <polyline points={reviewedPoints} fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {reviewedData.map((v, i) => (
            <circle key={`r-${i}`} cx={x(i)} cy={y(v)} r={4} fill={BLUE} />
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
            <span className="rounded-circle d-block" style={{ width: 10, height: 10, backgroundColor: BLUE }} aria-hidden="true" />
            PDF files reviewed
          </span>
          <span className="d-inline-flex align-items-center gap-2 small text-body">
            <span className="rounded-circle d-block" style={{ width: 10, height: 10, backgroundColor: AMBER }} aria-hidden="true" />
            PDF files pending
          </span>
        </div>
      </div>
    </div>
  );
};

const InternalPdfsView = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pdfDrawerOpen, setPdfDrawerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showMarkAsReviewedConfirm, setShowMarkAsReviewedConfirm] = useState(false);

  const openPdfDetails = (row) => {
    setSelectedPdf(row);
    setPdfDrawerOpen(true);
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_PDFS;
    const q = searchQuery.toLowerCase();
    return SAMPLE_PDFS.filter(
      (r) => (r.title || "").toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title") return dir * ((a.title || "").localeCompare(b.title || "") || a.url.localeCompare(b.url));
      if (sortBy === "fileSize") return dir * (a.fileSize.localeCompare(b.fileSize));
      if (sortBy === "pages") return dir * (a.pages - b.pages);
      if (sortBy === "words") return dir * (a.words - b.words);
      return dir * (a.created.localeCompare(b.created));
    });
  }, [filteredRows, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  return (
    <div className="internal-pdfs-view">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <ul className="nav nav-tabs border-0 gap-1">
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
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2" title="Upload" aria-label="Upload">
            <i className="isax isax-document-upload text-primary fs-18" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2" title="Download" aria-label="Download">
            <i className="isax isax-document-download text-primary fs-18" aria-hidden="true" />
          </button>
          <p className="text-muted small mb-0">PDF Accessibility scan credits available: 0</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
            <i className="isax isax-document-text text-primary fs-24" aria-hidden="true" />
          </div>
          <div>
            <h5 className="mb-1 fw-semibold text-body">All Pending Internal PDF files</h5>
            <p className="text-muted fs-13 mb-0">A list of all internal PDF files that you need to check for accessibility issues</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <PdfTrendChart reviewedData={[0.2, 0.2, 0.2]} pendingData={[15.5, 15.7, 14]} />
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
        <div className="dropdown">
          <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 d-inline-flex align-items-center gap-1 text-primary" data-bs-toggle="dropdown" aria-expanded="false">
            All PDFs
            <i className="isax isax-arrow-down-1 fs-12" aria-hidden="true" />
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><button type="button" className="dropdown-item">All PDFs</button></li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 text-primary"
                onClick={() => setShowMarkAsReviewedConfirm(true)}
              >
                <i className="isax isax-refresh fs-14" aria-hidden="true" /> Mark all as reviewed
              </button>
            </li>
          </ul>
        </div>
        <div className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white" style={{ width: 220 }}>
          <span className="d-flex align-items-center ps-3 flex-shrink-0 text-muted" aria-hidden="true">
            <i className="isax isax-search-normal-1" style={{ fontSize: "1rem" }} aria-hidden="true" />
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
                  <th className="py-3 ps-4" style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input" aria-label="Select all" />
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("title")}>
                      Title
                      {sortBy === "title" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("fileSize")}>
                      File size
                      {sortBy === "fileSize" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("pages")}>
                      Pages
                      {sortBy === "pages" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("words")}>
                      Words
                      {sortBy === "words" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button type="button" className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => handleSort("created")}>
                      Created
                      {sortBy === "created" ? <i className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`} aria-hidden="true" /> : <i className="isax isax-sort fs-12 opacity-50" aria-hidden="true" />}
                    </button>
                  </th>
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <input type="checkbox" className="form-check-input" aria-label={`Select ${row.title}`} />
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column">
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none fw-medium fs-13">
                          {row.title}
                        </a>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break">
                          <ExternalLinkIcon size={12} />
                          {row.url}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 fs-13 text-body">{row.fileSize}</td>
                    <td className="py-3 fs-13 text-body">{row.pages}</td>
                    <td className="py-3 fs-13 text-body">{row.words.toLocaleString()}</td>
                    <td className="py-3 fs-13 text-body">{row.created}</td>
                    <td className="py-3 pe-4">
                      <div className="d-flex gap-1">
                        <div className="dropdown">
                          <button type="button" className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            Action
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => setShowMarkAsReviewedConfirm(true)}
                              >
                                Marked as reviewed
                              </button>
                            </li>
                          </ul>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-2"
                          title="Open page details"
                          aria-label="Open page details"
                          onClick={() => openPdfDetails(row)}
                        >
                          <i className="isax isax-document-text fs-14" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedRows.length === 0 && (
            <div className="text-center text-muted py-5">No content was found.</div>
          )}
        </div>
      </div>

      <PdfAccessibilityDrawer
        open={pdfDrawerOpen}
        onClose={() => {
          setPdfDrawerOpen(false);
          setSelectedPdf(null);
        }}
        pdf={selectedPdf ? { title: selectedPdf.title, url: selectedPdf.url } : null}
      />

      {showMarkAsReviewedConfirm && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1080 }}>
          <div className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50" aria-hidden="true" onClick={() => setShowMarkAsReviewedConfirm(false)} />
          <div className="position-relative bg-white rounded-3 shadow p-4" style={{ maxWidth: 480, minWidth: 420 }} role="dialog" aria-modal="true" aria-labelledby="mark-reviewed-confirm-title">
            <button
              type="button"
              className="btn btn-icon btn-sm position-absolute top-0 end-0 m-2 rounded-2 border-0 bg-transparent text-body"
              onClick={() => setShowMarkAsReviewedConfirm(false)}
              title="Close"
              aria-label="Close"
            >
              <i className="isax isax-close-circle fs-18" aria-hidden="true" />
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

export default InternalPdfsView;
