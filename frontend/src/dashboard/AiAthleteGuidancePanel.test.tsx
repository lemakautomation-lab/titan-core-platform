import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMyAthleteGuidance, type AthleteGuidanceResult } from "./ai-athlete-guidance.api";
import AiAthleteGuidancePanel from "./AiAthleteGuidancePanel";
vi.mock("./ai-athlete-guidance.api", () => ({ generateMyAthleteGuidance: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const explanation: AthleteGuidanceResult["data"]["explanation"] = {
  version: 1, retrievedAt: "2026-09-30T00:00:00Z",
  facts: { goals: ["STRENGTH"], trainingFrequencies: [] },
  sources: { goals: "USED", training: "WITHHELD" },
};
const limitations: AthleteGuidanceResult["data"]["limitations"] = {
  confidence: "NOT_ASSESSED", coverage: "GOALS_ONLY",
  notices: ["Response accuracy has not been assessed; no confidence score is available."],
};
const escalation: AthleteGuidanceResult["data"]["escalation"] = {
  professionalReviewRequired: true, automaticContact: false,
  notices: ["Review AI suggestions with your coach or qualified performance professional before changing your training plan.",
    "For health concerns, contact a qualified healthcare professional. This assistant cannot diagnose, treat or assess whether exercise is safe for you.",
    "You must contact the professional yourself. TITAN does not send a referral or notify anyone, and this panel is not monitored for urgent help."],
};
function requestGuidance() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Generate performance guidance" }));
}
describe("Personal AI guidance panel", () => {
  it("requires explicit consent and never generates on mount", () => {
    render(<AiAthleteGuidancePanel />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(generateMyAthleteGuidance).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "When to contact a professional" })).toBeInTheDocument();
    expect(screen.getByText(escalation.notices[2])).toBeInTheDocument();
  });
  it("displays requested guidance", async () => {
    vi.mocked(generateMyAthleteGuidance).mockResolvedValue({ data: { status: "GENERATED",
      guidance: { summary: "Review goals with your coach.", actions: ["Track attendance."] }, generatedAt: "2026-09-30T00:00:00Z", explanation, limitations, escalation } });
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByText("Track attendance.")).toBeInTheDocument();
    expect(generateMyAthleteGuidance).toHaveBeenCalledTimes(1);
    expect(screen.getByText(escalation.notices[0])).toBeInTheDocument();
    expect(screen.getByText("STRENGTH")).toBeInTheDocument();
    expect(screen.getByText("Data coverage: Goal categories only.")).toBeInTheDocument();
    expect(screen.getByText("Confidence: not assessed.")).toBeInTheDocument();
    expect(screen.getByText(limitations.notices[0])).toBeInTheDocument();
    expect(screen.getByText("Not shared: read access is unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI-generated suggestions" })).toBeInTheDocument();
  });
  it("shows insufficient data without invented guidance", async () => {
    vi.mocked(generateMyAthleteGuidance).mockResolvedValue({ data: { status: "INSUFFICIENT_DATA", guidance: null, escalation, generatedAt: "2026-09-30T00:00:00Z", limitations: { ...limitations, coverage: "NONE" }, explanation: {
        ...explanation, facts: { goals: [], trainingFrequencies: [] },
        sources: { goals: "NO_USABLE_FACTS", training: "WITHHELD" },
      } } });
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByText(/No permitted goals/)).toBeInTheDocument();
    expect(screen.getByText(escalation.notices[1])).toBeInTheDocument();
    expect(screen.getByText("No usable goal categories available.")).toBeInTheDocument();
    expect(screen.getByText("Data coverage: No usable facts available.")).toBeInTheDocument();
    expect(screen.getByText("No facts were sent to OpenAI for this request.")).toBeInTheDocument();
  });
  it("shows an unavailable state and permits retry after failure", async () => {
    vi.mocked(generateMyAthleteGuidance).mockRejectedValue(new Error("unavailable"));
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByRole("alert")).toHaveTextContent("Guidance is unavailable");
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(screen.getByText(escalation.notices[2])).toBeInTheDocument();
  });
});
