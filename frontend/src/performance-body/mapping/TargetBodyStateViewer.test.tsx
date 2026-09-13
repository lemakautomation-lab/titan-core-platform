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
import TargetBodyStateViewer from "./TargetBodyStateViewer";
import {
  createTargetBodyState,
} from "./body-state-mapping";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const measurements=createBodyMeasurements({
  chest: 105,
});

const muscleDevelopment=createMuscleDevelopment({
  torso: 80,
});

describe("target body state mapping", () => {
  it("creates an immutable explicit future target", () => {
    const state=createTargetBodyState(
      "2026-09-13T12:00:00+02:00",
      "2026-12-13T12:00:00+02:00",
      measurements,
      muscleDevelopment,
    );

    expect(state.state).toBe("TARGET");
    expect(state.targetAt).toBe(
      "2026-12-13T12:00:00+02:00",
    );
    expect(Object.isFrozen(state)).toBe(true);
    expect(
      Object.isFrozen(state.measurements),
    ).toBe(true);
  });

  it("rejects a target not later than current", () => {
    expect(() =>
      createTargetBodyState(
        "2026-09-13T12:00:00+02:00",
        "2026-09-13T12:00:00+02:00",
        measurements,
        muscleDevelopment,
      ),
    ).toThrow(
      "Target body state must be later than the current state.",
    );
  });

  it("rejects a target without explicit values", () => {
    expect(() =>
      createTargetBodyState(
        "2026-09-13T12:00:00+02:00",
        "2026-12-13T12:00:00+02:00",
        [],
        [],
      ),
    ).toThrow(
      "Target body state requires at least one explicit value.",
    );
  });

  it("renders the explicit target through the verified viewer", () => {
    render(
      <TargetBodyStateViewer
        modelType="FEMALE"
        currentAt="2026-09-13T12:00:00+02:00"
        targetAt="2026-12-13T12:00:00+02:00"
        measurements={measurements}
        muscleDevelopment={muscleDevelopment}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Target state",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "2026-12-13T12:00:00+02:00",
      ),
    ).toBeInTheDocument();

    expect(viewerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelType: "FEMALE",
        measurements,
        muscleDevelopment,
      }),
      undefined,
    );

    expect(
      screen.getByText(/not inferred, guaranteed, medical/i),
    ).toBeInTheDocument();
  });
});
