import React, { Suspense, lazy, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getSpellCheckerAuditBySlug } from "@/lib/spell-checker-audit-data";
import { getDomainSeoPagesApi, getDomainAuditDataApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const AffectedPagesChart = lazy(() => import("@/components/audit/AffectedPagesChart"));
const SeoHealthExamplesCard = lazy(() => import("@/components/audit/SeoHealthExamplesCard"));

export default function SpellCheckerDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const config = slug ? getSpellCheckerAuditBySlug(slug) : null;
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [domainTotalPages, setDomainTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (slug && !getSpellCheckerAuditBySlug(slug)) navigate("/error-404", { replace: true });
  }, [slug, navigate]);

  const fetchDomainData = useCallback(async () => {
    if (!domainId) return;
    try {
        const res = await getDomainAuditDataApi(domainId);
        if (res.success && res.data?.pagesAnalyzed) {
            setDomainTotalPages(res.data.pagesAnalyzed.totalPages || 0);
        }
    } catch (err) {
        console.error("Failed to fetch domain audit data:", err);
    }
  }, [domainId]);

  const fetchPages = useCallback(async () => {
    if (!domainId || !slug) return;
    setIsLoading(true);
    try {
      const res = await getDomainSeoPagesApi(domainId, page, limit, '', slug);
      if (res.success) {
        setPages(res.data.pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch spell checker pages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [domainId, slug, page, limit]);

  useEffect(() => {
    fetchDomainData();
    fetchPages();
  }, [fetchDomainData, fetchPages]);

  const chartData = useMemo(() => {
    if (!pages.length) return { series: [], categories: [] };
    const topPages = [...pages].sort((a, b) => (b.targetedIssueCount || 0) - (a.targetedIssueCount || 0)).slice(0, 5);
    return {
        series: [{ name: 'Issues', data: topPages.map(p => p.targetedIssueCount || 1) }],
        categories: topPages.map(p => {
            const url = p.url || "";
            return url.length > 25 ? "..." + url.slice(-22) : url;
        })
    };
  }, [pages]);

  const brokenLinksList = useMemo(() => {
    const list = [];
    pages.forEach(p => {
      const links = p.brokenLinks || [];
      if (links.length === 0 && (p.targetedIssueCount > 0 || p.brokenLinksCount > 0)) {
        list.push({
          brokenUrl: "N/A (Details unavailable)",
          foundPage: p.url,
          anchorText: "N/A",
          status: 404,
          lastCrawled: p.lastCrawled
        });
      } else {
        links.forEach(l => {
          list.push({
            brokenUrl: l.url || l.href || "N/A",
            foundPage: p.url,
            anchorText: l.anchorText || l.text || '(No text)',
            status: l.status || l.statusCode || 404,
            lastCrawled: p.lastCrawled
          });
        });
      }
    });
    return list;
  }, [pages]);

  if (!slug || !config) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const { title } = config;
  const h1Title = `${title} Report`;
  const reportFileTitle = `${title}-spell-checker`;

  const handlePageChange = (newPage, newLimit) => {
    setPage(newPage);
    setLimit(newLimit);
  };

  if (slug === "broken-links") {
    return (
      <DashboardLayout
        breadcrumbTitle="Broken Links"
        breadcrumbParent="Run Website Audit"
        breadcrumbParentHref="/domain/audit"
      >
        <div className="content">
          <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                  <h4 className="mb-1 fw-bold">Broken Links Directory</h4>
                  <p className="text-muted fs-14 mb-0">List of all dead links and the pages where they were found</p>
              </div>
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(-1)}>
                  <i className="isax isax-arrow-left-1 me-1" /> Back to Audit
              </button>
          </div>

          <div className="row g-4 mb-4">
              <div className="col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                          <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Affected pages</h6>
                          <div className="d-flex align-items-baseline gap-2 mb-2">
                              <h2 className="fw-bold mb-0 text-primary">{totalCount}</h2>
                              <span className="text-muted fs-14">of {domainTotalPages} pages</span>
                          </div>
                          <div className="mt-4">
                              <div className="d-flex justify-content-between mb-1">
                                  <span className="fs-12 text-muted">Impact Rate</span>
                                  <span className="fs-12 fw-medium">{domainTotalPages ? ((totalCount / domainTotalPages) * 100).toFixed(1) : 0}%</span>
                              </div>
                              <div className="progress rounded-pill" style={{ height: 6 }}>
                                  <div className="progress-bar bg-danger" style={{ width: domainTotalPages ? `${(totalCount / domainTotalPages) * 100}%` : '0%' }}></div>
                              </div>
                          </div>
                          <p className="fs-12 text-muted mt-3">Fixing broken links restores crawl budget and enhances user navigation.</p>
                      </div>
                  </div>
              </div>
              
              <div className="col-lg-8">
                  <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                          <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Broken Links count per Page (Top 5)</h6>
                          <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border" /></div>}>
                              {chartData.series.length > 0 ? (
                                  <AffectedPagesChart 
                                      chartId="broken-links-chart" 
                                      height={240}
                                      type="bar"
                                      series={chartData.series}
                                      categories={chartData.categories}
                                      colors={['#ef4444']}
                                      showLegend={false}
                                      tooltipLabel="Broken Links"
                                  />
                              ) : (
                                  <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-13">
                                      No data to display in graph.
                                  </div>
                              )}
                          </Suspense>
                      </div>
                  </div>
              </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header border-0 d-flex align-items-center justify-content-between flex-wrap gap-2 bg-transparent py-3">
              <h6 className="mb-0 fw-semibold d-flex align-items-center">
                Discovered Broken Links
                <span className="ms-1 opacity-75" title="List of specific dead links found across crawled pages">
                  <i className="isax isax-info-circle fs-14" />
                </span>
              </h6>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="fw-semibold text-body fs-13 border-0 py-3" style={{ width: '40%' }}>Broken Link (Dead URL)</th>
                      <th className="fw-semibold text-body fs-13 border-0 py-3" style={{ width: '35%' }}>Found on Page (Source URL)</th>
                      <th className="fw-semibold text-body fs-13 border-0 py-3" style={{ width: '15%' }}>Anchor Text</th>
                      <th className="fw-semibold text-body fs-13 border-0 py-3 text-center" style={{ width: '10%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                          <span className="text-muted fs-13">Loading broken links...</span>
                        </td>
                      </tr>
                    ) : brokenLinksList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted fs-13">
                          No broken links were found on your website. Excellent job!
                        </td>
                      </tr>
                    ) : (
                      brokenLinksList.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3">
                            <a href={item.brokenUrl} target="_blank" rel="noopener noreferrer" className="text-danger text-decoration-none text-break fw-medium fs-13">
                              {item.brokenUrl}
                            </a>
                          </td>
                          <td className="py-3">
                            <a href={item.foundPage} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none text-break fs-13">
                              {item.foundPage}
                            </a>
                          </td>
                          <td className="py-3 text-muted fs-13">{item.anchorText}</td>
                          <td className="py-3 text-center">
                            <span className="badge bg-danger-subtle text-danger rounded-pill px-2">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination block */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 border-top bg-transparent">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-13 text-muted">Rows per page:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={limit}
                    onChange={(e) => handlePageChange(1, Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <span className="fs-13 text-muted">
                  {totalCount > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalCount)} of {totalCount} pages
                </span>
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-light border-0"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1, limit)}
                  >
                    <i className="isax isax-arrow-left-1" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-light border-0"
                    disabled={page >= Math.ceil(totalCount / limit)}
                    onClick={() => handlePageChange(page + 1, limit)}
                  >
                    <i className="isax isax-arrow-right-1" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbTitle={title}
      breadcrumbParent="Run Website Audit"
      breadcrumbParentHref="/domain/audit"
    >
      <div className="content">
        <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h4 className="mb-1 fw-bold">{h1Title}</h4>
                <p className="text-muted fs-14 mb-0">Detailed view of pages with content issues</p>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(-1)}>
                <i className="isax isax-arrow-left-1 me-1" /> Back to Audit
            </button>
        </div>

        <div className="row g-4 mb-4">
            <div className="col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Affected pages</h6>
                        <div className="d-flex align-items-baseline gap-2 mb-2">
                            <h2 className="fw-bold mb-0 text-primary">{totalCount}</h2>
                            <span className="text-muted fs-14">of {domainTotalPages} pages</span>
                        </div>
                        <div className="mt-4">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fs-12 text-muted">Impact Rate</span>
                                <span className="fs-12 fw-medium">{domainTotalPages ? ((totalCount / domainTotalPages) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div className="progress rounded-pill" style={{ height: 6 }}>
                                <div className="progress-bar bg-warning" style={{ width: domainTotalPages ? `${(totalCount / domainTotalPages) * 100}%` : '0%' }}></div>
                            </div>
                        </div>
                        <p className="fs-12 text-muted mt-3">Fixing these issues improves content quality and user trust.</p>
                    </div>
                </div>
            </div>
            <div className="col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Issue Count per Page (Top 5)</h6>
                        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border" /></div>}>
                            {chartData.series.length > 0 ? (
                                <AffectedPagesChart 
                                    chartId={`sc-chart-${slug}`} 
                                    height={240}
                                    type="bar"
                                    series={chartData.series}
                                    categories={chartData.categories}
                                    colors={['#f59e0b']}
                                    showLegend={false}
                                    tooltipLabel="Issues"
                                />
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-13">
                                    No data to display in graph.
                                </div>
                            )}
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>

        <Suspense fallback={<div className="card p-5 text-center"><div className="spinner-border" /></div>}>
          {!isLoading && pages.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center">
                <div className="mb-3">
                    <i className="isax isax-tick-circle text-success" style={{ fontSize: '3rem' }} />
                </div>
                <h5 className="fw-bold">All Good!</h5>
                <p className="text-muted mb-0">No spelling issues were found in this category.</p>
            </div>
          ) : (
            <SeoHealthExamplesCard 
              totalCount={totalCount} 
              reportTitle={h1Title} 
              rows={pages}
              isLoading={isLoading}
              serverSide={true}
              currentPage={page}
              pageSize={limit}
              onPageChange={handlePageChange}
            />
          )}
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
