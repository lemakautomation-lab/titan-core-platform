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

        const now = new Date();

        return new Exercise(
            randomUUID(),
            tenantId,
            name,
            slug,
            description,
            movement,
            muscleGroups,
            equipment,
            trainingObjective,
            difficulty,
            trainingPhase,
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

        this.name = name;
        this.slug = slug;
        this.description = description;
        this.movement = movement;
        this.muscleGroups = muscleGroups;
        this.equipment = equipment;
        this.trainingObjective = trainingObjective;
        this.difficulty = difficulty;
        this.trainingPhase = trainingPhase;
        this.sportId = sportId;
        this.updatedAt = new Date();
    }

    activate(): void {

        this.status = RecordStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    deactivate(): void {

        this.status = RecordStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    suspend(): void {

        this.status = RecordStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    delete(): void {

        this.status = RecordStatus.DELETED;
        this.updatedAt = new Date();
    }

    isActive(): boolean {

        return this.status === RecordStatus.ACTIVE;
    }
}


