import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "../performance-body/PerformanceBodyViewer",
  () => ({
    default: ({
      modelType,
      measurements,
      progressSnapshots,
    }: {
      modelType: string;
      measurements: readonly unknown[];
      progressSnapshots: readonly unknown[];
    }) => (
      <div data-testid="performance-body-viewer">
        {modelType}:{measurements.length}:
        {progressSnapshots.length}
      </div>
    ),
  }),
);

vi.mock("./athlete-performance-body.api", () => ({
  getMyPerformanceBodyProfile: vi.fn(),
  updateMyPerformanceBodyModel: vi.fn(),
}));

import {
  getMyPerformanceBodyProfile,
  updateMyPerformanceBodyModel,
} from "./athlete-performance-body.api";
import AthletePerformanceBodyPanel from "./AthletePerformanceBodyPanel";

const getProfileMock =
  vi.mocked(getMyPerformanceBodyProfile);
const updateModelMock =
  vi.mocked(updateMyPerformanceBodyModel);

const profile = {
  athleteId: "athlete-1",
  tenantId: "tenant-1",
  modelType: "FEMALE" as const,
  measurements: [
    {
      id: "measurement-1",
      heightCm: 170,
      weightKg: 65,
      bmi: 22.49,
      bodyFatPercentage: 24,
      recordedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      id: "measurement-2",
      heightCm: 171,
      weightKg: 64,
      bmi: 21.89,
      bodyFatPercentage: null,
      recordedAt: "2026-09-14T10:00:00.000Z",
    },
  ],
};

describe("AthletePerformanceBodyPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the explicit model and latest data", async () => {
    getProfileMock.mockResolvedValue(profile);

    render(
      <AthletePerformanceBodyPanel
        athleteId="athlete-1"
      />,
    );

    expect(
      await screen.findByTestId(
        "performance-body-viewer",
      ),
    ).toHaveTextContent("FEMALE:1:2");

    expect(screen.getByText("64 kg"))
      .toBeInTheDocument();
    expect(screen.getByText("21.89"))
      .toBeInTheDocument();
    expect(screen.getByText("Not supplied"))
      .toBeInTheDocument();
  });

  it("requires explicit selection when unset", async () => {
    getProfileMock.mockResolvedValue({
      ...profile,
      modelType: null,
    });
    updateModelMock.mockResolvedValue({
      athleteId: "athlete-1",
      tenantId: "tenant-1",
      modelType: "MALE",
    });

    render(
      <AthletePerformanceBodyPanel
        athleteId="athlete-1"
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Use male model",
      }),
    );

    await waitFor(() => {
      expect(updateModelMock)
        .toHaveBeenCalledWith("MALE");
    });

    expect(
      await screen.findByTestId(
        "performance-body-viewer",
      ),
    ).toHaveTextContent("MALE:1:2");
  });

  it("rejects mismatched Athlete ownership", async () => {
    getProfileMock.mockResolvedValue({
      ...profile,
      athleteId: "athlete-2",
    });

    render(
      <AthletePerformanceBodyPanel
        athleteId="athlete-1"
      />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "does not belong to the requested Athlete",
    );
  });
});