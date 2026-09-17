import {
  useEffect,
  useState,
} from "react";

import {
  getMyTrainerAccess,
  type TrainerAccessDto,
} from "./trainer-access.api";

export default function TrainerAccessPage() {
  const [access, setAccess] =
    useState<TrainerAccessDto | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(false);

    void getMyTrainerAccess()
      .then((result) => {
        if (mounted) {
          setAccess(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setAccess(null);
          setError(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="titan-dashboard-page">
      <section
        className="titan-panel"
        aria-label="Trainer subscription access"
      >
        <span className="titan-eyebrow">
          TRAINER PLATFORM
        </span>

        <h2>Trainer access</h2>

        {loading && (
          <p role="status">
            Checking Trainer subscription access...
          </p>
        )}

        {!loading && error && (
          <p role="alert">
            Trainer access is temporarily unavailable.
          </p>
        )}

        {!loading &&
          !error &&
          access?.accessGranted && (
            <p role="status">
              Your Trainer subscription is active.
              Trainer platform access is enabled.
            </p>
          )}

        {!loading &&
          !error &&
          access?.reason ===
            "TRAINER_TYPE_REQUIRED" && (
            <p role="status">
              Trainer access requires the Trainer user type.
            </p>
          )}

        {!loading &&
          !error &&
          access?.reason ===
            "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED" && (
            <p role="status">
              An active Trainer subscription is required
              to access the Trainer platform.
            </p>
          )}
      </section>
    </section>
  );
}
