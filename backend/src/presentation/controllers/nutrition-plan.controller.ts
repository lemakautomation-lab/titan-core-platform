import { Response, NextFunction } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";
import { GenerateNutritionPlanRequestDto } from "../dto/generate-nutrition-plan-request.dto";
import { GenerateNutritionPlanUseCase } from "../../application/use-cases/generate-nutrition-plan.use-case";
import { NutritionPlanGenerationHttpErrorMapper } from "../errors/nutrition-plan-generation-http-error.mapper";

export class NutritionPlanController {
    constructor(
        private readonly generateNutritionPlanUseCase: GenerateNutritionPlanUseCase,
    ) {}

    async generate(
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        try {
            const command =
                GenerateNutritionPlanRequestDto.toCommand(
                    req.body,
                    req.headers["idempotency-key"],
                    authUser.tenantId,
                    authUser.userId,
                );

            const outcome =
                await this.generateNutritionPlanUseCase.execute(
                    command,
                );

            res.status(
                outcome.status === "created"
                    ? 201
                    : 200,
            ).json(outcome.plan);
        } catch (error) {
            next(
                NutritionPlanGenerationHttpErrorMapper.map(error) ??
                error,
            );
        }
    }
}
