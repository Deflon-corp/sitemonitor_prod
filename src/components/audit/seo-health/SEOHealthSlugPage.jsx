import React, { Suspense, lazy, useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getSeoIssuePageTitle, getSeoIssueBySlug } from "@/lib/seo-health-config";
import { getDomainSeoPagesApi, getDomainAuditDataApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const AffectedPagesChart = lazy(() => import("@/components/audit/AffectedPagesChart"));
const SeoHealthExamplesCard = lazy(() => import("@/components/audit/SeoHealthExamplesCard"));

export default function SEOHealthSlugPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const issueConfig = slug ? getSeoIssueBySlug(slug) : null;
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [domainTotalPages, setDomainTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (!issueConfig) navigate("/error-404", { replace: true });
  }, [issueConfig, navigate]);

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
      const mapping = {
          'meta-title-missing': 'meta title missing',
          'meta-description-missing': 'meta description missing',
          'h1-tags-missing': 'h1 missing',
          'no-canonical': 'canonical',
          'multiple-h1-tags': 'multiple h1',
          'meta-description-too-long': 'description too long',
          'meta-description-too-short': 'description too short',
          'missing-alt-text': 'alt text'
      };
      
      const res = await getDomainSeoPagesApi(domainId, page, limit, '', mapping[slug] || slug);
      if (res.success) {
        setPages(res.data.pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch SEO health pages:", err);
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
      // Sort by targetedIssueCount to show top issues
      const topPages = [...pages].sort((a, b) => (b.targetedIssueCount || 0) - (a.targetedIssueCount || 0)).slice(0, 10);
      return {
          series: [{ name: 'Issues', data: topPages.map(p => p.targetedIssueCount || 1) }],
          categories: topPages.map(p => {
              const url = p.url || "";
              return url.length > 25 ? "..." + url.slice(-22) : url;
          })
      };
  }, [pages]);

  if (!slug || !issueConfig) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const pageTitle = getSeoIssuePageTitle(slug);
  const h1Title = `${pageTitle} Report`;

  const handlePageChange = (newPage, newLimit) => {
      setPage(newPage);
      setLimit(newLimit);
  };

  return (
    <DashboardLayout
      breadcrumbTitle={pageTitle}
      breadcrumbParent="Run Website Audit"
      breadcrumbParentHref="/domain/audit"
    >
      <div className="content">
        <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h4 className="mb-1 fw-bold">{h1Title}</h4>
                <p className="text-muted fs-14 mb-0">Detailed view of pages affected by {pageTitle.toLowerCase()}</p>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(-1)}>
                <i className="isax isax-arrow-left-1 me-1" /> Back to Audit
            </button>
        </div>

        <div className="row g-4 mb-4">
            <div className="col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Summary</h6>
                        <div className="d-flex align-items-baseline gap-2 mb-2">
                            <h2 className="fw-bold mb-0 text-primary">{totalCount}</h2>
                            <span className="text-muted fs-14">Affected Pages</span>
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
                        <p className="fs-12 text-muted mt-3">
                            {totalCount > 0 ? "Optimization required for these pages." : "No critical issues found in the latest scan."}
                        </p>
                    </div>
                </div>
            </div>
            <div className="col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">Issue count per Page (Top 10)</h6>
                        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border" /></div>}>
                            {chartData.series.length > 0 ? (
                                <AffectedPagesChart 
                                    chartId={`seo-chart-${slug}`} 
                                    height={240}
                                    type="bar"
                                    series={chartData.series}
                                    categories={chartData.categories}
                                    colors={['#ef4444']}
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
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
