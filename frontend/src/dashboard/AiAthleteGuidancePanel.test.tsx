import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMyAthleteGuidance } from "./ai-athlete-guidance.api";
import AiAthleteGuidancePanel from "./AiAthleteGuidancePanel";
vi.mock("./ai-athlete-guidance.api", () => ({ generateMyAthleteGuidance: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function requestGuidance() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Generate performance guidance" }));
}
describe("Personal AI guidance panel", () => {
  it("requires explicit consent and never generates on mount", () => {
    render(<AiAthleteGuidancePanel />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(generateMyAthleteGuidance).not.toHaveBeenCalled();
  });
  it("displays requested guidance", async () => {
    vi.mocked(generateMyAthleteGuidance).mockResolvedValue({ data: { status: "GENERATED",
      guidance: { summary: "Review goals with your coach.", actions: ["Track attendance."] }, generatedAt: "2026-09-30T00:00:00Z" } });
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByText("Track attendance.")).toBeInTheDocument();
    expect(generateMyAthleteGuidance).toHaveBeenCalledTimes(1);
  });
  it("shows insufficient data without invented guidance", async () => {
    vi.mocked(generateMyAthleteGuidance).mockResolvedValue({ data: { status: "INSUFFICIENT_DATA", guidance: null, generatedAt: "2026-09-30T00:00:00Z" } });
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByText(/No permitted goals/)).toBeInTheDocument();
  });
  it("shows an unavailable state and permits retry after failure", async () => {
    vi.mocked(generateMyAthleteGuidance).mockRejectedValue(new Error("unavailable"));
    render(<AiAthleteGuidancePanel />);
    requestGuidance();
    expect(await screen.findByRole("alert")).toHaveTextContent("Guidance is unavailable");
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  });
});
