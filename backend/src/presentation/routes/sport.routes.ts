import { Router } from "express";

import { SportController } from "../controllers/sport.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createSportRoutes(
    controller: SportController,
): Router {

    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/",
        requirePermission("sports.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("sports.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("sports.read"),
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("sports.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("sports.delete"),
        controller.delete.bind(controller),
    );

    return router;
}
