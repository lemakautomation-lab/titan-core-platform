import { Router } from "express";

import { CoachSquadController } from "../controllers/coach-squad.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createCoachRoutes(
    controller: CoachSquadController,
): Router {
    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/squads",
        requirePermission("coach-squads.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/squads",
        requirePermission("coach-squads.read"),
        controller.list.bind(controller),
    );

    router.patch(
        "/squads/:id",
        requirePermission("coach-squads.update"),
        controller.update.bind(controller),
    );

    return router;
}