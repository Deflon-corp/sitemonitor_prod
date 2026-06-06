import React, { useState, useMemo, useCallback } from "react";
import AccessibilityIssuesDrawer from "./AccessibilityIssuesDrawer";
import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import { getAccessibilitySummaryApi } from "@/api/accessibilityApi";
import { SELECTED_DOMAIN_KEY } from "@/layouts/Sidebar";

const PRINCIPLES = [
  {
    id: 1,
    name: "Principle 1: Perceivable",
    description: "Information and user interface components must be presentable to users in ways they can perceive.",
    guidelines: [
      { id: "1.1", title: "Text Alternatives: Provide text alternatives for any non-text content.", level: null, error: 0, warning: 0, review: 0 },
      { id: "1.1.1", title: "Non-text Content", level: "A", error: 996, warning: 0, review: 0 },
      { id: "1.2", title: "Time-based Media: Provide alternatives for time-based media.", level: null, error: 0, warning: 0, review: 0 },
      { id: "1.2.1", title: "Audio-only and Video-only (Prerecorded)", level: "A", error: 0, warning: 0, review: 0 },
      { id: "1.2.2", title: "Captions (Prerecorded)", level: "A", error: 0, warning: 0, review: 0 },
      { id: "1.2.3", title: "Audio Description or Media Alternative (Prerecorded)", level: "A", error: 0, warning: 0, review: 0 },
      { id: "1.2.4", title: "Captions (Live)", level: "AA", error: 0, warning: 0, review: 0 },
      { id: "1.2.5", title: "Audio Description (Prerecorded)", level: "AA", error: 0, warning: 0, review: 0 },
      { id: "1.3", title: "Adaptable: Create content that can be presented in different ways (for example simpler layout) without losing information or structure.", level: null, error: 0, warning: 0, review: 0 },
      { id: "1.3.1", title: "Info and Relationships", level: "A", error: 455, warning: 55542, review: 8393 },
      { id: "1.3.2", title: "Meaningful Sequence", level: "A", error: 0, warning: 1, review: 14579 },
      { id: "1.3.3", title: "Sensory Characteristics", level: "A", error: 0, warning: 0, review: 500 },
      { id: "1.3.4", title: "Orientation", level: "AA", error: 0, warning: 0, review: 0 },
    ],
  },
  {
    id: 2,
    name: "Principle 2: Operable",
    description: "User interface components and navigation must be operable.",
    guidelines: [
      { id: "2.1", title: "Keyboard: Make all functionality available from a keyboard.", level: null, error: 0, warning: 0, review: 0 },
      { id: "2.1.1", title: "Keyboard", level: "A", error: 0, warning: 0, review: 0 },
      { id: "2.1.2", title: "No Keyboard Trap", level: "A", error: 0, warning: 0, review: 0 },
      { id: "2.2", title: "Enough Time: Provide users enough time to read and use content.", level: null, error: 0, warning: 0, review: 0 },
      { id: "2.2.1", title: "Timing Adjustable", level: "A", error: 0, warning: 0, review: 0 },
    ],
  },
  {
    id: 3,
    name: "Principle 3: Understandable",
    description: "Information and the operation of user interface must be understandable.",
    guidelines: [
      { id: "3.1", title: "Readable: Make text content readable and understandable.", level: null, error: 0, warning: 0, review: 0 },
      { id: "3.1.1", title: "Language of Page", level: "A", error: 0, warning: 0, review: 0 },
      { id: "3.2", title: "Predictable: Make Web pages appear and operate in predictable ways.", level: null, error: 0, warning: 0, review: 0 },
      { id: "3.2.1", title: "On Focus", level: "A", error: 0, warning: 0, review: 0 },
    ],
  },
  {
    id: 4,
    name: "Principle 4: Robust",
    description: "Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.",
    guidelines: [
      { id: "4.1", title: "Compatible: Maximize compatibility with current and future user agents.", level: null, error: 0, warning: 0, review: 0 },
      { id: "4.1.1", title: "Parsing", level: "A", error: 0, warning: 0, review: 0 },
      { id: "4.1.2", title: "Name, Role, Value", level: "A", error: 382, warning: 1240, review: 256 },
    ],
  },
];

/** Group flat guidelines into parent (level null) + children (success criteria). */
const groupGuidelines = (guidelines) => {
  const groups = [];
  let current = null;
  for (const g of guidelines) {
    if (g.level === null) {
      current = { parent: g, children: [] };
      groups.push(current);
    } else if (current) {
      current.children.push(g);
    }
  }
  return groups;
};

