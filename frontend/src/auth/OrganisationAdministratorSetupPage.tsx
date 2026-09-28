import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { organisationOnboarding } from "./organisation-onboarding.api";

export default function OrganisationAdministratorSetupPage() {
  const [params, setParams] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setPending(true); setError("");
    try {
      const result = await organisationOnboarding.completeSetup(token, password);
      if (result.status !== "ACTIVE") throw new Error("Unexpected status");
      setParams({}, { replace: true });
      setPassword(""); setConfirmation(""); setComplete(true);
    } catch { setError("Setup link is invalid or expired, or the password does not meet requirements."); }
    finally { setPending(false); }
  }
  return <main>
    <h1>Set up your organisation administrator</h1>
    {complete ? <p>Setup complete. You can now sign in.</p> : <>
      {!token && <p role="alert">The setup link is missing its token.</p>}
      <form onSubmit={submit}>
        <label htmlFor="organisation-password">New password</label>
        <input id="organisation-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={!token || pending} value={password} onChange={event => setPassword(event.target.value)} />
        <label htmlFor="organisation-confirm-password">Confirm password</label>
        <input id="organisation-confirm-password" type="password" autoComplete="new-password" required disabled={!token || pending} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={!token || pending}>{pending ? "Setting up..." : "Complete administrator setup"}</button>
      </form>
    </>}
    <p><Link to="/login">Sign in</Link></p>
  </main>;
}
