import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CoachAthleteDto,
  CoachSquadDto,
} from "./coach.api";
import {
  generateCoachAiAssistance,
  type CoachAiAssistanceResponse,
  type CoachAiQueryType,
} from "./ai-coach-assistant.api";

const tasks: Array<{
  value: CoachAiQueryType;
  label: string;
}> = [
  {
    value: "SQUAD_INTELLIGENCE",
    label: "Squad intelligence",
  },
  {
    value: "TRAINING_SUPPORT",
    label: "Training support",
  },
  {
    value: "PERFORMANCE_QUERY",
    label: "Performance query",
  },
];

interface Props {
  athletes: CoachAthleteDto[];
  squads: CoachSquadDto[];
}

export default function CoachAiAssistant({
  athletes,
  squads,
}: Props) {
  const [queryType, setQueryType] =
    useState<CoachAiQueryType>(
      squads.length > 0
        ? "SQUAD_INTELLIGENCE"
        : "TRAINING_SUPPORT",
    );
  const [targetId, setTargetId] =
    useState("");
  const [acknowledgement, setAcknowledgement] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState(false);
  const [result, setResult] =
    useState<
      CoachAiAssistanceResponse["data"] | null
    >(null);
  const pending = useRef(false);

  const isSquadTask =
    queryType === "SQUAD_INTELLIGENCE";

  const availableTargets = useMemo(
    () => isSquadTask
      ? squads.map(squad => ({
          id: squad.id,
          label: `${squad.name} (${squad.id})`,
        }))
      : athletes.map(athlete => ({
          id: athlete.athleteId,
          label:
            `${athlete.firstName} ${athlete.lastName} (${athlete.athleteId})`,
        })),
    [athletes, isSquadTask, squads],
  );

  useEffect(() => {
    if (
      targetId &&
      availableTargets.some(
        target => target.id === targetId,
      )
    ) {
      return;
    }

    setTargetId(
      availableTargets[0]?.id ?? "",
    );
  }, [availableTargets, targetId]);

  async function generate() {
    if (
      !acknowledgement ||
      !targetId ||
      pending.current
    ) {
      return;
    }

    pending.current = true;
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const response =
        await generateCoachAiAssistance(
          targetId,
          queryType,
        );

      setResult(response.data);
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  if (
    athletes.length === 0 &&
    squads.length === 0
  ) {
    return null;
  }

  return (
    <section
      className="titan-panel"
      aria-label="Coach AI assistant"
    >
      <span className="titan-eyebrow">
        AI COACH ASSISTANT
      </span>

      <h2>Coach decision support</h2>

      <p>
        Review bounded squad intelligence, training
        support and Athlete performance information.
      </p>

      <p>
        AI may be incorrect. It does not change a
        programme automatically, rank Athletes or provide
        medical advice. You remain responsible for all
        professional decisions.
      </p>

      <label>
        Assistant task
        <select
          value={queryType}
          disabled={loading}
          onChange={(event) => {
            setQueryType(
              event.target
                .value as CoachAiQueryType,
            );
            setResult(null);
            setError(false);
            setAcknowledgement(false);
          }}
        >
          {tasks
            .filter(task =>
              task.value ===
                "SQUAD_INTELLIGENCE"
                ? squads.length > 0
                : athletes.length > 0,
            )
            .map(task => (
              <option
                key={task.value}
                value={task.value}
              >
                {task.label}
              </option>
            ))}
        </select>
      </label>

      <label>
        {isSquadTask ? "Squad" : "Athlete"}
        <select
          value={targetId}
          disabled={loading}
          onChange={(event) => {
            setTargetId(event.target.value);
            setResult(null);
            setError(false);
          }}
        >
          {availableTargets.map(target => (
            <option
              key={target.id}
              value={target.id}
            >
              {target.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={acknowledgement}
          disabled={loading}
          onChange={(event) =>
            setAcknowledgement(
              event.target.checked,
            )
          }
        />
        I confirm I am authorised to use this bounded
        Coach portfolio data for this AI-assisted
        professional task and acknowledge that the listed
        de-identified facts will be sent to OpenAI for
        this request.
      </label>

      <p>
        Athlete and squad names, account identifiers,
        programme names, descriptions and goals are
        excluded from the AI payload. OpenAI API
        retention policies apply.
      </p>

      <button
        type="button"
        disabled={
          !acknowledgement ||
          !targetId ||
          loading
        }
        onClick={() => void generate()}
      >
        {loading
          ? "Generating Coach support..."
          : "Generate Coach support"}
      </button>

      {loading && (
        <p role="status">
          Generating Coach support...
        </p>
      )}

      {error && (
        <p role="alert">
          Coach AI assistance is unavailable. Confirm
          your authorised Coach scope and try again
          later.
        </p>
      )}

      {result?.status ===
        "INSUFFICIENT_DATA" && (
        <p role="status">
          The selected target does not currently have
          enough bounded data for this Coach AI task.
        </p>
      )}

      {result?.status === "GENERATED" &&
        result.assistance && (
          <section
            aria-label="Generated Coach AI support"
          >
            <p>{result.assistance.summary}</p>

            <h3>Observations</h3>
            <ul>
              {Array.from(
                new Set(
                  result.assistance.observations,
                ),
              ).map(observation => (
                <li key={observation}>
                  {observation}
                </li>
              ))}
            </ul>

            <h3>Coach review considerations</h3>
            <ul>
              {Array.from(
                new Set(
                  result.assistance.considerations,
                ),
              ).map(consideration => (
                <li key={consideration}>
                  {consideration}
                </li>
              ))}
            </ul>
          </section>
        )}

      {result?.explanation && (
        <section
          aria-label="Coach AI source explanation"
        >
          <h3>Basis of this response</h3>

          <p>
            TITAN builds this source summary before the
            AI request. It is not generated by the model.
          </p>

          {result.explanation.facts.squad && (
            <dl>
              <dt>Authorised squad members</dt>
              <dd>
                {
                  result.explanation.facts.squad
                    .memberCount
                }
              </dd>

              <dt>Performance measurements</dt>
              <dd>
                {
                  result.explanation.facts.squad
                    .performanceMeasurementCount
                }
              </dd>

              <dt>Bounded trend groups</dt>
              <dd>
                {
                  result.explanation.facts.squad
                    .trendMetrics.length
                }
              </dd>

              <dt>Training-load observations</dt>
              <dd>
                {
                  result.explanation.facts.squad
                    .trainingLoad.observationCount
                }
              </dd>

              <dt>Workout programmes</dt>
              <dd>
                {
                  result.explanation.facts.squad
                    .workoutProgrammeCount
                }
              </dd>
            </dl>
          )}

          {result.explanation.facts.athlete && (
            <dl>
              <dt>Performance metric snapshots</dt>
              <dd>
                {
                  result.explanation.facts.athlete
                    .performanceTrends.length
                }
              </dd>

              <dt>Training-load observations</dt>
              <dd>
                {
                  result.explanation.facts.athlete
                    .trainingLoad.observationCount
                }
              </dd>

              <dt>Active programme snapshots</dt>
              <dd>
                {
                  result.explanation.facts.athlete
                    .programmes.length
                }
              </dd>
            </dl>
          )}

          <p>
            Source snapshot retrieved{" "}
            {new Date(
              result.explanation.retrievedAt,
            ).toLocaleString()}.
          </p>
        </section>
      )}

      {result?.limitations && (
        <section
          aria-label="Coach AI limitations"
        >
          <h3>Limitations and confidence</h3>
          <p>Confidence: not assessed.</p>
          <ul>
            {result.limitations.notices.map(
              notice => (
                <li key={notice}>
                  {notice}
                </li>
              ),
            )}
          </ul>
        </section>
      )}
    </section>
  );
}
