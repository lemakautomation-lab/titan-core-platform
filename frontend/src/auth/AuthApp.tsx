import { AuthUser } from "./auth.types";

interface AuthAppProps {
  user: AuthUser;
  onLogout: () => void;
  loggingOut: boolean;
}

export default function AuthApp({
  user,
  onLogout,
  loggingOut,
}: AuthAppProps) {

  return (
    <main>
      <header>
        <h1>TITAN Core Platform</h1>

        <p>
          Authenticated
        </p>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      <section>
        <h2>Welcome</h2>

        <p>
          {user.email}
        </p>

        <p>
          Tenant: {user.tenantId}
        </p>
      </section>
    </main>
  );
}
