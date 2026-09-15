import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";

import {
  requestPasswordReset,
} from "./auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        await requestPasswordReset({
          email,
        });

      setMessage(response.message);
    } catch {
      setError(
        "Unable to submit the request. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h2>Forgot password</h2>

      <p>
        Enter the email address for your
        TITAN Health account.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="recovery-email">
            Email address
          </label>
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={loading}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </div>

        {message && (
          <p role="status">{message}</p>
        )}

        {error && (
          <p role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "Send reset instructions"}
        </button>
      </form>

      <p>
        <Link to="/login">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
