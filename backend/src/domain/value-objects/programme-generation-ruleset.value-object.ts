export class ProgrammeGenerationRuleset {
    static readonly V1_ID = "TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION";
    static readonly V1_VERSION = "1.0.0";

    private constructor(
        public readonly id: string,
        public readonly version: string,
    ) {
        Object.freeze(this);
    }

    static v1(): ProgrammeGenerationRuleset {
        return new ProgrammeGenerationRuleset(
            this.V1_ID,
            this.V1_VERSION,
        );
    }

    static create(
        id: unknown,
        version: unknown,
    ): ProgrammeGenerationRuleset {
        if (id !== this.V1_ID || version !== this.V1_VERSION) {
            throw new Error("Unsupported generation ruleset.");
        }

        return this.v1();
    }
}
