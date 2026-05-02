import React, { Suspense, lazy, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getSeoIssuePageTitle, getSeoIssueBySlug } from "@/lib/seo-health-config";

const AffectedPagesChart = lazy(() => import("@/components/audit/AffectedPagesChart"));
const SEOHealthExamplesCard = lazy(() => import("@/components/audit/SEOHealthExamplesCard"));

export default function SEOHealthSlugPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const issue = slug ? getSeoIssueBySlug(slug) : null;

  useEffect(() => {
    if (!issue) navigate("/error-404", { replace: true });
  }, [issue, navigate]);

  if (!slug || !issue) {
    return (
      React.createElement('div', { className: "d-flex align-items-center justify-content-center text-muted"   , style: { minHeight: 280 }}, "Loading..."

      )
    );
  }

  const pageTitle = getSeoIssuePageTitle(slug);
  const h1Title = `${pageTitle} Report`;
  const affectedCount = 91;

  return (
    React.createElement(DashboardLayout, {
      breadcrumbTitle: pageTitle,
      breadcrumbParent: "SEO Health" ,
      breadcrumbParentHref: "/domain/audit"}

      , React.createElement('div', { className: "content"}
        , React.createElement('h1', { className: "mb-4"}, h1Title)

        , React.createElement('div', { className: "card mb-4" }
          , React.createElement('div', { className: "card-body"}
            , React.createElement('h6', { className: "text-body mb-2" }, "Affected pages" )
            , React.createElement('p', { className: "fs-2 fw-bold text-body mb-4"   }, affectedCount)
            , React.createElement(Suspense, { fallback: React.createElement('div', { style: { minHeight: 280 }, className: "d-flex align-items-center justify-content-center text-muted"   }, "Loading chart..." )}
              , React.createElement(AffectedPagesChart, { chartId: `seo-chart-${slug}`} )
            )
          )
        )

        , React.createElement(Suspense, { fallback: React.createElement('div', { className: "card"}, React.createElement('div', { className: "card-body"}, React.createElement('p', { className: "text-muted mb-0" }, "Loading table..." )))}
          , React.createElement(SEOHealthExamplesCard, { totalCount: affectedCount, reportTitle: h1Title} )
        )
      )
    )
  );
}
