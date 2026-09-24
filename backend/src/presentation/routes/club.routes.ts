import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { ListClubExecutivesUseCase } from "../../application/use-cases/list-club-executives.use-case";
import { ListClubDirectorsUseCase } from "../../application/use-cases/list-club-directors.use-case";
import { ListClubCoachesUseCase } from "../../application/use-cases/list-club-coaches.use-case";
import { ListClubScientistsUseCase } from "../../application/use-cases/list-club-scientists.use-case";
import { ListClubConditioningUseCase } from "../../application/use-cases/list-club-conditioning.use-case";
import { ListClubNutritionUseCase } from "../../application/use-cases/list-club-nutrition.use-case";
import { ListClubRehabilitationUseCase } from "../../application/use-cases/list-club-rehabilitation.use-case";
import { ListDepartmentTeamsUseCase } from "../../application/use-cases/list-department-teams.use-case";

export function createClubRoutes(executives: ListClubExecutivesUseCase, directors: ListClubDirectorsUseCase, coaches: ListClubCoachesUseCase, scientists: ListClubScientistsUseCase, conditioning: ListClubConditioningUseCase, nutrition: ListClubNutritionUseCase, rehabilitation: ListClubRehabilitationUseCase, teams: ListDepartmentTeamsUseCase): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get(
        "/teams",
        requirePermission("club.teams.read"),
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
            const result = await teams.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/rehabilitation",
        requirePermission("club.rehabilitation.read"),
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
            const result = await rehabilitation.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/nutrition",
        requirePermission("club.nutrition.read"),
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
            const result = await nutrition.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/conditioning",
        requirePermission("club.conditioning.read"),
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
            const result = await conditioning.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/scientists",
        requirePermission("club.scientists.read"),
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
            const result = await scientists.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/coaches",
        requirePermission("club.coaches.read"),
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
            const result = await coaches.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
    router.get(
        "/directors",
        requirePermission("club.directors.read"),
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
            const result = await directors.execute(
                req.user.tenantId, req.user.userId, Number(rawLimit), cursor ?? null,
            );
            if (!result) {
                res.status(404).json({ error: "Club page not found." });
                return;
            }
            res.status(200).json(result);
        },
    );
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
