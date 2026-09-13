import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AmbientLight,
  DirectionalLight,
  type Group,
  type Material,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import { createFemaleBodyModel } from "./models/female-body.model";
import { createMaleBodyModel } from "./models/male-body.model";
import {
  applyMuscleDevelopment,
  type MuscleDevelopment,
} from "./muscle-development/muscle-development";
import BodyMeasurementsPanel from "./measurements/BodyMeasurementsPanel";
import BodyProgressPanel from "./progress/BodyProgressPanel";
import type {
  BodyProgressSnapshot,
} from "./progress/body-progress";
import type {
  BodyMeasurement,
} from "./measurements/body-measurements";
import "./PerformanceBodyViewer.css";

export type PerformanceBodyModelType =
  | "MALE"
  | "FEMALE";

interface PerformanceBodyViewerProps {
  modelType: PerformanceBodyModelType;
  measurements?: readonly BodyMeasurement[];
  muscleDevelopment?: readonly MuscleDevelopment[];
  progressSnapshots?: readonly BodyProgressSnapshot[];
}

const VIEWPORT_WIDTH = 480;
const VIEWPORT_HEIGHT = 640;
const DEFAULT_CAMERA_DISTANCE = 7;
const MIN_CAMERA_DISTANCE = 5;
const MAX_CAMERA_DISTANCE = 9;
const ZOOM_STEP = 0.5;
const ROTATION_STEP_DEGREES = 15;

interface ViewState {
  readonly rotationDegrees: number;
  readonly cameraDistance: number;
}

function disposeModel(model: Group): void {
  model.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    object.geometry.dispose();

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material: Material) => {
      material.dispose();
    });
  });
}

export default function PerformanceBodyViewer({
  modelType,
  measurements = [],
  muscleDevelopment,
  progressSnapshots,
}: PerformanceBodyViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef =
    useRef<PerspectiveCamera | null>(null);
  const modelRef = useRef<Group | null>(null);
  const rendererRef =
    useRef<WebGLRenderer | null>(null);

  const [renderError, setRenderError] =
    useState(false);

  const [view, setView] = useState<ViewState>({
    rotationDegrees: 0,
    cameraDistance: DEFAULT_CAMERA_DISTANCE,
  });

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const model =
      modelType === "MALE"
        ? createMaleBodyModel()
        : createFemaleBodyModel();

    if (muscleDevelopment) {
      applyMuscleDevelopment(
        model,
        muscleDevelopment,
      );
    }

    let renderer: WebGLRenderer | null = null;

    try {
      const scene = new Scene();
      const camera = new PerspectiveCamera(
        35,
        VIEWPORT_WIDTH / VIEWPORT_HEIGHT,
        0.1,
        100,
      );

      camera.position.set(
        0,
        0.8,
        view.cameraDistance,
      );

      model.rotation.y =
        (view.rotationDegrees * Math.PI) /
        180;
      camera.lookAt(0, 0.8, 0);

      scene.add(new AmbientLight(0xffffff, 1.8));

      const keyLight =
        new DirectionalLight(0xffffff, 2.4);

      keyLight.position.set(4, 6, 5);
      scene.add(keyLight);

      const fillLight =
        new DirectionalLight(0x42f5c5, 1.1);

      fillLight.position.set(-4, 2, 3);
      scene.add(fillLight);

      scene.add(model);

      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
      });

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2),
      );
      renderer.setSize(
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT,
        false,
      );

      renderer.domElement.setAttribute(
        "aria-label",
        `${modelType.toLowerCase()} performance body`,
      );

      host.replaceChildren(renderer.domElement);

      sceneRef.current = scene;
      cameraRef.current = camera;
      modelRef.current = model;
      rendererRef.current = renderer;

      renderer.render(scene, camera);
      setRenderError(false);
    } catch {
      host.replaceChildren();
      setRenderError(true);
    }

    return () => {
      host.replaceChildren();
      disposeModel(model);
      renderer?.dispose();

      if (modelRef.current === model) {
        sceneRef.current = null;
        cameraRef.current = null;
        modelRef.current = null;
        rendererRef.current = null;
      }
    };
  }, [
    modelType,
    muscleDevelopment,
    view.cameraDistance,
    view.rotationDegrees,
  ]);

  function updateView(next: ViewState): void {
    setView(next);
  }

  function rotate(delta: number): void {
    updateView({
      ...view,
      rotationDegrees:
        view.rotationDegrees + delta,
    });
  }

  function zoom(delta: number): void {
    updateView({
      ...view,
      cameraDistance: Math.min(
        MAX_CAMERA_DISTANCE,
        Math.max(
          MIN_CAMERA_DISTANCE,
          view.cameraDistance + delta,
        ),
      ),
    });
  }

  function resetView(): void {
    updateView({
      rotationDegrees: 0,
      cameraDistance:
        DEFAULT_CAMERA_DISTANCE,
    });
  }

  return (
    <section
      className="performance-body-viewer"
      aria-label="3D performance body visualisation"
    >
      <div
        ref={hostRef}
        className="performance-body-viewer__canvas"
        role="img"
        aria-label={`${modelType.toLowerCase()} 3D performance body`}
      />

      <nav
        className="performance-body-controls"
        aria-label="3D body controls"
      >
        <button
          type="button"
          onClick={() =>
            rotate(-ROTATION_STEP_DEGREES)
          }
          disabled={renderError}
        >
          Rotate left
        </button>

        <button
          type="button"
          onClick={() =>
            rotate(ROTATION_STEP_DEGREES)
          }
          disabled={renderError}
        >
          Rotate right
        </button>

        <button
          type="button"
          onClick={() => zoom(-ZOOM_STEP)}
          disabled={
            renderError ||
            view.cameraDistance <=
              MIN_CAMERA_DISTANCE
          }
        >
          Zoom in
        </button>

        <button
          type="button"
          onClick={() => zoom(ZOOM_STEP)}
          disabled={
            renderError ||
            view.cameraDistance >=
              MAX_CAMERA_DISTANCE
          }
        >
          Zoom out
        </button>

        <button
          type="button"
          onClick={resetView}
          disabled={renderError}
        >
          Reset view
        </button>
      </nav>

      <output
        className="performance-body-controls__status"
        aria-live="polite"
      >
        Rotation {view.rotationDegrees} degrees;
        camera distance {view.cameraDistance}
      </output>

      <BodyMeasurementsPanel
        measurements={measurements}
      />

      {progressSnapshots && (
        <BodyProgressPanel
          snapshots={progressSnapshots}
        />
      )}

      {renderError && (
        <p
          className="performance-body-viewer__fallback"
          role="alert"
        >
          3D body visualisation is unavailable on this device.
        </p>
      )}
    </section>
  );
}
