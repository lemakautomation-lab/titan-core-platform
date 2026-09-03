import { randomUUID } from "crypto";

import { describe, expect, it, vi } from "vitest";

import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaExercisePrescriptionProfileRepository } from "../../src/infrastructure/repositories/exercise-prescription-profile.repository";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function setup() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const exercise = await testPrisma.exercise.create({
        data: {
            tenantId: owner.tenant.id,
            name: `Profile Exercise ${randomUUID()}`,
            slug: `profile-exercise-${randomUUID()}`,
            movement: "Push",
            muscleGroups: ["Chest"],
            equipment: ["Barbell"],
            trainingObjective: "Strength",
            difficulty: "Beginner",
        },
    });
    const repository = new PrismaExercisePrescriptionProfileRepository(
        new DatabaseService(),
    );

    return { owner, other, exercise, repository };
}

function profile(
    tenantId: string,
    exerciseId: string,
    overrides: Record<string, unknown> = {},
) {
    return ExercisePrescriptionProfile.create({
        tenantId,
        exerciseId,
        goalClassification: ProgrammeGoalClassification.STRENGTH,
        trainingExperience: TrainingExperienceLevel.BEGINNER,
        version: 1,
        prescriptionMode: ExercisePrescriptionMode.REPETITIONS,
        defaultSets: 3,
        defaultRepetitions: 8,
        defaultDurationSeconds: null,
        defaultRestSeconds: 60,
        estimatedSetDurationSeconds: 30,
        ...overrides,
    });
}

describe("Exercise Prescription Profile persistence", () => {
    it("leaves existing Exercises prescription-unready", async () => {
        const data = await setup();

        expect(await data.repository.findActiveExact(
            data.owner.tenant.id,
            data.exercise.id,
            ProgrammeGoalClassification.STRENGTH,
            TrainingExperienceLevel.BEGINNER,
        )).toBeNull();
    });

    it("persists and retrieves an immutable tenant-scoped profile", async () => {
        const data = await setup();
        const expected = profile(data.owner.tenant.id, data.exercise.id);
        const created = await data.repository.create(expected);

        expect(created).toMatchObject({
            id: expected.id,
            tenantId: expected.tenantId,
            exerciseId: expected.exerciseId,
            goalClassification: expected.goalClassification,
            trainingExperience: expected.trainingExperience,
            version: expected.version,
            prescriptionMode: expected.prescriptionMode,
            defaultSets: expected.defaultSets,
            defaultRepetitions: expected.defaultRepetitions,
            defaultDurationSeconds: expected.defaultDurationSeconds,
            defaultRestSeconds: expected.defaultRestSeconds,
            estimatedSetDurationSeconds:
                expected.estimatedSetDurationSeconds,
            status: expected.status,
        });
        expect(await data.repository.findById(
            created.id,
            data.owner.tenant.id,
        )).toEqual(created);
        expect(await data.repository.findById(
            created.id,
            data.other.tenant.id,
        )).toBeNull();
    });

    it("returns only the ACTIVE exact Goal and experience profile", async () => {
        const data = await setup();
        await data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
        ));
        const active = await data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
            { version: 2, status: RecordStatus.ACTIVE },
        ));

        expect(await data.repository.findActiveExact(
            data.owner.tenant.id,
            data.exercise.id,
            ProgrammeGoalClassification.STRENGTH,
            TrainingExperienceLevel.BEGINNER,
        )).toEqual(active);
        expect(await data.repository.findActiveExact(
            data.owner.tenant.id,
            data.exercise.id,
            ProgrammeGoalClassification.POWER,
            TrainingExperienceLevel.BEGINNER,
        )).toBeNull();
        expect(await data.repository.findActiveExact(
            data.other.tenant.id,
            data.exercise.id,
            ProgrammeGoalClassification.STRENGTH,
            TrainingExperienceLevel.BEGINNER,
        )).toBeNull();
    });

    it("rejects cross-tenant Exercise ownership", async () => {
        const data = await setup();

        await expect(data.repository.create(profile(
            data.other.tenant.id,
            data.exercise.id,
        ))).rejects.toBeDefined();
    });

    it("enforces historical-version and one-ACTIVE uniqueness", async () => {
        const data = await setup();
        const first = profile(data.owner.tenant.id, data.exercise.id, {
            status: RecordStatus.ACTIVE,
        });
        await data.repository.create(first);

        await expect(data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
            { status: RecordStatus.INACTIVE },
        ))).rejects.toBeDefined();
        await expect(data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
            { version: 2, status: RecordStatus.ACTIVE },
        ))).rejects.toBeDefined();
        await expect(data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
            {
                version: 1,
                goalClassification: ProgrammeGoalClassification.POWER,
                status: RecordStatus.ACTIVE,
            },
        ))).resolves.toBeDefined();
    });

    it("rejects physical Exercise deletion while a profile exists", async () => {
        const data = await setup();
        await data.repository.create(profile(
            data.owner.tenant.id,
            data.exercise.id,
        ));

        await expect(testPrisma.exercise.delete({
            where: { id: data.exercise.id },
        })).rejects.toBeDefined();
    });

    it("does not convert infrastructure failures into absence", async () => {
        const failure = new Error("database unavailable");
        const database = {
            prisma: {
                exercisePrescriptionProfile: {
                    findFirst: vi.fn().mockRejectedValue(failure),
                },
            },
        } as unknown as DatabaseService;
        const repository = new PrismaExercisePrescriptionProfileRepository(
            database,
        );

        await expect(repository.findById(
            randomUUID(),
            randomUUID(),
        )).rejects.toBe(failure);
    });

    it.each([
        { version: 0 },
        { defaultSets: 0 },
        { defaultRestSeconds: -1 },
        { prescriptionMode: "REPETITIONS", defaultRepetitions: null },
        {
            prescriptionMode: "DURATION",
            defaultRepetitions: 8,
            defaultDurationSeconds: 30,
            estimatedSetDurationSeconds: null,
        },
        { goalClassification: "UNKNOWN" },
        { trainingExperience: "EXPERT" },
        { prescriptionMode: "COUNT" },
        { status: "DRAFT" },
    ])("rejects invalid database values %j", async invalid => {
        const data = await setup();
        const valid = {
            id: randomUUID(),
            tenantId: data.owner.tenant.id,
            exerciseId: data.exercise.id,
            goalClassification: "STRENGTH",
            trainingExperience: "BEGINNER",
            version: 1,
            prescriptionMode: "REPETITIONS",
            defaultSets: 3,
            defaultRepetitions: 8,
            defaultDurationSeconds: null,
            defaultRestSeconds: 60,
            estimatedSetDurationSeconds: 30,
            status: "INACTIVE" as const,
        };

        await expect(testPrisma.exercisePrescriptionProfile.create({
            data: { ...valid, ...invalid },
        })).rejects.toBeDefined();
    });
});
