import { NutritionPlan } from "../../domain/entities/nutrition-plan/nutrition-plan.entity";

export interface NutritionPlanGenerationTransactionInput {
    readonly tenantId: string;
    readonly actorUserId: string;
    readonly idempotencyKey: string;
    readonly requestFingerprint: string;
    readonly requestFingerprintVersion: "1";
    readonly plan: NutritionPlan;
}

export interface NutritionPlanGenerationTransactionOutcome {
    readonly status: "created" | "replayed";
    readonly plan: NutritionPlan;
}

export interface NutritionPlanGenerationTransaction {
    execute(
        input: NutritionPlanGenerationTransactionInput,
    ): Promise<NutritionPlanGenerationTransactionOutcome>;
}
