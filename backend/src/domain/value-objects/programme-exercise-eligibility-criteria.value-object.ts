import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";
import { ProgrammeGenerationGoal } from "./programme-generation-goal.value-object";

export class ProgrammeExerciseEligibilityCriteria {
    private readonly equipment: readonly string[];

    private constructor(
        public readonly tenantId: string,
        public readonly goal: ProgrammeGenerationGoal,
        public readonly trainingExperience: TrainingExperienceLevel,
        public readonly sportId: string | null,
        availableEquipment: readonly string[],
    ) {
        this.equipment = Object.freeze([...availableEquipment]);
        Object.freeze(this);
    }

    static create(
        tenantId: unknown,
        goal: unknown,
        trainingExperience: unknown,
        sportId: unknown,
        availableEquipment: unknown,
    ): ProgrammeExerciseEligibilityCriteria {
        const normalizedTenantId = this.requireIdentifier(
            tenantId,
            "Tenant ID",
        );

        if (!(goal instanceof ProgrammeGenerationGoal)) {
            throw new Error("Programme generation goal is required.");
        }

        if (
            typeof trainingExperience !== "string" ||
            !Object.values(TrainingExperienceLevel).includes(
                trainingExperience as TrainingExperienceLevel,
            )
        ) {
            throw new Error("Training experience level is invalid.");
        }

        const normalizedSportId = this.optionalIdentifier(sportId);
        const normalizedEquipment = this.normalizeEquipment(
            availableEquipment,
        );

        return new ProgrammeExerciseEligibilityCriteria(
            normalizedTenantId,
            goal,
            trainingExperience as TrainingExperienceLevel,
            normalizedSportId,
            normalizedEquipment,
        );
    }

    get availableEquipment(): readonly string[] {
        return Object.freeze([...this.equipment]);
    }

    private static requireIdentifier(value: unknown, field: string): string {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }

        const normalized = value.trim();
        const semantic = normalized.toLocaleLowerCase("en-US");

        if (semantic === "null" || semantic === "undefined") {
            throw new Error(`${field} is required.`);
        }

        return normalized;
    }

    private static optionalIdentifier(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value !== "string") {
            throw new Error("Sport ID is invalid.");
        }

        if (!value.trim()) {
            return null;
        }

        const normalized = value.trim();
        const semantic = normalized.toLocaleLowerCase("en-US");

        if (semantic === "null" || semantic === "undefined") {
            throw new Error("Sport ID is invalid.");
        }

        return normalized;
    }

    private static normalizeEquipment(value: unknown): readonly string[] {
        if (!Array.isArray(value)) {
            throw new Error("Available equipment must be an array.");
        }

        const normalized = value.map(item => {
            if (typeof item !== "string") {
                throw new Error("Available equipment is invalid.");
            }

            const equipment = item
                .normalize("NFKC")
                .trim()
                .replace(/\s+/gu, " ")
                .toLocaleLowerCase("en-US");

            if (
                !equipment ||
                equipment === "null" ||
                equipment === "undefined"
            ) {
                throw new Error("Available equipment is invalid.");
            }

            return equipment;
        });

        return Object.freeze([...new Set(normalized)].sort());
    }
}
