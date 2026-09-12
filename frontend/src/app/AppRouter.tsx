import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "../auth/LoginPage";
import DashboardPage from "../dashboard/DashboardPage";
import AuthApp from "../auth/AuthApp";
import UsersPage from "../users/UsersPage";
import SportsPage from "../sports/SportsPage";
import PerformanceMetricsPage from "../performance-metrics/PerformanceMetricsPage";
import ExercisesPage from "../exercises/ExercisesPage";
import AthleteDigitalTwinPage from "../athlete-digital-twin/AthleteDigitalTwinPage";
import type { AuthUser } from "../auth/auth.types";

type AppRouterProps = {
  authState:
    | "checking"
    | "authenticated"
    | "unauthenticated";
  user: AuthUser | null;
  onAuthenticated: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
  loggingOut: boolean;
};

function ProtectedRoute({
  user,
  onLogout,
  loggingOut,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
  loggingOut: boolean;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthApp
      user={user}
      onLogout={onLogout}
      loggingOut={loggingOut}
    />
  );
}

function RequirePermission({
  user,
  permission,
  children,
}: {
  user: AuthUser | null;
  permission: string;
  children: React.ReactNode;
}) {
  if (!user?.permissions.includes(permission)) {
    return (
      <main>
        <h1>Access denied</h1>
        <p>
          You do not have permission to access this TITAN page.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>
        The requested TITAN page does not exist.
      </p>
    </main>
  );
}

export default function AppRouter({
  authState,
  user,
  onAuthenticated,
  onLogout,
  loggingOut,
}: AppRouterProps) {
  if (authState === "checking") {
    return (
      <main>
        <h1>TITAN Health</h1>
        <p>Checking session...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authState === "authenticated" ? (
            <Navigate to="/users" replace />
          ) : (
            <LoginPage
              onAuthenticated={onAuthenticated}
            />
          )
        }
      />

      <Route
        element={
          <ProtectedRoute
            user={user}
            onLogout={onLogout}
            loggingOut={loggingOut}
          />
        }
      >
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />

        <Route
          path="/users"
          element={
            <RequirePermission
              user={user}
              permission="users.read"
            >
              {user ? (
                <UsersPage tenantId={user.tenantId} />
              ) : null}
            </RequirePermission>
          }
        />

        <Route
          path="/sports"
          element={
            <RequirePermission
              user={user}
              permission="sports.read"
            >
              {user ? (
                <SportsPage tenantId={user.tenantId} />
              ) : null}
            </RequirePermission>
          }
        />

        <Route
          path="/performance-metrics"
          element={
            <RequirePermission
              user={user}
              permission="performance-metrics.read"
            >
              {user ? (
                <PerformanceMetricsPage
                  tenantId={user.tenantId}
                />
              ) : null}
            </RequirePermission>
          }
        />

        <Route
          path="/exercises"
          element={
            <RequirePermission
              user={user}
              permission="exercises.read"
            >
              <ExercisesPage />
            </RequirePermission>
          }
        />

        <Route
          path="/athlete-digital-twin/:athleteId"
          element={
            <RequirePermission
              user={user}
              permission="athlete_digital_twins.read"
            >
              <AthleteDigitalTwinRoute />
            </RequirePermission>
          }
        />
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}

function AthleteDigitalTwinRoute() {
  const athleteId =
    window.location.pathname.split("/").pop() ?? "";

  return (
    <AthleteDigitalTwinPage
      athleteId={athleteId}
    />
  );
}
