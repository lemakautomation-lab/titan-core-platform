import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { organisationOnboarding, type OrganisationPlan } from "./organisation-onboarding.api";

export default function OrganisationSignupPage() {
  const [plans, setPlans] = useState<OrganisationPlan[]>([]);
  const [planError, setPlanError] = useState(false);
  const [organisationName, setOrganisationName] = useState("");
  const [administratorEmail, setAdministratorEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    organisationOnboarding.plans().then(({ plans }) => {
      if (active) { setPlans(plans); setPlanId(plans[0]?.id ?? ""); }
    }).catch(() => { if (active) setPlanError(true); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    try {
      const { application } = await organisationOnboarding.register({ requestId, organisationName, administratorEmail, planId });
      setApplicationId(application.id);
      setSubmitted(true);
    } catch {
      // Reuse the same request ID after an uncertain response so a retry stays idempotent.
      setError(true);
    } finally { setPending(false); }
  }

  if (submitted) return <main><h1>Check your email</h1><p>We sent a verification link to {administratorEmail}. Verify your address to continue. Payment checkout is being prepared; registration does not activate access.</p><p>Application ID: <strong>{applicationId}</strong>. Keep this for administrator setup after payment is confirmed.</p><Link to="/login">Back to sign in</Link></main>;

  return <main>
    <h1>Register your organisation</h1>
    <p>Choose a plan and verify the administrator email. Access starts only after confirmed payment and administrator setup.</p>
    {planError && <p role="alert">Plans are temporarily unavailable. Please try again later.</p>}
    {!planError && plans.length === 0 && <p>Loading available plans...</p>}
    <form onSubmit={submit}>
      <label htmlFor="organisation-name">Organisation name</label>
      <input id="organisation-name" required value={organisationName} onChange={event => setOrganisationName(event.target.value)} />
      <label htmlFor="administrator-email">Administrator email</label>
      <input id="administrator-email" type="email" autoComplete="email" required value={administratorEmail} onChange={event => setAdministratorEmail(event.target.value)} />
      <label htmlFor="organisation-plan">Plan</label>
      <select id="organisation-plan" required value={planId} onChange={event => setPlanId(event.target.value)}>
        {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {new Intl.NumberFormat(undefined, { style: "currency", currency: plan.currency }).format(plan.amountMinor / 100)} / {plan.billingInterval === "MONTHLY" ? "month" : "year"}</option>)}
      </select>
      {error && <p role="alert">Registration could not be completed. Please retry; if you already received an email, use its verification link.</p>}
      <button type="submit" disabled={pending || !planId}>{pending ? "Submitting..." : "Register organisation"}</button>
    </form>
    <p><Link to="/signup">Back to account options</Link></p>
  </main>;
}
