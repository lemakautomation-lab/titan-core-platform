import { useEffect, useState } from "react";

import {
  listSports,
  SportDto,
} from "./sports.api";

interface SportsPageProps {
  tenantId: string;
}

export default function SportsPage({
  tenantId,
}: SportsPageProps) {
  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSports() {
      setLoading(true);
      setError(null);

      try {
        const result = await listSports(tenantId);

        if (mounted) {
          setSports(result);
        }
      } catch {
        if (mounted) {
          setError(
            "Unable to load sports. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSports();

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  return (
    <section className="titan-users-page">
      <div className="titan-page-heading">
        <div>
          <span className="titan-eyebrow">
            SPORT ENGINE
          </span>

          <h2>Sports</h2>
        </div>

        <div className="titan-tenant">
          <span>Tenant</span>
          <strong>{tenantId}</strong>
        </div>
      </div>

      <section className="titan-panel titan-users-panel">
        <div className="titan-users-header">
          <div>
            <span className="titan-eyebrow">
              SPORT DIRECTORY
            </span>

            <h3>Tenant sports</h3>
          </div>

          {!loading && !error && (
            <span className="titan-user-count">
              {sports.length} sport{sports.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading && (
          <div className="titan-users-state">
            Loading sports...
          </div>
        )}

        {error && (
          <div
            className="titan-users-state titan-users-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && sports.length === 0 && (
          <div className="titan-users-state">
            No sports found for this tenant.
          </div>
        )}

        {!loading && !error && sports.length > 0 && (
          <div className="titan-users-table-wrapper">
            <table className="titan-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {sports.map((sport) => (
                  <tr key={sport.id}>
                    <td>
                      <strong>{sport.name}</strong>
                    </td>

                    <td>{sport.slug}</td>

                    <td>
                      <span className="titan-user-status">
                        {sport.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
