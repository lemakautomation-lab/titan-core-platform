import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TrainerClientDto } from "./trainer-clients.api";
import {
  generateTrainerAiAssistance,
  type TrainerAiAssistanceResponse,
  type TrainerAiQueryType,
} from "./ai-trainer-assistant.api";

const tasks: Array<{
  value: TrainerAiQueryType;
  label: string;
}> = [
  {
    value: "ADHERENCE",
    label: "Client adherence",
  },
  {
    value: "PERFORMANCE_TRENDS",
    label: "Performance trends",
  },
  {
    value: "PROGRAMME_PROPOSAL",
    label: "Programme proposal support",
  },
  {
    value: "PROGRESS_REPORT",
    label: "Progress report",
  },
];

interface Props {
  clients: TrainerClientDto[];
}

export default function TrainerAiAssistant({
  clients,
}: Props) {
  const [athleteId, setAthleteId] =
    useState(clients[0]?.athleteId ?? "");
  const [queryType, setQueryType] =
    useState<TrainerAiQueryType>("ADHERENCE");
  const [acknowledgement, setAcknowledgement] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState(false);
  const [result, setResult] =
    useState<TrainerAiAssistanceResponse["data"] | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (
      athleteId &&
      clients.some(
        client => client.athleteId === athleteId,
      )
    ) {
      return;
    }

    setAthleteId(
      clients[0]?.athleteId ?? "",
    );
  }, [athleteId, clients]);

  const selectedClient = useMemo(
    () => clients.find(
      client => client.athleteId === athleteId,
    ) ?? null,
    [athleteId, clients],
  );

  async function generate() {
    if (
      !acknowledgement ||
      !athleteId ||
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
        await generateTrainerAiAssistance(
          athleteId,
          queryType,
        );

      setResult(response.data);
    }
    catch {
      setError(true);
    }
    finally {
      pending.current = false;
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return null;
  }

  return (
    <section
      className="titan-panel"
      aria-label="Trainer AI assistant"
    >
      <span className="titan-eyebrow">
        AI TRAINER ASSISTANT
      </span>

      <h2>Trainer decision support</h2>

      <p>
        Review bounded client information for adherence,
        numeric performance trends, programme proposal
        considerations and progress reporting.
      </p>

      <p>
        AI may be incorrect. It does not change a client
        programme automatically and does not provide
        medical advice. You remain responsible for all
        professional decisions.
      </p>

      <label>
        Client
        <select
          value={athleteId}
          disabled={loading}
          onChange={(event) => {
            setAthleteId(event.target.value);
            setResult(null);
            setError(false);
          }}
        >
          {clients.map((client) => (
            <option
              key={client.athleteId}
              value={client.athleteId}
            >
              {client.firstName} {client.lastName} ({client.athleteId})
            </option>
          ))}
        </select>
      </label>

      <label>
        Assistant task
        <select
          value={queryType}
          disabled={loading}
          onChange={(event) => {
            setQueryType(
              event.target.value as TrainerAiQueryType,
            );
            setResult(null);
            setError(false);
          }}
        >
          {tasks.map((task) => (
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
        <input
          type="checkbox"
          checked={acknowledgement}
          disabled={loading}
          onChange={(event) =>
            setAcknowledgement(event.target.checked)
          }
        />
        I confirm I am authorised to use this client&apos;s
        bounded data for this AI-assisted professional
        task and acknowledge that the listed de-identified
        facts will be sent to OpenAI for this request.
      </label>

      <p>
        Athlete names, account identifiers, session titles,
        notes, programme names, descriptions and goals are
        excluded from the AI payload. OpenAI API retention
        policies apply.
      </p>

      <button
        type="button"
        disabled={!acknowledgement || !athleteId || loading}
        onClick={() => void generate()}
      >
        {loading
          ? "Generating Trainer support..."
          : "Generate Trainer support"}
      </button>

      {loading && (
        <p role="status">
          Generating Trainer support...
        </p>
      )}

      {error && (
        <p role="alert">
          Trainer AI assistance is unavailable. Confirm
          your client access and try again later.
        </p>
      )}

      {result?.status === "INSUFFICIENT_DATA" && (
        <p role="status">
          The selected client does not currently have enough
          bounded data for this Trainer AI task.
        </p>
      )}

      {result?.status === "GENERATED" &&
        result.assistance && (
          <section
            aria-label="Generated Trainer AI support"
          >
            <h3>
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : "Selected client"}
            </h3>

            <p>{result.assistance.summary}</p>

            <h4>Observations</h4>
            <ul>
              {Array.from(new Set(result.assistance.observations)).map(
                observation => (
                  <li key={observation}>
                    {observation}
                  </li>
                ),
              )}
            </ul>

            <h4>Trainer review considerations</h4>
            <ul>
              {Array.from(new Set(result.assistance.considerations)).map(
                consideration => (
                  <li key={consideration}>
                    {consideration}
                  </li>
                ),
              )}
            </ul>

            <p>
              Generated {new Date(
                result.generatedAt,
              ).toLocaleString()}.
            </p>
          </section>
        )}

      {result?.explanation && (
        <section
          aria-label="Trainer AI source explanation"
        >
          <h3>Basis of this response</h3>

          <p>
            TITAN builds this source summary before the AI
            request. It is not generated by the model.
          </p>

          <dl>
            <dt>Past Trainer sessions</dt>
            <dd>
              {result.explanation.facts.adherence.totalPastSessions}
              {" "}in the last 28 days;{" "}
              {result.explanation.facts.adherence.completedSessions}
              {" "}completed, {result.explanation.facts.adherence.cancelledSessions}
              {" "}cancelled, {result.explanation.facts.adherence.unresolvedPastSessions}
              {" "}still scheduled.
            </dd>

            <dt>Performance metrics</dt>
            <dd>
              {result.explanation.facts.performanceTrends.length}
              {" "}bounded metric trend snapshots.
            </dd>

            <dt>Active programmes</dt>
            <dd>
              {result.explanation.facts.programmes.length}
              {" "}bounded frequency/duration snapshots.
            </dd>
          </dl>

          {result.explanation.facts.performanceTrends.length > 0 && (
            <ul>
              {result.explanation.facts.performanceTrends.map(
                trend => (
                  <li key={trend.metricSlug}>
                    {trend.metricSlug}: {trend.direction}
                    {trend.delta === null
                      ? ""
                      : ` (${trend.delta > 0 ? "+" : ""}${trend.delta}${trend.unit ? ` ${trend.unit}` : ""})`}
                  </li>
                ),
              )}
            </ul>
          )}

          <p>
            Source snapshot retrieved {new Date(
              result.explanation.retrievedAt,
            ).toLocaleString()}.
          </p>
        </section>
      )}

      {result?.limitations && (
        <section
          aria-label="Trainer AI limitations"
        >
          <h3>Limitations and confidence</h3>
          <p>Confidence: not assessed.</p>
          <ul>
            {result.limitations.notices.map(
              notice => (
                <li key={notice}>{notice}</li>
              ),
            )}
          </ul>
        </section>
      )}
    </section>
  );
}
