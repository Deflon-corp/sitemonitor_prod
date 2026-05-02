import React, { Suspense, lazy, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getResponseStatusBySlug } from "@/lib/response-status-data";

const AffectedPagesChart = lazy(() => import("@/components/audit/AffectedPagesChart"));
const SEOHealthExamplesCard = lazy(() => import("@/components/audit/SEOHealthExamplesCard"));

export default function ResponseStatusDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const config = slug ? getResponseStatusBySlug(slug) : null;

  useEffect(() => {
    if (!config) navigate("/error-404", { replace: true });
  }, [config, navigate]);

  if (!slug || !config) {
    return React.createElement(
      "div",
      { className: "d-flex align-items-center justify-content-center text-muted", style: { minHeight: 280 } },
      "Loading..."
    );
  }

  const { title, affectedCount, rows } = config;
  const h1Title = `${title} Report`;
  const reportFileTitle = `${title}-response-status`;

  return React.createElement(DashboardLayout, {
    breadcrumbTitle: title,
    breadcrumbParent: "Run Website Audit",
    breadcrumbParentHref: "/domain/audit",
  }, React.createElement("div", { className: "content" },
    React.createElement("h1", { className: "mb-4" }, h1Title),
    React.createElement("div", { className: "card mb-4" },
      React.createElement("div", { className: "card-body" },
        React.createElement("h6", { className: "text-body mb-2" }, "Affected pages"),
        React.createElement("p", { className: "fs-2 fw-bold text-body mb-4" }, affectedCount),
        React.createElement(Suspense, {
          fallback: React.createElement(
            "div",
            { style: { minHeight: 280 }, className: "d-flex align-items-center justify-content-center text-muted" },
            "Loading chart..."
          ),
        }, React.createElement(AffectedPagesChart, { chartId: `response-status-${slug}` }))
      )
    ),
    React.createElement(Suspense, {
      fallback: React.createElement(
        "div",
        { className: "card" },
        React.createElement("div", { className: "card-body" }, React.createElement("p", { className: "text-muted mb-0" }, "Loading table..."))
      ),
    }, React.createElement(SEOHealthExamplesCard, {
      totalCount: affectedCount,
      reportTitle: reportFileTitle,
      rows,
    }))
  ));
}
