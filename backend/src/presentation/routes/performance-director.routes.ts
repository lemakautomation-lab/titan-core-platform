import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { GetDepartmentCommandCentreUseCase } from "../../application/use-cases/get-department-command-centre.use-case";

export function createPerformanceDirectorRoutes(query: GetDepartmentCommandCentreUseCase): Router {
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
    return router;
}
