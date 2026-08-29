import { useEffect, useState } from "react";

import {
  ExerciseDto,
  listExercises,
} from "./exercises.api";

export default function ExercisesPage() {
  const [exercises, setExercises] =
    useState<ExerciseDto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadExercises() {
      setLoading(true);
      setError(null);

      try {
        const result = await listExercises();

        if (mounted) {
          setExercises(result);
        }
      } catch {
        if (mounted) {
          setError(
            "Unable to load exercises. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadExercises();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="titan-users-page">
      <div className="titan-page-heading">
        <div>
          <span className="titan-eyebrow">
            EXERCISE ENGINE
          </span>

          <h2>Exercises</h2>
        </div>
      </div>

      <section className="titan-panel titan-users-panel">
        <div className="titan-users-header">
          <div>
            <span className="titan-eyebrow">
              EXERCISE DIRECTORY
            </span>

            <h3>Exercise library</h3>
          </div>

          {!loading && !error && (
            <span className="titan-user-count">
              {exercises.length} exercise
              {exercises.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading && (
          <div className="titan-users-state">
            Loading exercises...
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

        {!loading && !error && exercises.length === 0 && (
          <div className="titan-users-state">
            No exercises found.
          </div>
        )}

        {!loading && !error && exercises.length > 0 && (
          <div className="titan-users-table-wrapper">
            <table className="titan-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Movement</th>
                  <th>Difficulty</th>
                  <th>Training Objective</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {exercises.map((exercise) => (
                  <tr key={exercise.id}>
                    <td>
                      <strong>{exercise.name}</strong>
                    </td>

                    <td>{exercise.movement}</td>

                    <td>{exercise.difficulty}</td>

                    <td>
                      {exercise.trainingObjective}
                    </td>

                    <td>
                      <span className="titan-user-status">
                        {exercise.status}
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
