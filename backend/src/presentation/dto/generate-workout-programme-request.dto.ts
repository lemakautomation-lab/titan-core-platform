import { GenerateWorkoutProgrammeCommand } from "../../application/commands/generate-workout-programme.command";
import { GenerateWorkoutProgrammeRequest } from "../../application/commands/generate-workout-programme-request";
import { ProgrammeGenerationGoal } from "../../domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../domain/value-objects/programme-generation-input.value-object";
import { HttpException } from "../../shared/exceptions/http.exception";

const ALLOWED_FIELDS = new Set([
    "athleteId",
    "goalClassification",
    "trainingExperience",
    "sportId",
    "availableEquipment",
    "trainingFrequency",
    "sessionDurationMinutes",
]);

export class GenerateWorkoutProgrammeRequestDto {
    static toApplicationRequest(
        body: unknown,
        idempotencyHeader: unknown,
        tenantId: string,
        actorUserId: string,
    ): GenerateWorkoutProgrammeRequest {
        try {
            if (
                body === null ||
                typeof body !== "object" ||
                Array.isArray(body) ||
                Object.getPrototypeOf(body) !== Object.prototype
            ) {
                throw new Error("Request body must be an object.");
            }

            const values = body as Record<string, unknown>;
            const unknownFields = Object.keys(values)
                .filter(field => !ALLOWED_FIELDS.has(field));
            if (unknownFields.length > 0) {
                throw new Error("Request body contains unsupported fields.");
            }

            if (typeof idempotencyHeader !== "string") {
                throw new Error("Idempotency key is invalid.");
            }

            const goal = ProgrammeGenerationGoal.create(
                values.goalClassification,
            );
            const input = ProgrammeGenerationInput.create({
                athleteId: values.athleteId,
                goal,
                trainingExperience: values.trainingExperience,
                sportId: values.sportId,
                availableEquipment: values.availableEquipment,
                trainingFrequency: values.trainingFrequency,
                sessionDurationMinutes: values.sessionDurationMinutes,
            });
            const command = new GenerateWorkoutProgrammeCommand(
                tenantId,
                actorUserId,
                input,
            );

            return new GenerateWorkoutProgrammeRequest(
                command,
                idempotencyHeader,
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                error instanceof Error ? error.message : "Validation failed.",
                400,
                "VALIDATION_ERROR",
            );
        }
    }
}
