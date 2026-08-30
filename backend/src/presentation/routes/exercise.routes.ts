import { Router } from "express";

import { ExerciseController } from "../controllers/exercise.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createExerciseRoutes(
    controller: ExerciseController,
): Router {

    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/",
        requirePermission("exercises.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("exercises.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("exercises.read"),
        controller.getById.bind(controller),
    );

    router.patch(
        "/:id/status",
        requirePermission("exercises.update"),
        controller.updateStatus.bind(controller),
    );
    router.put(
        "/:id",
        requirePermission("exercises.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("exercises.delete"),
        controller.delete.bind(controller),
    );

    return router;
}
