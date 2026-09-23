import { useEffect, useState } from "react";
import {
  getDepartmentCommandCentre,
  getDepartmentPerformanceIntelligence,
  type DepartmentCommandCentre,
  type DepartmentPerformanceIntelligence,
  type IntelligenceWindow,
} from "./performance-director.api";

export default function PerformanceDirectorPage({ canReadIntelligence = false }: {
  canReadIntelligence?: boolean;
}) {
  const [summary, setSummary] = useState<DepartmentCommandCentre | null>(null);
  const [error, setError] = useState(false);
  const [days, setDays] = useState<IntelligenceWindow>(30);
  const [intelligence, setIntelligence] = useState<DepartmentPerformanceIntelligence | null>(null);
  const [intelligenceError, setIntelligenceError] = useState(false);

  useEffect(() => {
    let active = true;
    getDepartmentCommandCentre()
      .then((result) => { if (active) setSummary(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!canReadIntelligence) return;
    let active = true;
    setIntelligence(null);
    setIntelligenceError(false);
    getDepartmentPerformanceIntelligence(days)
      .then((result) => { if (active) setIntelligence(result); })
      .catch(() => { if (active) setIntelligenceError(true); });
    return () => { active = false; };
  }, [canReadIntelligence, days]);

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
      {canReadIntelligence && (
        <section aria-label="Department performance intelligence">
          <h2>Measurement activity</h2>
          <label htmlFor="director-days">Reporting window</label>
          <select
            id="director-days"
            value={days}
            onChange={(event) => setDays(Number(event.target.value) as IntelligenceWindow)}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          {intelligenceError && <p role="alert">Measurement activity is unavailable.</p>}
          {!intelligence && !intelligenceError && <p>Loading measurement activity...</p>}
          {intelligence && (
            <div>
              <p>Active athletes: {intelligence.activeAthleteCount}</p>
              <p>Athletes with measurements: {intelligence.measuredAthleteCount}</p>
              <p>Effective measurements: {intelligence.effectiveMeasurementCount}</p>
              <p>Latest measurement: {intelligence.latestMeasurementAt ?? "None in this window"}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
