import { Router } from "express";

import { PerformanceMetricController } from "../controllers/performance-metric.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createPerformanceMetricRoutes(
    controller: PerformanceMetricController,
): Router {

    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/",
        requirePermission("performance-metrics.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("performance-metrics.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("performance-metrics.read"),
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("performance-metrics.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("performance-metrics.delete"),
        controller.delete.bind(controller),
    );

    return router;
}
