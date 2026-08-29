import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "../auth/LoginPage";
import AuthApp from "../auth/AuthApp";
import UsersPage from "../users/UsersPage";
import SportsPage from "../sports/SportsPage";
import PerformanceMetricsPage from "../performance-metrics/PerformanceMetricsPage";
import { AuthUser } from "../auth/auth.types";

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
          element={<Navigate to="/users" replace />}
        />

        <Route
          path="/users"
          element={
            user ? (
              <UsersPage tenantId={user.tenantId} />
            ) : null
          }
        />

        <Route
          path="/sports"
          element={
            user ? (
              <SportsPage tenantId={user.tenantId} />
            ) : null
          }
        />

        <Route
          path="/performance-metrics"
          element={
            user ? (
              <PerformanceMetricsPage
                tenantId={user.tenantId}
              />
            ) : null
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
