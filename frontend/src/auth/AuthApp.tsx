import { useState } from "react";

import { AuthUser } from "./auth.types";
import UsersPage from "../users/UsersPage";

interface AuthAppProps {
  user: AuthUser;
  onLogout: () => void;
  loggingOut: boolean;
}

type NavigationItem =
  | "Dashboard"
  | "Athletes"
  | "Teams"
  | "Training"
  | "Performance"
  | "Nutrition"
  | "Recovery"
  | "Wearables"
  | "Programmes"
  | "Reports"
  | "Administration"
  | "Users";

const navigation: NavigationItem[] = [
  "Dashboard",
  "Athletes",
  "Teams",
  "Training",
  "Performance",
  "Nutrition",
  "Recovery",
  "Wearables",
  "Programmes",
  "Reports",
  "Administration",
  "Users",
];

export default function AuthApp({
  user,
  onLogout,
  loggingOut,
}: AuthAppProps) {

  const [activeSection, setActiveSection] =
    useState<NavigationItem>("Dashboard");

  return (
    <div className="titan-shell">

      <aside className="titan-sidebar">

        <div className="titan-brand">

          <div className="titan-brand-mark">
            T
          </div>

          <div>
            <strong>TITAN</strong>
            <span>HEALTH</span>
          </div>

        </div>

        <nav
          aria-label="Primary navigation"
          className="titan-navigation"
        >

          {navigation.map((item) => (

            <button
              key={item}
              type="button"
              className={
                activeSection === item
                  ? "titan-nav-item titan-nav-item-active"
                  : "titan-nav-item"
              }
              onClick={() => setActiveSection(item)}
            >
              {item}
            </button>

          ))}

        </nav>

        <div className="titan-sidebar-footer">
          Enterprise Platform
        </div>

      </aside>

      <section className="titan-main">

        <header className="titan-header">

          <div>

            <span className="titan-header-label">
              HUMAN PERFORMANCE OPERATING SYSTEM
            </span>

            <h1>
              TITAN HEALTH
            </h1>

            <span className="titan-authenticated">
              Authenticated
            </span>

          </div>

          <div className="titan-user-menu">

            <div className="titan-user-details">

              <strong>
                {user.email}
              </strong>

              <span>
                {user.roles.join(" Â· ")}
              </span>

            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="titan-logout"
            >
              {
                loggingOut
                  ? "Signing out..."
                  : "Sign out"
              }
            </button>

          </div>

        </header>

        <main className="titan-content">

          <div className="titan-page-heading">

            <div>

              <span className="titan-eyebrow">
                {activeSection}
              </span>

              <h2>
                {
                  activeSection === "Dashboard"
                    ? "Performance Command Centre"
                    : activeSection
                }
              </h2>

            </div>

            <div className="titan-tenant">

              <span>
                Tenant
              </span>

              <strong>
                {user.tenantId}
              </strong>

            </div>

          </div>

          {activeSection === "Dashboard" ? (

            <Dashboard />

          ) : (

            <ModulePlaceholder
              section={activeSection}
            />

          )}

        </main>

      </section>

    </div>
  );
}

function Dashboard() {

  return (
    <>

      <section className="titan-welcome">

        <div>

          <span className="titan-eyebrow">
            HUMAN PERFORMANCE
          </span>

          <h3>
            Intelligence for every athlete.
          </h3>

          <p>
            TITAN Health unifies training, performance,
            nutrition, recovery and connected biometric
            data into one enterprise human-performance
            platform.
          </p>

        </div>

      </section>

      <section
        className="titan-metrics"
        aria-label="Performance overview"
      >

        <MetricCard
          title="Athletes"
          value="â€”"
          description="Connected athlete population"
        />

        <MetricCard
          title="Training"
          value="â€”"
          description="Active programmes"
        />

        <MetricCard
          title="Performance"
          value="â€”"
          description="Performance intelligence"
        />

        <MetricCard
          title="Recovery"
          value="â€”"
          description="Recovery monitoring"
        />

      </section>

      <section className="titan-command-grid">

        <article className="titan-panel">

          <span className="titan-eyebrow">
            ATHLETE INTELLIGENCE
          </span>

          <h3>
            Performance intelligence
          </h3>

          <p>
            TITAN will combine athlete profiles,
            training load, performance metrics,
            recovery and wearable data to provide
            a unified performance picture.
          </p>

        </article>

        <article className="titan-panel">

          <span className="titan-eyebrow">
            AI PERFORMANCE ENGINE
          </span>

          <h3>
            Adaptive decision support
          </h3>

          <p>
            Future TITAN intelligence will analyse
            athlete data and recommend training,
            recovery and nutrition actions within
            defined safety and governance controls.
          </p>

        </article>

      </section>

    </>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {

  return (
    <article className="titan-metric-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </article>
  );
}

function ModulePlaceholder({
  section,
}: {
  section: NavigationItem;
}) {

  return (
    <section className="titan-module-placeholder">

      <span className="titan-eyebrow">
        TITAN HEALTH MODULE
      </span>

      <h3>
        {section}
      </h3>

      <p>
        This enterprise module is architecturally
        reserved for the TITAN Health development
        roadmap.
      </p>

      <span className="titan-status">
        MODULE FOUNDATION
      </span>

    </section>
  );
}