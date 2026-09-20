import { Router } from "express";

import { CoachSquadController } from "../controllers/coach-squad.controller";
import { CoachTeamController } from "../controllers/coach-team.controller";
import { CoachAthleteController } from "../controllers/coach-athlete.controller";
import { CoachTrainingController } from "../controllers/coach-training.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createCoachRoutes(
    controller: CoachSquadController,
    teamController: CoachTeamController,
    athleteController: CoachAthleteController,
    trainingController: CoachTrainingController,
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
        "/squads/:id/athletes",
        requirePermission("coach-squads.update"),
        controller.addAthlete.bind(controller),
    );

    router.get(
        "/squads/:id/athletes",
        requirePermission("coach-squads.read"),
        controller.listAthletes.bind(controller),
    );

    router.get(
        "/squads/:id/performance-dashboard",
        requirePermission("coach-squads.read"),
        requirePermission("performance-measurements.read"),
        controller.performanceDashboard.bind(controller),
    );
    router.delete(
        "/squads/:id/athletes/:athleteId",
        requirePermission("coach-squads.update"),
        controller.removeAthlete.bind(controller),
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
    router.post(
        "/athletes",
        requirePermission("coach-athletes.update"),
        athleteController.add.bind(athleteController),
    );

    router.get(
        "/athletes",
        requirePermission("coach-athletes.read"),
        athleteController.list.bind(athleteController),
    );

    router.delete(
        "/athletes/:athleteId",
        requirePermission("coach-athletes.update"),
        athleteController.remove.bind(athleteController),
    );
    router.post(
        "/training/programmes",
        requirePermission("workout-programmes.create"),
        trainingController.create.bind(trainingController),
    );

    router.patch(
        "/training/programmes/:id/assignment",
        requirePermission("workout-programmes.update"),
        trainingController.assign.bind(trainingController),
    );

    router.get(
        "/athletes/:athleteId/performance-monitoring",
        requirePermission("performance-measurements.read"),
        trainingController.monitoring.bind(trainingController),
    );
    return router;
}