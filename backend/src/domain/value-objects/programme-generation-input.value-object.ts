import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";
import { ProgrammeGenerationGoal } from "./programme-generation-goal.value-object";

export interface ProgrammeGenerationInputProperties {
    athleteId: unknown;
    goal: unknown;
    trainingExperience: unknown;
    sportId?: unknown;
    availableEquipment: unknown;
    trainingFrequency: unknown;
    sessionDurationMinutes: unknown;
}

export interface ProgrammeGenerationInputSnapshot {
    readonly athleteId: string;
    readonly goalClassification: string;
    readonly trainingExperience: TrainingExperienceLevel;
    readonly sportId: string | null;
    readonly availableEquipment: readonly string[];
    readonly trainingFrequency: number;
    readonly sessionDurationMinutes: number;
}

export class ProgrammeGenerationInput {
    private readonly equipment: readonly string[];

    private constructor(
        public readonly athleteId: string,
        public readonly goal: ProgrammeGenerationGoal,
        public readonly trainingExperience: TrainingExperienceLevel,
        public readonly sportId: string | null,
        availableEquipment: readonly string[],
        public readonly trainingFrequency: number,
        public readonly sessionDurationMinutes: number,
    ) {
        this.equipment = Object.freeze([
            ...availableEquipment,
        ]);
        Object.freeze(this);
    }

    static create(
        properties: ProgrammeGenerationInputProperties,
    ): ProgrammeGenerationInput {
        const athleteId = this.normalizeRequiredIdentifier(
            properties.athleteId,
            "Athlete ID",
        );

        if (!(properties.goal instanceof ProgrammeGenerationGoal)) {
            throw new Error("Programme generation goal is required.");
        }

        if (
            typeof properties.trainingExperience !== "string" ||
            !Object.values(TrainingExperienceLevel).includes(
                properties.trainingExperience as TrainingExperienceLevel,
            )
        ) {
            throw new Error("Training experience level is invalid.");
        }

        const sportId = this.normalizeOptionalIdentifier(
            properties.sportId,
            "Sport ID",
        );
        const availableEquipment = this.normalizeEquipment(
            properties.availableEquipment,
        );
        const trainingFrequency = this.requirePositiveInteger(
            properties.trainingFrequency,
            "Training frequency",
        );
        const sessionDurationMinutes = this.requirePositiveInteger(
            properties.sessionDurationMinutes,
            "Session duration",
        );

        return new ProgrammeGenerationInput(
            athleteId,
            properties.goal,
            properties.trainingExperience as TrainingExperienceLevel,
            sportId,
            availableEquipment,
            trainingFrequency,
            sessionDurationMinutes,
        );
    }

    get availableEquipment(): readonly string[] {
        return Object.freeze([...this.equipment]);
    }

    toSnapshot(): ProgrammeGenerationInputSnapshot {
        return Object.freeze({
            athleteId: this.athleteId,
            goalClassification: this.goal.classification,
            trainingExperience: this.trainingExperience,
            sportId: this.sportId,
            availableEquipment: Object.freeze([
                ...this.equipment,
            ]),
            trainingFrequency: this.trainingFrequency,
            sessionDurationMinutes: this.sessionDurationMinutes,
        });
    }

    private static normalizeRequiredIdentifier(
        value: unknown,
        field: string,
    ): string {
        if (typeof value !== "string") {
            throw new Error(`${field} is required.`);
        }

        const normalized = value.trim();

        if (
            !normalized ||
            this.isSemanticGarbage(normalized)
        ) {
            throw new Error(`${field} is required.`);
        }

        return normalized;
    }

    private static normalizeOptionalIdentifier(
        value: unknown,
        field: string,
    ): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value !== "string") {
            throw new Error(`${field} is invalid.`);
        }

        const normalized = value.trim();

        if (!normalized) {
            return null;
        }

        if (this.isSemanticGarbage(normalized)) {
            throw new Error(`${field} is invalid.`);
        }

        return normalized;
    }

    private static normalizeEquipment(
        value: unknown,
    ): readonly string[] {
        if (!Array.isArray(value)) {
            throw new Error("Available equipment must be an array.");
        }

        const equipment = value.map((entry) => {
            if (typeof entry !== "string") {
                throw new Error(
                    "Available equipment must contain only text values.",
                );
            }

            const normalized = entry
                .trim()
                .normalize("NFKC")
                .toLocaleLowerCase("en-US");

            if (
                !normalized ||
                this.isSemanticGarbage(normalized)
            ) {
                throw new Error(
                    "Available equipment must contain only valid text values.",
                );
            }

            return normalized;
        });

        return Object.freeze(
            [...new Set(equipment)].sort(),
        );
    }

    private static requirePositiveInteger(
        value: unknown,
        field: string,
    ): number {
        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            !Number.isInteger(value) ||
            value <= 0
        ) {
            throw new Error(
                `${field} must be a finite positive integer.`,
            );
        }

        return value;
    }

    private static isSemanticGarbage(
        value: string,
    ): boolean {
        const normalized = value.toLocaleLowerCase("en-US");
        return normalized === "undefined" || normalized === "null";
    }
}
