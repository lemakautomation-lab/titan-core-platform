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
} from "./body-measurements";

import BodyMeasurementsPanel
  from "./BodyMeasurementsPanel";

describe("body measurements", () => {
  it("creates an immutable canonical measurement set", () => {
    const measurements =
      createBodyMeasurements({
        waist: 82.5,
        height: 181,
        chest: 101,
      });

    expect(measurements).toEqual([
      {
        name: "height",
        label: "Height",
        valueCm: 181,
      },
      {
        name: "chest",
        label: "Chest",
        valueCm: 101,
      },
      {
        name: "waist",
        label: "Waist",
        valueCm: 82.5,
      },
    ]);

    expect(Object.isFrozen(measurements))
      .toBe(true);

    expect(
      measurements.every(Object.isFrozen),
    ).toBe(true);
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    "rejects invalid centimetre value %s",
    (valueCm) => {
      expect(() =>
        createBodyMeasurements({
          height: valueCm,
        }),
      ).toThrow(
        "Height must be a finite positive centimetre value.",
      );
    },
  );

  it("renders supplied values with units and boundary text", () => {
    render(
      <BodyMeasurementsPanel
        measurements={createBodyMeasurements({
          height: 181,
          waist: 82.5,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Measurements",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("181 cm"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("82.5 cm"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /not medical or diagnostic assessments/i,
      ),
    ).toBeInTheDocument();
  });
});
