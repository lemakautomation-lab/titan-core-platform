import { createHash } from "crypto";

import { GenerateNutritionPlanCommand } from "../commands/generate-nutrition-plan.command";
import { classifyNutritionGoal } from "./nutrition-goal-policy.service";

export interface NutritionPlanGenerationFingerprint {
    readonly fingerprint: string;
    readonly fingerprintVersion: "1";
    readonly canonicalJson: string;
    readonly snapshot: Record<string, unknown>;
}

export class NutritionPlanGenerationFingerprintService {
    static readonly FINGERPRINT_VERSION = "1" as const;

    static request(
        command: GenerateNutritionPlanCommand,
    ): NutritionPlanGenerationFingerprint {
        if (!(command instanceof GenerateNutritionPlanCommand)) {
            throw new Error("Nutrition plan generation command is required.");
        }

        const goalClassification = classifyNutritionGoal(
            command.input.goal,
        );

        const snapshot = {
            fingerprintVersion: this.FINGERPRINT_VERSION,
            tenantId: command.tenantId,
            actorUserId: command.actorUserId,
            athleteId: command.input.athleteId,
            ...(goalClassification
                ? { goalClassification }
                : { goal: command.input.goal ?? null }),
            dietaryPreferences: [...(command.input.dietaryPreferences ?? [])],
            dietaryRestrictions: [...(command.input.dietaryRestrictions ?? [])],
            notes: command.input.notes ?? null,
        };

        const canonicalJson = JSON.stringify(snapshot);
        const fingerprint = createHash("sha256")
            .update(canonicalJson, "utf8")
            .digest("hex");

        return Object.freeze({
            fingerprint,
            fingerprintVersion: this.FINGERPRINT_VERSION,
            canonicalJson,
            snapshot: Object.freeze(snapshot),
        });
    }
}
