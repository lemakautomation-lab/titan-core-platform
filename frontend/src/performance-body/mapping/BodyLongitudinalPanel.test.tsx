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
} from "vitest";

import {
  createBodyMeasurements,
} from "../measurements/body-measurements";
import {
  createMuscleDevelopment,
} from "../muscle-development/muscle-development";
import {
  createBodyProgressSnapshot,
} from "../progress/body-progress";
import BodyLongitudinalPanel from "./BodyLongitudinalPanel";
import {
  createBodyLongitudinalProgress,
} from "./body-longitudinal";

afterEach(cleanup);

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

const first=snapshot(
  "2026-07-13T12:00:00+02:00",
  95,
  50,
);
const second=snapshot(
  "2026-08-13T12:00:00+02:00",
  98,
  60,
);
const third=snapshot(
  "2026-09-13T12:00:00+02:00",
  102,
  70,
);

describe("longitudinal body progress", () => {
  it("creates chronological adjacent comparisons", () => {
    const timeline=createBodyLongitudinalProgress([
      third,
      first,
      second,
    ]);

    expect(timeline.startAt).toBe(first.recordedAt);
    expect(timeline.endAt).toBe(third.recordedAt);
    expect(timeline.comparisons).toHaveLength(2);
    expect(
      timeline.comparisons[0].measurementDeltas[0].deltaCm,
    ).toBe(3);
    expect(
      timeline.comparisons[1].measurementDeltas[0].deltaCm,
    ).toBe(4);
  });

  it("returns an immutable timeline", () => {
    const timeline=createBodyLongitudinalProgress([
      first,
      second,
    ]);

    expect(Object.isFrozen(timeline)).toBe(true);
    expect(
      Object.isFrozen(timeline.comparisons),
    ).toBe(true);
  });

  it("requires at least two snapshots", () => {
    expect(() =>
      createBodyLongitudinalProgress([first]),
    ).toThrow(
      "Longitudinal progress requires at least two snapshots.",
    );
  });

  it("rejects duplicate timestamps", () => {
    expect(() =>
      createBodyLongitudinalProgress([
        first,
        snapshot(first.recordedAt, 96, 55),
      ]),
    ).toThrow(
      "Longitudinal progress requires unique timestamps.",
    );
  });

  it("renders every chronological interval accessibly", () => {
    render(
      <BodyLongitudinalPanel
        snapshots={[third, first, second]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Longitudinal comparison",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("list", {
        name: "Body progress intervals",
      }).children,
    ).toHaveLength(2);

    expect(screen.getByText("Chest: +3 cm"))
      .toBeInTheDocument();

    expect(screen.getByText("Chest: +4 cm"))
      .toBeInTheDocument();

    expect(
      screen.getByText(/not a medical or diagnostic assessment/i),
    ).toBeInTheDocument();
  });
});
