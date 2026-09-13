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

const viewerMock = vi.hoisted(() => vi.fn());

vi.mock("../PerformanceBodyViewer", () => ({
  default: viewerMock,
}));

import {
  createBodyMeasurements,
} from "../measurements/body-measurements";
import {
  createMuscleDevelopment,
} from "../muscle-development/muscle-development";
import {
  createBodyProgressSnapshot,
} from "../progress/body-progress";
import CurrentBodyStateViewer from "./CurrentBodyStateViewer";
import {
  selectCurrentBodyState,
} from "./body-state-mapping";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function snapshot(
  recordedAt: string,
  chest: number,
  torso: number,
) {
  return createBodyProgressSnapshot(
    recordedAt,
    createBodyMeasurements({ chest }),
    createMuscleDevelopment({ torso }),
  );
}

describe("current body state mapping", () => {
  it("selects the latest snapshot deterministically", () => {
    const before = snapshot(
      "2026-08-13T12:00:00+02:00",
      98,
      60,
    );
    const current = snapshot(
      "2026-09-13T12:00:00+02:00",
      102,
      70,
    );

    const state = selectCurrentBodyState([
      current,
      before,
    ]);

    expect(state.state).toBe("CURRENT");
    expect(state.recordedAt).toBe(
      "2026-09-13T12:00:00+02:00",
    );
    expect(state.measurements[0].valueCm).toBe(102);
    expect(state.muscleDevelopment[0].score).toBe(70);
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("rejects an empty snapshot collection", () => {
    expect(() =>
      selectCurrentBodyState([]),
    ).toThrow(
      "Current body state requires at least one progress snapshot.",
    );
  });

  it("renders the latest state through the verified viewer", () => {
    const before = snapshot(
      "2026-08-13T12:00:00+02:00",
      98,
      60,
    );
    const current = snapshot(
      "2026-09-13T12:00:00+02:00",
      102,
      70,
    );

    render(
      <CurrentBodyStateViewer
        modelType="MALE"
        snapshots={[before, current]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Current state",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "2026-09-13T12:00:00+02:00",
      ),
    ).toBeInTheDocument();

    expect(viewerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelType: "MALE",
        measurements: current.measurements,
        muscleDevelopment:
          current.muscleDevelopment,
      }),
      undefined,
    );
  });
});
