import { FormEvent, useState } from "react";

import { login } from "./auth.service";
import { AuthUser } from "./auth.types";

interface LoginPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

export default function LoginPage({
  onAuthenticated,
}: LoginPageProps) {

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {

    event.preventDefault();

    setError(null);
    setLoading(true);

    try {

      const user =
        await login({
          tenantId,
          email,
          password,
        });

      onAuthenticated(user);

    } catch {

      setError(
        "Unable to sign in. Please check your credentials and try again.",
      );

    } finally {

      setLoading(false);

    }

  }

  return (
    <main>
      <h1>TITAN Core Platform</h1>

      <h2>Sign in</h2>

      <form onSubmit={handleSubmit}>

        <div>
          <label htmlFor="tenantId">
            Tenant ID
          </label>

          <input
            id="tenantId"
            name="tenantId"
            type="text"
            value={tenantId}
            onChange={(event) =>
              setTenantId(event.target.value)
            }
            required
            autoComplete="organization"
          />
        </div>

        <div>
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

      </form>
    </main>
  );
}
