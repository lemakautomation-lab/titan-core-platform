import {
  type FormEvent,
  useState,
} from "react";

import {
  getSportsScientistWorkflow,
  getStrengthConditioningWorkflow,
  getNutritionProfessionalWorkflow,
  getRehabilitationProfessionalWorkflow,
  type PerformanceProfessionalWorkflowDto,
  type StrengthConditioningWorkflowDto,
  type NutritionProfessionalWorkflowDto,
  type RehabilitationProfessionalWorkflowDto,
} from "./performance-professional.api";

export default function PerformanceProfessionalPage() {
  const [athleteId, setAthleteId] = useState("");
  const [workflow, setWorkflow] =
    useState<PerformanceProfessionalWorkflowDto | null>(null);
  const [
    strengthConditioningWorkflow,
    setStrengthConditioningWorkflow,
  ] =
    useState<StrengthConditioningWorkflowDto | null>(null);
  const [
    nutritionWorkflow,
    setNutritionWorkflow,
  ] =
    useState<NutritionProfessionalWorkflowDto | null>(null);
  const [
    rehabilitationWorkflow,
    setRehabilitationWorkflow,
  ] =
    useState<RehabilitationProfessionalWorkflowDto | null>(null);
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
    setStrengthConditioningWorkflow(null);
    setNutritionWorkflow(null);
    setRehabilitationWorkflow(null);

    try {
      const [
        sportsScientistResult,
        strengthConditioningResult,
        nutritionResult,
        rehabilitationResult,
      ] = await Promise.all([
        getSportsScientistWorkflow(id),
        getStrengthConditioningWorkflow(id),
        getNutritionProfessionalWorkflow(id),
        getRehabilitationProfessionalWorkflow(id),
      ]);

      setWorkflow(sportsScientistResult);
      setStrengthConditioningWorkflow(
        strengthConditioningResult,
      );
      setNutritionWorkflow(nutritionResult);
      setRehabilitationWorkflow(
        rehabilitationResult,
      );
    }
    catch {
      setError(
        "The Performance Professional workflow is temporarily unavailable.",
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

            <h3>Sports Scientist overview</h3>

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

        {strengthConditioningWorkflow && (
          <section
            aria-label="Strength and Conditioning workflow"
          >
            <span className="titan-eyebrow">
              STRENGTH & CONDITIONING
            </span>

            <h3>Strength & Conditioning Workflow</h3>

            <p>
              Review authorised training stress and
              workout programme information for the
              selected Athlete.
            </p>

            <p>
              Athlete ID:{" "}
              <strong>
                {strengthConditioningWorkflow.athleteId}
              </strong>
            </p>

            <dl>
              <dt>
                Strength & Conditioning training stress observations
              </dt>
              <dd>
                {
                  strengthConditioningWorkflow
                    .trainingStress.length
                }
              </dd>

              <dt>
                Strength & Conditioning workout programmes
              </dt>
              <dd>
                {
                  strengthConditioningWorkflow
                    .workoutProgrammes.length
                }
              </dd>
            </dl>
          </section>
        )}
        {nutritionWorkflow && (
          <section
            aria-label="Nutrition Professional workflow"
          >
            <span className="titan-eyebrow">
              NUTRITION PROFESSIONAL
            </span>

            <h3>Nutrition Professional Workflow</h3>

            <p>
              Review the selected Athlete's latest
              authorised nutrition plan.
            </p>

            <p>
              Athlete ID:{" "}
              <strong>
                {nutritionWorkflow.athleteId}
              </strong>
            </p>

            {nutritionWorkflow.latestNutritionPlan ? (
              <dl>
                <dt>Goal classification</dt>
                <dd>
                  {
                    nutritionWorkflow
                      .latestNutritionPlan
                      .planSnapshot
                      .goalClassification ??
                    "General nutrition"
                  }
                </dd>

                <dt>Daily calories</dt>
                <dd>
                  {
                    nutritionWorkflow
                      .latestNutritionPlan
                      .planSnapshot
                      .macroTargets
                      .caloriesKcal
                  } kcal
                </dd>

                <dt>Daily hydration</dt>
                <dd>
                  {
                    nutritionWorkflow
                      .latestNutritionPlan
                      .planSnapshot
                      .hydrationGuidance
                      .dailyWaterLitres
                  } L
                </dd>
              </dl>
            ) : (
              <p role="status">
                No nutrition plan is currently available.
              </p>
            )}
          </section>
        )}

        {rehabilitationWorkflow && (
          <section
            aria-label="Rehabilitation Professional workflow"
          >
            <span className="titan-eyebrow">
              REHABILITATION PROFESSIONAL
            </span>

            <h3>Rehabilitation Professional Workflow</h3>

            <p>
              Review authorised, non-clinical recovery
              observations for the selected Athlete.
            </p>

            <p>
              Athlete ID:{" "}
              <strong>
                {rehabilitationWorkflow.athleteId}
              </strong>
            </p>

            <dl>
              <dt>Rehabilitation recovery observations</dt>
              <dd>
                {rehabilitationWorkflow.recovery.length}
              </dd>
            </dl>
          </section>
        )}
      </section>
    </main>
  );
}
