import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { GetPerformanceProfessionalWorkflowUseCase } from "../../application/use-cases/get-performance-professional-workflow.use-case";
import { GetStrengthConditioningWorkflowUseCase } from "../../application/use-cases/get-strength-conditioning-workflow.use-case";
import { GetNutritionProfessionalWorkflowUseCase } from "../../application/use-cases/get-nutrition-professional-workflow.use-case";
import { GetRehabilitationProfessionalWorkflowUseCase } from "../../application/use-cases/get-rehabilitation-professional-workflow.use-case";
import { GeneratePerformanceProfessionalAiAssistanceUseCase } from "../../application/use-cases/generate-performance-professional-ai-assistance.use-case";
import { PerformanceProfessionalAiUnavailableError } from "../../application/ai-performance-professional/performance-professional-assistance";

export class PerformanceProfessionalController {
    constructor(
        private readonly getWorkflowUseCase:
            GetPerformanceProfessionalWorkflowUseCase,
        private readonly getStrengthConditioningWorkflowUseCase:
            GetStrengthConditioningWorkflowUseCase,
        private readonly getNutritionProfessionalWorkflowUseCase:
            GetNutritionProfessionalWorkflowUseCase,
        private readonly getRehabilitationProfessionalWorkflowUseCase:
            GetRehabilitationProfessionalWorkflowUseCase,
        private readonly generateAiAssistanceUseCase:
            GeneratePerformanceProfessionalAiAssistanceUseCase,
    ) {}

    async getAthleteWorkflow(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const rawLimit = req.query.limit;
        const limit =
            rawLimit === undefined
                ? 25
                : Number(rawLimit);

        const result = await this.getWorkflowUseCase.execute({
            tenantId: authUser.tenantId,
            userId: authUser.userId,
            athleteId: String(req.params.athleteId),
            limit,
        });

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async getStrengthConditioningWorkflow(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const rawLimit = req.query.limit;
        const limit =
            rawLimit === undefined
                ? 25
                : Number(rawLimit);

        const result =
            await this.getStrengthConditioningWorkflowUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                athleteId: String(req.params.athleteId),
                limit,
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async getNutritionProfessionalWorkflow(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.getNutritionProfessionalWorkflowUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                athleteId: String(req.params.athleteId),
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async generateAiAssistance(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        res.set("Cache-Control", "no-store");

        const authUser = req.user;

        if (!authUser) {
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
                    "Explicit AI data-transfer acknowledgement is required.",
            });
            return;
        }

        const record =
            body as Record<string, unknown>;

        const keys =
            Object.keys(record)
                .sort()
                .join(",");

        if (
            keys !== "acknowledgement" ||
            record.acknowledgement !== true
        ) {
            res.status(400).json({
                error:
                    "Explicit AI data-transfer acknowledgement is required; prompts and scope overrides are not accepted.",
            });
            return;
        }

        const requestId = (
            req as AuthRequest & {
                requestId?: string;
            }
        ).requestId;

        if (!requestId) {
            throw new Error(
                "Request correlation identifier missing.",
            );
        }

        try {
            const result =
                await this.generateAiAssistanceUseCase.execute({
                    tenantId: authUser.tenantId,
                    userId: authUser.userId,
                    athleteId:
                        String(req.params.athleteId),
                    acknowledgement: true,
                    requestId,
                });

            if (!result.isSuccess) {
                const status =
                    result.error ===
                    "Athlete not found."
                        ? 404
                        : 400;

                res.status(status).json({
                    error: result.error,
                });
                return;
            }

            res.status(200).json({
                data: result.value,
            });
        }
        catch (error) {
            if (
                error instanceof
                PerformanceProfessionalAiUnavailableError
            ) {
                res.status(503).json({
                    error:
                        "Performance Professional AI assistance is temporarily unavailable.",
                });
                return;
            }

            throw error;
        }
    }

    async getRehabilitationProfessionalWorkflow(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const rawLimit = req.query.limit;
        const limit =
            rawLimit === undefined
                ? 25
                : Number(rawLimit);

        const result =
            await this.getRehabilitationProfessionalWorkflowUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                athleteId: String(req.params.athleteId),
                limit,
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }
}
