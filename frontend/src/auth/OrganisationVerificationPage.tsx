import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { organisationOnboarding } from "./organisation-onboarding.api";

export default function OrganisationVerificationPage() {
  const [params, setParams] = useSearchParams();
  const token = params.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  async function verify() {
    setPending(true); setError(false);
    try {
      const result = await organisationOnboarding.verifyEmail(token);
      if (result.status !== "PENDING_PAYMENT") throw new Error("Unexpected status");
      setParams({}, { replace: true });
      setVerified(true);
    } catch { setError(true); } finally { setPending(false); }
  }
  return <main>
    <h1>Verify organisation email</h1>
    {verified ? <p>Email verified. Your application is awaiting payment. Checkout is being prepared; we will provide payment instructions when available. Access is not active yet.</p> : <>
      {!token && <p role="alert">This verification link is missing its token.</p>}
      {error && <p role="alert">The verification link is invalid or expired. If already verified, your application may be awaiting payment.</p>}
      <button type="button" disabled={!token || pending} onClick={verify}>{pending ? "Verifying..." : "Verify email"}</button>
    </>}
    <p><Link to="/login">Back to sign in</Link></p>
  </main>;
}
