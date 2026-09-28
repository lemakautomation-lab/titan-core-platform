import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { organisationOnboarding } from "./organisation-onboarding.api";

export default function OrganisationSetupRequestPage() {
  const [applicationId, setApplicationId] = useState("");
  const [administratorEmail, setAdministratorEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(false);
    try { await organisationOnboarding.requestSetup(applicationId, administratorEmail); setSent(true); }
    catch { setError(true); } finally { setPending(false); }
  }
  return <main>
    <h1>Request administrator setup</h1>
    <p>Once payment is confirmed and your organisation is provisioned, request a setup link. You will need the application ID from your registration.</p>
    {sent ? <p>If the application is eligible, setup instructions will be emailed.</p> : <form onSubmit={submit}>
      <label htmlFor="application-id">Application ID</label>
      <input id="application-id" required value={applicationId} onChange={event => setApplicationId(event.target.value)} />
      <label htmlFor="setup-email">Administrator email</label>
      <input id="setup-email" type="email" required autoComplete="email" value={administratorEmail} onChange={event => setAdministratorEmail(event.target.value)} />
      {error && <p role="alert">Setup instructions are temporarily unavailable. Please try again later.</p>}
      <button type="submit" disabled={pending}>{pending ? "Requesting..." : "Request setup link"}</button>
    </form>}
    <p><Link to="/login">Back to sign in</Link></p>
  </main>;
}
