import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { ListClubExecutivesUseCase } from "../../application/use-cases/list-club-executives.use-case";

export function createClubRoutes(executives: ListClubExecutivesUseCase): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get(
        "/executives",
        requirePermission("club.executives.read"),
        async (req: AuthRequest, res: Response) => {
            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const rawLimit = req.query.limit === undefined ? "25" : req.query.limit;
            if (typeof rawLimit !== "string" || !/^[1-9][0-9]*$/.test(rawLimit) || Number(rawLimit) > 100) {
                res.status(400).json({ error: "limit must be an integer between 1 and 100." });
                return;
            }
            const cursor = req.query.cursor;
            if (cursor !== undefined && (typeof cursor !== "string" ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor))) {
                res.status(400).json({ error: "Invalid cursor." });
                return;
            }
            const result = await executives.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    return router;
}
