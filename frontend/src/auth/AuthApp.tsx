import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import type { AuthUser } from "./auth.types";

interface AuthAppProps {
  user: AuthUser;
  onLogout: () => void;
  loggingOut: boolean;
}

type NavigationItem =
  | "Onboarding"
  | "Dashboard"
  | "Director"
  | "Club"
  | "Training"
  | "Performance"
  | "Users";

type NavigationDefinition = {
  label: NavigationItem;
  route: string;
  permission: string | string[];
};

const navigation: NavigationDefinition[] = [
  {
    label: "Dashboard",
    route: "/dashboard",
    permission: [],
  },
  {
    label: "Club",
    route: "/club",
    permission: "club.executives.read",
  },
  {
    label: "Director",
    route: "/performance-director",
    permission: "performance-director.command-centre.read",
  },
  {
    label: "Training",
    route: "/exercises",
    permission: "exercises.read",
  },
  {
    label: "Performance",
    route: "/sports",
    permission: ["sports.read", "performance-metrics.read"],
  },
  {
    label: "Users",
    route: "/users",
    permission: "users.read",
  },
];

function normalizePermissions(
  permissions: string[],
): Set<string> {
  return new Set(
    permissions.map((permission) =>
      permission.trim().toLowerCase(),
    ),
  );
}

function canAccess(
  item: NavigationDefinition,
  permissions: Set<string>,
): boolean {
  const requiredPermissions =
    Array.isArray(item.permission)
      ? item.permission
      : [item.permission];

  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.some(
    (permission) =>
      permissions.has(permission),
  );
}

function getNavigationRoute(
  item: NavigationDefinition,
  permissions: Set<string>,
): string {
  if (
    item.label === "Performance" &&
    !permissions.has("sports.read") &&
    permissions.has("performance-metrics.read")
  ) {
    return "/performance-metrics";
  }

  return item.route;
}

function getActiveSection(
  pathname: string,
): NavigationItem {
  if (pathname === "/club") return "Club";
  if (pathname === "/performance-director") {
    return "Director";
  }
  if (pathname === "/onboarding") {
    return "Onboarding";
  }

  if (pathname === "/sports") {
    return "Performance";
  }

  if (
    pathname === "/performance-metrics"
  ) {
    return "Performance";
  }

  if (pathname === "/exercises") {
    return "Training";
  }

  if (pathname === "/users") {
    return "Users";
  }

  return "Dashboard";
}

export default function AuthApp({
  user,
  onLogout,
  loggingOut,
}: AuthAppProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const permissions =
    normalizePermissions(user.permissions);

  const onboardingOnly =
    user.roles.length === 0 &&
    permissions.size === 0;

  const allowedNavigation =
    onboardingOnly
      ? [{
          label: "Onboarding" as const,
          route: "/onboarding",
          permission: [],
        }]
      : navigation.filter((item) =>
          canAccess(item, permissions),
        );

  const activeSection =
    getActiveSection(location.pathname);

  const safeActiveSection =
    allowedNavigation.some(
      (item) =>
        item.label === activeSection,
    )
      ? activeSection
      : "Dashboard";

  function handleNavigation(
    item: NavigationDefinition,
  ) {
    navigate(
      getNavigationRoute(
        item,
        permissions,
      ),
    );
  }

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

          {allowedNavigation.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                safeActiveSection === item.label
                  ? "titan-nav-item titan-nav-item-active"
                  : "titan-nav-item"
              }
              onClick={() =>
                handleNavigation(item)
              }
            >
              {item.label}
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
                {user.roles.join(" · ")}
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
                {safeActiveSection}
              </span>

              <h2>
                {
                  safeActiveSection === "Dashboard"
                    ? "Performance Command Centre"
                    : safeActiveSection === "Onboarding"
                      ? user.selectedUserType === "TRAINER"
                        ? "Trainer Onboarding"
                        : "Athlete Onboarding"
                      : safeActiveSection
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

          <Outlet
            context={{
              user,
            }}
          />

        </main>

      </section>

    </div>
  );
}
