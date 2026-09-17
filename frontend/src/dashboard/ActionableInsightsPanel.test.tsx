import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("./actionable-insights.api", () => ({
  getMyActionableInsights: vi.fn(),
}));

import {
  getMyActionableInsights,
} from "./actionable-insights.api";
import ActionableInsightsPanel from "./ActionableInsightsPanel";

const getInsightsMock =
  vi.mocked(getMyActionableInsights);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ActionableInsightsPanel", () => {
  it("renders actionable athlete insights", async () => {
    getInsightsMock.mockResolvedValue({
      insights: [
        {
          type: "RECORD_MEASUREMENT",
          metricId: "metric-1",
          metricName: "Sprint speed",
          message: "Record a performance measurement.",
        },
        {
          type: "ESTABLISH_COMPARISON",
          metricId: "metric-2",
          metricName: "Jump height",
          message:
            "Record another performance measurement to establish a comparison.",
        },
      ],
    });

    render(<ActionableInsightsPanel />);

    expect(
      await screen.findByText("Sprint speed"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Jump height"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Performance insight list"),
    ).toBeInTheDocument();
  });

  it("renders a safe empty state", async () => {
    getInsightsMock.mockResolvedValue({
      insights: [],
    });

    render(<ActionableInsightsPanel />);

    expect(
      await screen.findByText(
        "No actionable performance insights are currently available.",
      ),
    ).toBeInTheDocument();
  });

  it("fails safely when insights cannot load", async () => {
    getInsightsMock.mockRejectedValue(
      new Error("Unavailable"),
    );

    render(<ActionableInsightsPanel />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Actionable performance insights are temporarily unavailable.",
    );
  });
});
