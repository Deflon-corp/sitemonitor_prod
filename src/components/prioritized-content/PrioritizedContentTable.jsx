import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageDetailsMisspellingsDrawer from "@/components/prioritized-content/PageDetailsMisspellingsDrawer";
import PrioritizedContentPagesView from "@/components/prioritized-content/PrioritizedContentPagesView";
import PrioritizedContentPdfView from "@/components/prioritized-content/PrioritizedContentPdfView";
import PrioritizedContentOtherDocumentsView from "@/components/prioritized-content/PrioritizedContentOtherDocumentsView";
import PrioritizedContentImagesView from "@/components/prioritized-content/PrioritizedContentImagesView";
import { getDomainSeoPagesApi } from "@/api/domainApi";
import inventoryApi from "@/api/inventoryApi";
import { useQaDomainId } from "@/hooks/useQaDomainId";

// Filters Navigation
const FILTERS = [
    { key: "all", label: "All", icon: "isax-document-copy", href: "/prioritized-content?filter=all" },
    { key: "pages", label: "Pages", icon: "isax-document-text", href: "/prioritized-content?filter=pages" },
    { key: "pdf", label: "PDF Documents", icon: "isax-document-text", href: "/prioritized-content?filter=pdf" },
    { key: "images", label: "Images", icon: "isax-image", href: "/prioritized-content?filter=images" },
    { key: "other", label: "Other Documents", icon: "isax-document", href: "/prioritized-content?filter=other" },
];

// Sample Data


