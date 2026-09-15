import {
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";

import {
  requestAccountAssistance,
} from "./auth.api";

export default function AccountAssistancePage() {
  const [reference, setReference] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [loading, setLoading] =
    useState(false);

  async function handleRequest() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await requestAccountAssistance();

      setReference(
        response.data.reference,
      );
      setMessage(
        response.data.message,
      );
    } catch {
      setError(
        "Account assistance is temporarily unavailable. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h2>Account assistance</h2>

      <p>
        If you have forgotten the email
        address used for your TITAN Health
        account, create a private assistance
        reference.
      </p>

      <p>
        Do not enter passwords, payment
        details, identity documents or other
        personal information.
      </p>

      {!reference && (
        <button
          type="button"
          disabled={loading}
          onClick={handleRequest}
        >
          {loading
            ? "Creating reference..."
            : "Create assistance reference"}
        </button>
      )}

      {reference && (
        <section aria-labelledby="assistance-reference">
          <h3 id="assistance-reference">
            Your assistance reference
          </h3>

          <p>
            <code>{reference}</code>
          </p>

          <p role="status">
            {message}
          </p>

          <p>
            Keep this reference private and
            provide it only to authorised
            TITAN support. It does not prove
            account ownership.
          </p>
        </section>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}

      <p>
        <Link to="/login">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
