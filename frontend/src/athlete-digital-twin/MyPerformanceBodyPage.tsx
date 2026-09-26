import { useEffect, useState } from "react";
import AthletePerformanceBodyPanel from "./AthletePerformanceBodyPanel";
import { getMyPerformanceBodyProfile } from "./athlete-performance-body.api";

export default function MyPerformanceBodyPage() {
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getMyPerformanceBodyProfile()
      .then((profile) => { if (mounted) setAthleteId(profile.athleteId); })
      .catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="titan-dashboard-page">
      <h2>My 3D performance body</h2>
      {error && <p role="alert">Unable to load your performance body.</p>}
      {!error && !athleteId && <p role="status">Loading your performance body...</p>}
      {athleteId && <AthletePerformanceBodyPanel athleteId={athleteId} />}
    </section>
  );
}
