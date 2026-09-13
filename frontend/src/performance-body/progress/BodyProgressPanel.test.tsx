import {
  render,
  screen,
} from "@testing-library/react";
import {
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
  compareBodyProgress,
  createBodyProgressSnapshot,
} from "./body-progress";

import BodyProgressPanel
  from "./BodyProgressPanel";

describe("body progress", () => {
  const baseline =
    createBodyProgressSnapshot(
      "2026-08-01T08:00:00+02:00",
      createBodyMeasurements({
        chest: 100,
        waist: 85.5,
      }),
      createMuscleDevelopment({
        torso: 60,
      }),
    );

  const current =
    createBodyProgressSnapshot(
      "2026-09-01T08:00:00+02:00",
      createBodyMeasurements({
        chest: 102.5,
        waist: 83,
      }),
      createMuscleDevelopment({
        torso: 72,
      }),
    );

  it("calculates deterministic measurement and muscle deltas", () => {
    expect(
      compareBodyProgress(
        baseline,
        current,
      ),
    ).toEqual({
      baselineAt:
        "2026-08-01T08:00:00+02:00",
      currentAt:
        "2026-09-01T08:00:00+02:00",
      measurementDeltas: [
        {
          name: "chest",
          label: "Chest",
          deltaCm: 2.5,
        },
        {
          name: "waist",
          label: "Waist",
          deltaCm: -2.5,
        },
      ],
      muscleDeltas: [
        {
          segment: "torso",
          deltaScore: 12,
        },
      ],
    });
  });

  it("rejects invalid or unordered timestamps", () => {
    expect(() =>
      createBodyProgressSnapshot(
        "2026-09-01",
        current.measurements,
        [],
      ),
    ).toThrow(
      "Progress timestamp must be a valid ISO 8601 value with timezone.",
    );

    expect(() =>
      compareBodyProgress(
        current,
        baseline,
      ),
    ).toThrow(
      "Current progress snapshot must be later than baseline.",
    );
  });

  it("requires at least one explicitly supplied value", () => {
    expect(() =>
      createBodyProgressSnapshot(
        "2026-09-01T08:00:00+02:00",
        [],
        [],
      ),
    ).toThrow(
      "Progress snapshot requires at least one supplied value.",
    );
  });

  it("renders earliest-to-latest progress accessibly", () => {
    render(
      <BodyProgressPanel
        snapshots={[
          current,
          baseline,
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Progress",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("+2.5 cm"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("-2.5 cm"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("+12 points"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /not a medical or diagnostic assessment/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows a safe state with insufficient history", () => {
    render(
      <BodyProgressPanel
        snapshots={[baseline]}
      />,
    );

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "At least two progress snapshots are required.",
    );
  });
});
