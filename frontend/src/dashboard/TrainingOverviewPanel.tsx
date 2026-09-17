import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listExercises,
  type ExerciseDto,
} from "../exercises/exercises.api";

interface TrainingOverviewPanelProps {
  permissions: readonly string[];
}

const EXERCISES_READ_PERMISSION =
  "exercises.read";

function canReadExercises(
  permissions: readonly string[],
): boolean {
  return permissions
    .map((permission) =>
      permission.trim().toLowerCase(),
    )
    .includes(EXERCISES_READ_PERMISSION);
}

export default function TrainingOverviewPanel({
  permissions,
}: TrainingOverviewPanelProps) {
  const allowed=canReadExercises(permissions);
  const [exercises,setExercises]=
    useState<ExerciseDto[]>([]);
  const [loading,setLoading]=useState(allowed);
  const [error,setError]=useState(false);

  useEffect(() => {
    let mounted=true;

    if (!allowed) {
      setLoading(false);
      setExercises([]);
      setError(false);

      return () => {
        mounted=false;
      };
    }

    setLoading(true);
    setError(false);

    void listExercises()
      .then((result) => {
        if (mounted) {
          setExercises(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setExercises([]);
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
  },[allowed]);

  const summary=useMemo(() => ({
    exercises: exercises.length,
    active: exercises.filter(
      (exercise) =>
        exercise.status.trim().toLowerCase() ===
        "active",
    ).length,
    objectives: new Set(
      exercises.map(
        (exercise) => exercise.trainingObjective,
      ),
    ).size,
    muscleGroups: new Set(
      exercises.flatMap(
        (exercise) => exercise.muscleGroups,
      ),
    ).size,
  }),[exercises]);

  return (
    <section
      className="titan-panel"
      aria-label="Training overview"
    >
      <h2>Training overview</h2>

      {!allowed && (
        <p role="status">
          Training overview requires the exercises.read
          permission.
        </p>
      )}

      {allowed && loading && (
        <p role="status">
          Loading training overview...
        </p>
      )}

      {allowed && !loading && error && (
        <p role="alert">
          Training overview is temporarily unavailable.
        </p>
      )}

      {allowed &&
        !loading &&
        !error &&
        exercises.length === 0 && (
          <p role="status">
            No training exercises are available.
          </p>
        )}

      {allowed &&
        !loading &&
        !error &&
        exercises.length > 0 && (
          <>
            <dl className="titan-dashboard-summary" aria-label="Training summary">
              <div>
                <dt>Available exercises</dt>
                <dd>{summary.exercises}</dd>
              </div>

              <div>
                <dt>Active exercises</dt>
                <dd>{summary.active}</dd>
              </div>

              <div>
                <dt>Training objectives</dt>
                <dd>{summary.objectives}</dd>
              </div>

              <div>
                <dt>Muscle groups covered</dt>
                <dd>{summary.muscleGroups}</dd>
              </div>
            </dl>

            <p>
              Training overview values reflect authorised
              tenant-scoped exercise records.
            </p>
          </>
        )}
    </section>
  );
}
