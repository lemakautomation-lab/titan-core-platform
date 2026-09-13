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
import BodyMeasurementMappingPanel from "./BodyMeasurementMappingPanel";
import {
  mapBodyMeasurements,
} from "./measurement-mapping";

afterEach(cleanup);

describe("body measurement mapping", () => {
  it("maps measurements to canonical body segments", () => {
    const mappings=mapBodyMeasurements(
      createBodyMeasurements({
        chest: 100,
        hips: 98,
        "left-upper-arm": 35,
      }),
    );

    expect(mappings).toEqual([
      expect.objectContaining({
        measurement: "chest",
        segments: ["torso"],
      }),
      expect.objectContaining({
        measurement: "hips",
        segments: ["pelvis"],
      }),
      expect.objectContaining({
        measurement: "left-upper-arm",
        segments: ["left-upper-arm"],
      }),
    ]);
  });

  it("maps height to the whole model", () => {
    const [mapping]=mapBodyMeasurements(
      createBodyMeasurements({
        height: 180,
      }),
    );

    expect(mapping.segments).toHaveLength(16);
    expect(mapping.segments).toContain("head");
    expect(mapping.segments).toContain(
      "right-lower-leg",
    );
  });

  it("returns immutable mappings", () => {
    const mappings=mapBodyMeasurements(
      createBodyMeasurements({
        waist: 80,
      }),
    );

    expect(Object.isFrozen(mappings)).toBe(true);
    expect(Object.isFrozen(mappings[0])).toBe(true);
    expect(
      Object.isFrozen(mappings[0].segments),
    ).toBe(true);
  });

  it("renders mapped values and regions accessibly", () => {
    render(
      <BodyMeasurementMappingPanel
        measurements={createBodyMeasurements({
          height: 180,
          chest: 100,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Measurement mapping",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("180 cm mapped to Whole body"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("100 cm mapped to Torso"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/not a medical, diagnostic or anatomical/i),
    ).toBeInTheDocument();
  });

  it("renders a safe empty state", () => {
    render(
      <BodyMeasurementMappingPanel
        measurements={[]}
      />,
    );

    expect(screen.getByRole("status"))
      .toHaveTextContent(
        "No body measurements are available for mapping.",
      );
  });
});
