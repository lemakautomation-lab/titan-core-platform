import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "../auth/LoginPage";
import ForgotPasswordPage from "../auth/ForgotPasswordPage";
import AccountAssistancePage from "../auth/AccountAssistancePage";
import ResetPasswordPage from "../auth/ResetPasswordPage";
import AthleteSignupPage from "../auth/AthleteSignupPage";
import TrainerSignupPage from "../auth/TrainerSignupPage";
import AthleteOnboardingPage from "../auth/AthleteOnboardingPage";
import DashboardPage from "../dashboard/DashboardPage";
import AuthApp from "../auth/AuthApp";
import UsersPage from "../users/UsersPage";
import SportsPage from "../sports/SportsPage";
import PerformanceMetricsPage from "../performance-metrics/PerformanceMetricsPage";
import ExercisesPage from "../exercises/ExercisesPage";
import AthleteDigitalTwinPage from "../athlete-digital-twin/AthleteDigitalTwinPage";
import TrainerAccessPage from "../trainer/TrainerAccessPage";
import CoachPlatformPage from "../coach/CoachPlatformPage";
import PerformanceProfessionalPage from "../performance-professional/PerformanceProfessionalPage";
import PerformanceDirectorPage from "../performance-director/PerformanceDirectorPage";
import ClubPage from "../club/ClubPage";
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

function getAuthenticatedLandingRoute(
  user: AuthUser | null,
): string {
  if (
    user &&
    user.roles.length === 0 &&
    user.permissions.length === 0
  ) {
    return "/onboarding";
  }

  if (user?.permissions.includes("users.read")) {
    return "/users";
  }

  return "/dashboard";
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
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <LoginPage
              onAuthenticated={onAuthenticated}
            />
          )
        }
      />

      <Route
        path="/account-assistance"
        element={
          authState === "authenticated" ? (
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <AccountAssistancePage />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          authState === "authenticated" ? (
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />

      <Route
        path="/reset-password"
        element={
          authState === "authenticated" ? (
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <ResetPasswordPage />
          )
        }
      />
      <Route
        path="/signup/athlete"
        element={
          authState === "authenticated" ? (
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <AthleteSignupPage
              onAuthenticated={onAuthenticated}
            />
          )
        }
      />

      <Route
        path="/signup/trainer"
        element={
          authState === "authenticated" ? (
            <Navigate
              to={getAuthenticatedLandingRoute(user)}
              replace
            />
          ) : (
            <TrainerSignupPage
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
          path="/onboarding"
          element={<AthleteOnboardingPage />}
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage
                tenantId={user.tenantId}
                permissions={user.permissions}
              />
            ) : null
          }
        />

        <Route
          path="/trainer"
          element={<TrainerAccessPage />}
        />

        <Route
          path="/coach"
          element={<CoachPlatformPage />}
        />
        <Route
          path="/performance-professional"
          element={
            <RequirePermission
              user={user}
              permission="performance-measurements.read"
            >
              <RequirePermission
                user={user}
                permission="workout-programmes.read"
              >
                <PerformanceProfessionalPage />
              </RequirePermission>
            </RequirePermission>
          }
        />

        <Route
          path="/club"
          element={
            <RequirePermission user={user} permission="club.executives.read">
              <ClubPage
                canReadDirectors={Boolean(user?.permissions.includes("club.directors.read"))}
                canReadCoaches={Boolean(user?.permissions.includes("club.coaches.read"))}
                canReadScientists={Boolean(user?.permissions.includes("club.scientists.read"))}
                canReadConditioning={Boolean(user?.permissions.includes("club.conditioning.read"))}
                canReadNutrition={Boolean(user?.permissions.includes("club.nutrition.read"))}
                canReadRehabilitation={Boolean(user?.permissions.includes("club.rehabilitation.read"))}
              />
            </RequirePermission>
          }
        />

        <Route
          path="/performance-director"
          element={
            <RequirePermission
              user={user}
              permission="performance-director.command-centre.read"
            >
              <PerformanceDirectorPage
                canReadIntelligence={Boolean(
                  user?.permissions.includes("performance-director.intelligence.read"),
                )}
                canReadTeams={Boolean(
                  user?.permissions.includes("performance-director.teams.read"),
                )}
                canReadReport={Boolean(
                  user?.permissions.includes("performance-director.reports.read"),
                )}
                canReadDecisions={Boolean(
                  user?.permissions.includes("performance-director.decisions.read"),
                )}
              />
            </RequirePermission>
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
