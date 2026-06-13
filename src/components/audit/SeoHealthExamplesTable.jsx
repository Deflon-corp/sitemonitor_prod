import React, { useState, useMemo } from "react";

const SeoHealthExamplesTable = ({ data = [] }) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  const sortedRows = useMemo(() => {
    const byDate = [...data].sort((a, b) => {
      const d = (s) => new Date(s).getTime();
      return sortDesc
        ? d(b.lastCrawled) - d(a.lastCrawled)
        : d(a.lastCrawled) - d(b.lastCrawled);
    });
    return byDate;
  }, [data, sortDesc]);

  const start = (page - 1) * rowsPerPage;
  const pageRows = sortedRows.slice(start, start + rowsPerPage);
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover table-borderless mb-0">
          <thead>
            <tr>
              <th className="fw-semibold text-body">URL</th>
              <th
                className="fw-semibold text-body text-end"
                style={{ minWidth: "140px" }}
              >
                <button
                  type="button"
                  className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center ms-auto"
                  onClick={() => setSortDesc((v) => !v)}
                >
                  Last crawled
                  <i
                    className={`isax ms-1 fs-12 ${sortDesc ? "isax-arrow-down-1" : "isax-arrow-up-1"}`}
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={start + i}>
                <td>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-underline text-break"
                  >
                    {row.url}
                  </a>
                </td>
                <td className="text-end text-body">{row.lastCrawled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 border-top">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-13 text-muted">Rows per page:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
        </div>
        <span className="fs-13 text-muted">
          {start + 1}-{Math.min(start + rowsPerPage, sortedRows.length)} of{" "}
          {sortedRows.length}
        </span>
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-icon btn-sm btn-light"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <i className="isax isax-arrow-left-1" />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm btn-light"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <i className="isax isax-arrow-right-1" />
          </button>
        </div>
      </div>
    </>
  );
};

export default SeoHealthExamplesTable;
