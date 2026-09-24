import { useEffect, useState } from "react";
import { getClubExecutives, getClubDirectors, getClubCoaches, type ClubDirectorPage, type ClubExecutivePage, type ClubCoachPage } from "./club.api";

export default function ClubPage({ canReadDirectors = false, canReadCoaches = false }: { canReadDirectors?: boolean; canReadCoaches?: boolean }) {
  const [page, setPage] = useState<ClubExecutivePage | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [directorPage, setDirectorPage] = useState<ClubDirectorPage | null>(null);
  const [directorError, setDirectorError] = useState(false);
  const [loadingMoreDirectors, setLoadingMoreDirectors] = useState(false);
  const [coachPage, setCoachPage] = useState<ClubCoachPage | null>(null);
  const [coachError, setCoachError] = useState(false);
  const [loadingMoreCoaches, setLoadingMoreCoaches] = useState(false);
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
  </main>;
}
