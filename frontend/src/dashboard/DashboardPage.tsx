import TrainingOverviewPanel from "./TrainingOverviewPanel";
import RelevantContextPanel from "./RelevantContextPanel";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listPerformanceMetrics,
  type PerformanceMetricDto,
} from "../performance-metrics/performance-metrics.api";

interface DashboardPageProps {
  tenantId: string;
  permissions: readonly string[];
}

const PERFORMANCE_READ_PERMISSION =
  "performance-metrics.read";

function hasPermission(
  permissions: readonly string[],
): boolean {
  return permissions
    .map((permission) =>
      permission.trim().toLowerCase(),
    )
    .includes(PERFORMANCE_READ_PERMISSION);
}

export default function DashboardPage({
  tenantId,
  permissions,
}: DashboardPageProps) {
  const allowed=hasPermission(permissions);
  const [metrics,setMetrics]=
    useState<PerformanceMetricDto[]>([]);
  const [loading,setLoading]=useState(allowed);
  const [error,setError]=useState(false);

  useEffect(() => {
    let mounted=true;

    if (!allowed) {
      setLoading(false);
      setMetrics([]);
      setError(false);
      return () => {
        mounted=false;
      };
    }

    setLoading(true);
    setError(false);

    void listPerformanceMetrics(tenantId)
      .then((result) => {
        if (mounted) {
          setMetrics(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setMetrics([]);
          setError(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted=false;
    };
  }, [allowed,tenantId]);

  const summary=useMemo(() => ({
    metrics: metrics.length,
    athletes: new Set(
      metrics.map((metric) => metric.athleteId),
    ).size,
    sports: new Set(
      metrics.map((metric) => metric.sportId),
    ).size,
    active: metrics.filter(
      (metric) =>
        metric.status.trim().toLowerCase() ===
        "active",
    ).length,
  }),[metrics]);

  return (
    <section className="titan-dashboard-page">
      <section className="titan-panel titan-dashboard-intro">
        <span className="titan-eyebrow">
          PERFORMANCE COMMAND CENTRE
        </span>

        <h3>Dashboard</h3>

        <p>
          Welcome to TITAN Health. Your performance workspace
          is ready.
        </p>
      </section>

      <section
        className="titan-panel"
        aria-label="Athlete performance overview"
      >
        <h2>Athlete performance overview</h2>

        {!allowed && (
          <p role="status">
            Performance overview requires the
            performance-metrics.read permission.
          </p>
        )}

        {allowed && loading && (
          <p role="status">
            Loading athlete performance overview...
          </p>
        )}

        {allowed && !loading && error && (
          <p role="alert">
            Athlete performance overview is temporarily
            unavailable.
          </p>
        )}

        {allowed &&
          !loading &&
          !error &&
          metrics.length === 0 && (
            <p role="status">
              No performance metrics are available.
            </p>
          )}

        {allowed &&
          !loading &&
          !error &&
          metrics.length > 0 && (
            <>
              <dl className="titan-dashboard-summary" aria-label="Performance summary">
                <div>
                  <dt>Tracked metrics</dt>
                  <dd>{summary.metrics}</dd>
                </div>

                <div>
                  <dt>Athletes represented</dt>
                  <dd>{summary.athletes}</dd>
                </div>

                <div>
                  <dt>Sports represented</dt>
                  <dd>{summary.sports}</dd>
                </div>

                <div>
                  <dt>Active metrics</dt>
                  <dd>{summary.active}</dd>
                </div>
              </dl>

              <p>
                Overview values reflect authorised tenant-scoped
                performance metric records.
              </p>
            </>
          )}
      </section>
      <TrainingOverviewPanel
        permissions={permissions}
      />

      <RelevantContextPanel
        permissions={permissions}
      />

    </section>
  );
}

