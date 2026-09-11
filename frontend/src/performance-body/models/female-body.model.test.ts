import {
  Group,
  Mesh,
} from "three";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createFemaleBodyModel,
  FEMALE_BODY_MODEL_NAME,
  FEMALE_BODY_MODEL_VERSION,
  FEMALE_BODY_SEGMENT_NAMES,
} from "./female-body.model";

describe("createFemaleBodyModel", () => {
  it("creates the deterministic TITAN female body model", () => {
    const model = createFemaleBodyModel();

    expect(model).toBeInstanceOf(Group);
    expect(model.name).toBe(FEMALE_BODY_MODEL_NAME);
    expect(model.userData).toEqual({
      modelType: "FEMALE",
      modelVersion: FEMALE_BODY_MODEL_VERSION,
    });

    expect(model.children.map(({ name }) => name)).toEqual(
      FEMALE_BODY_SEGMENT_NAMES,
    );
  });

  it("creates renderable and shadow-enabled body segments", () => {
    const model = createFemaleBodyModel();

    expect(model.children).toHaveLength(
      FEMALE_BODY_SEGMENT_NAMES.length,
    );

    for (const child of model.children) {
      expect(child).toBeInstanceOf(Mesh);

      const segment = child as Mesh;

      expect(segment.geometry).toBeDefined();
      expect(segment.material).toBeDefined();
      expect(segment.castShadow).toBe(true);
      expect(segment.receiveShadow).toBe(true);
    }
  });

  it("creates independent model instances", () => {
    const first = createFemaleBodyModel();
    const second = createFemaleBodyModel();

    expect(first).not.toBe(second);
    expect(first.children[0]).not.toBe(second.children[0]);
  });
});
