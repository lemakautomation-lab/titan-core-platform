import { NutritionPlanGenerationInput } from "../../application/ports/nutrition-plan-generator.port";
import { GenerateNutritionPlanCommand } from "../../application/commands/generate-nutrition-plan.command";
import { HttpException } from "../../shared/exceptions/http.exception";

const ALLOWED_FIELDS = new Set([
    "athleteId",
    "goal",
    "dietaryPreferences",
    "dietaryRestrictions",
    "notes",
]);

export class GenerateNutritionPlanRequestDto {
    static toCommand(
        body: unknown,
        idempotencyHeader: unknown,
        tenantId: string,
        actorUserId: string,
    ): GenerateNutritionPlanCommand {
        try {
            if (
                body === null ||
                typeof body !== "object" ||
                Array.isArray(body) ||
                Object.getPrototypeOf(body) !== Object.prototype
            ) {
                throw new Error("Request body must be an object.");
            }

            if (typeof idempotencyHeader !== "string") {
                throw new Error("Idempotency key is invalid.");
            }

            const values = body as Record<string, unknown>;

            const unknownFields = Object.keys(values)
                .filter(field => !ALLOWED_FIELDS.has(field));

            if (unknownFields.length > 0) {
                throw new Error(
                    "Request body contains unsupported fields.",
                );
            }

            if (
                typeof values.athleteId !== "string" ||
                !values.athleteId.trim()
            ) {
                throw new Error("Athlete ID is required.");
            }

            if (
                values.goal !== undefined &&
                values.goal !== null &&
                typeof values.goal !== "string"
            ) {
                throw new Error("Goal must be a string.");
            }

            if (
                values.notes !== undefined &&
                values.notes !== null &&
                typeof values.notes !== "string"
            ) {
                throw new Error("Notes must be a string.");
            }

            const dietaryPreferences =
                GenerateNutritionPlanRequestDto.parseStringArray(
                    values.dietaryPreferences,
                    "Dietary preferences",
                );

            const dietaryRestrictions =
                GenerateNutritionPlanRequestDto.parseStringArray(
                    values.dietaryRestrictions,
                    "Dietary restrictions",
                );

            const input: NutritionPlanGenerationInput = {
                athleteId: values.athleteId.trim(),
                goal:
                    typeof values.goal === "string"
                        ? values.goal.trim()
                        : undefined,
                dietaryPreferences,
                dietaryRestrictions,
                notes:
                    typeof values.notes === "string"
                        ? values.notes.trim()
                        : undefined,
            };

            return new GenerateNutritionPlanCommand(
                tenantId,
                actorUserId,
                idempotencyHeader,
                input,
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                error instanceof Error
                    ? error.message
                    : "Validation failed.",
                400,
                "VALIDATION_ERROR",
            );
        }
    }

    private static parseStringArray(
        value: unknown,
        fieldName: string,
    ): readonly string[] | undefined {
        if (value === undefined || value === null) {
            return undefined;
        }

        if (
            !Array.isArray(value) ||
            value.some(
                item =>
                    typeof item !== "string" ||
                    !item.trim(),
            )
        ) {
            throw new Error(
                `${fieldName} must be an array of non-empty strings.`,
            );
        }

        return value.map(item => item.trim());
    }
}
