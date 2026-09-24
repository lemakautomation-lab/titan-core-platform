import { useEffect, useState } from "react";
import { getClubExecutives, getClubDirectors, getClubCoaches, getClubScientists, getClubConditioning, getClubNutrition, getClubRehabilitation, getClubTeams, getClubAthletes, type ClubDirectorPage, type ClubExecutivePage, type ClubCoachPage, type ClubScientistPage, type ClubConditioningPage, type ClubNutritionPage, type ClubRehabilitationPage, type ClubTeamsPage, type ClubAthletesPage } from "./club.api";

export default function ClubPage({ canReadDirectors = false, canReadCoaches = false, canReadScientists = false, canReadConditioning = false, canReadNutrition = false, canReadRehabilitation = false, canReadTeams = false, canReadAthletes = false }: { canReadDirectors?: boolean; canReadCoaches?: boolean; canReadScientists?: boolean; canReadConditioning?: boolean; canReadNutrition?: boolean; canReadRehabilitation?: boolean; canReadTeams?: boolean; canReadAthletes?: boolean }) {
  const [page, setPage] = useState<ClubExecutivePage | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [directorPage, setDirectorPage] = useState<ClubDirectorPage | null>(null);
  const [directorError, setDirectorError] = useState(false);
  const [loadingMoreDirectors, setLoadingMoreDirectors] = useState(false);
  const [coachPage, setCoachPage] = useState<ClubCoachPage | null>(null);
  const [coachError, setCoachError] = useState(false);
  const [loadingMoreCoaches, setLoadingMoreCoaches] = useState(false);
  const [scientistPage, setScientistPage] = useState<ClubScientistPage | null>(null);
  const [scientistError, setScientistError] = useState(false);
  const [loadingMoreScientists, setLoadingMoreScientists] = useState(false);
  const [conditioningPage, setConditioningPage] = useState<ClubConditioningPage | null>(null);
  const [conditioningError, setConditioningError] = useState(false);
  const [loadingMoreConditioning, setLoadingMoreConditioning] = useState(false);
  const [nutritionPage, setNutritionPage] = useState<ClubNutritionPage | null>(null);
  const [nutritionError, setNutritionError] = useState(false);
  const [loadingMoreNutrition, setLoadingMoreNutrition] = useState(false);
  const [rehabilitationPage, setRehabilitationPage] = useState<ClubRehabilitationPage | null>(null);
  const [rehabilitationError, setRehabilitationError] = useState(false);
  const [loadingMoreRehabilitation, setLoadingMoreRehabilitation] = useState(false);
  const [teamsPage, setTeamsPage] = useState<ClubTeamsPage | null>(null);
  const [teamsError, setTeamsError] = useState(false);
  const [loadingMoreTeams, setLoadingMoreTeams] = useState(false);
  const [athletesPage, setAthletesPage] = useState<ClubAthletesPage | null>(null);
  const [athletesError, setAthletesError] = useState(false);
  const [loadingMoreAthletes, setLoadingMoreAthletes] = useState(false);
  const organisationId = page?.organisationId;

  useEffect(() => {
    let active = true;
    getClubExecutives()
      .then((result) => { if (active) setPage(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!canReadDirectors || !organisationId) return;
    let active = true;
    getClubDirectors()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setDirectorError(true);
          return;
        }
        setDirectorPage(result);
      })
      .catch(() => { if (active) setDirectorError(true); });
    return () => { active = false; };
  }, [canReadDirectors, organisationId]);

  useEffect(() => {
    if (!canReadCoaches || !organisationId) return;
    let active = true;
    getClubCoaches()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setCoachError(true);
          return;
        }
        setCoachPage(result);
      })
      .catch(() => { if (active) setCoachError(true); });
    return () => { active = false; };
  }, [canReadCoaches, organisationId]);

  useEffect(() => {
    if (!canReadScientists || !organisationId) return;
    let active = true;
    getClubScientists()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setScientistError(true);
          return;
        }
        setScientistPage(result);
      })
      .catch(() => { if (active) setScientistError(true); });
    return () => { active = false; };
  }, [canReadScientists, organisationId]);

  useEffect(() => {
    if (!canReadConditioning || !organisationId) return;
    let active = true;
    getClubConditioning()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setConditioningError(true);
          return;
        }
        setConditioningPage(result);
      })
      .catch(() => { if (active) setConditioningError(true); });
    return () => { active = false; };
  }, [canReadConditioning, organisationId]);

  useEffect(() => {
    if (!canReadNutrition || !organisationId) return;
    let active = true;
    getClubNutrition()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setNutritionError(true);
          return;
        }
        setNutritionPage(result);
      })
      .catch(() => { if (active) setNutritionError(true); });
    return () => { active = false; };
  }, [canReadNutrition, organisationId]);

  async function loadMoreNutrition() {
    if (!nutritionPage?.nextCursor || loadingMoreNutrition) return;
    setLoadingMoreNutrition(true);
    setNutritionError(false);
    try {
      const next = await getClubNutrition(nutritionPage.nextCursor);
      if (next.organisationId !== organisationId) throw new Error("Club changed");
      setNutritionPage({ ...next, nutrition: [...nutritionPage.nutrition, ...next.nutrition] });
    } catch {
      setNutritionError(true);
    } finally {
      setLoadingMoreNutrition(false);
    }
  }

  useEffect(() => {
    if (!canReadRehabilitation || !organisationId) return;
    let active = true;
    getClubRehabilitation()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setRehabilitationError(true);
          return;
        }
        setRehabilitationPage(result);
      })
      .catch(() => { if (active) setRehabilitationError(true); });
    return () => { active = false; };
  }, [canReadRehabilitation, organisationId]);

  async function loadMoreRehabilitation() {
    if (!rehabilitationPage?.nextCursor || loadingMoreRehabilitation) return;
    setLoadingMoreRehabilitation(true);
    setRehabilitationError(false);
    try {
      const next = await getClubRehabilitation(rehabilitationPage.nextCursor);
      if (next.organisationId !== organisationId) throw new Error("Club changed");
      setRehabilitationPage({ ...next, rehabilitation: [...rehabilitationPage.rehabilitation, ...next.rehabilitation] });
    } catch {
      setRehabilitationError(true);
    } finally {
      setLoadingMoreRehabilitation(false);
    }
  }

  useEffect(() => {
    if (!canReadTeams || !organisationId) return;
    let active = true;
    getClubTeams()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setTeamsError(true);
          return;
        }
        setTeamsPage(result);
      })
      .catch(() => { if (active) setTeamsError(true); });
    return () => { active = false; };
  }, [canReadTeams, organisationId]);

  async function loadMoreTeams() {
    if (!teamsPage?.nextCursor || loadingMoreTeams) return;
    setLoadingMoreTeams(true);
    setTeamsError(false);
    try {
      const next = await getClubTeams(teamsPage.nextCursor);
      if (next.organisationId !== organisationId) throw new Error("Club changed");
      setTeamsPage({ ...next, teams: [...teamsPage.teams, ...next.teams] });
    } catch {
      setTeamsError(true);
    } finally {
      setLoadingMoreTeams(false);
    }
  }

  useEffect(() => {
    if (!canReadAthletes || !organisationId) return;
    let active = true;
    getClubAthletes()
      .then((result) => {
        if (!active) return;
        if (result.organisationId !== organisationId) {
          setAthletesError(true);
          return;
        }
        setAthletesPage(result);
      })
      .catch(() => { if (active) setAthletesError(true); });
    return () => { active = false; };
  }, [canReadAthletes, organisationId]);

  async function loadMoreAthletes() {
    if (!athletesPage?.nextCursor || loadingMoreAthletes) return;
    setLoadingMoreAthletes(true);
    setAthletesError(false);
    try {
      const next = await getClubAthletes(athletesPage.nextCursor);
      if (next.organisationId !== organisationId) throw new Error("Club changed");
      setAthletesPage({ ...next, athletes: [...athletesPage.athletes, ...next.athletes] });
    } catch {
      setAthletesError(true);
    } finally {
      setLoadingMoreAthletes(false);
    }
  }

  async function loadMoreConditioning() {
    if (!conditioningPage?.nextCursor || loadingMoreConditioning) return;
    setLoadingMoreConditioning(true);
    setConditioningError(false);
    try {
      const next = await getClubConditioning(conditioningPage.nextCursor);
      if (next.organisationId !== conditioningPage.organisationId) throw new Error("Club changed");
      setConditioningPage({ ...next, conditioning: [...conditioningPage.conditioning, ...next.conditioning] });
    } catch {
      setConditioningError(true);
    } finally {
      setLoadingMoreConditioning(false);
    }
  }

  async function loadMoreScientists() {
    if (!scientistPage?.nextCursor || loadingMoreScientists) return;
    setLoadingMoreScientists(true);
    setScientistError(false);
    try {
      const next = await getClubScientists(scientistPage.nextCursor);
      if (next.organisationId !== scientistPage.organisationId) throw new Error("Club changed");
      setScientistPage({ ...next, scientists: [...scientistPage.scientists, ...next.scientists] });
    } catch {
      setScientistError(true);
    } finally {
      setLoadingMoreScientists(false);
    }
  }

  async function loadMoreCoaches() {
    if (!coachPage?.nextCursor || loadingMoreCoaches) return;
    setLoadingMoreCoaches(true);
    setCoachError(false);
    try {
      const next = await getClubCoaches(coachPage.nextCursor);
      if (next.organisationId !== coachPage.organisationId) throw new Error("Club changed");
      setCoachPage({ ...next, coaches: [...coachPage.coaches, ...next.coaches] });
    } catch {
      setCoachError(true);
    } finally {
      setLoadingMoreCoaches(false);
    }
  }

  async function loadMoreDirectors() {
    if (!directorPage?.nextCursor || loadingMoreDirectors) return;
    setLoadingMoreDirectors(true);
    setDirectorError(false);
    try {
      const next = await getClubDirectors(directorPage.nextCursor);
      if (next.organisationId !== directorPage.organisationId) throw new Error("Club changed");
      setDirectorPage({ ...next, directors: [...directorPage.directors, ...next.directors] });
    } catch {
      setDirectorError(true);
    } finally {
      setLoadingMoreDirectors(false);
    }
  }

  async function loadMore() {
    if (!page?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(false);
    try {
      const next = await getClubExecutives(page.nextCursor);
      if (next.organisationId !== page.organisationId) throw new Error("Club changed");
      setPage({ ...next, executives: [...page.executives, ...next.executives] });
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return <main>
    <h1>Club executive structure</h1>
    {error && <p role="alert">Club structure is unavailable.</p>}
    {!page && !error && <p>Loading club structure...</p>}
    {page && <section aria-label="Club executives">
      <h2>{page.organisationName}</h2>
      <p>Active direct units: {page.activeChildOrganisationCount}</p>
      {page.executives.length === 0 && <p>No active executives assigned to this club.</p>}
      <ul>{page.executives.map((executive) => <li key={executive.id}>{executive.name}</li>)}</ul>
      {page.nextCursor && <button type="button" disabled={loadingMore} onClick={loadMore}>
        Load more executives
      </button>}
    </section>}
    {canReadDirectors && <section aria-label="Club performance directors">
      <h2>Performance Directors</h2>
      {directorError && <p role="alert">Club directors are unavailable.</p>}
      {!directorPage && !directorError && <p>Loading directors...</p>}
      {directorPage && <>
        {directorPage.directors.length === 0 && <p>No active Performance Directors assigned to this club.</p>}
        <ul>{directorPage.directors.map((director) => <li key={director.id}>{director.name}</li>)}</ul>
        {directorPage.nextCursor && <button type="button" disabled={loadingMoreDirectors} onClick={loadMoreDirectors}>
          Load more directors
        </button>}
      </>}
    </section>}
    {canReadCoaches && page && <section aria-label="Club coaches">
      <h2>Coaches</h2>
      {coachError && <p role="alert">Club coaches are unavailable.</p>}
      {!coachPage && !coachError && <p>Loading coaches...</p>}
      {coachPage && <>
        {coachPage.coaches.length === 0 && <p>No active coaches assigned to this club.</p>}
        <ul>{coachPage.coaches.map((coach) => <li key={coach.id}>{coach.name}</li>)}</ul>
        {coachPage.nextCursor && <button type="button" disabled={loadingMoreCoaches} onClick={loadMoreCoaches}>
          Load more coaches
        </button>}
      </>}
    </section>}
    {canReadScientists && page && <section aria-label="Club sports scientists">
      <h2>Sports Scientists</h2>
      {scientistError && <p role="alert">Club scientists are unavailable.</p>}
      {!scientistPage && !scientistError && <p>Loading scientists...</p>}
      {scientistPage && <>
        {scientistPage.scientists.length === 0 && <p>No active Sports Scientists assigned to this club.</p>}
        <ul>{scientistPage.scientists.map((scientist) => <li key={scientist.id}>{scientist.name}</li>)}</ul>
        {scientistPage.nextCursor && <button type="button" disabled={loadingMoreScientists} onClick={loadMoreScientists}>
          Load more scientists
        </button>}
      </>}
    </section>}
    {canReadConditioning && page && <section aria-label="Club strength and conditioning">
      <h2>Strength &amp; Conditioning</h2>
      {conditioningError && <p role="alert">Club conditioning staff are unavailable.</p>}
      {!conditioningPage && !conditioningError && <p>Loading conditioning staff...</p>}
      {conditioningPage && <>
        {conditioningPage.conditioning.length === 0 && <p>No active strength and conditioning professionals assigned to this club.</p>}
        <ul>{conditioningPage.conditioning.map((professional) => <li key={professional.id}>{professional.name}</li>)}</ul>
        {conditioningPage.nextCursor && <button type="button" disabled={loadingMoreConditioning} onClick={loadMoreConditioning}>
          Load more conditioning staff
        </button>}
      </>}
    </section>}
    {canReadNutrition && page && <section aria-label="Club nutrition">
      <h2>Nutrition Professionals</h2>
      {nutritionError && <p role="alert">Club nutrition staff are unavailable.</p>}
      {!nutritionPage && !nutritionError && <p>Loading nutrition staff...</p>}
      {nutritionPage && <>
        {nutritionPage.nutrition.length === 0 && <p>No active Nutrition Professionals assigned to this club.</p>}
        <ul>{nutritionPage.nutrition.map((professional) => <li key={professional.id}>{professional.name}</li>)}</ul>
        {nutritionPage.nextCursor && <button type="button" disabled={loadingMoreNutrition} onClick={loadMoreNutrition}>
          Load more nutrition staff
        </button>}
      </>}
    </section>}
    {canReadRehabilitation && page && <section aria-label="Club rehabilitation">
      <h2>Rehabilitation Professionals</h2>
      {rehabilitationError && <p role="alert">Club rehabilitation staff are unavailable.</p>}
      {!rehabilitationPage && !rehabilitationError && <p>Loading rehabilitation staff...</p>}
      {rehabilitationPage && <>
        {rehabilitationPage.rehabilitation.length === 0 && <p>No active Rehabilitation Professionals assigned to this club.</p>}
        <ul>{rehabilitationPage.rehabilitation.map((professional) => <li key={professional.id}>{professional.name}</li>)}</ul>
        {rehabilitationPage.nextCursor && <button type="button" disabled={loadingMoreRehabilitation} onClick={loadMoreRehabilitation}>
          Load more rehabilitation staff
        </button>}
      </>}
    </section>}
    {canReadTeams && page && <section aria-label="Club teams">
      <h2>Teams</h2>
      {teamsError && <p role="alert">Club teams are unavailable.</p>}
      {!teamsPage && !teamsError && <p>Loading teams...</p>}
      {teamsPage && <>
        {teamsPage.teams.length === 0 && <p>No active teams assigned to this club.</p>}
        <ul>{teamsPage.teams.map((team) => <li key={team.id}>{team.name}</li>)}</ul>
        {teamsPage.nextCursor && <button type="button" disabled={loadingMoreTeams} onClick={loadMoreTeams}>
          Load more teams
        </button>}
      </>}
    </section>}
    {canReadAthletes && page && <section aria-label="Club athletes">
      <h2>Athletes</h2>
      {athletesError && <p role="alert">Club athletes are unavailable.</p>}
      {!athletesPage && !athletesError && <p>Loading athletes...</p>}
      {athletesPage && <>
        {athletesPage.athletes.length === 0 && <p>No active athletes assigned to this club.</p>}
        <ul>{athletesPage.athletes.map((athlete) => <li key={athlete.id}>{athlete.name}</li>)}</ul>
        {athletesPage.nextCursor && <button type="button" disabled={loadingMoreAthletes} onClick={loadMoreAthletes}>
          Load more athletes
        </button>}
      </>}
    </section>}
  </main>;
}
