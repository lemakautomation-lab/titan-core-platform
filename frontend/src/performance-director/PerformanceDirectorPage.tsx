import { useEffect, useState } from "react";
import {
  getDepartmentCommandCentre,
  type DepartmentCommandCentre,
} from "./performance-director.api";

export default function PerformanceDirectorPage() {
  const [summary, setSummary] = useState<DepartmentCommandCentre | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getDepartmentCommandCentre()
      .then((result) => { if (active) setSummary(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return (
    <main>
      <h1>Department command centre</h1>
      {error && <p role="alert">Department data is unavailable.</p>}
      {!error && !summary && <p>Loading department...</p>}
      {summary && (
        <section aria-label="Department overview">
          <h2>{summary.organisationName}</h2>
          <p>Staff: {summary.staffCount}</p>
          <p>Athletes: {summary.athleteCount}</p>
        </section>
      )}
    </main>
  );
}
