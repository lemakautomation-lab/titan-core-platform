import { useEffect, useState } from "react";
import {
  getDepartmentCommandCentre,
  getDepartmentPerformanceIntelligence,
  getDepartmentTeams,
  getDepartmentRoleReport,
  type DepartmentCommandCentre,
  type DepartmentPerformanceIntelligence,
  type IntelligenceWindow,
  type DepartmentTeamsPage,
  type DepartmentRoleReport,
} from "./performance-director.api";

export default function PerformanceDirectorPage({ canReadIntelligence = false, canReadTeams = false, canReadReport = false }: {
  canReadIntelligence?: boolean;
  canReadTeams?: boolean;
  canReadReport?: boolean;
}) {
  const [summary, setSummary] = useState<DepartmentCommandCentre | null>(null);
  const [error, setError] = useState(false);
  const [days, setDays] = useState<IntelligenceWindow>(30);
  const [intelligence, setIntelligence] = useState<DepartmentPerformanceIntelligence | null>(null);
  const [intelligenceError, setIntelligenceError] = useState(false);
  const [teamsPage, setTeamsPage] = useState<DepartmentTeamsPage | null>(null);
  const [teamsError, setTeamsError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportDays, setReportDays] = useState<IntelligenceWindow>(30);
  const [report, setReport] = useState<DepartmentRoleReport | null>(null);
  const [reportError, setReportError] = useState(false);

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

  useEffect(() => {
    if (!canReadTeams) return;
    let active = true;
    getDepartmentTeams()
      .then((page) => { if (active) setTeamsPage(page); })
      .catch(() => { if (active) setTeamsError(true); });
    return () => { active = false; };
  }, [canReadTeams]);

  useEffect(() => {
    if (!canReadReport) return;
    let active = true;
    setReport(null);
    setReportError(false);
    getDepartmentRoleReport(reportDays)
      .then((value) => { if (active) setReport(value); })
      .catch(() => { if (active) setReportError(true); });
    return () => { active = false; };
  }, [canReadReport, reportDays]);

  async function loadMoreTeams() {
    if (!teamsPage?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    setTeamsError(false);
    try {
      const next = await getDepartmentTeams(teamsPage.nextCursor);
      if (next.organisationId !== teamsPage.organisationId) throw new Error("Department changed");
      setTeamsPage({
        ...next,
        teams: [...teamsPage.teams, ...next.teams],
      });
    } catch {
      setTeamsError(true);
    } finally {
      setLoadingMore(false);
    }
  }

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
      {canReadTeams && (
        <section aria-label="Department teams">
          <h2>Department teams</h2>
          {!teamsPage && !teamsError && <p>Loading teams...</p>}
          {teamsError && <p role="alert">Department teams are unavailable.</p>}
          {teamsPage && (
            <>
              {teamsPage.teams.length === 0 && <p>No active teams in this department.</p>}
              <ul>{teamsPage.teams.map((team) => <li key={team.id}>{team.name}</li>)}</ul>
              {teamsPage.nextCursor && (
                <button type="button" disabled={loadingMore} onClick={loadMoreTeams}>
                  Load more teams
                </button>
              )}
            </>
          )}
        </section>
      )}
      {canReadReport && (
        <section aria-label="Director role report">
          <h2>Department report</h2>
          <label htmlFor="report-days">Report window</label>
          <select id="report-days" value={reportDays}
            onChange={(event) => setReportDays(Number(event.target.value) as IntelligenceWindow)}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          {reportError && <p role="alert">Department report is unavailable.</p>}
          {!report && !reportError && <p>Loading department report...</p>}
          {report && <div>
            <p>Department: {report.organisationName}</p>
            <p>Staff: {report.staffCount}</p>
            <p>Active athletes: {report.activeAthleteCount}</p>
            <p>Athletes with measurements: {report.measuredAthleteCount}</p>
            <p>Effective measurements: {report.effectiveMeasurementCount}</p>
            <p>Latest measurement: {report.latestMeasurementAt ?? "None in this window"}</p>
          </div>}
        </section>
      )}
    </main>
  );
}
