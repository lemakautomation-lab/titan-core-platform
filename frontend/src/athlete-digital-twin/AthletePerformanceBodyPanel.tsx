import {
  useEffect,
  useState,
} from "react";

import PerformanceBodyViewer from "../performance-body/PerformanceBodyViewer";
import {
  createBodyMeasurements,
} from "../performance-body/measurements/body-measurements";
import {
  createBodyProgressSnapshot,
} from "../performance-body/progress/body-progress";
import {
  type AthletePerformanceBodyProfileDto,
  getMyPerformanceBodyProfile,
  type PerformanceBodyModelType,
  updateMyPerformanceBodyModel,
} from "./athlete-performance-body.api";

interface Props {
  athleteId: string;
}

export default function AthletePerformanceBodyPanel({
  athleteId,
}: Props) {
  const [profile, setProfile] =
    useState<AthletePerformanceBodyProfileDto | null>(
      null,
    );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const result =
          await getMyPerformanceBodyProfile();

        if (!mounted) {
          return;
        }

        if (result.athleteId !== athleteId) {
          setError(
            "This performance body does not belong to the requested Athlete.",
          );
          return;
        }

        setProfile(result);
      } catch {
        if (mounted) {
          setError(
            "Unable to load the performance body. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [athleteId]);

  async function selectModel(
    modelType: PerformanceBodyModelType,
  ) {
    if (!profile || updating) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const result =
        await updateMyPerformanceBodyModel(
          modelType,
        );

      if (result.athleteId !== athleteId) {
        throw new Error("Athlete mismatch.");
      }

      setProfile({
        ...profile,
        modelType: result.modelType,
      });
    } catch {
      setError(
        "Unable to update the performance-body model.",
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <section aria-label="Performance body">
        <p>Loading performance body...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Performance body">
        <p role="alert">{error}</p>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  if (!profile.modelType) {
    return (
      <section aria-label="Performance body">
        <h3>Select your performance-body model</h3>

        <p>
          Choose the explicit model that should represent
          your Athlete profile. TITAN will not infer or
          default this selection.
        </p>

        <button
          type="button"
          disabled={updating}
          onClick={() => void selectModel("MALE")}
        >
          Use male model
        </button>{" "}

        <button
          type="button"
          disabled={updating}
          onClick={() => void selectModel("FEMALE")}
        >
          Use female model
        </button>
      </section>
    );
  }

  const snapshots =
    profile.measurements.map((measurement) =>
      createBodyProgressSnapshot(
        measurement.recordedAt,
        createBodyMeasurements({
          height: measurement.heightCm,
        }),
        [],
      ),
    );

  const latest =
    profile.measurements[
      profile.measurements.length - 1
    ];

  const currentMeasurements = latest
    ? createBodyMeasurements({
        height: latest.heightCm,
      })
    : [];

  return (
    <section aria-label="Performance body">
      <div className="titan-users-header">
        <div>
          <span className="titan-eyebrow">
            PERFORMANCE BODY
          </span>

          <h3>3D Athlete body</h3>
        </div>
      </div>

      {latest && (
        <dl aria-label="Current body metrics">
          <div>
            <dt>Weight</dt>
            <dd>{latest.weightKg} kg</dd>
          </div>

          <div>
            <dt>BMI</dt>
            <dd>{latest.bmi}</dd>
          </div>

          <div>
            <dt>Body fat</dt>
            <dd>
              {latest.bodyFatPercentage === null
                ? "Not supplied"
                : `${latest.bodyFatPercentage}%`}
            </dd>
          </div>

          <div>
            <dt>Recorded</dt>
            <dd>
              <time dateTime={latest.recordedAt}>
                {latest.recordedAt}
              </time>
            </dd>
          </div>
        </dl>
      )}

      <PerformanceBodyViewer
        modelType={profile.modelType}
        measurements={currentMeasurements}
        progressSnapshots={snapshots}
      />

      <p>
        This visualisation reflects explicitly supplied
        profile and measurement data. It is not a medical
        or diagnostic assessment.
      </p>
    </section>
  );
}