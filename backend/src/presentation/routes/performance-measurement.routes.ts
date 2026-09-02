import { Router } from "express";
import { PerformanceMeasurementController } from "../controllers/performance-measurement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createPerformanceMeasurementRoutes(controller: PerformanceMeasurementController) {
    const router = Router();
    router.use(authMiddleware);
    router.post("/", requirePermission("performance-measurements.create"), controller.create.bind(controller));
    router.post("/:id/corrections", requirePermission("performance-measurements.correct"), controller.correct.bind(controller));
    router.get("/", requirePermission("performance-measurements.read"), controller.list.bind(controller));
    return router;
}
