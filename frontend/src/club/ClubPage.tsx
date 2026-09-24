import { useEffect, useState } from "react";
import { getClubExecutives, type ClubExecutivePage } from "./club.api";

export default function ClubPage() {
  const [page, setPage] = useState<ClubExecutivePage | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    getClubExecutives()
      .then((result) => { if (active) setPage(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

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
  </main>;
}
