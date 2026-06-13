import React, { useState, useMemo, useCallback } from "react";
import { getAccessibilitySummaryApi } from "@/api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";
import PagesFailingCheckDrawer from "./PagesFailingCheckDrawer";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 5;

// Static SNIPPETS_SAMPLE replaced by API data

const DonutSmall = ({ percent, label, value }) => {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(100, percent) / 100) * circumference;
  return (
    <div className="d-flex flex-column align-items-center">
      <div className="position-relative">
        <svg
          width={88}
          height={88}
          viewBox="0 0 88 88"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <span className="fw-bold text-body" style={{ fontSize: "0.9rem" }}>
            {value}
          </span>
        </div>
      </div>
      <span
        className="text-muted fs-12 mt-1 text-center"
        style={{ maxWidth: 100 }}
      >
        {label}
      </span>
    </div>
  );
};

const AccessibilityFastTrackView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [showFullSnippet, setShowFullSnippet] = useState(false);
  const [checkForDrawer, setCheckForDrawer] = useState(null);
  const [pageDetailsForAccessibility, setPageDetailsForAccessibility] =
    useState(null);

  const snippetRef = React.useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const [summary, setSummary] = useState(null);
  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  const fetchSummary = useCallback(async () => {
    if (!domainId) return;
    try {
      const res = await getAccessibilitySummaryApi(domainId);
      if (res.success && res.data) {
        setSummary(res.data);
        if (res.data.topSnippets && res.data.topSnippets.length > 0) {
          setSelectedSnippetId(res.data.topSnippets[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch fast track summary", err);
    }
  }, [domainId]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenDocuments = useCallback((page) => {
    setCheckForDrawer(null);
    setPageDetailsForAccessibility({ id: 0, title: page.title, url: page.url });
  }, []);

  const filteredSnippets = useMemo(() => {
    const snippets = summary?.topSnippets || [];
    if (!searchQuery.trim()) return snippets;
    const q = searchQuery.toLowerCase();
    return snippets.filter((s) => s.html.toLowerCase().includes(q));
  }, [summary, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSnippets.length / rowsPerPage),
  );
  const paginatedSnippets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSnippets.slice(start, start + rowsPerPage);
  }, [filteredSnippets, currentPage, rowsPerPage]);

  const selectedSnippet = useMemo(() => {
    const snippets = summary?.topSnippets || [];
    return (
      snippets.find((s) => s.id === selectedSnippetId) ||
      snippets[0] || {
        html: "No snippets found",
        effectPercent: 0,
        pagesCount: 0,
        checks: [],
      }
    );
  }, [summary, selectedSnippetId]);

  React.useEffect(() => {
    if (snippetRef.current) {
      const prev = snippetRef.current.style.maxHeight;
      snippetRef.current.style.maxHeight = "80px";
      snippetRef.current.style.overflow = "hidden";
      const overflow = snippetRef.current.scrollHeight > 80;
      snippetRef.current.style.maxHeight = prev;
      snippetRef.current.style.overflow = showFullSnippet
        ? "visible"
        : "hidden";
      setIsOverflowing(overflow);
    }
  }, [selectedSnippet, showFullSnippet]);

  const apiChecks = useMemo(() => {
    if (!summary || !summary.allChecks) return [];

    // Only show checks that this specific snippet is failing on
    const relevantCheckIds = new Set(selectedSnippet?.checks || []);

    const getArea = (tags = []) => {
      const tStr = tags.join(" ").toLowerCase();
      if (tStr.includes("color") || tStr.includes("contrast")) return "Design";
      if (
        tStr.includes("language") ||
        tStr.includes("alt") ||
        tStr.includes("text") ||
        tStr.includes("name") ||
        tStr.includes("label")
      )
        return "Content";
      return "Development";
    };

    const getCriteria = (tags = []) => {
      const wcag = tags.find((t) => t.startsWith("wcag"));
      if (!wcag) return "Best Practice";
      return wcag
        .toUpperCase()
        .replace(/WCAG(\d)(\d)?(A+)?/, (match, p1, p2, p3) => {
          return `WCAG ${p1}${p2 ? "." + p2 : ".0"} ${p3 ? "Level " + p3 : ""}`.trim();
        });
    };

    return summary.allChecks
      .filter((c) => !c.passed && relevantCheckIds.has(c.id))
      .map((c) => ({
        id: c.id,
        question: c.help || c.description || c.id,
        area: getArea(c.tags),
        criteria: getCriteria(c.tags),
        pages: c.count,
      }));
  }, [summary, selectedSnippet]);

  const getSnippetIssueDescriptions = useCallback(
    (snippet) => {
      if (!summary || !summary.allChecks || !snippet.checks)
        return "Unknown issue";
      const relevantCheckIds = new Set(snippet.checks || []);
      const failingChecks = summary.allChecks.filter(
        (c) => !c.passed && relevantCheckIds.has(c.id),
      );
      if (failingChecks.length === 0) return "No failing checks";
      return failingChecks
        .map((c) => c.help || c.description || c.id)
        .join(" • ");
    },
    [summary],
  );

  const failingChecksCount = apiChecks.length;
  const affectedPagesCount = selectedSnippet?.pagesCount || 0;
  const complianceEffect = selectedSnippet?.effectPercent || 0;

  return (
    <div className="accessibility-fast-track-view">
      <div className="mb-4">
        <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
          <i
            className="isax isax-driving text-primary fs-22"
            aria-hidden="true"
          />{" "}
          Accessibility Fast Track
        </h5>
        <p className="text-muted fs-13 mb-0">
          With Fast Track you can fix, review and ignore HTML snippets on
          affected pages all in one go.
        </p>
      </div>

      <div className="position-relative mb-4" style={{ maxWidth: 400 }}>
        <i
          className="isax isax-search-normal-1 text-muted position-absolute top-50 start-0 translate-middle-y ms-3"
          style={{ fontSize: "1rem" }}
          aria-hidden="true"
        />
        <input
          type="search"
          className="form-control form-control-sm border border-secondary border-opacity-25 rounded-2"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Search"
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body px-0">
              <div className="px-3">
                <h6 className="fw-semibold text-body mb-3">
                  HTML snippet affecting compliance level
                </h6>
                <div className="d-flex flex-column gap-2">
                  {paginatedSnippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      type="button"
                      onClick={() => {
                        setSelectedSnippetId(snippet.id);
                        setShowFullSnippet(false);
                      }}
                      className={`btn btn-sm text-start border rounded-2 p-3 d-flex align-items-start gap-2 ${selectedSnippetId === snippet.id ? "border-primary bg-primary bg-opacity-10" : "border-secondary border-opacity-25 bg-transparent"}`}
                    >
                      <i
                        className="isax isax-code-1 text-primary fs-18 flex-shrink-0 mt-1"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-grow-1">
                        <code
                          className="fs-13 text-body text-break d-block"
                          style={{
                            maxHeight: 48,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {snippet.html}
                        </code>
                        <div
                          className="text-muted fs-12 mt-2 mb-1 fw-medium"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={getSnippetIssueDescriptions(snippet)}
                        >
                          <i
                            className="isax isax-info-circle me-1"
                            aria-hidden="true"
                          />
                          {getSnippetIssueDescriptions(snippet)}
                        </div>
                        <span className="text-danger fs-13 fw-medium mt-1 d-inline-block">
                          {snippet.effectPercent}%
                        </span>
                        <span className="text-muted fs-12 ms-1">
                          Effect on compliance
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top border-secondary border-opacity-25 px-3">
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm rounded-2"
                    style={{ width: "auto", minWidth: 70 }}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted small">
                    {(currentPage - 1) * rowsPerPage + 1}–
                    {Math.min(
                      currentPage * rowsPerPage,
                      filteredSnippets.length,
                    )}{" "}
                    of {filteredSnippets.length}
                  </span>
                </div>
                <nav aria-label="Pagination">
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li
                      className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        aria-label="Previous"
                      >
                        «
                      </button>
                    </li>
                    <li
                      className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-2"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Next"
                      >
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="row g-3 mb-4">
            <div className="col-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body py-3 d-flex flex-column align-items-center">
                  <DonutSmall
                    percent={Number(complianceEffect)}
                    label="Effect on overall compliance level"
                    value={`${complianceEffect}%`}
                  />
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body py-3 d-flex flex-column align-items-center">
                  <DonutSmall
                    percent={12}
                    label="Affected pages"
                    value={affectedPagesCount}
                  />
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body py-3 d-flex flex-column align-items-center justify-content-center">
                  <span className="fs-4 fw-bold text-body">
                    {failingChecksCount}
                  </span>
                  <span className="text-muted fs-12 mt-1">Failing checks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-semibold text-body mb-2">Snippet</h6>
              <div className="rounded-2 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25">
                <code
                  ref={snippetRef}
                  className="fs-13 text-danger text-break d-block"
                  style={{
                    maxHeight: showFullSnippet ? "none" : 80,
                    overflow: showFullSnippet ? "visible" : "hidden",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedSnippet.html}
                </code>
              </div>
              {isOverflowing && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-primary mt-2"
                  onClick={() => setShowFullSnippet(!showFullSnippet)}
                >
                  {showFullSnippet ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <h6 className="fw-semibold text-body px-4 pt-3 pb-2">
                Failing Checks for this Snippet
              </h6>
              <div className="table-responsive">
                <table className="table table-hover table-borderless align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                      <th className="py-3 ps-4 text-body fs-13 fw-semibold">
                        Check
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiChecks.map((check) => (
                      <tr
                        key={check.id}
                        className="border-bottom border-secondary border-opacity-25"
                      >
                        <td className="py-3 ps-4">
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <div className="d-flex align-items-start gap-2">
                              <span
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-danger"
                                style={{
                                  width: 28,
                                  height: 28,
                                  backgroundColor: "rgba(220, 53, 69, 0.15)",
                                }}
                              >
                                <i
                                  className="isax isax-danger fs-14"
                                  aria-hidden="true"
                                />
                              </span>
                              <div>
                                <p className="mb-0 fs-13 fw-medium text-body">
                                  {check.question}
                                </p>
                                <p className="mb-0 fs-12 text-muted mt-1">
                                  {check.area} • {check.criteria}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-link p-0 border-0 text-primary fs-13 fw-medium text-decoration-none pe-4"
                              onClick={() => setCheckForDrawer(check)}
                            >
                              {check.pages} PAGES
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!!checkForDrawer && (
        <PagesFailingCheckDrawer
          open={!!checkForDrawer}
          onClose={() => setCheckForDrawer(null)}
          check={checkForDrawer}
          onOpenDocuments={handleOpenDocuments}
        />
      )}

      {!!pageDetailsForAccessibility && (
        <PageDetailsMisspellingsDrawer
          open={!!pageDetailsForAccessibility}
          onClose={() => setPageDetailsForAccessibility(null)}
          page={pageDetailsForAccessibility}
          defaultTab="accessibility"
          backdropZIndex={1075}
          panelZIndex={1080}
        />
      )}
    </div>
  );
};

export default AccessibilityFastTrackView;