// Prioritized Content Table Component
const PrioritizedContentTable = ({ rows = [], onOpenPageDetails }) => {
    const [sortKey, setSortKey] = useState("title");
    const [sortAsc, setSortAsc] = useState(true);

    const sortedRows = useMemo(() => {
        const list = [...rows];
        list.sort((a, b) => {
            if (sortKey === "title") {
                return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            }
            if (sortKey === "notifications") {
                return sortAsc ? a.notifications - b.notifications : b.notifications - a.notifications;
            }
            if (sortKey === "priority") {
                const order = { High: 3, Medium: 2, Low: 1 };
                return sortAsc ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority];
            }
            return sortAsc ? a.views - b.views : b.views - a.views;
        });
        return list;
    }, [rows, sortKey, sortAsc]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortAsc((v) => !v);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const SortIcon = ({ column }) => (
        <i
            className={`isax ms-1 fs-12 ${sortKey === column
                    ? sortAsc
                        ? "isax-arrow-up-1"
                        : "isax-arrow-down-1"
                    : "isax-arrow-down-1"
                }`}
            style={{ opacity: sortKey === column ? 1 : 0.4 }}
        />
    );

    return (
        <div className="card mb-4">
            <div className="card-header border-0 d-flex align-items-center justify-content-end">
                <button
                    type="button"
                    className="btn btn-sm btn-primary d-flex align-items-center"
                    title="Open page details"
                >
                    <i className="isax isax-document-text me-1"></i> Open page details
                </button>
            </div>

            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover table-borderless mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="fw-semibold text-body">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                                        onClick={() => toggleSort("title")}
                                    >
                                        Title and URL
                                        <SortIcon column="title" />
                                    </button>
                                </th>
                                <th className="fw-semibold text-body">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 border-0 text-body text-decoration-none d-inline-flex align-items-center"
                                        onClick={() => toggleSort("notifications")}
                                    >
                                        Notifications
                                        <SortIcon column="notifications" />
                                    </button>
                                </th>
                                <th className="fw-semibold text-body">
                                    <span className="d-inline-flex align-items-center">
                                        Priority
                                        <span className="ms-1 opacity-75" title="Priority level">
                                            <i className="isax isax-info-circle fs-14"></i>
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                                            onClick={() => toggleSort("priority")}
                                        >
                                            <SortIcon column="priority" />
                                        </button>
                                    </span>
                                </th>
                                <th className="fw-semibold text-body">
                                    <span className="d-inline-flex align-items-center">
                                        Views
                                        <span className="ms-1 opacity-75" title="View count">
                                            <i className="isax isax-info-circle fs-14"></i>
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 border-0 text-body text-decoration-none ms-1 d-inline-flex align-items-center"
                                            onClick={() => toggleSort("views")}
                                        >
                                            <SortIcon column="views" />
                                        </button>
                                    </span>
                                </th>
                                <th className="fw-semibold text-body text-end" style={{ width: "100px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted fs-5">
                                        Good job! No issues were found
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="fw-semibold text-primary">{row.title}</span>
                                                <a
                                                    href={row.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted small text-decoration-none d-inline-flex align-items-center mt-1"
                                                    title="Open in new tab"
                                                >
                                                    <span className="d-inline-flex align-items-center me-1" aria-hidden="true">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </span>
                                                    {row.url}
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                                                {row.notifications}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-body">{row.views}</span>
                                            <div className="progress mt-1" style={{ height: 4, width: 60 }}>
                                                <div
                                                    className="progress-bar bg-secondary"
                                                    role="progressbar"
                                                    style={{ width: "0%" }}
                                                    aria-valuenow="0"
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                />
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-sm btn-light"
                                                title="Open page details"
                                                onClick={() => onOpenPageDetails(row)}
                                            >
                                                <i className="isax isax-document-text text-primary"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Main Page Component
const PrioritizedContentPage = () => {
    const [searchParams] = useSearchParams();
    const currentFilter = searchParams.get("filter") || "all";

    const [pageDetailsOpen, setPageDetailsOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState(null);

    const domainId = useQaDomainId();
    const [pages, setPages] = useState([]);
    const [pdfs, setPdfs] = useState([]);
    const [others, setOthers] = useState([]);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const openPageDetails = (row) => {
        setSelectedPage(row);
        setPageDetailsOpen(true);
    };

    useEffect(() => {
        if (!domainId) {
            setPages([]);
            setPdfs([]);
            setOthers([]);
            setImages([]);
            setError(null);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (currentFilter === "all" || currentFilter === "pages") {
                    const pagesRes = await getDomainSeoPagesApi(domainId, 1, 100);
                    if (pagesRes.success && pagesRes.data?.pages) {
                        setPages(pagesRes.data.pages);
                    } else {
                        setPages([]);
                    }
                } else if (currentFilter === "pdf" || currentFilter === "other") {
                    const docRes = await inventoryApi.getInventoryDetails(domainId, { type: "documents", limit: 100 });
                    if (docRes.success && docRes.data?.items) {
                        const allDocs = docRes.data.items || [];
                        const pdfDocs = allDocs.filter(d => {
                            const docUrl = d.document_url || "";
                            return docUrl.toLowerCase().endsWith(".pdf") || d.document_type?.toLowerCase() === "pdf";
                        }).map(d => ({
                            id: d._id || d.document_url,
                            title: d.document_url.split('/').pop() || d.document_url,
                            url: d.document_url,
                            notifications: 0,
                            priority: "Low",
                            views: 0
                        }));
                        const otherDocs = allDocs.filter(d => {
                            const docUrl = d.document_url || "";
                            return !(docUrl.toLowerCase().endsWith(".pdf") || d.document_type?.toLowerCase() === "pdf");
                        }).map(d => ({
                            id: d._id || d.document_url,
                            title: d.document_url.split('/').pop() || d.document_url,
                            url: d.document_url,
                            notifications: 0,
                            priority: "Low",
                            views: 0
                        }));
                        setPdfs(pdfDocs);
                        setOthers(otherDocs);
                    } else {
                        setPdfs([]);
                        setOthers([]);
                    }
                } else if (currentFilter === "images") {
                    const imgRes = await inventoryApi.getInventoryDetails(domainId, { type: "images", limit: 100 });
                    if (imgRes.success && imgRes.data?.items) {
                        const allImages = imgRes.data.items || [];
                        const imageMap = {};
                        allImages.forEach(item => {
                            const url = item.image_url;
                            if (!url) return;
                            if (!imageMap[url]) {
                                imageMap[url] = {
                                    id: item._id || url,
                                    url: url,
                                    statusCode: item.status_code || 200,
                                    pageCount: 0,
                                };
                            }
                            imageMap[url].pageCount += 1;
                        });
                        setImages(Object.values(imageMap));
                    } else {
                        setImages([]);
                    }
                }
            } catch (err) {
                console.error("Error fetching prioritized content details:", err);
                setError("Failed to load prioritized content data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [domainId, currentFilter]);

    return (
        <div className="prioritized-content-page">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                <h6 className="mb-0">Prioritized Content</h6>
            </div>

            {/* Filter Tabs */}
            <nav className="prioritized-content-filters mb-4" aria-label="Content type filter">
                <div className="d-flex flex-wrap gap-1 gap-md-4 align-items-center">
                    {FILTERS.map(({ key, label, icon, href }) => {
                        const isActive = currentFilter === key;
                        return (
                            <Link
                                key={key}
                                to={href}
                                className={`prioritized-content-filter-link d-inline-flex align-items-center text-primary text-decoration-none py-2 ${isActive ? "active" : ""}`}
                            >
                                <i className={`isax ${icon} me-2`} aria-hidden="true"></i>
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Conditional Content Rendering */}
            {!domainId ? (
                <div className="alert alert-warning fs-13" role="status">
                    Select a domain from the sidebar to view prioritized content.
                </div>
            ) : isLoading ? (
                <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="alert alert-danger d-flex align-items-center py-2 px-3" role="alert">
                    <i className="isax isax-warning-2 me-2"></i>
                    <span>{error}</span>
                </div>
            ) : currentFilter === "all" ? (
                <>
                    <PrioritizedContentTable rows={pages} onOpenPageDetails={openPageDetails} />
                    <PageDetailsMisspellingsDrawer
                        open={pageDetailsOpen}
                        onClose={() => setPageDetailsOpen(false)}
                        page={selectedPage}
                    />
                </>
            ) : currentFilter === "pages" ? (
                <>
                    <PrioritizedContentPagesView rows={pages} onOpenPageDetails={openPageDetails} />
                    <PageDetailsMisspellingsDrawer
                        open={pageDetailsOpen}
                        onClose={() => setPageDetailsOpen(false)}
                        page={selectedPage}
                    />
                </>
            ) : currentFilter === "pdf" ? (
                <>
                    <PrioritizedContentPdfView rows={pdfs} onOpenPageDetails={openPageDetails} />
                    <PageDetailsMisspellingsDrawer
                        open={pageDetailsOpen}
                        onClose={() => setPageDetailsOpen(false)}
                        page={selectedPage}
                    />
                </>
            ) : currentFilter === "images" ? (
                <PrioritizedContentImagesView items={images} />
            ) : currentFilter === "other" ? (
                <>
                    <PrioritizedContentOtherDocumentsView rows={others} onOpenPageDetails={openPageDetails} />
                    <PageDetailsMisspellingsDrawer
                        open={pageDetailsOpen}
                        onClose={() => setPageDetailsOpen(false)}
                        page={selectedPage}
                    />
                </>
            ) : null}
        </div>
    );
};

export default PrioritizedContentPage;