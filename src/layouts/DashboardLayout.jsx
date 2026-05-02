import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
    children,
    breadcrumbTitle = "Dashboard",
    breadcrumbParent,
    breadcrumbParentHref,
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = useLocation().pathname;

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Handle body overflow and menu class when mobile menu opens/closes
    useEffect(() => {
        if (mobileMenuOpen) {
            document.documentElement.classList.add("menu-opened");
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
        } else {
            document.documentElement.classList.remove("menu-opened");
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        }

        // Cleanup function
        return () => {
            document.documentElement.classList.remove("menu-opened");
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    return (
        <>
            <div className={`main-wrapper${mobileMenuOpen ? " slide-nav" : ""}`}>
                <Header
                    breadcrumbTitle={breadcrumbTitle}
                    breadcrumbParent={breadcrumbParent}
                    breadcrumbParentHref={breadcrumbParentHref}
                    onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
                />

                <Sidebar />

                <div className="page-wrapper">
                    <div className="content">{children}</div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="sidebar-overlay opened"
                    role="button"
                    tabIndex={0}
                    aria-label="Close menu"
                    onClick={() => setMobileMenuOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}