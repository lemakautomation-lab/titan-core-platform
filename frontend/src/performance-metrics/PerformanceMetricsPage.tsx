import { useEffect, useState } from "react";

import {
  listPerformanceMetrics,
  PerformanceMetricDto,
} from "./performance-metrics.api";

interface PerformanceMetricsPageProps {
  tenantId: string;
}

export default function PerformanceMetricsPage({
  tenantId,
}: PerformanceMetricsPageProps) {
  const [metrics, setMetrics] =
    useState<PerformanceMetricDto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPerformanceMetrics() {
      setLoading(true);
      setError(null);

      try {
        const result =
          await listPerformanceMetrics(tenantId);

        if (mounted) {
          setMetrics(result);
        }
      } catch {
        if (mounted) {
          setError(
            "Unable to load performance metrics. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPerformanceMetrics();

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  return (
    <section className="titan-users-page">

      <div className="titan-page-heading">

        <div>
          <span className="titan-eyebrow">
            PERFORMANCE ENGINE
          </span>

          <h2>
            Performance Metrics
          </h2>
        </div>

        <div className="titan-tenant">
          <span>
            Tenant
          </span>

          <strong>
            {tenantId}
          </strong>
        </div>

      </div>

      <section className="titan-panel titan-users-panel">

        <div className="titan-users-header">

          <div>
            <span className="titan-eyebrow">
              METRIC DIRECTORY
            </span>

            <h3>
              Tenant performance metrics
            </h3>
          </div>

          {!loading && !error && (
            <span className="titan-user-count">
              {metrics.length} metric{metrics.length === 1 ? "" : "s"}
            </span>
          )}

        </div>

        {loading && (
          <div className="titan-users-state">
            Loading performance metrics...
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

        {!loading && !error && metrics.length === 0 && (
          <div className="titan-users-state">
            No performance metrics found for this tenant.
          </div>
        )}

        {!loading && !error && metrics.length > 0 && (
          <div className="titan-users-table-wrapper">

            <table className="titan-users-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Data Type</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {metrics.map((metric) => (

                  <tr key={metric.id}>

                    <td>
                      <strong>
                        {metric.name}
                      </strong>
                    </td>

                    <td>
                      {metric.slug}
                    </td>

                    <td>
                      {metric.dataType}
                    </td>

                    <td>
                      {metric.unit || "—"}
                    </td>

                    <td>
                      <span className="titan-user-status">
                        {metric.status}
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