const GuidelinesView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrincipleIds, setExpandedPrincipleIds] = useState(new Set());
  const [expandedGuidelineIds, setExpandedGuidelineIds] = useState(new Set());
  const [issuesDrawerOpen, setIssuesDrawerOpen] = useState(false);
  const [issuesDrawerContext, setIssuesDrawerContext] = useState(null);
  const [pageDetailsDrawerOpen, setPageDetailsDrawerOpen] = useState(false);
  const [selectedPageForDetails, setSelectedPageForDetails] = useState(null);
  const [summary, setSummary] = useState(null);

  const domainId = sessionStorage.getItem(SELECTED_DOMAIN_KEY);

  React.useEffect(() => {
    if (!domainId) return;
    getAccessibilitySummaryApi(domainId).then(res => {
      if (res.success) setSummary(res.data);
    });
  }, [domainId]);

  const dynamicPrinciples = useMemo(() => {
    const principles = JSON.parse(JSON.stringify(PRINCIPLES));
    principles.forEach(p => p.guidelines.forEach(g => {
      g.error = 0; g.warning = 0; g.review = 0;
    }));

    if (!summary || !summary.allChecks) return principles;

    const counts = {};
    const addCount = (id, type, amount) => {
      if (!counts[id]) counts[id] = { error: 0, warning: 0, review: 0 };
      counts[id][type] += amount;
    };

    summary.allChecks.forEach(check => {
      if (check.passed) return;
      
      const type = check.impact === 'critical' || check.impact === 'serious' ? 'error' 
                 : check.impact === 'moderate' ? 'warning' 
                 : 'review';
      
      (check.tags || []).forEach(tag => {
        const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
        if (match) {
          const guidelineId = `${match[1]}.${match[2]}.${match[3]}`;
          const parentId = `${match[1]}.${match[2]}`;
          addCount(guidelineId, type, check.count);
          addCount(parentId, type, check.count);
        }
      });
    });

    principles.forEach(p => {
      p.guidelines.forEach(g => {
        if (counts[g.id]) {
          g.error = counts[g.id].error;
          g.warning = counts[g.id].warning;
          g.review = counts[g.id].review;
        }
      });
    });

    return principles;
  }, [summary]);

  const openPageDetails = useCallback((page) => {
    setIssuesDrawerOpen(false);
    setSelectedPageForDetails({ id: 0, title: page.title, url: page.url });
    setPageDetailsDrawerOpen(true);
  }, []);

  const openIssuesDrawer = (item, issueType) => {
    const count = issueType === "error" ? item.error : issueType === "warning" ? item.warning : item.review;
    setIssuesDrawerContext({
      guidelineId: item.id,
      guidelineTitle: `${item.title}${item.level ? ` (${item.level})` : ""}`,
      issueType,
      count,
    });
    setIssuesDrawerOpen(true);
  };

  const togglePrinciple = (id) => {
    setExpandedPrincipleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGuideline = (id) => {
    setExpandedGuidelineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredPrinciples = useMemo(() => {
    if (!searchQuery.trim()) return dynamicPrinciples;
    const q = searchQuery.toLowerCase();
    return dynamicPrinciples.map((principle) => ({
      ...principle,
      guidelines: principle.guidelines.filter(
        (g) =>
          principle.name.toLowerCase().includes(q) ||
          principle.description.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q)
      ),
    })).filter((p) => p.guidelines.length > 0);
  }, [searchQuery, dynamicPrinciples]);

  const principlesWithGroups = useMemo(
    () => filteredPrinciples.map((p) => ({ ...p, groups: groupGuidelines(p.guidelines) })),
    [filteredPrinciples]
  );

  return (
    <div className="guidelines-view">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h5 className="mb-1 fw-semibold text-body d-flex align-items-center gap-2">
            <i className="isax isax-menu text-primary fs-22" aria-hidden="true" /> Guidelines for WCAG 2.2
          </h5>
          <p className="text-muted fs-13 mb-0">List of checks with and without issues categorized by WCAG 2.2 guidelines</p>
        </div>
        <div
          className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
          style={{ width: 220 }}
        >
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

      {/* Principles and guidelines */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="py-3 ps-4 text-body fs-13 fw-semibold text-nowrap">Guideline</th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap text-end">
                    <span className="d-inline-flex align-items-center gap-1">Error</span>
                    <i className="isax isax-arrow-down-1 fs-12 opacity-50 ms-1" aria-hidden="true" />
                  </th>
                  <th className="py-3 px-3 text-body fs-13 fw-semibold text-nowrap text-end">
                    <span className="d-inline-flex align-items-center gap-1">Warning</span>
                    <i className="isax isax-arrow-down-1 fs-12 opacity-50 ms-1" aria-hidden="true" />
                  </th>
                  <th className="py-3 pe-4 text-body fs-13 fw-semibold text-nowrap text-end">
                    <span className="d-inline-flex align-items-center gap-1">Review</span>
                    <i className="isax isax-arrow-down-1 fs-12 opacity-50 ms-1" aria-hidden="true" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {principlesWithGroups.map((principle) => (
                  <React.Fragment key={principle.id}>
                    <tr
                      className="bg-light"
                      role="button"
                      tabIndex={0}
                      onClick={() => togglePrinciple(principle.id)}
                      onKeyDown={(e) => e.key === "Enter" && togglePrinciple(principle.id)}
                    >
                      <td className="py-3 ps-4" colSpan={4}>
                        <div className="d-flex align-items-center gap-2">
                          <i
                            className={`isax isax-arrow-down-1 fs-14 transition-transform flex-shrink-0 ${expandedPrincipleIds.has(principle.id) ? "" : "rotate-n90"}`}
                            style={{ transform: expandedPrincipleIds.has(principle.id) ? undefined : "rotate(-90deg)" }}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="fw-semibold text-body">{principle.name}</span>
                            <p className="text-muted fs-13 mb-0 mt-1">{principle.description}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedPrincipleIds.has(principle.id) &&
                      principle.groups.map(({ parent, children }) => (
                        <React.Fragment key={`${principle.id}-${parent.id}`}>
                          <tr
                            className="bg-light"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleGuideline(parent.id)}
                            onKeyDown={(e) => e.key === "Enter" && toggleGuideline(parent.id)}
                          >
                            <td className="py-2 ps-4" colSpan={4}>
                              <div className="d-flex align-items-center gap-2">
                                <i
                                  className="isax isax-arrow-down-1 fs-14 flex-shrink-0"
                                  style={{ transform: expandedGuidelineIds.has(parent.id) ? undefined : "rotate(-90deg)" }}
                                  aria-hidden="true"
                                />
                                <i className="isax isax-document-text text-muted fs-16 flex-shrink-0" aria-hidden="true" />
                                <span className="fw-medium fs-13 text-body">
                                  {parent.id} {parent.title}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {expandedGuidelineIds.has(parent.id) &&
                            children.map((item) => (
                              <tr key={`${principle.id}-${item.id}`}>
                                <td className="py-2 ps-4">
                                  <div className="d-flex align-items-center gap-2 ms-4">
                                    <span
                                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                      style={{
                                        width: 24,
                                        height: 24,
                                        fontSize: "0.7rem",
                                        backgroundColor: "#dc3545",
                                      }}
                                      aria-hidden="true"
                                    >
                                      {item.level}
                                    </span>
                                    <span className="fw-medium fs-13 text-body">
                                      {item.id} {item.title} ({item.level})
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-end">
                                  <button
                                    type="button"
                                    className={`btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1 fs-13 text-decoration-none ${item.error > 0 ? "text-danger" : "text-body"}`}
                                    title="View list of accessibility issues (errors)"
                                    onClick={() => openIssuesDrawer(item, "error")}
                                    aria-label={`${item.error} errors – open list`}
                                  >
                                    <i className="isax isax-danger text-danger fs-14" aria-hidden="true" />
                                    {item.error.toLocaleString()}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-end">
                                  <button
                                    type="button"
                                    className={`btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1 fs-13 text-decoration-none ${item.warning > 0 ? "text-warning" : "text-body"}`}
                                    title="View list of accessibility issues (warnings)"
                                    onClick={() => openIssuesDrawer(item, "warning")}
                                    aria-label={`${item.warning} warnings – open list`}
                                  >
                                    <i className="isax isax-notification text-warning fs-14" aria-hidden="true" />
                                    {item.warning.toLocaleString()}
                                  </button>
                                </td>
                                <td className="py-2 pe-4 text-end">
                                  <button
                                    type="button"
                                    className={`btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1 fs-13 text-decoration-none ${item.review > 0 ? "text-primary" : "text-body"}`}
                                    title="View list of accessibility issues (review)"
                                    onClick={() => openIssuesDrawer(item, "review")}
                                    aria-label={`${item.review} review – open list`}
                                  >
                                    <i className="isax isax-eye text-primary fs-14" aria-hidden="true" />
                                    {item.review.toLocaleString()}
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPrinciples.length === 0 && (
            <div className="text-center text-muted py-5">No guidelines match your search.</div>
          )}
        </div>
      </div>

      <AccessibilityIssuesDrawer
        open={issuesDrawerOpen}
        onClose={() => {
          setIssuesDrawerOpen(false);
          setIssuesDrawerContext(null);
        }}
        guidelineLabel={issuesDrawerContext ? `${issuesDrawerContext.guidelineId} ${issuesDrawerContext.guidelineTitle}` : undefined}
        guidelineId={issuesDrawerContext?.guidelineId}
        issueType={issuesDrawerContext?.issueType}
        totalCount={issuesDrawerContext?.count ?? 0}
        onOpenPageDetails={openPageDetails}
      />

      <PageDetailsMisspellingsDrawer
        open={pageDetailsDrawerOpen}
        onClose={() => {
          setPageDetailsDrawerOpen(false);
          setSelectedPageForDetails(null);
        }}
        page={selectedPageForDetails}
        defaultTab="accessibility"
        backdropZIndex={1075}
        panelZIndex={1080}
      />
    </div>
  );
};

export default GuidelinesView;
