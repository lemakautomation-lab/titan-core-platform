import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MyPerformanceBodyPage from "./MyPerformanceBodyPage";
import { getMyPerformanceBodyProfile } from "./athlete-performance-body.api";

vi.mock("./athlete-performance-body.api", () => ({ getMyPerformanceBodyProfile: vi.fn() }));
vi.mock("./AthletePerformanceBodyPanel", () => ({
  default: ({ athleteId }: { athleteId: string }) => <div>Body for {athleteId}</div>,
}));

describe("MyPerformanceBodyPage", () => {
  it("uses the authenticated Athlete identity", async () => {
    vi.mocked(getMyPerformanceBodyProfile).mockResolvedValue({
      athleteId: "athlete-1", tenantId: "tenant-1", modelType: null, measurements: [],
    });
    render(<MyPerformanceBodyPage />);
    expect(await screen.findByText("Body for athlete-1")).toBeInTheDocument();
  });
});
