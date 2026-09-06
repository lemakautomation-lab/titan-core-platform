import { Router } from "express";

import { NutritionPlanController } from "../controllers/nutrition-plan.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createNutritionPlanRoutes(
    controller: NutritionPlanController,
): Router {
    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/generations",
        requirePermission("nutrition-plans.generate"),
        controller.generate.bind(controller),
    );

    return router;
}
