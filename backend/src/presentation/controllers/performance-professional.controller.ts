import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { GetPerformanceProfessionalWorkflowUseCase } from "../../application/use-cases/get-performance-professional-workflow.use-case";
import { GetStrengthConditioningWorkflowUseCase } from "../../application/use-cases/get-strength-conditioning-workflow.use-case";

export class PerformanceProfessionalController {
    constructor(
        private readonly getWorkflowUseCase:
            GetPerformanceProfessionalWorkflowUseCase,
        private readonly getStrengthConditioningWorkflowUseCase:
            GetStrengthConditioningWorkflowUseCase,
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
}
