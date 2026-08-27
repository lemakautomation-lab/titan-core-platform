import { Router } from "express";

import { AthleteRelationshipController } from "../controllers/athlete-relationship.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createAthleteRelationshipRoutes(
    controller: AthleteRelationshipController,
): Router {

    const router = Router();

    router.use(
        authMiddleware,
    );

    router.post(
        "/",
        requirePermission("athlete_relationships.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/athlete/:athleteId",
        requirePermission("athlete_relationships.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("athlete_relationships.read"),
        controller.getById.bind(controller),
    );

    return router;
}
