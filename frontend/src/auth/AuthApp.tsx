import { AuthUser } from "./auth.types";

interface AuthAppProps {
  user: AuthUser;
}

export default function AuthApp({
  user,
}: AuthAppProps) {

  return (
    <main>
      <header>
        <h1>TITAN Core Platform</h1>

        <p>
          Authenticated
        </p>
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
