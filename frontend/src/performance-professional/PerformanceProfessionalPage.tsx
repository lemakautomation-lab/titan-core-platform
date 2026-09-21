import {
  type FormEvent,
  useState,
} from "react";

import {
  getSportsScientistWorkflow,
  type PerformanceProfessionalWorkflowDto,
} from "./performance-professional.api";

export default function PerformanceProfessionalPage() {
  const [athleteId, setAthleteId] = useState("");
  const [workflow, setWorkflow] =
    useState<PerformanceProfessionalWorkflowDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function loadWorkflow(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const id = athleteId.trim();

    if (!id) {
      setError(
        "Enter an Athlete ID before loading the workflow.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setWorkflow(null);

    try {
      const result =
        await getSportsScientistWorkflow(id);

      setWorkflow(result);
    }
    catch {
      setError(
        "The Sports Scientist workflow is temporarily unavailable.",
      );
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section
        className="titan-panel"
        aria-label="Sports Scientist workflow"
      >
        <span className="titan-eyebrow">
          PERFORMANCE PROFESSIONAL
        </span>

        <h2>Sports Scientist Workflow</h2>

        <p>
          Review authorised Athlete performance,
          recovery, training stress and workout
          programme information.
        </p>

        <form onSubmit={loadWorkflow}>
          <label>
            Athlete ID
            <input
              name="athleteId"
              value={athleteId}
              onChange={(event) =>
                setAthleteId(event.target.value)
              }
              autoComplete="off"
              placeholder="Enter Athlete ID"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Loading workflow..."
              : "Load workflow"}
          </button>
        </form>

        {error && (
          <p role="alert">{error}</p>
        )}

        {workflow && (
          <section
            aria-label="Athlete workflow"
          >
            <span className="titan-eyebrow">
              AUTHORISED ATHLETE
            </span>

            <h3>Workflow overview</h3>

            <p>
              Athlete ID:{" "}
              <strong>
                {workflow.athleteId}
              </strong>
            </p>

            <dl>
              <dt>Performance metrics</dt>
              <dd>
                {workflow.performance.length}
              </dd>

              <dt>Recovery observations</dt>
              <dd>
                {workflow.recovery.length}
              </dd>

              <dt>Training stress observations</dt>
              <dd>
                {workflow.trainingStress.length}
              </dd>

              <dt>Workout programmes</dt>
              <dd>
                {workflow.workoutProgrammes.length}
              </dd>
            </dl>
          </section>
        )}
      </section>
    </main>
  );
}
