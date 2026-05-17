import React, { useState, useEffect, useMemo, useCallback } from "react";
import inventoryApi from "@/api/inventoryApi";
import DownloadReportDropdown from "@/components/ui/DownloadReportDropdown";
import { downloadBlob, safeFilename } from "@/lib/download";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function InventoryDetailsView({ domainId, currentView }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Debounce search input for high performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch detailed data from server-side paginated API
  const fetchData = useCallback(async () => {
    if (!domainId || !currentView) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getInventoryDetails(domainId, {
        type: currentView,
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      if (res && res.success && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch inventory details:", err);
    } finally {
      setLoading(false);
    }
  }, [domainId, currentView, page, limit, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when current tab changes
  useEffect(() => {
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setSortBy("");
    setSortOrder("asc");
    setExpandedId(null);
  }, [currentView]);

  const handleSort = (field) => {
    setPage(1);
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Label configuration based on selected view
  const viewConfig = useMemo(() => {
    switch (currentView) {
      case "html-pages":
        return {
          title: "HTML Pages",
          icon: "isax-document-copy",
          badgeColor: "bg-primary bg-opacity-10 text-primary",
          headers: [
            { label: "Title and URL", field: "page_title" },
            { label: "Status Code", field: "status_code" },
          ],
        };
      case "images":
        return {
          title: "Images",
          icon: "isax-gallery",
          badgeColor: "bg-success bg-opacity-10 text-success",
          headers: [
            { label: "Image URL", field: "image_url" },
            { label: "Found on Page", field: "page_url" },
            { label: "Alt Text", field: "alt_text" },
            { label: "Status", field: "status_code" },
          ],
        };
      case "css":
        return {
          title: "CSS Stylesheets",
          icon: "isax-code-1",
          badgeColor: "bg-warning bg-opacity-10 text-warning",
          headers: [
            { label: "Stylesheet URL", field: "css_url" },
            { label: "Found on Page", field: "page_url" },
            { label: "Status", field: "status_code" },
          ],
        };
      case "js":
        return {
          title: "JavaScript Files",
          icon: "isax-braces",
          badgeColor: "bg-info bg-opacity-10 text-info",
          headers: [
            { label: "JS File URL", field: "js_url" },
            { label: "Found on Page", field: "page_url" },
            { label: "Status", field: "status_code" },
          ],
        };
      case "documents":
        return {
          title: "Documents",
          icon: "isax-folder-2",
          badgeColor: "bg-danger bg-opacity-10 text-danger",
          headers: [
            { label: "Document URL", field: "document_url" },
            { label: "Found on Page", field: "page_url" },
            { label: "Type", field: "document_type" },
          ],
        };
      case "emails":
        return {
          title: "Email Addresses",
          icon: "isax-sms",
          badgeColor: "bg-secondary bg-opacity-10 text-secondary",
          headers: [
            { label: "Email Address", field: "email_address" },
            { label: "Found on Page", field: "page_url" },
          ],
        };
      case "headlinks":
        return {
          title: "Head Relations",
          icon: "isax-link-2",
          badgeColor: "bg-dark bg-opacity-10 text-dark",
          headers: [
            { label: "Relation Type (rel)", field: "rel_type" },
            { label: "Href URL", field: "href" },
            { label: "Found on Page", field: "page_url" },
          ],
        };
      case "links":
        return {
          title: "Scanned Links",
          icon: "isax-link-2",
          badgeColor: "bg-primary bg-opacity-10 text-primary",
          headers: [
            { label: "Target URL", field: "link_url" },
            { label: "Found on Page", field: "page_url" },
            { label: "Anchor Text", field: "anchor_text" },
            { label: "Type", field: "link_type" },
            { label: "Status", field: "status_code" },
          ],
        };
      case "forms":
        return {
          title: "Scanned Forms",
          icon: "isax-element-3",
          badgeColor: "bg-success bg-opacity-10 text-success",
          headers: [
            { label: "Form Action URL", field: "form_action" },
            { label: "Found on Page", field: "page_url" },
            { label: "Method", field: "form_method" },
            { label: "Inputs Count", field: "input_count" },
          ],
        };
      case "iframes":
        return {
          title: "Scanned IFrames",
          icon: "isax-code-circle",
          badgeColor: "bg-info bg-opacity-10 text-info",
          headers: [
            { label: "IFrame Source (src)", field: "iframe_src" },
            { label: "Found on Page", field: "page_url" },
          ],
        };
      case "frames":
        return {
          title: "Scanned Frames",
          icon: "isax-code-circle",
          badgeColor: "bg-warning bg-opacity-10 text-warning",
          headers: [
            { label: "Frame Source (src)", field: "frame_src" },
            { label: "Found on Page", field: "page_url" },
          ],
        };
      default:
        return { title: "Scanned Assets", icon: "isax-box", badgeColor: "bg-light text-muted", headers: [] };
    }
  }, [currentView]);

  // Export handlers
  const reportBase = safeFilename(`${viewConfig.title}-Report`);
  const exportCSV = useCallback(() => {
    let header = "";
    let body = "";

    switch (currentView) {
      case "html-pages":
        header = "Title,Page URL,Status Code\n";
        body = items.map((r) => `"${(r.page_title || "").replace(/"/g, '""')}","${r.page_url}",${r.status_code}`).join("\n");
        break;
      case "images":
        header = "Image URL,Page URL,Alt Text,Type,Status Code\n";
        body = items.map((r) => `"${r.image_url}","${r.page_url}","${(r.alt_text || "").replace(/"/g, '""')}","${r.image_type || ""}",${r.status_code || 200}`).join("\n");
        break;
      case "css":
        header = "CSS URL,Page URL,Status Code\n";
        body = items.map((r) => `"${r.css_url}","${r.page_url}",${r.status_code || 200}`).join("\n");
        break;
      case "js":
        header = "JS URL,Page URL,Status Code\n";
        body = items.map((r) => `"${r.js_url}","${r.page_url}",${r.status_code || 200}`).join("\n");
        break;
      case "documents":
        header = "Document URL,Page URL,Type\n";
        body = items.map((r) => `"${r.document_url}","${r.page_url}","${r.document_type}"`).join("\n");
        break;
      case "emails":
        header = "Email Address,Page URL\n";
        body = items.map((r) => `"${r.email_address}","${r.page_url}"`).join("\n");
        break;
      case "headlinks":
        header = "Rel Type,Href URL,Page URL\n";
        body = items.map((r) => `"${r.rel_type}","${r.href}","${r.page_url}"`).join("\n");
        break;
      case "links":
        header = "Target URL,Page URL,Anchor Text,Type,Status Code\n";
        body = items.map((r) => `"${r.link_url}","${r.page_url}","${(r.anchor_text || "").replace(/"/g, '""')}","${r.link_type}",${r.status_code}`).join("\n");
        break;
      case "forms":
        header = "Form Action,Found on Page,Method,Inputs Count\n";
        body = items.map((r) => `"${r.form_action || ""}","${r.page_url}","${r.form_method || "GET"}",${r.input_count || 0}`).join("\n");
        break;
      case "iframes":
        header = "IFrame Source,Found on Page\n";
        body = items.map((r) => `"${r.iframe_src || ""}","${r.page_url}"`).join("\n");
        break;
      case "frames":
        header = "Frame Source,Found on Page\n";
        body = items.map((r) => `"${r.frame_src || ""}","${r.page_url}"`).join("\n");
        break;
    }
    downloadBlob(new Blob([header + body], { type: "text/csv;charset=utf-8;" }), `${reportBase}.csv`);
  }, [items, currentView, reportBase]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    let mapped = [];
    switch (currentView) {
      case "html-pages":
        mapped = items.map((r) => ({ Title: r.page_title, URL: r.page_url, Status: r.status_code }));
        break;
      case "images":
        mapped = items.map((r) => ({ "Image URL": r.image_url, "Page URL": r.page_url, "Alt Text": r.alt_text, Type: r.image_type, Status: r.status_code || 200 }));
        break;
      case "css":
        mapped = items.map((r) => ({ "CSS URL": r.css_url, "Page URL": r.page_url, Status: r.status_code || 200 }));
        break;
      case "js":
        mapped = items.map((r) => ({ "JS URL": r.js_url, "Page URL": r.page_url, Status: r.status_code || 200 }));
        break;
      case "documents":
        mapped = items.map((r) => ({ "Document URL": r.document_url, "Page URL": r.page_url, Type: r.document_type }));
        break;
      case "emails":
        mapped = items.map((r) => ({ Email: r.email_address, "Page URL": r.page_url }));
        break;
      case "headlinks":
        mapped = items.map((r) => ({ Rel: r.rel_type, Href: r.href, "Page URL": r.page_url }));
        break;
      case "links":
        mapped = items.map((r) => ({ "Target URL": r.link_url, "Found on Page": r.page_url, "Anchor Text": r.anchor_text, Type: r.link_type, Status: r.status_code }));
        break;
      case "forms":
        mapped = items.map((r) => ({ "Form Action": r.form_action, "Found on Page": r.page_url, Method: r.form_method, "Inputs Count": r.input_count }));
        break;
      case "iframes":
        mapped = items.map((r) => ({ "IFrame Source": r.iframe_src, "Found on Page": r.page_url }));
        break;
      case "frames":
        mapped = items.map((r) => ({ "Frame Source": r.frame_src, "Found on Page": r.page_url }));
        break;
    }
    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Details");
    XLSX.writeFile(wb, `${reportBase}.xlsx`);
  }, [items, currentView, reportBase]);

  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    let head = [];
    let body = [];

    switch (currentView) {
      case "html-pages":
        head = [["Title", "Page URL", "Status"]];
        body = items.map((r) => [r.page_title || "", r.page_url, String(r.status_code)]);
        break;
      case "images":
        head = [["Image URL", "Page URL", "Alt Text", "Type", "Status"]];
        body = items.map((r) => [r.image_url, r.page_url, r.alt_text || "", r.image_type || "", String(r.status_code || 200)]);
        break;
      case "css":
        head = [["CSS URL", "Page URL", "Status"]];
        body = items.map((r) => [r.css_url, r.page_url, String(r.status_code || 200)]);
        break;
      case "js":
        head = [["JS URL", "Page URL", "Status"]];
        body = items.map((r) => [r.js_url, r.page_url, String(r.status_code || 200)]);
        break;
      case "documents":
        head = [["Document URL", "Page URL", "Type"]];
        body = items.map((r) => [r.document_url, r.page_url, r.document_type]);
        break;
      case "emails":
        head = [["Email Address", "Page URL"]];
        body = items.map((r) => [r.email_address, r.page_url]);
        break;
      case "headlinks":
        head = [["Rel", "Href URL", "Page URL"]];
        body = items.map((r) => [r.rel_type, r.href, r.page_url]);
        break;
      case "links":
        head = [["Target URL", "Found on Page", "Anchor Text", "Type", "Status"]];
        body = items.map((r) => [r.link_url, r.page_url, r.anchor_text || "", r.link_type, String(r.status_code)]);
        break;
      case "forms":
        head = [["Form Action", "Found on Page", "Method", "Inputs"]];
        body = items.map((r) => [r.form_action || "", r.page_url, r.form_method || "GET", String(r.input_count || 0)]);
        break;
      case "iframes":
        head = [["IFrame Source", "Found on Page"]];
        body = items.map((r) => [r.iframe_src || "", r.page_url]);
        break;
      case "frames":
        head = [["Frame Source", "Found on Page"]];
        body = items.map((r) => [r.frame_src || "", r.page_url]);
        break;
    }

    autoTable(doc, {
      head,
      body,
      startY: 10,
      styles: { fontSize: 8 },
    });
    doc.save(`${reportBase}.pdf`);
  }, [items, currentView, reportBase]);

  const SortIcon = ({ column }) => (
    <i
      className={`isax ms-1 fs-12 ${
        sortBy === column
          ? sortOrder === "asc"
            ? "isax-arrow-up-1"
            : "isax-arrow-down-1"
          : "isax-arrow-down-1"
      }`}
      style={{ opacity: sortBy === column ? 1 : 0.4 }}
      aria-hidden="true"
    />
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      {/* Title Header Card */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <span
              className={`avatar avatar-40 avatar-rounded d-flex align-items-center justify-content-center flex-shrink-0 ${viewConfig.badgeColor}`}
            >
              <i className={`isax ${viewConfig.icon} fs-22`} aria-hidden="true" />
            </span>
            <div>
              <h6 className="mb-0 fw-semibold text-body">{viewConfig.title}</h6>
              <p className="text-muted fs-13 mb-0">
                {loading ? "Loading..." : `${total} items scanned`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Exports */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
              >
                <i className={`isax ${viewConfig.icon}`} aria-hidden="true" />
                All List
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              {items.length > 0 && (
                <DownloadReportDropdown
                  reportBaseName={reportBase}
                  onExportCSV={exportCSV}
                  onExportExcel={exportExcel}
                  onExportPDF={exportPDF}
                  variant="icon"
                />
              )}
              <div className="input-group input-group-sm" style={{ minWidth: 240, maxWidth: 320 }}>
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="isax isax-search-normal-1 text-muted" aria-hidden="true" />
                </span>
                <input
                  type="search"
                  className="form-control border-start-0"
                  placeholder={`Search ${viewConfig.title.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search items"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Assets Paginated Table */}
      <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm overflow-hidden mb-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-borderless mb-0 align-middle">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50">
                  {viewConfig.headers.map((hdr) => (
                    <th key={hdr.field} className="py-3 ps-4 fw-semibold text-body fs-13">
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                        onClick={() => handleSort(hdr.field)}
                      >
                        {hdr.label}
                        <SortIcon column={hdr.field} />
                      </button>
                    </th>
                  ))}
                  <th className="py-3 pe-4 text-end" style={{ width: "80px" }} />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={viewConfig.headers.length + 1} className="py-5 text-center">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                      <span className="text-muted">Loading asset inventory details...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={viewConfig.headers.length + 1} className="py-5 text-center">
                      <i className="isax isax-box fs-32 text-muted mb-2 d-block" />
                      <span className="text-muted">No records found matching criteria.</span>
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const rowId = row._id || String(Math.random());
                    const isExpanded = expandedId === rowId;

                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleRowExpand(rowId)}
                          className={isExpanded ? "table-active border-start border-primary border-4" : ""}
                        >
                          {/* Columns based on current view */}
                          {currentView === "html-pages" && (
                            <>
                              <td className="py-3 ps-4">
                                <div className="d-flex flex-column">
                                  <span className="fw-semibold text-body">
                                    {row.page_title || "(No Title)"}
                                  </span>
                                  <span className="text-muted small text-truncate" style={{ maxWidth: 450 }}>
                                    {row.page_url}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`badge rounded-pill ${
                                    row.status_code < 300
                                      ? "bg-success bg-opacity-10 text-success"
                                      : row.status_code < 400
                                      ? "bg-warning bg-opacity-10 text-warning"
                                      : "bg-danger bg-opacity-10 text-danger"
                                  }`}
                                >
                                  {row.status_code}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "images" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 350 }}>
                                  {row.image_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small">
                                  {row.alt_text || <em className="text-danger">None (Missing Alt Text)</em>}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill ${row.status_code < 400 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                  {row.status_code || 200}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "css" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 400 }}>
                                  {row.css_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill ${row.status_code < 400 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                  {row.status_code || 200}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "js" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 400 }}>
                                  {row.js_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill ${row.status_code < 400 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                  {row.status_code || 200}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "documents" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 350 }}>
                                  {row.document_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="badge bg-danger bg-opacity-10 text-danger text-uppercase">
                                  {row.document_type}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "emails" && (
                            <>
                              <td className="py-3 ps-4 text-primary fw-semibold">
                                {row.email_address}
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 400 }}>
                                  {row.page_url}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "headlinks" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="badge bg-dark bg-opacity-10 text-dark">
                                  {row.rel_type}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                                  {row.href}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                                  {row.page_url}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "links" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                                  {row.link_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 200 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 150 }}>
                                  {row.anchor_text || <em className="text-muted">(Empty Anchor)</em>}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill ${row.link_type === 'internal' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                                  {row.link_type}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`badge rounded-pill ${row.status_code < 400 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                  {row.status_code}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "forms" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                                  {row.form_action || <em className="text-muted">(Self Submit)</em>}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                                  {row.page_url}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase">
                                  {row.form_method || 'GET'}
                                </span>
                              </td>
                              <td className="py-3 ps-4 fw-semibold text-body">
                                {row.input_count || 0}
                              </td>
                            </>
                          )}

                          {currentView === "iframes" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 450 }}>
                                  {row.iframe_src || <em className="text-muted">(No Source)</em>}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 350 }}>
                                  {row.page_url}
                                </span>
                              </td>
                            </>
                          )}

                          {currentView === "frames" && (
                            <>
                              <td className="py-3 ps-4">
                                <span className="text-body fw-medium text-truncate d-inline-block" style={{ maxWidth: 450 }}>
                                  {row.frame_src || <em className="text-muted">(No Source)</em>}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 350 }}>
                                  {row.page_url}
                                </span>
                              </td>
                            </>
                          )}

                          <td className="py-3 pe-4 text-end">
                            <i
                              className={`isax fs-18 text-primary ${
                                isExpanded ? "isax-arrow-up-1" : "isax-arrow-down-1"
                              }`}
                            />
                          </td>
                        </tr>

                        {/* Expandable Slide-down container */}
                        {isExpanded && (
                          <tr className="bg-light bg-opacity-50">
                            <td colSpan={viewConfig.headers.length + 1} className="p-4 border-bottom">
                              <div
                                className="p-3 bg-white rounded-3 border shadow-sm animate__animated animate__fadeIn"
                                style={{ fontSize: "13px" }}
                              >
                                <h6 className="fw-semibold text-primary mb-3">Asset Granular Specification</h6>
                                
                                <div className="row g-3">
                                  {currentView === "html-pages" && (
                                    <>
                                      <div className="col-12 col-md-8">
                                        <strong>Absolute Web Address:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.page_url}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.page_url)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>MIME Scope:</strong> <span className="badge bg-light text-dark d-block py-2 mt-1">text/html</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "images" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Absolute Image Source URL:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.image_url}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.image_url)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Format:</strong> <span className="badge bg-light text-dark text-uppercase d-block py-2 mt-1">{row.image_type || "N/A"}</span>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Alternate Tag:</strong> <span className="badge bg-light text-dark d-block py-2 mt-1">{row.alt_text || "None"}</span>
                                      </div>
                                      {row.image_size && row.image_size !== "Unknown" && (
                                        <div className="col-6 col-md-4">
                                          <strong>Image Size:</strong> <span className="badge bg-light text-dark d-block py-2 mt-1">{row.image_size}</span>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {(currentView === "css" || currentView === "js") && (
                                    <>
                                      <div className="col-12">
                                        <strong>Resolved Asset URL:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={currentView === "css" ? row.css_url : row.js_url}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(currentView === "css" ? row.css_url : row.js_url)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-12">
                                        <strong>Linked on Source URL:</strong>
                                        <span className="text-muted d-block mt-1">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "documents" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Downloadable File Resource Link:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.document_url}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.document_url)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Extension Format:</strong> <span className="badge bg-danger bg-opacity-10 text-danger text-uppercase d-block py-2 mt-1">{row.document_type}</span>
                                      </div>
                                      <div className="col-6 col-md-8">
                                        <strong>Parent Crawler URL:</strong> <span className="text-muted d-block mt-2">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "emails" && (
                                    <>
                                      <div className="col-6 col-md-6">
                                        <strong>Harvested Inbox Address:</strong>
                                        <span className="text-primary fw-semibold d-block mt-1">{row.email_address}</span>
                                      </div>
                                      <div className="col-6 col-md-6">
                                        <strong>Found on Page:</strong>
                                        <span className="text-muted d-block mt-1">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "headlinks" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Head Link Reference (href):</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.href}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.href)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Relationship Value (rel):</strong> <span className="badge bg-dark bg-opacity-10 text-dark d-block py-2 mt-1">{row.rel_type}</span>
                                      </div>
                                      <div className="col-6 col-md-8">
                                        <strong>Parent DOM Document URL:</strong> <span className="text-muted d-block mt-2">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "links" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Absolute Target Link URL:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.link_url}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.link_url)}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Classification Scope:</strong> <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase d-block py-2 mt-1">{row.link_type}</span>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Status Code Response:</strong> <span className={`badge ${row.status_code < 400 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} d-block py-2 mt-1`}>{row.status_code}</span>
                                      </div>
                                      <div className="col-12 col-md-4">
                                        <strong>Anchor Text Label:</strong> <span className="text-body fw-medium d-block mt-2">{row.anchor_text || '(Empty Anchor)'}</span>
                                      </div>
                                      <div className="col-12 mt-2">
                                        <strong>Linked on Page URL:</strong> <span className="text-muted d-block">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "forms" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Form Action Destination URL:</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.form_action || '(Self Submit)'}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.form_action || '')}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Request Method:</strong> <span className="badge bg-success bg-opacity-10 text-success text-uppercase d-block py-2 mt-1">{row.form_method || 'GET'}</span>
                                      </div>
                                      <div className="col-6 col-md-4">
                                        <strong>Input Element Count:</strong> <span className="badge bg-primary bg-opacity-10 text-primary d-block py-2 mt-1">{row.input_count || 0} Elements</span>
                                      </div>
                                      <div className="col-12 col-md-4">
                                        <strong>Found on Page:</strong> <span className="text-muted d-block mt-2">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "iframes" && (
                                    <>
                                      <div className="col-12">
                                        <strong>IFrame Source URL (src):</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.iframe_src || ''}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.iframe_src || '')}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-12 mt-2">
                                        <strong>Host Page URL:</strong> <span className="text-muted d-block">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}

                                  {currentView === "frames" && (
                                    <>
                                      <div className="col-12">
                                        <strong>Frame Source URL (src):</strong>
                                        <div className="d-flex align-items-center mt-1">
                                          <input
                                            type="text"
                                            readOnly
                                            className="form-control form-control-sm bg-light text-muted"
                                            value={row.frame_src || ''}
                                          />
                                          <button
                                            className="btn btn-sm btn-outline-primary ms-2"
                                            onClick={() => navigator.clipboard.writeText(row.frame_src || '')}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </div>
                                      <div className="col-12 mt-2">
                                        <strong>Host Page URL:</strong> <span className="text-muted d-block">{row.page_url}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          {!loading && items.length > 0 && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Rows per page</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-muted small">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </span>
              </div>

              <nav aria-label="Inventory details pagination">
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = page <= 4 ? i + 1 : page - 3 + i;
                    if (p > totalPages) return null;
                    return (
                      <li key={p} className="page-item">
                        <button
                          type="button"
                          className={`page-link rounded-2 ${page === p ? "active" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link rounded-2"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
