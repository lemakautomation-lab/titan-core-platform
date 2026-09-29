import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth.middleware";
import { GetMyAiAthleteContextUseCase } from "../../application/use-cases/get-my-ai-athlete-context.use-case";

export function createAiAthleteAssistantRoutes(context: GetMyAiAthleteContextUseCase) {
    const router = Router();
    router.use(authMiddleware);
    router.get("/context", async (req: AuthRequest, res: Response, next: NextFunction) => {
        res.set("Cache-Control", "no-store");
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        if (Object.keys(req.query).length) {
            return void res.status(400).json({ error: "Assistant scope is derived from the authenticated account." });
        }
        try {
            const data = await context.execute({ tenantId: req.user.tenantId, userId: req.user.userId });
            if (!data) return void res.status(404).json({ error: "Athlete not found." });
            res.status(200).json({ data });
        } catch (error) { next(error); }
    });
    return router;
}
