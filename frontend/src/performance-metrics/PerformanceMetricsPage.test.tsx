import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import PerformanceMetricsPage from "./PerformanceMetricsPage";

vi.mock("./performance-metrics.api", () => ({
  listPerformanceMetrics: vi.fn(),
}));

import {
  listPerformanceMetrics,
} from "./performance-metrics.api";

const listPerformanceMetricsMock =
  vi.mocked(listPerformanceMetrics);

const tenantId = "tenant-1";

const metrics = [
  {
    id: "metric-1",
    tenantId,
    athleteId: "athlete-1",
    sportId: "sport-1",
    name: "Sprint Time",
    slug: "sprint-time",
    description: "100m sprint time",
    unit: "seconds",
    dataType: "DECIMAL",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
  {
    id: "metric-2",
    tenantId,
    athleteId: "athlete-1",
    sportId: "sport-1",
    name: "Vertical Jump",
    slug: "vertical-jump",
    description: "Maximum vertical jump",
    unit: "cm",
    dataType: "DECIMAL",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
];

describe("PerformanceMetricsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    listPerformanceMetricsMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(
      <PerformanceMetricsPage tenantId={tenantId} />,
    );

    expect(
      screen.getByText(
        "Loading performance metrics...",
      ),
    ).toBeInTheDocument();
  });

  it("loads and renders performance metrics", async () => {
    listPerformanceMetricsMock.mockResolvedValue(
      metrics,
    );

    render(
      <PerformanceMetricsPage tenantId={tenantId} />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Sprint Time"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Vertical Jump"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 metrics"),
    ).toBeInTheDocument();
  });

  it("passes tenant id to API", async () => {
    listPerformanceMetricsMock.mockResolvedValue([]);

    render(
      <PerformanceMetricsPage tenantId={tenantId} />,
    );

    await waitFor(() => {
      expect(
        listPerformanceMetricsMock,
      ).toHaveBeenCalledTimes(1);
    });

    expect(
      listPerformanceMetricsMock,
    ).toHaveBeenCalledWith(tenantId);
  });

  it("renders empty state", async () => {
    listPerformanceMetricsMock.mockResolvedValue([]);

    render(
      <PerformanceMetricsPage tenantId={tenantId} />,
    );

    expect(
      await screen.findByText(
        "No performance metrics found for this tenant.",
      ),
    ).toBeInTheDocument();
  });

  it("renders generic error", async () => {
    listPerformanceMetricsMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(
      <PerformanceMetricsPage tenantId={tenantId} />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load performance metrics. Please try again.",
    );
  });
});
