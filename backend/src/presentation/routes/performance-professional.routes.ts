import { Router } from "express";
import { PerformanceProfessionalController } from "../controllers/performance-professional.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createPerformanceProfessionalRoutes(
    controller: PerformanceProfessionalController,
) {
    const router = Router();

    router.use(authMiddleware);

    router.get(
        "/athletes/:athleteId/workflow",
        requirePermission("performance-measurements.read"),
        requirePermission("workout-programmes.read"),
        controller.getAthleteWorkflow.bind(controller),
    );

    router.get(
        "/athletes/:athleteId/strength-conditioning",
        requirePermission("workout-programmes.read"),
        controller.getStrengthConditioningWorkflow.bind(controller),
    );

    router.get(
        "/athletes/:athleteId/nutrition",
        requirePermission("nutrition-plans.generate"),
        controller.getNutritionProfessionalWorkflow.bind(controller),
    );

    router.get(
        "/athletes/:athleteId/rehabilitation",
        requirePermission("performance-professional.rehabilitation.read"),
        controller.getRehabilitationProfessionalWorkflow.bind(controller),
    );

    return router;
}
