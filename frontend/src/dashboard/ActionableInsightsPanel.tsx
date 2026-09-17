import { useEffect, useState } from "react";

import {
  getMyActionableInsights,
  type ActionableInsightDto,
} from "./actionable-insights.api";

export default function ActionableInsightsPanel() {
  const [insights, setInsights] =
    useState<readonly ActionableInsightDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(false);

    void getMyActionableInsights()
      .then((result) => {
        if (mounted) {
          setInsights(result.insights);
        }
      })
      .catch(() => {
        if (mounted) {
          setInsights([]);
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
    <section
      className="titan-panel"
      aria-label="Actionable performance insights"
    >
      <h2>Actionable insights</h2>

      {loading && (
        <p role="status">
          Loading actionable performance insights...
        </p>
      )}

      {!loading && error && (
        <p role="alert">
          Actionable performance insights are temporarily unavailable.
        </p>
      )}

      {!loading && !error && insights.length === 0 && (
        <p role="status">
          No actionable performance insights are currently available.
        </p>
      )}

      {!loading && !error && insights.length > 0 && (
        <ul aria-label="Performance insight list">
          {insights.map((insight) => (
            <li key={`${insight.metricId}-${insight.type}`}>
              <strong>{insight.metricName}</strong>
              <p>{insight.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
