import { rateLimit } from "express-rate-limit";
import {
    Router,
    Response,
    NextFunction,
} from "express";

import {
    CoachAiUnavailableError,
    type CoachAiQueryType,
    type CoachAiTargetType,
} from "../../application/ai-coach/coach-assistance";
import type { GetAiCoachContextUseCase } from "../../application/use-cases/get-ai-coach-context.use-case";
import type { GenerateCoachAiAssistanceUseCase } from "../../application/use-cases/generate-coach-ai-assistance.use-case";
import {
    authMiddleware,
    AuthRequest,
} from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function failureStatus(
    error: string | undefined,
): number {
    if (
        error === "Athlete not found." ||
        error === "Coach squad not found."
    ) {
        return 404;
    }

    if (
        error ===
            "Active Coach athlete relationship is required." ||
        error ===
            "Active Coach athlete relationships are required."
    ) {
        return 403;
    }

    return 400;
}

type QueryTask = Readonly<{
    queryType: CoachAiQueryType;
    targetType: CoachAiTargetType;
}>;

export function createAiCoachAssistantRoutes(
    context: GetAiCoachContextUseCase,
    assistance: GenerateCoachAiAssistanceUseCase,
): Router {
    const router = Router();

    router.use(authMiddleware);

    router.get(
        "/context",
        requirePermission("coach-athletes.read"),
        requirePermission("coach-squads.read"),
        requirePermission("coach-teams.read"),
        async (
            req: AuthRequest,
            res: Response,
            next: NextFunction,
        ) => {
            res.set("Cache-Control", "no-store");

            if (!req.user) {
                res.status(401).json({
                    error: "Unauthorized",
                });
                return;
            }

            if (
                Object.keys(req.query).length > 0
            ) {
                res.status(400).json({
                    error:
                        "Coach portfolio scope is derived from the authenticated account.",
                });
                return;
            }

            try {
                const result =
                    await context.execute({
                        tenantId:
                            req.user.tenantId,
                        userId:
                            req.user.userId,
                    });

                if (!result.isSuccess) {
                    res.status(
                        failureStatus(
                            result.error,
                        ),
                    ).json({
                        error: result.error,
                    });
                    return;
                }

                res.status(200).json({
                    data: result.value,
                });
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

    const handleTask = (
        task: QueryTask,
    ) => async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ) => {
        res.set("Cache-Control", "no-store");

        if (!req.user) {
            res.status(401).json({
                error: "Unauthorized",
            });
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
                error:
                    "An explicit data-transfer acknowledgement and an authorised Coach AI target are required.",
            });
            return;
        }

        const record =
            body as Record<string, unknown>;
        const keys =
            Object.keys(record)
                .sort()
                .join(",");
        const targetId =
            record.targetId;
        const acknowledgement =
            record.acknowledgement;

        if (
            keys !==
                "acknowledgement,targetId" ||
            typeof targetId !== "string" ||
            !isUuid(targetId) ||
            acknowledgement !== true
        ) {
            res.status(400).json({
                error:
                    "An explicit data-transfer acknowledgement and an authorised Coach AI target are required; prompts and scope overrides cannot be supplied.",
            });
            return;
        }

        const requestId = (
            req as AuthRequest & {
                requestId?: string;
            }
        ).requestId;

        if (!requestId) {
            next(
                new Error(
                    "Request correlation identifier missing.",
                ),
            );
            return;
        }

        try {
            const result =
                await assistance.execute({
                    tenantId:
                        req.user.tenantId,
                    userId:
                        req.user.userId,
                    targetId,
                    targetType:
                        task.targetType,
                    queryType:
                        task.queryType,
                    acknowledgement: true,
                    requestId,
                });

            if (!result.isSuccess) {
                res.status(
                    failureStatus(
                        result.error,
                    ),
                ).json({
                    error: result.error,
                });
                return;
            }

            res.status(200).json({
                data: result.value,
            });
        } catch (error) {
            if (
                error instanceof
                CoachAiUnavailableError
            ) {
                res.status(503).json({
                    error:
                        "Coach AI assistance is temporarily unavailable.",
                });
                return;
            }

            next(error);
        }
    };

    router.post(
        "/squad-intelligence",
        requirePermission("coach-squads.read"),
        requirePermission(
            "performance-measurements.read",
        ),
        queryLimit,
        handleTask({
            queryType:
                "SQUAD_INTELLIGENCE",
            targetType: "SQUAD",
        }),
    );

    router.post(
        "/training-support",
        requirePermission("coach-athletes.read"),
        requirePermission(
            "performance-measurements.read",
        ),
        requirePermission(
            "workout-programmes.create",
        ),
        queryLimit,
        handleTask({
            queryType:
                "TRAINING_SUPPORT",
            targetType: "ATHLETE",
        }),
    );

    router.post(
        "/performance-query",
        requirePermission("coach-athletes.read"),
        requirePermission(
            "performance-measurements.read",
        ),
        queryLimit,
        handleTask({
            queryType:
                "PERFORMANCE_QUERY",
            targetType: "ATHLETE",
        }),
    );

    return router;
}
