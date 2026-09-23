import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { GetDepartmentCommandCentreUseCase } from "../../application/use-cases/get-department-command-centre.use-case";
import { GetDepartmentPerformanceIntelligenceUseCase } from "../../application/use-cases/get-department-performance-intelligence.use-case";

export function createPerformanceDirectorRoutes(
    query: GetDepartmentCommandCentreUseCase,
    intelligence: GetDepartmentPerformanceIntelligenceUseCase,
): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get(
        "/command-centre",
        requirePermission("performance-director.command-centre.read"),
        async (req: AuthRequest, res: Response) => {
            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const result = await query.execute(req.user.tenantId, req.user.userId);
            if (!result) {
                res.status(404).json({ error: "Department not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/intelligence",
        requirePermission("performance-director.intelligence.read"),
        async (req: AuthRequest, res: Response) => {
            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const input = req.query.days === undefined ? "30" : req.query.days;
            if (input !== "7" && input !== "30" && input !== "90") {
                res.status(400).json({ error: "days must be 7, 30 or 90." });
                return;
            }
            const days = Number(input) as 7 | 30 | 90;
            const result = await intelligence.execute(req.user.tenantId, req.user.userId, days);
            if (!result) {
                res.status(404).json({ error: "Department not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    return router;
}
