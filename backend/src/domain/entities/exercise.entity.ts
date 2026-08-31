import { randomUUID } from "crypto";

import { RecordStatus } from "../enums/record-status.enum";

export class Exercise {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public name: string,

        public slug: string,

        public description: string | null,

        public movement: string,

        public muscleGroups: string[],

        public equipment: string[],

        public trainingObjective: string,

        public difficulty: string,

        public trainingPhase: string | null,

        public sportId: string | null,

        public status: RecordStatus,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(
        tenantId: string,
        name: string,
        slug: string,
        description: string | null,
        movement: string,
        muscleGroups: string[],
        equipment: string[],
        trainingObjective: string,
        difficulty: string,
        trainingPhase: string | null,
        sportId: string | null,
    ): Exercise {

        Exercise.validateRequiredText("name", name);
        Exercise.validateRequiredText("slug", slug);
        Exercise.validateRequiredText("movement", movement);
        Exercise.validateRequiredText(
            "trainingObjective",
            trainingObjective,
        );
        Exercise.validateRequiredText("difficulty", difficulty);

        Exercise.validateStringCollection(
            "muscleGroups",
            muscleGroups,
        );

        Exercise.validateStringCollection(
            "equipment",
            equipment,
        );

        const now = new Date();

        return new Exercise(
            randomUUID(),
            tenantId,
            name.trim(),
            slug.trim(),
            description?.trim() || null,
            movement.trim(),
            muscleGroups.map((value) => value.trim()),
            equipment.map((value) => value.trim()),
            trainingObjective.trim(),
            difficulty.trim(),
            trainingPhase?.trim() || null,
            sportId,
            RecordStatus.ACTIVE,
            now,
            now,
        );
    }

    updateDetails(
        name: string,
        slug: string,
        description: string | null,
        movement: string,
        muscleGroups: string[],
        equipment: string[],
        trainingObjective: string,
        difficulty: string,
        trainingPhase: string | null,
        sportId: string | null,
    ): void {

        this.ensureMutable();

        Exercise.validateRequiredText("name", name);
        Exercise.validateRequiredText("slug", slug);
        Exercise.validateRequiredText("movement", movement);
        Exercise.validateRequiredText(
            "trainingObjective",
            trainingObjective,
        );
        Exercise.validateRequiredText("difficulty", difficulty);

        Exercise.validateStringCollection(
            "muscleGroups",
            muscleGroups,
        );

        Exercise.validateStringCollection(
            "equipment",
            equipment,
        );

        this.name = name.trim();
        this.slug = slug.trim();
        this.description = description?.trim() || null;
        this.movement = movement.trim();
        this.muscleGroups = muscleGroups.map(
            (value) => value.trim(),
        );
        this.equipment = equipment.map(
            (value) => value.trim(),
        );
        this.trainingObjective = trainingObjective.trim();
        this.difficulty = difficulty.trim();
        this.trainingPhase = trainingPhase?.trim() || null;
        this.sportId = sportId;
        this.updatedAt = new Date();
    }

    activate(): void {

        this.ensureLifecycleMutable();

        this.status = RecordStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    deactivate(): void {

        this.ensureLifecycleMutable();

        this.status = RecordStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    suspend(): void {

        this.ensureLifecycleMutable();

        this.status = RecordStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    delete(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Exercise is already deleted.",
            );
        }

        this.status = RecordStatus.DELETED;
        this.updatedAt = new Date();
    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;
    }

    private ensureMutable(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted exercises cannot be modified.",
            );
        }
    }

    private ensureLifecycleMutable(): void {

        if (this.status === RecordStatus.DELETED) {
            throw new Error(
                "Deleted exercises cannot change lifecycle state.",
            );
        }
    }

    private static validateRequiredText(
        field: string,
        value: string,
    ): void {

        if (
            typeof value !== "string" ||
            value.trim().length === 0 ||
            value.trim().toLowerCase() === "undefined" ||
            value.trim().toLowerCase() === "null"
        ) {
            throw new Error(
                `${field} is required.`,
            );
        }
    }

    private static validateStringCollection(
        field: string,
        value: string[],
    ): void {

        if (!Array.isArray(value)) {
            throw new Error(
                `${field} must be an array.`,
            );
        }

        for (const item of value) {

            if (
                typeof item !== "string" ||
                item.trim().length === 0 ||
                item.trim().toLowerCase() === "undefined" ||
                item.trim().toLowerCase() === "null"
            ) {
                throw new Error(
                    `${field} must contain only non-empty text values.`
                );
            }
        }
    }
}
