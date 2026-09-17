import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RelevantContextPanel from "./RelevantContextPanel";

vi.mock("./relevant-context.api", () => ({
  getMyRelevantContext: vi.fn(),
}));

import { getMyRelevantContext } from "./relevant-context.api";

const mockedGet = vi.mocked(getMyRelevantContext);

const context = {
  body: { athleteId: "athlete-1" },
  recovery: { latest: { value: 82, recordedAt: "2026-09-17T06:00:00.000Z" } },
  nutrition: { latest: { goalClassification: "GENERAL_FITNESS", macroTargets: { caloriesKcal: 2200, proteinGrams: 160, carbohydrateGrams: 240, fatGrams: 70 }, hydrationGuidance: { dailyWaterLitres: 2.5, unit: "LITRES_PER_DAY" as const }, createdAt: "2026-09-17T06:00:00.000Z" } },
};

describe("RelevantContextPanel", () => {
  beforeEach(() => {
    mockedGet.mockResolvedValue(context);
  });

  it("renders body, recovery and nutrition context", async () => {
    render(<RelevantContextPanel permissions={[]} />);
    expect(await screen.findByText(/Latest recovery value: 82/)).toBeTruthy();
    expect(screen.getByText(/GENERAL_FITNESS: 2200 kcal\/day/)).toBeTruthy();
    expect(screen.getByText((text) => text.includes("hydration") && text.includes("2.5") && text.includes("L/day"))).toBeTruthy();
  });

  it("fails safely when context cannot be loaded", async () => {
    mockedGet.mockRejectedValue(new Error("unavailable"));
    render(<RelevantContextPanel permissions={[]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Relevant athlete context is temporarily unavailable.");
  });
});



