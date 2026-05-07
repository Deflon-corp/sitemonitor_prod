import React from "react";
import { Link, useLocation } from "react-router-dom";
import DomainOverview from "../domain/DomainOverview";

const LANDING_NAV = [
  { href: "/home", label: "Domain Overview", icon: "isax-global" },
  { href: "/home/users", label: "Users", icon: "isax-people" },
  { href: "/home/policies", label: "Policies", icon: "isax-shield-tick" },
  { href: "/home/history-center", label: "History center", icon: "isax-chart-2" },
];

const Home = () => {
  const pathname = useLocation().pathname;

  return (
    <div className="content landing-content">
      {/* Navigation Tabs */}
      <div className="landing-nav-tabs">
        <div className="landing-nav-tabs-inner">
          {LANDING_NAV.map((item) => {
            const isActive =
              (pathname === "/home" && item.label === "Domain Overview") ||
              (pathname === "/home/users" && item.label === "Users") ||
              (pathname === "/home/policies" && item.label === "Policies") ||
              (pathname === "/home/history-center" && item.label === "History center");

            return (
              <Link
                key={item.label}
                className={`landing-pill ${isActive ? "landing-pill-active" : "landing-pill-inactive"}`}
                to={item.href}
              >
                <i className={`isax ${item.icon} landing-pill-icon`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Domain Overview Section */}
      <DomainOverview />
    </div>
  );
}

export default Home
