import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { GetDepartmentCommandCentreUseCase } from "../../application/use-cases/get-department-command-centre.use-case";
import { GetDepartmentPerformanceIntelligenceUseCase } from "../../application/use-cases/get-department-performance-intelligence.use-case";
import { ListDepartmentTeamsUseCase } from "../../application/use-cases/list-department-teams.use-case";

export function createPerformanceDirectorRoutes(
    query: GetDepartmentCommandCentreUseCase,
    intelligence: GetDepartmentPerformanceIntelligenceUseCase,
    teams: ListDepartmentTeamsUseCase,
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
    router.get(
        "/teams",
        requirePermission("performance-director.teams.read"),
        async (req: AuthRequest, res: Response) => {
            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const rawLimit = req.query.limit === undefined ? "25" : req.query.limit;
            if (typeof rawLimit !== "string" || !/^[1-9][0-9]*$/.test(rawLimit) ||
                Number(rawLimit) > 100) {
                res.status(400).json({ error: "limit must be an integer between 1 and 100." });
                return;
            }
            const rawCursor = req.query.cursor;
            if (rawCursor !== undefined &&
                (typeof rawCursor !== "string" ||
                    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCursor))) {
                res.status(400).json({ error: "Invalid cursor." });
                return;
            }
            const result = await teams.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), rawCursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Department page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    return router;
}
