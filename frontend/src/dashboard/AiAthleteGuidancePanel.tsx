import { useRef, useState } from "react";
import { generateMyAthleteGuidance, type AthleteGuidanceResult } from "./ai-athlete-guidance.api";

const coverageLabels = {
  NONE: "No usable facts available",
  GOALS_ONLY: "Goal categories only",
  TRAINING_ONLY: "Planned programme frequencies only",
  GOALS_AND_TRAINING: "Goal categories and planned programme frequencies",
};

export default function AiAthleteGuidancePanel() {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AthleteGuidanceResult["data"] | null>(null);
  const [error, setError] = useState(false);
  const pending = useRef(false);

  async function generate() {
    if (!consent || pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      setResult((await generateMyAthleteGuidance()).data);
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="titan-panel" aria-label="Personal AI performance assistant">
      <h2>Personal AI performance assistant</h2>
      <p>For your own athlete account. General fitness support based on permitted goals and programme frequency.</p>
      <p>AI can make mistakes. This is not medical advice or a replacement for your coach’s plan. Discuss changes with a qualified professional.</p>
      <label>
        <input type="checkbox" checked={consent} disabled={loading}
          onChange={(event) => setConsent(event.target.checked)} />
        I agree to send my permitted goal categories and training frequencies to OpenAI for this request.
      </label>
      <p>Names, account identifiers and health observations are excluded. OpenAI’s API retention policies apply.</p>
      <button type="button" disabled={!consent || loading} onClick={() => void generate()}>
        {loading ? "Generating guidance…" : "Generate performance guidance"}
      </button>
      {loading && <p role="status">Generating guidance…</p>}
      {error && <p role="alert">Guidance is unavailable. Your account may have no active athlete profile, or the service may be unavailable.</p>}
      {result?.status === "INSUFFICIENT_DATA" && <p role="status">No permitted goals or training frequency are available to support guidance.</p>}
      {result?.status === "GENERATED" && result.guidance && (
        <div aria-label="Generated performance guidance">
          <h3>AI-generated suggestions</h3>
          <p>{result.guidance.summary}</p>
          <ul>{result.guidance.actions.map((action, index) => <li key={`${index}-${action}`}>{action}</li>)}</ul>
          <p>Generated {new Date(result.generatedAt).toLocaleString()}. Review against your current plan.</p>
        </div>
      )}
      {result?.explanation && (
        <div aria-label="Guidance source explanation">
          <h3>Basis of this response</h3>
          <p>This source summary is supplied by TITAN. Any generated suggestions are produced by AI and may be incorrect.</p>
          <dl>
            <dt>Goal categories shared</dt>
            <dd>{result.explanation.sources.goals === "WITHHELD"
              ? "Not shared: read access is unavailable."
              : result.explanation.facts.goals.length
                ? result.explanation.facts.goals.join(", ")
                : "No usable goal categories available."}</dd>
            <dt>Programme frequencies shared</dt>
            <dd>{result.explanation.sources.training === "WITHHELD"
              ? "Not shared: read access is unavailable."
              : result.explanation.facts.trainingFrequencies.length
                ? `${result.explanation.facts.trainingFrequencies.join(", ")} sessions per week (per selected programme).`
                : "No usable programme frequencies available."}</dd>
          </dl>
          <p>Programme frequency describes a plan, not completed workouts or measured progress. The snapshot includes at most five selected programme frequencies and nine distinct goal categories.</p>
          <p>Source snapshot retrieved {new Date(result.explanation.retrievedAt).toLocaleString()}.</p>
          {result.status === "INSUFFICIENT_DATA" && <p>No facts were sent to OpenAI for this request.</p>}
        </div>
      )}
      {result?.limitations && (
        <div aria-label="Guidance limitations">
          <h3>Limitations and confidence</h3>
          <p>Data coverage: {coverageLabels[result.limitations.coverage]}.</p>
          <p>Confidence: not assessed.</p>
          <ul>{result.limitations.notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
