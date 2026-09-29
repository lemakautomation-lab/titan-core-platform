import { Router, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { AuthoriseAthleteTrendVisibilityUseCase } from "../../application/use-cases/authorise-athlete-trend-visibility.use-case";
import { PerformanceMeasurementController } from "../controllers/performance-measurement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createPerformanceMeasurementRoutes(
    controller: PerformanceMeasurementController,
    authorise: AuthoriseAthleteTrendVisibilityUseCase,
) {
    const router = Router();
    router.use(authMiddleware);
    const authoriseTrend = async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        // Validate the identifier before querying; full request validation remains in the controller.
        if (typeof req.query.athleteId !== "string" || !req.query.athleteId.trim()) {
            return void res.status(400).json({ error: "Invalid athleteId." });
        }
        try {
            if (!await authorise.execute({ tenantId: req.user.tenantId,
                userId: req.user.userId, athleteId: req.query.athleteId })) {
                return void res.status(404).json({ error: "Athlete not found." });
            }
            next();
        } catch (error) { next(error); }
    };
    router.get("/trends/improvement",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.detectImprovement.bind(controller),
    );
    router.get("/trends/decline",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.detectDecline.bind(controller),
    );
    router.get("/trends/context",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.getTrendContext.bind(controller),
    );
    router.get("/trends/deviation",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.detectDeviation.bind(controller),
    );
    router.get("/trends/change",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.detectChange.bind(controller),
    );
    router.get("/trends/plateau",
        requirePermission("performance-measurements.read"),
        authoriseTrend,
        controller.detectPlateau.bind(controller),
    );
    router.post("/baselines",
        requirePermission("performance-measurements.create"),
        requirePermission("performance-measurements.read"),
        controller.createBaseline.bind(controller),
    );
    router.post("/", requirePermission("performance-measurements.create"), controller.create.bind(controller));
    router.post("/:id/corrections", requirePermission("performance-measurements.correct"), controller.correct.bind(controller));
    router.get("/", requirePermission("performance-measurements.read"), controller.list.bind(controller));
    return router;
}
