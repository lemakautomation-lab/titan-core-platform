import { Router } from "express";

import { SessionController } from "../controllers/session.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createSessionRoutes(
    controller: SessionController,
): Router {

    const router = Router();

    router.use(
        authMiddleware,
    );

    router.get(
        "/:id",
        requirePermission("sessions.read"),
        controller.getById.bind(controller),
    );

    return router;
}
