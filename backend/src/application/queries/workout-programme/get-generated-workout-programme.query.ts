const CANONICAL_UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export class GetGeneratedWorkoutProgrammeQuery {
    public readonly generationId: string;
    public readonly tenantId: string;

    constructor(
        generationId: unknown,
        tenantId: unknown,
    ) {
        this.generationId = this.requireGenerationId(generationId);
        this.tenantId = this.requireIdentifier(tenantId, "Tenant ID");
        Object.freeze(this);
    }

    private requireGenerationId(value: unknown): string {
        const generationId = this.requireIdentifier(value, "Generation ID")
            .toLocaleLowerCase("en-US");
        if (!CANONICAL_UUID.test(generationId)) {
            throw new Error("Generation ID is invalid.");
        }
        return generationId;
    }

    private requireIdentifier(value: unknown, field: string): string {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }
        const identifier = value.trim();
        const semantic = identifier.toLocaleLowerCase("en-US");
        if (semantic === "null" || semantic === "undefined") {
            throw new Error(`${field} is required.`);
        }
        return identifier;
    }
}
