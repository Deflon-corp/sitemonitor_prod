function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useState, useCallback } from "react";
import { downloadBlob } from "@/lib/download";

const DIAGNOSTICS_DESCRIPTION =
  "Diagnostics, which flags particular problems that currently exist on your site that need to be addressed, like having file sizes that are too large that are potentially slowing down loading times. They'll let you know exactly what the problem is, how it's impacting your site, and why it needs to be fixed.";

const SAMPLE_AUDITS = [
  {
    id: 1,
    title: "Uses passive listeners to improve scrolling performance",
    description:
      "Consider marking your touch and wheel event listeners as `passive` to improve your page's scroll performance. Learn more about adopting passive event listeners.",
    difficulty: "Easy",
    priority: "Low",
    relevantFor: null,
  },
  {
    id: 2,
    title: "Uses efficient cache policy on static assets",
    description:
      "A long cache lifetime can speed up repeat visits to your page. Learn more about efficient cache policies.",
    difficulty: "Easy",
    priority: "Low",
    relevantFor: null,
  },
  {
    id: 3,
    title: "User Timing marks and measures",
    description:
      "Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. Learn more about User Timing marks.",
    difficulty: "Hard",
    priority: "Low",
    relevantFor: null,
  },
  {
    id: 4,
    title: "Use video formats for animated content",
    description:
      "Large GIFs are inefficient for delivering animated content. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes. Learn more about efficient video formats.",
    difficulty: "Easy",
    priority: "Low",
    relevantFor: "LCP",
  },
  {
    id: 5,
    title: "Use HTTP/2",
    description:
      "HTTP/2 offers many benefits over HTTP/1.1, including binary headers and multiplexing. Learn more about HTTP/2.",
    difficulty: "Moderate",
    priority: "Low",
    relevantFor: null,
  },
  {
    id: 6,
    title: "Serve images in next-gen formats",
    description:
      "Image formats like WebP and AVIF often provide better compression than PNG or JPEG, which means faster downloads and less data consumption. Learn more about modern image formats.",
    difficulty: "Moderate",
    priority: "Low",
    relevantFor: null,
  },
];

function escapeCsvCell(value) {
  const s = String(_nullishCoalesce(value, () => ""));
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function PerformanceDiagnosticsView() {
  const [filter, setFilter] = useState("errors");
  const errorsCount = 38;
  const passedCount = 0;

  const handleExportCsv = useCallback(() => {
    const rows = filter === "errors" ? SAMPLE_AUDITS : [];
    const header = [
      "Audit",
      "Description",
      "Difficulty",
      "Priority",
      "Relevant for",
    ];
    const lines = [
      header.map(escapeCsvCell).join(","),
      ...rows.map((a) =>
        [
          a.title,
          a.description,
          a.difficulty,
          a.priority,
          _nullishCoalesce(a.relevantFor, () => ""),
        ]
          .map(escapeCsvCell)
          .join(","),
      ),
    ];
    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "Diagnostics_report.csv");
  }, [filter]);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex align-items-start gap-2">
        <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0">
          <i className="isax isax-discovery fs-22" aria-hidden={true} />
        </span>
        <div>
          <h6 className="mb-2 fw-semibold text-body">Diagnostics</h6>
          <p
            className="text-muted mb-0"
            style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
          >
            {DIAGNOSTICS_DESCRIPTION}
          </p>
        </div>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3">
        <div className="d-flex gap-1">
          <button
            type="button"
            onClick={() => setFilter("errors")}
            className={`btn btn-sm border-0 rounded-0 bg-transparent px-0 pb-2 pt-0 ${filter === "errors" ? "text-primary border-bottom border-2 border-primary fw-medium" : "text-body"}`}
          >
            Errors ({errorsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("passed")}
            className={`btn btn-sm border-0 rounded-0 bg-transparent px-0 pb-2 pt-0 ms-3 ${filter === "passed" ? "text-primary border-bottom border-2 border-primary fw-medium" : "text-body"}`}
          >
            Passed ({passedCount})
          </button>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-sm btn-light border border-primary text-primary d-inline-flex align-items-center gap-2"
          >
            <i
              className="isax isax-document-download fs-16"
              aria-hidden={true}
            />
            Export
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
            title="Filter"
            aria-label="Filter"
          >
            <i className="isax isax-filter fs-18" aria-hidden={true} />
          </button>
          <div
            className="d-flex align-items-center border border-secondary border-opacity-25 rounded-2 overflow-hidden bg-white"
            style={{ minWidth: 180 }}
          >
            <span
              className="d-flex align-items-center ps-2 pe-1 text-muted"
              aria-hidden={true}
            >
              <i
                className="isax isax-search-normal-1"
                style={{ fontSize: 14 }}
                aria-hidden={true}
              />
            </span>
            <input
              type="search"
              className="form-control form-control-sm border-0 shadow-none bg-transparent py-2"
              placeholder="Search..."
              style={{ fontSize: "0.8rem" }}
              aria-label="Search diagnostics"
            />
          </div>
        </div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                <th
                  className="fw-semibold text-body py-3 ps-4"
                  style={{ width: "35%" }}
                >
                  Audit
                  <i
                    className="isax isax-arrow-down-1 ms-1 opacity-50"
                    style={{ fontSize: 12 }}
                    aria-hidden={true}
                  />
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ width: "12%" }}
                >
                  Difficulty
                  <i
                    className="isax isax-information ms-1 opacity-50"
                    style={{ fontSize: 12 }}
                    aria-hidden={true}
                  />
                </th>
                <th
                  className="fw-semibold text-body py-3"
                  style={{ width: "12%" }}
                >
                  Priority
                </th>
                <th
                  className="fw-semibold text-body py-3 pe-4"
                  style={{ width: "15%" }}
                >
                  Relevant for
                </th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_AUDITS.map((audit) => (
                <tr
                  key={audit.id}
                  className="border-bottom border-secondary border-opacity-10"
                >
                  <td className="ps-4 py-3">
                    <div
                      className="fw-medium text-body mb-1"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {audit.title}
                    </div>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
                    >
                      {audit.description.includes("Learn more about ") ? (
                        <React.Fragment>
                          {audit.description.replace(
                            /\s*Learn more about [^.]+\.?$/,
                            "",
                          )}{" "}
                          <a
                            href="#"
                            className="text-primary text-decoration-underline"
                          >
                            {"Learn more about "}
                            {_optionalChain([
                              audit,
                              "access",
                              (_) => _.description,
                              "access",
                              (_2) => _2.match,
                              "call",
                              (_3) => _3(/Learn more about ([^.]+)/),
                              "optionalAccess",
                              (_4) => _4[1],
                            ])}
                          </a>
                          .
                        </React.Fragment>
                      ) : (
                        audit.description
                      )}
                    </p>
                  </td>
                  <td className="py-3">
                    <span className="text-body" style={{ fontSize: "0.75rem" }}>
                      {audit.difficulty}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className="badge rounded-pill bg-primary bg-opacity-10 text-primary"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {audit.priority}
                    </span>
                  </td>
                  <td className="py-3 pe-4">
                    {audit.relevantFor ? (
                      <span
                        className="text-body"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {audit.relevantFor}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
