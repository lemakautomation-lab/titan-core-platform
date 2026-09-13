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
import BeforeBodyStateViewer from "./BeforeBodyStateViewer";
import {
  selectBeforeBodyState,
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
    createBodyMeasurements({
      chest,
    }),
    createMuscleDevelopment({
      torso,
    }),
  );
}

describe("before body state mapping", () => {
  it("selects the earliest snapshot deterministically", () => {
    const current = snapshot(
      "2026-09-13T12:00:00+02:00",
      102,
      70,
    );
    const before = snapshot(
      "2026-08-13T12:00:00+02:00",
      98,
      60,
    );

    const state = selectBeforeBodyState([
      current,
      before,
    ]);

    expect(state.state).toBe("BEFORE");
    expect(state.recordedAt).toBe(
      "2026-08-13T12:00:00+02:00",
    );
    expect(state.measurements[0].valueCm).toBe(98);
    expect(state.muscleDevelopment[0].score).toBe(60);
  });

  it("returns an immutable mapped state", () => {
    const state = selectBeforeBodyState([
      snapshot(
        "2026-08-13T12:00:00+02:00",
        98,
        60,
      ),
    ]);

    expect(Object.isFrozen(state)).toBe(true);
    expect(
      Object.isFrozen(state.measurements),
    ).toBe(true);
    expect(
      Object.isFrozen(state.muscleDevelopment),
    ).toBe(true);
  });

  it("rejects an empty snapshot collection", () => {
    expect(() =>
      selectBeforeBodyState([]),
    ).toThrow(
      "Before body state requires at least one progress snapshot.",
    );
  });

  it("renders the earliest state through the verified viewer", () => {
    const current = snapshot(
      "2026-09-13T12:00:00+02:00",
      102,
      70,
    );
    const before = snapshot(
      "2026-08-13T12:00:00+02:00",
      98,
      60,
    );

    render(
      <BeforeBodyStateViewer
        modelType="FEMALE"
        snapshots={[current, before]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Before state",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "2026-08-13T12:00:00+02:00",
      ),
    ).toBeInTheDocument();

    expect(viewerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelType: "FEMALE",
        measurements: before.measurements,
        muscleDevelopment:
          before.muscleDevelopment,
      }),
      undefined,
    );

    expect(
      screen.getByText(/not a medical or diagnostic assessment/i),
    ).toBeInTheDocument();
  });
});
