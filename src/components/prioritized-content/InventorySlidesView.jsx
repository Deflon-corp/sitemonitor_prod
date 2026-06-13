import React, { useState, useMemo } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  {
    id: 1,
    link: "https://cms-assets.example.com/presentations/investor-deck-q1-2025.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 2,
    link: "https://cms-assets.example.com/presentations/board-update-mar-25.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 3,
    link: "https://cms-assets.example.com/presentations/product-overview.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 4,
    link: "https://cms-assets.example.com/presentations/compliance-training.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 5,
    link: "https://cms-assets.example.com/presentations/quarterly-results-fy25.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 6,
    link: "https://cms-assets.example.com/presentations/risk-assessment.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 7,
    link: "https://cms-assets.example.com/presentations/customer-journey.pptx",
    type: "Slides",
    responseCode: "200",
  },
  {
    id: 8,
    link: "https://cms-assets.example.com/presentations/strategy-2025.pptx",
    type: "Slides",
    responseCode: "200",
  },
];

export default function InventorySlidesView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((r) =>
      r.link.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  return (
    <React.Fragment>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                <i
                  className="isax isax-presention-chart fs-22"
                  aria-hidden={true}
                />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Slides</h6>
                <p className="text-muted fs-13 mb-0">
                  {filteredItems.length}
                  {" found"}
                </p>
              </div>
            </div>
            <div
              className="flex-grow-1 flex-md-grow-0"
              style={{ minWidth: 200, maxWidth: 320 }}
            >
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search slides"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless align-middle mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                    Link
                  </th>
                  <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                    Type
                  </th>
                  <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                    Response code
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <a
                        href={row.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none text-break"
                      >
                        {row.link}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <span className="badge bg-secondary bg-opacity-25 text-body">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-body">{row.responseCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
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
                {(currentPage - 1) * rowsPerPage + 1}-
                {Math.min(currentPage * rowsPerPage, filteredItems.length)}
                {" of "}
                {filteredItems.length}
              </span>
            </div>
            <nav aria-label="Slides pagination">
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous"
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li
                      key={p}
                      className={`page-item ${currentPage === p ? "active" : ""}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ),
                )}
                <li
                  className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    aria-label="Next"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
