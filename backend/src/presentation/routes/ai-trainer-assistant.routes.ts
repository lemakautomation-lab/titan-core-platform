import { rateLimit } from "express-rate-limit";
import {
    Router,
    Response,
    NextFunction,
} from "express";

import {
    TrainerAiUnavailableError,
    type TrainerAiQueryType,
} from "../../application/ai-trainer/trainer-assistance";
import type { GetAiTrainerPortfolioContextUseCase } from "../../application/use-cases/get-ai-trainer-portfolio-context.use-case";
import type { GenerateTrainerAiAssistanceUseCase } from "../../application/use-cases/generate-trainer-ai-assistance.use-case";
import {
    authMiddleware,
    AuthRequest,
} from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

const queryTypes = new Set<TrainerAiQueryType>([
    "ADHERENCE",
    "PERFORMANCE_TRENDS",
    "PROGRAMME_PROPOSAL",
    "PROGRESS_REPORT",
]);

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function failureStatus(error: string | undefined): number {
    if (error === "Athlete not found.") {
        return 404;
    }

    if (
        error === "Active Trainer access is required." ||
        error === "Active Trainer client relationship is required."
    ) {
        return 403;
    }

    return 400;
}

export function createAiTrainerAssistantRoutes(
    context: GetAiTrainerPortfolioContextUseCase,
    assistance: GenerateTrainerAiAssistanceUseCase,
): Router {
    const router = Router();

    router.use(authMiddleware);

    router.get(
        "/context",
        requirePermission("workout-programmes.read"),
        async (
            req: AuthRequest,
            res: Response,
            next: NextFunction,
        ) => {
            res.set("Cache-Control", "no-store");

            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            if (Object.keys(req.query).length > 0) {
                res.status(400).json({
                    error: "Trainer portfolio scope is derived from the authenticated account.",
                });
                return;
            }

            try {
                const result = await context.execute({
                    tenantId: req.user.tenantId,
                    userId: req.user.userId,
                });

                if (!result.isSuccess) {
                    res.status(failureStatus(result.error)).json({
                        error: result.error,
                    });
                    return;
                }

                res.status(200).json({ data: result.value });
            } catch (error) {
                next(error);
            }
        },
    );

    const queryLimit = rateLimit({
        windowMs: 60_000,
        limit: 3,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        keyGenerator: (req: AuthRequest) =>
            `${req.user?.tenantId}:${req.user?.userId}`,
    });

    router.post(
        "/query",
        requirePermission("workout-programmes.read"),
        queryLimit,
        async (
            req: AuthRequest,
            res: Response,
            next: NextFunction,
        ) => {
            res.set("Cache-Control", "no-store");

            if (!req.user) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const body: unknown = req.body;

            if (
                Object.keys(req.query).length > 0 ||
                !body ||
                typeof body !== "object" ||
                Array.isArray(body)
            ) {
                res.status(400).json({
                    error: "An explicit data-transfer acknowledgement, an authorised client and a supported Trainer AI task are required.",
                });
                return;
            }

            const record = body as Record<string, unknown>;
            const keys = Object.keys(record).sort().join(",");
            const athleteId = record.athleteId;
            const queryType = record.queryType;
            const acknowledgement = record.acknowledgement;

            if (
                keys !== "acknowledgement,athleteId,queryType" ||
                typeof athleteId !== "string" ||
                !isUuid(athleteId) ||
                typeof queryType !== "string" ||
                !queryTypes.has(queryType as TrainerAiQueryType) ||
                acknowledgement !== true
            ) {
                res.status(400).json({
                    error: "An explicit data-transfer acknowledgement, an authorised client and a supported Trainer AI task are required; prompts and scope overrides cannot be supplied.",
                });
                return;
            }

            const requestId = (
                req as AuthRequest & { requestId?: string }
            ).requestId;

            if (!requestId) {
                next(new Error("Request correlation identifier missing."));
                return;
            }

            try {
                const result = await assistance.execute({
                    tenantId: req.user.tenantId,
                    userId: req.user.userId,
                    athleteId,
                    queryType: queryType as TrainerAiQueryType,
                    acknowledgement: true,
                    requestId,
                });

                if (!result.isSuccess) {
                    res.status(failureStatus(result.error)).json({
                        error: result.error,
                    });
                    return;
                }

                res.status(200).json({ data: result.value });
            } catch (error) {
                if (error instanceof TrainerAiUnavailableError) {
                    res.status(503).json({
                        error: "Trainer AI assistance is temporarily unavailable.",
                    });
                    return;
                }

                next(error);
            }
        },
    );

    return router;
}
