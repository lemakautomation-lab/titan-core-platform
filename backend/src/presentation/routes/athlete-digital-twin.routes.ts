import { Router } from "express";

import { AthleteDigitalTwinController } from "../controllers/athlete-digital-twin.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createAthleteDigitalTwinRoutes(
    controller: AthleteDigitalTwinController,
): Router {

    const router = Router();

    router.use(
        authMiddleware,
    );

    router.post(
        "/",
        requirePermission("athlete_digital_twins.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/athlete/:athleteId",
        requirePermission("athlete_digital_twins.read"),
        controller.getByAthleteId.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("athlete_digital_twins.read"),
        controller.getById.bind(controller),
    );

    router.patch(
        "/:id/lifecycle",
        requirePermission("athlete_digital_twins.update"),
        controller.updateLifecycle.bind(controller),
    );

    return router;
}
