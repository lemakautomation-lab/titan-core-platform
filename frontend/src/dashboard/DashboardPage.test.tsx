import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "../performance-metrics/performance-metrics.api",
  () => ({
    listPerformanceMetrics: vi.fn(),
  }),
);

import {
  listPerformanceMetrics,
} from "../performance-metrics/performance-metrics.api";
import DashboardPage from "./DashboardPage";

const listMetricsMock=
  vi.mocked(listPerformanceMetrics);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const metrics=[
  {
    id: "metric-1",
    tenantId: "tenant-1",
    athleteId: "athlete-1",
    sportId: "sport-1",
    name: "Sprint speed",
    slug: "sprint-speed",
    description: null,
    unit: "m/s",
    dataType: "NUMBER",
    status: "ACTIVE",
    createdAt: "2026-09-01T10:00:00+02:00",
    updatedAt: "2026-09-13T10:00:00+02:00",
  },
  {
    id: "metric-2",
    tenantId: "tenant-1",
    athleteId: "athlete-2",
    sportId: "sport-1",
    name: "Jump height",
    slug: "jump-height",
    description: null,
    unit: "cm",
    dataType: "NUMBER",
    status: "INACTIVE",
    createdAt: "2026-09-01T10:00:00+02:00",
    updatedAt: "2026-09-13T10:00:00+02:00",
  },
];

describe("DashboardPage", () => {
  it("renders the canonical dashboard", () => {
    render(
      <DashboardPage
        tenantId="tenant-1"
        permissions={[]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "PERFORMANCE COMMAND CENTRE",
      ),
    ).toBeInTheDocument();
  });

  it("does not load metrics without permission", () => {
    render(
      <DashboardPage
        tenantId="tenant-1"
        permissions={[]}
      />,
    );

    expect(screen.getByText(
      "Performance overview requires the performance-metrics.read permission.",
    ))
      .toHaveTextContent(
        "performance-metrics.read permission",
      );

    expect(listMetricsMock).not.toHaveBeenCalled();
  });

  it("loads and summarises authorised tenant metrics", async () => {
    listMetricsMock.mockResolvedValue(metrics);

    render(
      <DashboardPage
        tenantId="tenant-1"
        permissions={["performance-metrics.read"]}
      />,
    );

    await waitFor(() =>
      expect(listMetricsMock)
        .toHaveBeenCalledWith("tenant-1"),
    );

    expect(
      screen.getByLabelText(
        "Performance summary",
      ),
    ).toHaveTextContent("Tracked metrics2");

    expect(
      screen.getByLabelText(
        "Performance summary",
      ),
    ).toHaveTextContent("Athletes represented2");

    expect(
      screen.getByLabelText(
        "Performance summary",
      ),
    ).toHaveTextContent("Sports represented1");

    expect(
      screen.getByLabelText(
        "Performance summary",
      ),
    ).toHaveTextContent("Active metrics1");
  });

  it("renders the authorised empty state", async () => {
    listMetricsMock.mockResolvedValue([]);

    render(
      <DashboardPage
        tenantId="tenant-1"
        permissions={["PERFORMANCE-METRICS.READ"]}
      />,
    );

    expect(
      await screen.findByText(
        "No performance metrics are available.",
      ),
    ).toBeInTheDocument();
  });

  it("fails safely when metrics cannot load", async () => {
    listMetricsMock.mockRejectedValue(
      new Error("Unavailable"),
    );

    render(
      <DashboardPage
        tenantId="tenant-1"
        permissions={["performance-metrics.read"]}
      />,
    );

    expect(await screen.findByRole("alert"))
      .toHaveTextContent(
        "Athlete performance overview is temporarily unavailable.",
      );
  });
});
