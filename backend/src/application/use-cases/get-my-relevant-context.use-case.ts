import { Result } from "../common/result";
import { RelevantContextDto } from "../dto/athlete/relevant-context.dto";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { NutritionPlanRepository } from "../../domain/repositories/nutrition-plan/nutrition-plan.repository";
import { ListRecentRecoveryTrackingUseCase } from "./list-recent-recovery-tracking.use-case";
import { GetMyAthletePerformanceBodyProfileUseCase } from "./get-my-athlete-performance-body-profile.use-case";

export interface GetMyRelevantContextQuery {
    userId: string;
    tenantId: string;
}

export class GetMyRelevantContextUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly recoveryUseCase: ListRecentRecoveryTrackingUseCase,
        private readonly nutritionPlanRepository: NutritionPlanRepository,
        private readonly bodyProfileUseCase: GetMyAthletePerformanceBodyProfileUseCase,
    ) {}

    async execute(
        input: Readonly<GetMyRelevantContextQuery>,
    ): Promise<Result<RelevantContextDto>> {
        try {
            const athlete = await this.athleteRepository.findByUserId(
                input.userId,
                input.tenantId,
            );

            if (!athlete) {
                return Result.failure("Athlete not found.");
            }

            const [bodyResult, recoveryResult, nutritionPlan] =
                await Promise.all([
                    this.bodyProfileUseCase.execute(input),
                    this.recoveryUseCase.execute({
                        tenantId: input.tenantId,
                        athleteId: athlete.id,
                        limit: 1,
                    }),
                    this.nutritionPlanRepository.findLatestForAthlete(
                        input.tenantId,
                        athlete.id,
                    ),
                ]);

            if (!bodyResult.isSuccess) {
                return Result.failure(
                    bodyResult.error ?? "Body context could not be loaded.",
                );
            }

            if (!recoveryResult.isSuccess) {
                return Result.failure(
                    recoveryResult.error ?? "Recovery context could not be loaded.",
                );
            }

            const latestRecovery =
                recoveryResult.value?.[0] ?? null;

            return Result.success({
                body: bodyResult.value,
                recovery: {
                    latest: latestRecovery
                        ? {
                            value: latestRecovery.value,
                            recordedAt:
                                latestRecovery.recordedAt.toISOString(),
                        }
                        : null,
                },
                nutrition: {
                    latest: nutritionPlan
                        ? {
                            ...(nutritionPlan.planSnapshot.goalClassification
                                ? {
                                    goalClassification:
                                        nutritionPlan.planSnapshot.goalClassification,
                                }
                                : {}),
                            macroTargets: {
                                caloriesKcal:
                                    nutritionPlan.planSnapshot.macroTargets.caloriesKcal,
                                proteinGrams:
                                    nutritionPlan.planSnapshot.macroTargets.proteinGrams,
                                carbohydrateGrams:
                                    nutritionPlan.planSnapshot.macroTargets.carbohydrateGrams,
                                fatGrams:
                                    nutritionPlan.planSnapshot.macroTargets.fatGrams,
                            },
                            hydrationGuidance: {
                                dailyWaterLitres:
                                    nutritionPlan.planSnapshot.hydrationGuidance.dailyWaterLitres,
                                unit:
                                    nutritionPlan.planSnapshot.hydrationGuidance.unit,
                            },
                            createdAt:
                                nutritionPlan.createdAt.toISOString(),
                        }
                        : null,
                },
            });
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Relevant athlete context could not be loaded.",
            );
        }
    }
}
