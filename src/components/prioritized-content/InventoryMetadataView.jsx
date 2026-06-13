import React, { useState, useMemo } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500];
const DEFAULT_ROWS_PER_PAGE = 10;

const SAMPLE = [
  { id: 1, nameProperty: "charset", content: "UTF-8" },
  {
    id: 2,
    nameProperty: "description",
    content:
      "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS) - Buy ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS) at best price from Example Domain.",
  },
  {
    id: 3,
    nameProperty: "keywords",
    content:
      "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS), gaming laptop, Example Domain",
  },
  {
    id: 4,
    nameProperty: "og:description",
    content:
      "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS) - Buy ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS) at best price from Example Domain.",
  },
  {
    id: 5,
    nameProperty: "og:image",
    content:
      "https://example.com/content/dam/examplemall-site/dam/HostedLink/220126/og_tag.png",
  },
  { id: 6, nameProperty: "og:locale", content: "en_IN" },
  { id: 7, nameProperty: "og:site_name", content: "Example Domain" },
  {
    id: 8,
    nameProperty: "og:title",
    content:
      "ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop (Graphite Black, FA506NFR-HN259WS) - Example Domain",
  },
  { id: 9, nameProperty: "og:type", content: "website" },
  {
    id: 10,
    nameProperty: "og:url",
    content:
      "https://example.com/bmall/asus-amd-ryzen-7-16-gb-ram-512-gb-ssd-windows-11-home-15-6-inch-gaming-laptop-graphite-black-fa506nfr-hn259ws/p/29185",
  },
  { id: 11, nameProperty: "twitter:card", content: "summary_large_image" },
  {
    id: 12,
    nameProperty: "twitter:title",
    content: "ASUS AMD Ryzen 7 16 GB RAM - Example Domain",
  },
  {
    id: 13,
    nameProperty: "twitter:description",
    content:
      "Buy ASUS AMD Ryzen 7 16 GB RAM/ 512 GB SSD/ Windows 11 Home/ 15.6 inch Gaming Laptop at best price from Example Domain.",
  },
  {
    id: 14,
    nameProperty: "twitter:image",
    content:
      "https://example.com/content/dam/examplemall-site/dam/HostedLink/220126/og_tag.png",
  },
  { id: 15, nameProperty: "robots", content: "index, follow" },
  {
    id: 16,
    nameProperty: "viewport",
    content: "width=device-width, initial-scale=1",
  },
  { id: 17, nameProperty: "theme-color", content: "#ffffff" },
  { id: 18, nameProperty: "author", content: "Example Domain" },
  { id: 19, nameProperty: "application-name", content: "Example Domain Mall" },
  {
    id: 20,
    nameProperty: "referrer",
    content: "strict-origin-when-cross-origin",
  },
  { id: 21, nameProperty: "format-detection", content: "telephone=no" },
  { id: 22, nameProperty: "apple-mobile-web-app-capable", content: "yes" },
];

export default function InventoryMetadataView({ items = SAMPLE }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (r) =>
        r.nameProperty.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q),
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
                <i className="isax isax-information fs-22" aria-hidden={true} />
              </span>
              <div>
                <h6 className="mb-0 fw-semibold">Metadata</h6>
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
                aria-label="Search metadata"
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
                    META name/property
                  </th>
                  <th className="text-uppercase fs-12 fw-semibold text-body border-0 py-3 px-4">
                    META content
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
                      style={{ minWidth: 140 }}
                    >
                      <code className="fs-13 bg-light px-2 py-1 rounded">
                        {row.nameProperty}
                      </code>
                    </td>
                    <td
                      className="px-4 py-3 text-body text-break"
                      style={{ wordBreak: "break-word" }}
                    >
                      {row.content.startsWith("http") ? (
                        <a
                          href={row.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                        >
                          {row.content}
                        </a>
                      ) : (
                        <span>{row.content}</span>
                      )}
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
            <nav aria-label="Metadata pagination">
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
