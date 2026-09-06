import { randomUUID } from "crypto";

export interface NutritionPlanSnapshot {
    readonly planType: "AUTOMATED_NUTRITION_PLAN";
    readonly guidance: readonly string[];
}

export class NutritionPlan {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly idempotencyKey: string,
        public readonly requestFingerprint: string,
        public readonly requestFingerprintVersion: "1",
        public readonly generatorId: string,
        public readonly generatorVersion: string,
        public readonly inputSnapshot: Record<string, unknown>,
        public readonly planSnapshot: NutritionPlanSnapshot,
        public readonly createdAt: Date,
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        idempotencyKey: string,
        requestFingerprint: string,
        requestFingerprintVersion: "1",
        generatorId: string,
        generatorVersion: string,
        inputSnapshot: Record<string, unknown>,
        planSnapshot: NutritionPlanSnapshot,
    ): NutritionPlan {
        if (!tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        if (!idempotencyKey?.trim()) {
            throw new Error("Idempotency key is required.");
        }

        if (!requestFingerprint?.trim()) {
            throw new Error("Request fingerprint is required.");
        }

        if (requestFingerprintVersion !== "1") {
            throw new Error("Request fingerprint version is invalid.");
        }

        if (!generatorId?.trim()) {
            throw new Error("Nutrition generator ID is required.");
        }

        if (!generatorVersion?.trim()) {
            throw new Error("Nutrition generator version is required.");
        }

        if (
            !planSnapshot ||
            planSnapshot.planType !== "AUTOMATED_NUTRITION_PLAN"
        ) {
            throw new Error("Automated nutrition plan output is invalid.");
        }

        return new NutritionPlan(
            randomUUID(),
            tenantId.trim(),
            athleteId.trim(),
            idempotencyKey.trim(),
            requestFingerprint.trim(),
            requestFingerprintVersion,
            generatorId.trim(),
            generatorVersion.trim(),
            Object.freeze({ ...inputSnapshot }),
            Object.freeze({
                planType: planSnapshot.planType,
                guidance: Object.freeze([...planSnapshot.guidance]),
            }),
            new Date(),
        );
    }
}
