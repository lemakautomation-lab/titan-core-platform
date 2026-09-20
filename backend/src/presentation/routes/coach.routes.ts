import { Router } from "express";

import { CoachSquadController } from "../controllers/coach-squad.controller";
import { CoachTeamController } from "../controllers/coach-team.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createCoachRoutes(
    controller: CoachSquadController,
    teamController: CoachTeamController,
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

    router.post(
        "/teams",
        requirePermission("coach-teams.create"),
        teamController.create.bind(teamController),
    );

    router.get(
        "/teams",
        requirePermission("coach-teams.read"),
        teamController.list.bind(teamController),
    );

    router.patch(
        "/teams/:id",
        requirePermission("coach-teams.update"),
        teamController.update.bind(teamController),
    );
    return router;
}