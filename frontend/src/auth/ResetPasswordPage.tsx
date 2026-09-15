import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  completePasswordReset,
} from "./auth.api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] =
    useState<string | null>(null);
  const [complete, setComplete] =
    useState(false);
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(
        "The password-reset link is invalid or expired.",
      );
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      setError(
        "Password must be between 8 and 128 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await completePasswordReset({
        token,
        newPassword,
      });

      setComplete(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "The password-reset link is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <main>
        <h2>Password reset complete</h2>
        <p>
          Your password has been updated.
        </p>
        <Link to="/login">
          Sign in with your new password
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h2>Reset password</h2>

      {!token && (
        <p role="alert">
          The password-reset link is invalid
          or expired.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            disabled={loading || !token}
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value,
              )
            }
          />
        </div>

        <div>
          <label htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            disabled={loading || !token}
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value,
              )
            }
          />
        </div>

        {error && (
          <p role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !token}
        >
          {loading
            ? "Resetting..."
            : "Reset password"}
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
