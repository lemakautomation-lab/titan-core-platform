import { Prisma } from "../../generated/prisma/client";
import { NutritionPlan } from "../../domain/entities/nutrition-plan/nutrition-plan.entity";

export class NutritionPlanMapper {
    static toPersistence(plan: NutritionPlan) {
        return {
            id: plan.id,
            tenantId: plan.tenantId,
            athleteId: plan.athleteId,
            idempotencyKey: plan.idempotencyKey,
            requestFingerprint: plan.requestFingerprint,
            requestFingerprintVersion: plan.requestFingerprintVersion,
            generatorId: plan.generatorId,
            generatorVersion: plan.generatorVersion,
            inputSnapshot:
                plan.inputSnapshot as unknown as Prisma.InputJsonValue,
            planSnapshot:
                plan.planSnapshot as unknown as Prisma.InputJsonValue,
            createdAt: plan.createdAt,
        };
    }

    static toDomain(row: {
        id: string;
        tenantId: string;
        athleteId: string;
        idempotencyKey: string;
        requestFingerprint: string;
        requestFingerprintVersion: string;
        generatorId: string;
        generatorVersion: string;
        inputSnapshot: unknown;
        planSnapshot: unknown;
        createdAt: Date;
    }): NutritionPlan {
        const snapshot = row.planSnapshot as {
            planType: "AUTOMATED_NUTRITION_PLAN";
            guidance: string[];
        };

        return new NutritionPlan(
            row.id,
            row.tenantId,
            row.athleteId,
            row.idempotencyKey,
            row.requestFingerprint,
            row.requestFingerprintVersion as "1",
            row.generatorId,
            row.generatorVersion,
            row.inputSnapshot as Record<string, unknown>,
            {
                planType: snapshot.planType,
                guidance: Object.freeze([
                    ...(snapshot.guidance ?? []),
                ]),
            },
            row.createdAt,
        );
    }
}
