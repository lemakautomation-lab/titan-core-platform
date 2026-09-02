import { ProgrammeGenerationInput } from "../../domain/value-objects/programme-generation-input.value-object";

export class GenerateWorkoutProgrammeCommand {
    public readonly tenantId: string;
    public readonly actorUserId: string;

    constructor(
        tenantId: unknown,
        actorUserId: unknown,
        public readonly input: ProgrammeGenerationInput,
    ) {
        this.tenantId = GenerateWorkoutProgrammeCommand.requireAuthorityId(
            tenantId,
            "Tenant ID",
        );
        this.actorUserId = GenerateWorkoutProgrammeCommand.requireAuthorityId(
            actorUserId,
            "Actor user ID",
        );

        if (!(input instanceof ProgrammeGenerationInput)) {
            throw new Error("Programme generation input is required.");
        }

        Object.freeze(this);
    }

    private static requireAuthorityId(
        value: unknown,
        field: string,
    ): string {
        if (typeof value !== "string") {
            throw new Error(`${field} is required.`);
        }

        const normalized = value.trim();
        const semanticValue = normalized.toLocaleLowerCase("en-US");

        if (
            !normalized ||
            semanticValue === "undefined" ||
            semanticValue === "null"
        ) {
            throw new Error(`${field} is required.`);
        }

        return normalized;
    }
}
