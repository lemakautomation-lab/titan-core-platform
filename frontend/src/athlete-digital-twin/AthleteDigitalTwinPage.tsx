import { useEffect, useState } from "react";

import {
  AthleteDigitalTwinDto,
  getAthleteDigitalTwinByAthleteId,
} from "./athlete-digital-twin.api";

type Props = {
  athleteId: string;
};

export default function AthleteDigitalTwinPage({
  athleteId,
}: Props) {
  const [twin, setTwin] =
    useState<AthleteDigitalTwinDto | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTwin() {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getAthleteDigitalTwinByAthleteId(
            athleteId,
          );

        if (mounted) {
          setTwin(result);
        }
      } catch {
        if (mounted) {
          setError(
            "Unable to load athlete digital twin. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadTwin();

    return () => {
      mounted = false;
    };
  }, [athleteId]);

  return (
    <section className="titan-users-page">
      <div className="titan-page-heading">
        <div>
          <span className="titan-eyebrow">
            ATHLETE DIGITAL TWIN
          </span>

          <h2>Digital Twin</h2>
        </div>
      </div>

      <section className="titan-panel titan-users-panel">
        <div className="titan-users-header">
          <div>
            <span className="titan-eyebrow">
              TWIN PROFILE
            </span>

            <h3>Athlete digital twin</h3>
          </div>
        </div>

        {loading && (
          <div className="titan-users-state">
            Loading digital twin...
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

        {!loading && !error && !twin && (
          <div className="titan-users-state">
            No digital twin found.
          </div>
        )}

        {!loading && !error && twin && (
          <div className="titan-users-table-wrapper">
            <table className="titan-users-table">
              <tbody>
                <tr>
                  <th>Twin ID</th>
                  <td>{twin.id}</td>
                </tr>

                <tr>
                  <th>Athlete ID</th>
                  <td>{twin.athleteId}</td>
                </tr>

                <tr>
                  <th>Status</th>
                  <td>
                    <span className="titan-user-status">
                      {twin.status}
                    </span>
                  </td>
                </tr>

                <tr>
                  <th>Created</th>
                  <td>{twin.createdAt}</td>
                </tr>

                <tr>
                  <th>Updated</th>
                  <td>{twin.updatedAt}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
