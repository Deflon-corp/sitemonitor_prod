import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getResponseStatusBySlug } from "@/lib/response-status-data";
import { getDomainSeoPagesApi, getDomainAuditDataApi } from "@/api/domainApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const AffectedPagesChart = lazy(
  () => import("@/components/audit/AffectedPagesChart"),
);
const SeoHealthExamplesCard = lazy(
  () => import("@/components/audit/SeoHealthExamplesCard"),
);

export default function ResponseStatusDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const config = slug ? getResponseStatusBySlug(slug) : null;
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [domainTotalPages, setDomainTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  useEffect(() => {
    if (!config) navigate("/error-404", { replace: true });
  }, [config, navigate]);

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
      const res = await getDomainSeoPagesApi(domainId, page, limit, "", slug);
      if (res.success) {
        setPages(res.data.pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch response status pages:", err);
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
    const topPages = [...pages].slice(0, 10);
    return {
      series: [{ name: "Status", data: topPages.map((p) => 1) }], // Constant 1 per page for status reports
      categories: topPages.map((p) => {
        const url = p.url || "";
        return url.length > 25 ? "..." + url.slice(-22) : url;
      }),
    };
  }, [pages]);

  if (!slug || !config) {
    return (
      <div
        className="d-flex align-items-center justify-content-center text-muted"
        style={{ minHeight: 400 }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const { title } = config;
  const h1Title = `${title} Report`;
  const reportFileTitle = `${title}-response-status`;

  const handlePageChange = (newPage, newLimit) => {
    setPage(newPage);
    setLimit(newLimit);
  };

  const statusColor = slug.startsWith("2")
    ? "#10b981"
    : slug.startsWith("3")
      ? "#f59e0b"
      : "#ef4444";

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
            <p className="text-muted fs-14 mb-0">
              Pages with HTTP {slug} response status
            </p>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate(-1)}
          >
            <i className="isax isax-arrow-left-1 me-1" /> Back to Audit
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">
                  Overview
                </h6>
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <h2 className="fw-bold mb-0 text-primary">{totalCount}</h2>
                  <span className="text-muted fs-14">Affected Pages</span>
                </div>
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-12 text-muted">Domain Impact</span>
                    <span className="fs-12 fw-medium">
                      {domainTotalPages
                        ? ((totalCount / domainTotalPages) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: 6 }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: domainTotalPages
                          ? `${(totalCount / domainTotalPages) * 100}%`
                          : "0%",
                        backgroundColor: statusColor,
                      }}
                    ></div>
                  </div>
                </div>
                <p className="fs-12 text-muted mt-3">
                  Distribution of status codes across the scanned domain.
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h6 className="text-muted fs-13 mb-3 text-uppercase fw-bold ls-1">
                  Affected Pages (Top 10)
                </h6>
                <Suspense
                  fallback={
                    <div className="p-5 text-center">
                      <div className="spinner-border" />
                    </div>
                  }
                >
                  {chartData.series.length > 0 ? (
                    <AffectedPagesChart
                      chartId={`rs-chart-${slug}`}
                      height={240}
                      type="bar"
                      series={chartData.series}
                      categories={chartData.categories}
                      colors={[statusColor]}
                      showLegend={false}
                      tooltipLabel="Count"
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

        <Suspense
          fallback={
            <div className="card p-5 text-center">
              <div className="spinner-border" />
            </div>
          }
        >
          <SeoHealthExamplesCard
            totalCount={totalCount}
            reportTitle={reportFileTitle}
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
