import React, { useState, useMemo } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, headerType: "h1", text: "Product specifications" },
  {
    id: 2,
    headerType: "h1",
    text: "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS)",
  },
  { id: 3, headerType: "h2", text: "Frequently asked questions" },
  { id: 4, headerType: "h2", text: "Choose a store you wish to shop from" },
  { id: 5, headerType: "h3", text: "Our Companies" },
  { id: 6, headerType: "h3", text: "Corporate Identity Number (CIN)" },
  { id: 7, headerType: "h3", text: "Example Domain Limited Regd. Office" },
  { id: 8, headerType: "h3", text: "URN - WEB/BFL/23-24/1/V1" },
  {
    id: 9,
    headerType: "h3",
    text: "IRDAI Corporate Agency (Composite) Regn No.",
  },
  { id: 10, headerType: "h3", text: "Corporate Identity Number (CIN)" },
  { id: 11, headerType: "h2", text: "Related products" },
  { id: 12, headerType: "h3", text: "Delivery & returns" },
  { id: 13, headerType: "h3", text: "Warranty information" },
  { id: 14, headerType: "h4", text: "Technical details" },
  { id: 15, headerType: "h4", text: "Payment options" },
  { id: 16, headerType: "h2", text: "Customer reviews" },
  { id: 17, headerType: "h3", text: "Terms and conditions" },
  { id: 18, headerType: "h3", text: "Privacy policy" },
  { id: 19, headerType: "h4", text: "Contact us" },
  { id: 20, headerType: "h1", text: "Home" },
  { id: 21, headerType: "h2", text: "Featured categories" },
  { id: 22, headerType: "h3", text: "Electronics" },
  { id: 23, headerType: "h3", text: "Personal loans" },
  { id: 24, headerType: "h4", text: "Eligibility criteria" },
  { id: 25, headerType: "h2", text: "Quick links" },
];

export default function InventoryHeadersView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (r) =>
        r.headerType.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q),
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
              <span className="avatar avatar-40 avatar-rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold fs-5">
                H
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Headers</h6>
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
                aria-label="Search headers"
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
                    Header type
                  </th>
                  <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                    Text
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-bottom border-secondary border-opacity-25"
                  >
                    <td
                      className="px-4 py-3 text-body align-top"
                      style={{ minWidth: 100 }}
                    >
                      <code className="fs-13 bg-light px-2 py-1 rounded">
                        {row.headerType}
                      </code>
                    </td>
                    <td
                      className="px-4 py-3 text-body text-break"
                      style={{ wordBreak: "break-word" }}
                    >
                      {row.text}
                    </td>
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
            <nav aria-label="Headers pagination">
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
