import { rateLimit } from "express-rate-limit";
import { GuidanceUnavailableError } from "../../application/ai-athlete/performance-guidance";
import { GetMyAiAthleteGuidanceUseCase } from "../../application/use-cases/get-my-ai-athlete-guidance.use-case";
import { GetMyAiAthleteDataUseCase } from "../../application/use-cases/get-my-ai-athlete-data.use-case";
import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth.middleware";
import { GetMyAiAthleteContextUseCase } from "../../application/use-cases/get-my-ai-athlete-context.use-case";

export function createAiAthleteAssistantRoutes(context: GetMyAiAthleteContextUseCase, data: GetMyAiAthleteDataUseCase, guidance: GetMyAiAthleteGuidanceUseCase) {
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
    router.get("/data", async (req: AuthRequest, res: Response, next: NextFunction) => {
        res.set("Cache-Control", "no-store");
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        if (Object.keys(req.query).length) {
            return void res.status(400).json({ error: "Assistant scope is derived from the authenticated account." });
        }
        try {
            const result = await data.execute({ tenantId: req.user.tenantId, userId: req.user.userId });
            if (!result) return void res.status(404).json({ error: "Athlete not found." });
            res.status(200).json({ data: result });
        } catch (error) { next(error); }
    });
    const guidanceLimit = rateLimit({ windowMs: 60_000, limit: 3,
        standardHeaders: "draft-8", legacyHeaders: false,
        keyGenerator: (req: AuthRequest) => `${req.user?.tenantId}:${req.user?.userId}`,
    });
    router.post("/guidance", guidanceLimit, async (req: AuthRequest, res: Response, next: NextFunction) => {
        res.set("Cache-Control", "no-store");
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        const body: unknown = req.body;
        if (Object.keys(req.query).length || !body || typeof body !== "object" || Array.isArray(body)
            || Object.keys(body).join(",") !== "consent" || (body as { consent?: unknown }).consent !== true) {
            return void res.status(400).json({ error: "Explicit consent is required; scope and prompts cannot be supplied." });
        }
        try {
            const result = await guidance.execute({ tenantId: req.user.tenantId, userId: req.user.userId });
            if (!result) return void res.status(404).json({ error: "Athlete not found." });
            res.status(200).json({ data: result });
        } catch (error) {
            if (error instanceof GuidanceUnavailableError) {
                return void res.status(503).json({ error: "Performance guidance is temporarily unavailable." });
            }
            next(error);
        }
    });
    return router;
}
