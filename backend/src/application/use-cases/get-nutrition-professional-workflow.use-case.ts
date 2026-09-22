import { Result } from "../common/result";
import { GetNutritionProfessionalWorkflowQuery } from "../queries/performance-professional/get-nutrition-professional-workflow.query";
import { NutritionProfessionalWorkflowDto } from "../dto/performance-professional/nutrition-professional-workflow.dto";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { NutritionPlanRepository } from "../../domain/repositories/nutrition-plan/nutrition-plan.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetNutritionProfessionalWorkflowUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly nutritionPlanRepository: NutritionPlanRepository,
    ) {}

    async execute(
        query: Readonly<GetNutritionProfessionalWorkflowQuery>,
    ): Promise<Result<NutritionProfessionalWorkflowDto>> {
        const athlete = await this.athleteRepository.findById(
            query.athleteId,
            query.tenantId,
        );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                query.athleteId,
                query.userId,
                AthleteRelationshipType.PERFORMANCE_PROFESSIONAL,
                query.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Performance Professional athlete relationship is required.",
            );
        }

        const plan =
            await this.nutritionPlanRepository.findLatestForAthlete(
                query.tenantId,
                query.athleteId,
            );

        return Result.success({
            athleteId: query.athleteId,
            latestNutritionPlan: plan
                ? {
                    id: plan.id,
                    athleteId: plan.athleteId,
                    generatorId: plan.generatorId,
                    generatorVersion: plan.generatorVersion,
                    planSnapshot: plan.planSnapshot,
                    createdAt: plan.createdAt.toISOString(),
                }
                : null,
        });
    }
}
