import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const DEFAULT_PAGES_WITH_LINK = [
  { title: "Latest BPL Televisions - Online at Best Prices in India | EMI Starting at ₹1078/Month", url: "https://www.bajajfinserv.in/bmall/televisions/bpl-tv", priority: "High", views: 0 },
  { title: "TVs - Latest Television Prices in India | Bajaj Finserv", url: "https://www.bajajfinserv.in/bmall/televisions", priority: "Low", views: 0 },
  { title: "16GB RAM Laptops - Buy 16GB RAM Laptop Online at Best Prices", url: "https://www.bajajfinserv.in/bmall/laptops/16gb-ram-laptops", priority: "High", views: 0 },
  { title: "Washing Machines - Buy Washing Machine Online at Best Prices", url: "https://www.bajajfinserv.in/bmall/washing-machines", priority: "Medium", views: 42 },
  { title: "Smartphones - Latest Mobile Phones in India | Bajaj Finserv", url: "https://www.bajajfinserv.in/bmall/smartphones", priority: "High", views: 128 },
  { title: "Refrigerators - Buy Refrigerator Online | EMI Options", url: "https://www.bajajfinserv.in/bmall/refrigerators", priority: "Low", views: 15 },
  { title: "Air Conditioners - AC Price in India | Best Deals", url: "https://www.bajajfinserv.in/bmall/air-conditioners", priority: "High", views: 89 },
  { title: "Kitchen Appliances - Mixer, Grinder & More", url: "https://www.bajajfinserv.in/bmall/kitchen-appliances", priority: "Medium", views: 31 },
  { title: "Gaming Laptops - Best Gaming Laptop Deals in India", url: "https://www.bajajfinserv.in/bmall/laptops/gaming", priority: "High", views: 56 },
  { title: "LED TVs - Smart TV & 4K TV at Best Prices", url: "https://www.bajajfinserv.in/bmall/televisions/led-tv", priority: "Low", views: 22 },
];

const BrokenLinkIssueDrawer = ({
  open,
  onClose,
  issue,
  page = null,
  pagesWithLink = DEFAULT_PAGES_WITH_LINK,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const totalPages = Math.max(1, Math.ceil(pagesWithLink.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return pagesWithLink.slice(start, start + rowsPerPage);
  }, [pagesWithLink, currentPage, rowsPerPage]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !issue) return null;

  const copyUrl = () => {
    navigator.clipboard?.writeText(issue.url);
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: 1060 }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
        style={{ zIndex: 1065, width: "min(100%, 640px)", maxWidth: "640px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="broken-link-issue-drawer-title"
      >
        <div className="border-bottom px-4 py-3 flex-shrink-0">
          <div className="d-flex align-items-flex-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <i className="isax isax-arrow-left" />
              </button>
              <div>
                <h6 className="mb-0 fw-semibold" id="broken-link-issue-drawer-title">Broken link</h6>
                <p className="text-muted fs-13 mb-0">ID: {issue.id}</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  Action
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button type="button" className="dropdown-item">Ignore</button></li>
                  <li><button type="button" className="dropdown-item">Mark as fixed</button></li>
                </ul>
              </div>
              <button type="button" className="btn btn-sm btn-light" onClick={copyUrl} title="Copy URL">
                Copy URL
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto px-4 py-3">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Issue details</h6>
              <dl className="row mb-0 fs-13">
                <dt className="col-4 text-muted">Element</dt>
                <dd className="col-8 mb-2"><a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">{issue.url}</a></dd>
                <dt className="col-4 text-muted">Response code</dt>
                <dd className="col-8 mb-2">{issue.responseCode}</dd>
                <dt className="col-4 text-muted">Date found</dt>
                <dd className="col-8 mb-2">{issue.dateFound}</dd>
                <dt className="col-4 text-muted">Snippet</dt>
                <dd className="col-8 mb-2"><span className="border border-danger rounded px-2 py-1 text-danger small">{issue.url}</span></dd>
                <dt className="col-4 text-muted">Found on page</dt>
                <dd className="col-8 mb-0">
                  <div className="d-flex flex-column">
                    <span className="fw-medium">{page?.title ?? "—"}</span>
                    <a
                      href={page?.url ?? issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted text-decoration-none fs-13 d-inline-flex align-items-center gap-1 mt-1"
                    >
                      <span className="text-primary">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <path d="M15 3h6v6" />
                          <path d="M10 14L21 3" />
                        </svg>
                      </span>
                      {page?.url ?? issue.url}
                    </a>
                  </div>
                </dd>
              </dl>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <h6 className="fw-semibold mb-0 px-4 pt-3 pb-2 text-body">All pages with this Broken Link</h6>
              <div className="table-responsive">
                <table className="table table-hover table-striped table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-3">Title and URL</th>
                      <th className="fw-semibold text-body py-3">Priority</th>
                      <th className="fw-semibold text-body py-3">Views</th>
                      <th className="py-3 pe-4" style={{ width: 80 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPages.map((p, idx) => (
                      <tr key={`${p.url}-${idx}`}>
                        <td className="py-2">
                          <div className="d-flex flex-column">
                            <Link to={p.url} className="text-primary text-decoration-none fw-medium fs-13">{p.title}</Link>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1 mt-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <span className="text-primary">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <path d="M15 3h6v6" />
                                  <path d="M10 14L21 3" />
                                </svg>
                              </span>
                              {p.url}
                            </a>
                          </div>
                        </td>
                        <td className="py-2">
                          <span className={`badge rounded-pill ${p.priority === "High" ? "bg-danger bg-opacity-10 text-danger" : p.priority === "Low" ? "bg-primary bg-opacity-10 text-primary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-2">
                          <input type="text" className="form-control form-control-sm" style={{ width: 60 }} defaultValue={p.views} readOnly />
                        </td>
                        <td className="py-2 pe-4">
                          <button type="button" className="btn btn-icon btn-sm btn-light" title="View">
                            <i className="isax isax-document-text" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Rows per page</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-muted small">
                    {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, pagesWithLink.length)} of {pagesWithLink.length}
                  </span>
                </div>
                <nav aria-label="Pages with broken link pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="Previous">Previous</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                        <button type="button" className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="Next">Next</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body p-0">
              <h6 className="fw-semibold mb-0 px-4 pt-3 pb-2 text-body">All documents with this Broken Link</h6>
              <div className="table-responsive">
                <table className="table table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="fw-semibold text-body py-3">
                        Title and URL <i className="isax isax-arrow-down-1 ms-1 fs-12" aria-hidden="true" />
                      </th>
                      <th className="fw-semibold text-body py-3">
                        Views <i className="isax isax-arrow-up-down ms-1 fs-12 opacity-50" aria-hidden="true" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2} className="py-5 text-center text-muted">No content was found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrokenLinkIssueDrawer;
