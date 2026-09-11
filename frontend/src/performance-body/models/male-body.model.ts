import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";

export const MALE_BODY_MODEL_NAME =
  "titan-male-performance-body";

export const MALE_BODY_MODEL_VERSION = 1;

export const MALE_BODY_SEGMENT_NAMES = [
  "head",
  "neck",
  "torso",
  "pelvis",
  "left-upper-arm",
  "right-upper-arm",
  "left-forearm",
  "right-forearm",
  "left-hand",
  "right-hand",
  "left-thigh",
  "right-thigh",
  "left-lower-leg",
  "right-lower-leg",
  "left-foot",
  "right-foot",
] as const;

export type MaleBodySegmentName =
  (typeof MALE_BODY_SEGMENT_NAMES)[number];

export type MaleBodyModel = Group & {
  userData: {
    modelType: "MALE";
    modelVersion: typeof MALE_BODY_MODEL_VERSION;
  };
};

type Segment = Mesh<
  BoxGeometry | CapsuleGeometry | SphereGeometry,
  MeshStandardMaterial
>;

function createSegment(
  name: MaleBodySegmentName,
  geometry:
    | BoxGeometry
    | CapsuleGeometry
    | SphereGeometry,
  material: MeshStandardMaterial,
  position: readonly [number, number, number],
): Segment {
  const segment = new Mesh(geometry, material);

  segment.name = name;
  segment.position.set(...position);
  segment.castShadow = true;
  segment.receiveShadow = true;

  return segment;
}

export function createMaleBodyModel(): MaleBodyModel {
  const model = new Group() as MaleBodyModel;

  model.name = MALE_BODY_MODEL_NAME;
  model.userData = {
    modelType: "MALE",
    modelVersion: MALE_BODY_MODEL_VERSION,
  };

  const material = new MeshStandardMaterial({
    color: 0x8f9aa3,
    metalness: 0.05,
    roughness: 0.72,
  });

  const segments: Segment[] = [
    createSegment(
      "head",
      new SphereGeometry(0.34, 24, 16),
      material,
      [0, 3.15, 0],
    ),
    createSegment(
      "neck",
      new CapsuleGeometry(0.13, 0.18, 8, 16),
      material,
      [0, 2.72, 0],
    ),
    createSegment(
      "torso",
      new BoxGeometry(1.12, 1.42, 0.5),
      material,
      [0, 1.92, 0],
    ),
    createSegment(
      "pelvis",
      new BoxGeometry(0.82, 0.52, 0.46),
      material,
      [0, 0.93, 0],
    ),
    createSegment(
      "left-upper-arm",
      new CapsuleGeometry(0.16, 0.72, 8, 16),
      material,
      [-0.78, 2.05, 0],
    ),
    createSegment(
      "right-upper-arm",
      new CapsuleGeometry(0.16, 0.72, 8, 16),
      material,
      [0.78, 2.05, 0],
    ),
    createSegment(
      "left-forearm",
      new CapsuleGeometry(0.13, 0.62, 8, 16),
      material,
      [-0.78, 1.22, 0],
    ),
    createSegment(
      "right-forearm",
      new CapsuleGeometry(0.13, 0.62, 8, 16),
      material,
      [0.78, 1.22, 0],
    ),
    createSegment(
      "left-hand",
      new BoxGeometry(0.24, 0.34, 0.15),
      material,
      [-0.78, 0.62, 0],
    ),
    createSegment(
      "right-hand",
      new BoxGeometry(0.24, 0.34, 0.15),
      material,
      [0.78, 0.62, 0],
    ),
    createSegment(
      "left-thigh",
      new CapsuleGeometry(0.22, 0.86, 8, 16),
      material,
      [-0.25, 0.02, 0],
    ),
    createSegment(
      "right-thigh",
      new CapsuleGeometry(0.22, 0.86, 8, 16),
      material,
      [0.25, 0.02, 0],
    ),
    createSegment(
      "left-lower-leg",
      new CapsuleGeometry(0.17, 0.82, 8, 16),
      material,
      [-0.25, -1.03, 0],
    ),
    createSegment(
      "right-lower-leg",
      new CapsuleGeometry(0.17, 0.82, 8, 16),
      material,
      [0.25, -1.03, 0],
    ),
    createSegment(
      "left-foot",
      new BoxGeometry(0.34, 0.22, 0.62),
      material,
      [-0.25, -1.62, 0.15],
    ),
    createSegment(
      "right-foot",
      new BoxGeometry(0.34, 0.22, 0.62),
      material,
      [0.25, -1.62, 0.15],
    ),
  ];

  model.add(...segments);

  return model;
}
