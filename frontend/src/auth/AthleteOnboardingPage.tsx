type Props = { selectedUserType?: "ATHLETE" | "TRAINER" | "ORGANISATION" | null };

export default function AthleteOnboardingPage({ selectedUserType }: Props) {
  const trainer = selectedUserType === "TRAINER";
  const accountName = trainer ? "Trainer" : "Athlete";
  return (
    <section className="titan-onboarding-panel">
      <div className="titan-onboarding-hero">
        <span className="titan-eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h1>Welcome to TITAN Health</h1>
        <p>Built for every step of your performance journey.</p>
      </div>
      <div className="titan-onboarding-body">
        <h2>Your {accountName} account is ready</h2>
        <p>{trainer
          ? "Your secure Trainer account has been created."
          : "Your secure Athlete profile and Digital Twin have been created."}</p>
        <div className="titan-onboarding-next" role="status">
          <strong>Access status</strong>
          <p>Paid performance features remain locked until payment is confirmed and the matching {accountName} entitlement is activated.</p>
          <p>Payment checkout is not yet available on staging.</p>
        </div>
      </div>
    </section>
  );
}
