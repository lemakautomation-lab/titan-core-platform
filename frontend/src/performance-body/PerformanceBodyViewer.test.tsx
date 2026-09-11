import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const rendererState = vi.hoisted(() => ({
  dispose: vi.fn(),
  fail: false,
  render: vi.fn(),
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
}));

vi.mock("three", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("three")>();

  class TestWebGLRenderer {
    readonly domElement =
      document.createElement("canvas");

    constructor() {
      if (rendererState.fail) {
        throw new Error("WebGL unavailable");
      }
    }

    setPixelRatio(value: number) {
      rendererState.setPixelRatio(value);
    }

    setSize(
      width: number,
      height: number,
      updateStyle: boolean,
    ) {
      rendererState.setSize(
        width,
        height,
        updateStyle,
      );
    }

    render(scene: unknown, camera: unknown) {
      rendererState.render(scene, camera);
    }

    dispose() {
      rendererState.dispose();
    }
  }

  return {
    ...actual,
    WebGLRenderer: TestWebGLRenderer,
  };
});

import PerformanceBodyViewer from "./PerformanceBodyViewer";

describe("PerformanceBodyViewer", () => {
  beforeEach(() => {
    rendererState.fail = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the male performance body", () => {
    render(
      <PerformanceBodyViewer modelType="MALE" />,
    );

    expect(
      screen.getByRole("img", {
        name: "male 3D performance body",
      }),
    ).toContainElement(
      screen.getByLabelText(
        "male performance body",
      ),
    );

    expect(rendererState.render).toHaveBeenCalledOnce();
    expect(rendererState.setSize).toHaveBeenCalledWith(
      480,
      640,
      false,
    );
  });

  it("renders the female performance body", () => {
    render(
      <PerformanceBodyViewer modelType="FEMALE" />,
    );

    expect(
      screen.getByRole("img", {
        name: "female 3D performance body",
      }),
    ).toContainElement(
      screen.getByLabelText(
        "female performance body",
      ),
    );

    expect(rendererState.render).toHaveBeenCalledOnce();
  });

  it("disposes the renderer on unmount", () => {
    const result = render(
      <PerformanceBodyViewer modelType="MALE" />,
    );

    result.unmount();

    expect(rendererState.dispose).toHaveBeenCalledOnce();
  });

  it("fails safely when WebGL is unavailable", () => {
    rendererState.fail = true;

    render(
      <PerformanceBodyViewer modelType="MALE" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "3D body visualisation is unavailable on this device.",
    );

    expect(rendererState.render).not.toHaveBeenCalled();
  });
});
