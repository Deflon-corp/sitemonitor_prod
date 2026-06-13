import React, { useState, useMemo } from "react";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import PdfAccessibilityDrawer from "./PdfAccessibilityDrawer";

import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const BLUE = "#3b82f6";
const AMBER = "#eab308";
const AMBER_FILL = "rgba(234, 179, 8, 0.25)";

const PdfTrendChart = ({
  labels = ["Dec 09", "Jan", "Feb 15"],
  reviewedData = [],
  pendingData = [],
}) => {
  const Y_MAX = Math.max(20, ...pendingData, ...reviewedData);
  const w = 840;
  const h = 230;
  const pad = { t: 16, r: 20, b: 50, l: 28 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;

  const x = (i) => pad.l + (i / Math.max(1, labels.length - 1)) * chartW;
  const y = (v) => pad.t + (1 - v / Y_MAX) * chartH;

  const pendingAreaD =
    pendingData.length > 0
      ? `M ${x(0)},${pad.t + chartH} L ${pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" L ")} L ${x(pendingData.length - 1)},${pad.t + chartH} Z`
      : "";
  const pendingPoints = pendingData.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const reviewedPoints = reviewedData
    .map((v, i) => `${x(i)},${y(v)}`)
    .join(" ");

  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm bg-white overflow-hidden">
      <div className="p-4">
        <svg
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          style={{ maxHeight: 280, minWidth: 280 }}
          aria-hidden="true"
        >
          {[0, 5, 10, 15, 20].map((val) => (
            <line
              key={val}
              x1={pad.l}
              y1={y(val)}
              x2={w - pad.r}
              y2={y(val)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          <path d={pendingAreaD} fill={AMBER_FILL} />
          <polyline
            points={pendingPoints}
            fill="none"
            stroke={AMBER}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pendingData.map((v, i) => (
            <circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={4} fill={AMBER} />
          ))}
          {[0, 5, 10, 15, 20].map((val) => (
            <text
              key={val}
              x={pad.l - 8}
              y={y(val) + 4}
              textAnchor="end"
              fill="#6b7280"
              style={{ fontSize: 11 }}
            >
              {val}
            </text>
          ))}
          {labels.map((label, i) => (
            <g key={i}>
              <text
                x={x(i)}
                y={h - 24}
                textAnchor="middle"
                fill="#6b7280"
                style={{ fontSize: 11 }}
              >
                {label.date}
              </text>
              <text
                x={x(i)}
                y={h - 10}
                textAnchor="middle"
                fill="#6b7280"
                style={{ fontSize: 10 }}
              >
                {label.time}
              </text>
            </g>
          ))}
        </svg>
        <div className="d-flex justify-content-center gap-4 mt-3">
          <span className="d-inline-flex align-items-center gap-2 small text-body">
            <span
              className="rounded-circle d-block"
              style={{ width: 10, height: 10, backgroundColor: AMBER }}
              aria-hidden="true"
            />
            PDF files pending
          </span>
        </div>
      </div>
    </div>
  );
};

const InternalPdfsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [pdfDrawerOpen, setPdfDrawerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [pdfs, setPdfs] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    pending: [],
    reviewed: [],
  });
  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  React.useEffect(() => {
    if (!domainId) return;
    import("@/api/inventoryApi").then(({ default: inventoryApi }) => {
      // Fetch documents
      inventoryApi
        .getInventoryDetails(domainId, { type: "documents", limit: 500 })
        .then((res) => {
          if (res.success && res.data) {
            const allDocs = res.data.items || [];
            const internalDocs = allDocs
              .filter((d) => {
                try {
                  return (
                    new URL(d.document_url).hostname ===
                    new URL(d.page_url).hostname
                  );
                } catch {
                  return true;
                }
              })
              .map((d) => ({
                id: d._id,
                title: d.document_url.split("/").pop() || d.document_url,
                url: d.document_url,
                fileSize: "-",
                pages: "-",
                words: 0,
                created: new Date(d.createdAt).toLocaleDateString(),
              }));
            setPdfs(internalDocs);
          }
        });

      inventoryApi.getInventoryHistory(domainId).then((res) => {
        if (res.success && res.history) {
          const hist = res.history.slice(-10); // Last 10 scans
          const labels = hist.map((h) => {
            const d = new Date(h.date);
            return {
              date: d.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              time: d.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
            };
          });
          const pending = hist.map((h) => h.documents || 0);
          const reviewed = hist.map(() => 0); // No reviewed tracking yet
          setChartData({ labels, pending, reviewed });
        }
      });
    });
  }, [domainId]);

  const openPdfDetails = (row) => {
    setSelectedPdf(row);
    setPdfDrawerOpen(true);
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return pdfs;
    const q = searchQuery.toLowerCase();
    return pdfs.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q),
    );
  }, [searchQuery, pdfs]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (sortBy === "title")
        return (
          dir *
          ((a.title || "").localeCompare(b.title || "") ||
            a.url.localeCompare(b.url))
        );
      if (sortBy === "fileSize")
        return dir * a.fileSize.localeCompare(b.fileSize);
      if (sortBy === "pages") return dir * (a.pages - b.pages);
      if (sortBy === "words") return dir * (a.words - b.words);
      return dir * a.created.localeCompare(b.created);
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
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 40, height: 40 }}
            >
              <i
                className="isax isax-document-text text-primary fs-20"
                aria-hidden="true"
              />
            </div>
            Internal PDF Documents
          </h5>
          <p
            className="text-muted fs-14 mb-0 ms-5"
            style={{ paddingLeft: "8px" }}
          >
            A comprehensive list of all PDF documents hosted on your domain that
            were discovered during the website scan.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
            title="Upload"
            aria-label="Upload"
          >
            <i
              className="isax isax-document-upload text-primary fs-18"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
            title="Download"
            aria-label="Download"
          >
            <i
              className="isax isax-document-download text-primary fs-18"
              aria-hidden="true"
            />
          </button>
          <p className="text-muted small mb-0 ms-2">Scan credits: 0</p>
        </div>
      </div>

      <div className="mb-4">
        {chartData.labels.length > 0 && (
          <PdfTrendChart
            labels={chartData.labels}
            reviewedData={chartData.reviewed}
            pendingData={chartData.pending}
          />
        )}
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
        <div
          className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
          style={{ width: 220 }}
        >
          <span
            className="d-flex align-items-center ps-3 flex-shrink-0 text-muted"
            aria-hidden="true"
          >
            <i
              className="isax isax-search-normal-1"
              style={{ fontSize: "1rem" }}
              aria-hidden="true"
            />
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
                    <input
                      type="checkbox"
                      className="form-check-input"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      {sortBy === "title" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("fileSize")}
                    >
                      File size
                      {sortBy === "fileSize" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("pages")}
                    >
                      Pages
                      {sortBy === "pages" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("words")}
                    >
                      Words
                      {sortBy === "words" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th className="py-3 text-body fs-13 fw-semibold">
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 text-body fs-13 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("created")}
                    >
                      Created
                      {sortBy === "created" ? (
                        <i
                          className={`isax fs-12 ${sortDir === "asc" ? "isax-arrow-up-1" : "isax-arrow-down-1"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="isax isax-sort fs-12 opacity-50"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                  <th
                    className="py-3 pe-4 text-body fs-13 fw-semibold"
                    style={{ width: 120 }}
                    aria-label="Actions"
                  />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 ps-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-label={`Select ${row.title}`}
                      />
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none fw-medium fs-13"
                        >
                          {row.title}
                        </a>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary fs-12 text-decoration-none d-inline-flex align-items-center gap-1 text-break"
                        >
                          <ExternalLinkIcon size={12} />
                          {row.url}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 fs-13 text-body">{row.fileSize}</td>
                    <td className="py-3 fs-13 text-body">{row.pages}</td>
                    <td className="py-3 fs-13 text-body">
                      {row.words.toLocaleString()}
                    </td>
                    <td className="py-3 fs-13 text-body">{row.created}</td>
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
          {sortedRows.length === 0 && (
            <div className="text-center text-muted py-5">
              No content was found.
            </div>
          )}
        </div>
      </div>

      <PdfAccessibilityDrawer
        open={pdfDrawerOpen}
        onClose={() => {
          setPdfDrawerOpen(false);
          setSelectedPdf(null);
        }}
        pdf={
          selectedPdf
            ? { title: selectedPdf.title, url: selectedPdf.url }
            : null
        }
      />
    </div>
  );
};

export default InternalPdfsView;
