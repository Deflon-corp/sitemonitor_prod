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
