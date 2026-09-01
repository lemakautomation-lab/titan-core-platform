import { Router } from "express";

import { WorkoutProgrammeController } from "../controllers/workout-programme.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createWorkoutProgrammeRoutes(
    controller: WorkoutProgrammeController,
): Router {

    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/",
        requirePermission("workout-programmes.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("workout-programmes.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/athlete/:athleteId",
        requirePermission("workout-programmes.read"),
        controller.listByAthlete.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("workout-programmes.read"),
        controller.getById.bind(controller),
    );

    router.patch(
        "/:id/status",
        requirePermission("workout-programmes.update"),
        controller.updateStatus.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("workout-programmes.update"),
        controller.update.bind(controller),
    );

    router.post(
        "/:id/performance-adaptation",
        requirePermission("workout-programmes.update"),
        controller.adaptFromPerformance.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("workout-programmes.delete"),
        controller.delete.bind(controller),
    );

    return router;
}
