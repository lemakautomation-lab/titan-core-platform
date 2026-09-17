import { useEffect, useState } from "react";

import { getMyRelevantContext, type RelevantContextDto } from "./relevant-context.api";

interface RelevantContextPanelProps {
  permissions: readonly string[];
}

export default function RelevantContextPanel({
  permissions: _permissions,
}: RelevantContextPanelProps) {
  const [context, setContext] = useState<RelevantContextDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    void getMyRelevantContext()
      .then((result) => {
        if (mounted) setContext(result);
      })
      .catch(() => {
        if (mounted) {
          setContext(null);
          setError(true);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  return (
    <section className="titan-panel" aria-label="Relevant body recovery and nutrition context">
      <h2>Relevant context</h2>

      {loading && (
        <p role="status">Loading relevant body, recovery and nutrition context...</p>
      )}

      {!loading && error && (
        <p role="alert">Relevant athlete context is temporarily unavailable.</p>
      )}

      {!loading && !error && context && (
        <>
          <section aria-label="Body context">
            <h3>Body</h3>
            <p>{context.body ? "Performance body profile is available for this athlete." : "Performance body profile is not currently available."}</p>
          </section>

          <section aria-label="Recovery context">
            <h3>Recovery</h3>
            {context.recovery.latest ? (
              <p role="status">Latest recovery value: {context.recovery.latest.value}</p>
            ) : (
              <p role="status">No recovery tracking data is currently available.</p>
            )}
          </section>

          <section aria-label="Nutrition context">
            <h3>Nutrition</h3>
            {context.nutrition.latest ? (
              <p role="status">
                {context.nutrition.latest.goalClassification ?? "Nutrition plan"}: {context.nutrition.latest.macroTargets.caloriesKcal} kcal/day; hydration {context.nutrition.latest.hydrationGuidance.dailyWaterLitres} L/day.
              </p>
            ) : (
              <p role="status">No nutrition plan is currently available.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
