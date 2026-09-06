import { NutritionPlanGenerationInput } from "../ports/nutrition-plan-generator.port";

export class GenerateNutritionPlanCommand {
    public readonly tenantId: string;
    public readonly actorUserId: string;
    public readonly idempotencyKey: string;
    public readonly input: NutritionPlanGenerationInput;

    constructor(
        tenantId: string,
        actorUserId: string,
        idempotencyKey: string,
        input: NutritionPlanGenerationInput,
    ) {
        if (!tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!actorUserId?.trim()) {
            throw new Error("Actor user ID is required.");
        }

        const key = idempotencyKey?.trim();

        if (
            !key ||
            key.length > 200 ||
            !/^[A-Za-z0-9._:-]+$/u.test(key)
        ) {
            throw new Error("Idempotency key is invalid.");
        }

        if (!input || !input.athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        this.tenantId = tenantId.trim();
        this.actorUserId = actorUserId.trim();
        this.idempotencyKey = key;
        this.input = Object.freeze({
            ...input,
            athleteId: input.athleteId.trim(),
            dietaryPreferences: Object.freeze([
                ...(input.dietaryPreferences ?? []),
            ]),
            dietaryRestrictions: Object.freeze([
                ...(input.dietaryRestrictions ?? []),
            ]),
        });
        Object.freeze(this);
    }
}
