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
  createMaleBodyModel,
  MALE_BODY_MODEL_NAME,
  MALE_BODY_MODEL_VERSION,
  MALE_BODY_SEGMENT_NAMES,
} from "./male-body.model";

describe("createMaleBodyModel", () => {
  it("creates the deterministic TITAN male body model", () => {
    const model = createMaleBodyModel();

    expect(model).toBeInstanceOf(Group);
    expect(model.name).toBe(MALE_BODY_MODEL_NAME);
    expect(model.userData).toEqual({
      modelType: "MALE",
      modelVersion: MALE_BODY_MODEL_VERSION,
    });

    expect(model.children.map(({ name }) => name)).toEqual(
      MALE_BODY_SEGMENT_NAMES,
    );
  });

  it("creates renderable and shadow-enabled body segments", () => {
    const model = createMaleBodyModel();

    expect(model.children).toHaveLength(
      MALE_BODY_SEGMENT_NAMES.length,
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
    const first = createMaleBodyModel();
    const second = createMaleBodyModel();

    expect(first).not.toBe(second);
    expect(first.children[0]).not.toBe(second.children[0]);
  });
});
