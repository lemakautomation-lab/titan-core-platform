import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { login } from "./auth.service";
import type { AuthUser } from "./auth.types";

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
      const user = await login({ tenantId, email, password });
      onAuthenticated(user);
    } catch (cause) {
      setError(
        cause instanceof Error &&
        cause.message === "API request failed with status 429"
          ? "Too many sign-in attempts. Please wait and try again."
          : "Unable to sign in. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="titan-login-page">
      <section className="titan-login-hero" aria-label="TITAN Health">
        <div className="titan-login-hero-content">
          <span className="titan-login-kicker">TITAN TECH / HEALTH</span>
          <h1>Move beyond limits.</h1>
          <p>Your performance journey starts here.</p>
          <span className="titan-login-hero-rule" aria-hidden="true" />
          <span className="titan-login-hero-foot">PERFORMANCE IN MOTION</span>
        </div>
      </section>

      <section className="titan-login-panel" aria-labelledby="titan-login-title">
        <div className="titan-login-card">
          <div className="titan-login-brand">
            <span className="titan-login-brand-mark" aria-hidden="true">T</span>
            <div>
              <strong>TITAN</strong>
              <span>HEALTH PLATFORM</span>
            </div>
          </div>
          <span className="titan-login-overline">YOUR PERFORMANCE SPACE</span>
          <h2 id="titan-login-title">Sign in</h2>
          <p className="titan-login-description">
            Access your TITAN Health workspace.
          </p>

          <form className="titan-login-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="tenantId">Tenant ID</label>
              <input
                id="tenantId"
                name="tenantId"
                type="text"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                required
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="titan-login-error" role="alert">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="titan-login-links">
            <Link to="/account-assistance">Forgot email?</Link>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <p className="titan-login-signup">
            Ready to start your journey? <Link to="/signup">Create your account now!</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
