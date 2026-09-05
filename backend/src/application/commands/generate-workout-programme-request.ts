import { GenerateWorkoutProgrammeCommand } from "./generate-workout-programme.command";

export class GenerateWorkoutProgrammeRequest {
    public readonly idempotencyKey: string;

    constructor(
        public readonly command: GenerateWorkoutProgrammeCommand,
        idempotencyKey: unknown,
    ) {
        if (!(command instanceof GenerateWorkoutProgrammeCommand)) {
            throw new Error("Programme generation command is required.");
        }

        if (typeof idempotencyKey !== "string") {
            throw new Error("Idempotency key is invalid.");
        }

        const normalized = idempotencyKey.trim();
        if (
            normalized.length < 1 ||
            normalized.length > 200 ||
            !/^[A-Za-z0-9._:-]+$/u.test(normalized)
        ) {
            throw new Error("Idempotency key is invalid.");
        }

        this.idempotencyKey = normalized;
        Object.freeze(this);
    }
}
