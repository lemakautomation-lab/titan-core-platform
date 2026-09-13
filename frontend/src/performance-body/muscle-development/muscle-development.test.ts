import {
  Mesh,
  type MeshStandardMaterial,
} from "three";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyMuscleDevelopment,
  createMuscleDevelopment,
} from "./muscle-development";

import {
  createMaleBodyModel,
} from "../models/male-body.model";

describe("muscle development", () => {
  it("creates an immutable canonical profile", () => {
    const development =
      createMuscleDevelopment({
        "right-thigh": 80,
        torso: 65,
        "left-upper-arm": 70,
      });

    expect(development).toEqual([
      {
        segment: "torso",
        score: 65,
      },
      {
        segment: "left-upper-arm",
        score: 70,
      },
      {
        segment: "right-thigh",
        score: 80,
      },
    ]);

    expect(Object.isFrozen(development))
      .toBe(true);

    expect(
      development.every(Object.isFrozen),
    ).toBe(true);
  });

  it.each([
    -1,
    101,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    "rejects invalid score %s",
    (score) => {
      expect(() =>
        createMuscleDevelopment({
          torso: score,
        }),
      ).toThrow(
        "torso development score must be an integer from 0 to 100.",
      );
    },
  );

  it("applies deterministic intensity only to selected segments", () => {
    const model =
      createMaleBodyModel();

    const torso =
      model.getObjectByName("torso");

    const head =
      model.getObjectByName("head");

    expect(torso).toBeInstanceOf(Mesh);
    expect(head).toBeInstanceOf(Mesh);

    const originalTorsoMaterial =
      (torso as Mesh).material;

    const originalHeadMaterial =
      (head as Mesh).material;

    applyMuscleDevelopment(
      model,
      createMuscleDevelopment({
        torso: 75,
      }),
    );

    const torsoMaterial =
      (torso as Mesh)
        .material as MeshStandardMaterial;

    expect(torsoMaterial)
      .not.toBe(originalTorsoMaterial);

    expect(torsoMaterial.emissive.getHex())
      .toBe(0x42f5c5);

    expect(torsoMaterial.emissiveIntensity)
      .toBe(0.75);

    expect((head as Mesh).material)
      .toBe(originalHeadMaterial);
  });
});
