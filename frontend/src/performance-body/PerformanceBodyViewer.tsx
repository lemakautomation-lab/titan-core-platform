import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AmbientLight,
  DirectionalLight,
  Group,
  Material,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

import { createFemaleBodyModel } from "./models/female-body.model";
import { createMaleBodyModel } from "./models/male-body.model";
import "./PerformanceBodyViewer.css";

export type PerformanceBodyModelType =
  | "MALE"
  | "FEMALE";

interface PerformanceBodyViewerProps {
  modelType: PerformanceBodyModelType;
}

const VIEWPORT_WIDTH = 480;
const VIEWPORT_HEIGHT = 640;

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
}: PerformanceBodyViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] =
    useState(false);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const model =
      modelType === "MALE"
        ? createMaleBodyModel()
        : createFemaleBodyModel();

    let renderer: WebGLRenderer | null = null;

    try {
      const scene = new Scene();
      const camera = new PerspectiveCamera(
        35,
        VIEWPORT_WIDTH / VIEWPORT_HEIGHT,
        0.1,
        100,
      );

      camera.position.set(0, 0.8, 7);
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
    };
  }, [modelType]);

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
