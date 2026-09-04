import { randomUUID } from "crypto";

import { describe, expect, it, vi } from "vitest";

import { Exercise } from "../../src/domain/entities/exercise.entity";
import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeExerciseEligibilityCriteria } from "../../src/domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaExercisePrescriptionProfileRepository } from "../../src/infrastructure/repositories/exercise-prescription-profile.repository";
import { PrismaExerciseRepository } from "../../src/infrastructure/repositories/exercise.repository";
import { PrismaProgrammeExercisePrescriptionCandidateRepository } from "../../src/infrastructure/repositories/programme-exercise-prescription-candidate.repository";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

function criteria(
    tenantId: string,
    overrides: { sportId?: string | null; equipment?: string[] } = {},
) {
    return ProgrammeExerciseEligibilityCriteria.create(
        tenantId,
        ProgrammeGenerationGoal.create(ProgrammeGoalClassification.STRENGTH),
        TrainingExperienceLevel.BEGINNER,
        overrides.sportId ?? null,
        overrides.equipment ?? ["barbell"],
    );
}

async function setup() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const database = new DatabaseService();
    const exerciseRepository = new PrismaExerciseRepository(database);
    const repository = new PrismaProgrammeExercisePrescriptionCandidateRepository(
        exerciseRepository,
        database,
    );
    const profileRepository = new PrismaExercisePrescriptionProfileRepository(database);
    return { owner, other, database, repository, profileRepository };
}

async function createExercise(
    tenantId: string,
    overrides: Record<string, unknown> = {},
) {
    return testPrisma.exercise.create({
        data: {
            id: overrides.id as string | undefined,
            tenantId,
            name: `Ready Exercise ${randomUUID()}`,
            slug: `ready-exercise-${randomUUID()}`,
            movement: "Push",
            muscleGroups: ["Chest"],
            equipment: (overrides.equipment as string[]) ?? ["Barbell"],
            trainingObjective: (overrides.objective as string) ?? "Strength",
            difficulty: (overrides.difficulty as string) ?? "Beginner",
            sportId: (overrides.sportId as string | null) ?? null,
            status: (overrides.status as RecordStatus) ?? RecordStatus.ACTIVE,
        },
    });
}

function profile(tenantId: string, exerciseId: string, overrides: Record<string, unknown> = {}) {
    const mode = overrides.mode ?? ExercisePrescriptionMode.REPETITIONS;
    return ExercisePrescriptionProfile.create({
        tenantId,
        exerciseId,
        goalClassification: overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        trainingExperience: overrides.experience ?? TrainingExperienceLevel.BEGINNER,
        version: overrides.version ?? 1,
        prescriptionMode: mode,
        defaultSets: 3,
        defaultRepetitions: mode === ExercisePrescriptionMode.REPETITIONS ? 8 : null,
        defaultDurationSeconds: mode === ExercisePrescriptionMode.DURATION ? 45 : null,
        defaultRestSeconds: 60,
        estimatedSetDurationSeconds: mode === ExercisePrescriptionMode.REPETITIONS ? 30 : null,
        status: overrides.status ?? RecordStatus.ACTIVE,
    });
}

function domainExercise(id: string, tenantId: string) {
    return new Exercise(
        id,
        tenantId,
        "Ready Exercise",
        `ready-exercise-${id}`,
        null,
        "Push",
        ["Chest"],
        ["Barbell"],
        "Strength",
        "Beginner",
        null,
        null,
        RecordStatus.ACTIVE,
        new Date(0),
        new Date(0),
    );
}

function persistenceProfile(id: string, tenantId: string, exerciseId: string) {
    return {
        id,
        tenantId,
        exerciseId,
        goalClassification: "STRENGTH",
        trainingExperience: "BEGINNER",
        version: 1,
        prescriptionMode: "REPETITIONS",
        defaultSets: 3,
        defaultRepetitions: 8,
        defaultDurationSeconds: null,
        defaultRestSeconds: 60,
        estimatedSetDurationSeconds: 30,
        status: "ACTIVE" as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
    };
}

describe("Programme Exercise prescription candidate repository", () => {
    it("returns same-tenant active exact repetition and duration candidates in stable order", async () => {
        const data = await setup();
        const ids = [randomUUID(), randomUUID()].sort();
        const first = await createExercise(data.owner.tenant.id, { id: ids[1] });
        const second = await createExercise(data.owner.tenant.id, { id: ids[0] });
        await data.profileRepository.create(profile(data.owner.tenant.id, first.id));
        await data.profileRepository.create(profile(data.owner.tenant.id, second.id, {
            mode: ExercisePrescriptionMode.DURATION,
        }));

        const input = criteria(data.owner.tenant.id);
        const one = await data.repository.findReadyForProgramme(input);
        const two = await data.repository.findReadyForProgramme(input);
        expect(one.map(item => item.exerciseId)).toEqual(ids);
        expect(two).toEqual(one);
        expect(one.map(item => item.prescriptionMode).sort()).toEqual([
            ExercisePrescriptionMode.DURATION,
            ExercisePrescriptionMode.REPETITIONS,
        ]);
    });

    it("preserves R3 Sport-neutral and equipment-subset eligibility", async () => {
        const data = await setup();
        const sport = await testPrisma.sport.create({
            data: {
                tenantId: data.owner.tenant.id,
                name: `Ready Sport ${randomUUID()}`,
                slug: `ready-sport-${randomUUID()}`,
            },
        });
        const specific = await createExercise(data.owner.tenant.id, { sportId: sport.id });
        const neutral = await createExercise(data.owner.tenant.id, { equipment: [] });
        const unavailable = await createExercise(data.owner.tenant.id, { equipment: ["Rack"] });
        for (const item of [specific, neutral, unavailable]) {
            await data.profileRepository.create(profile(data.owner.tenant.id, item.id));
        }

        const result = await data.repository.findReadyForProgramme(criteria(
            data.owner.tenant.id,
            { sportId: sport.id },
        ));
        expect(result.map(item => item.exerciseId).sort()).toEqual(
            [specific.id, neutral.id].sort(),
        );
    });

    it("omits inactive, cross-tenant, Goal-mismatched and experience-mismatched data", async () => {
        const data = await setup();
        const eligible = await createExercise(data.owner.tenant.id);
        const inactiveExercise = await createExercise(data.owner.tenant.id, {
            status: RecordStatus.INACTIVE,
        });
        const otherExercise = await createExercise(data.other.tenant.id);
        await data.profileRepository.create(profile(data.owner.tenant.id, eligible.id, {
            status: RecordStatus.INACTIVE,
        }));
        await data.profileRepository.create(profile(data.owner.tenant.id, inactiveExercise.id));
        await data.profileRepository.create(profile(data.other.tenant.id, otherExercise.id));
        await data.profileRepository.create(profile(data.owner.tenant.id, eligible.id, {
            goal: ProgrammeGoalClassification.POWER,
        }));
        await data.profileRepository.create(profile(data.owner.tenant.id, eligible.id, {
            experience: TrainingExperienceLevel.ADVANCED,
        }));

        expect(await data.repository.findReadyForProgramme(
            criteria(data.owner.tenant.id),
        )).toEqual([]);
    });

    it("preserves R3's generic invalid-Sport failure", async () => {
        const data = await setup();
        await expect(data.repository.findReadyForProgramme(criteria(
            data.owner.tenant.id,
            { sportId: randomUUID() },
        ))).rejects.toThrow("Programme Sport is unavailable.");
    });

    it("returns early without querying profiles when R3 is empty", async () => {
        const database = new DatabaseService();
        const exerciseRepository = {
            findEligibleForProgramme: vi.fn().mockResolvedValue([]),
        } as unknown as PrismaExerciseRepository;
        const profileQuery = vi.spyOn(
            database.prisma.exercisePrescriptionProfile,
            "findMany",
        );
        const repository = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            exerciseRepository,
            database,
        );

        const result = await repository.findReadyForProgramme(criteria(randomUUID()));
        expect(result).toEqual([]);
        expect(Object.isFrozen(result)).toBe(true);
        expect(profileQuery).not.toHaveBeenCalled();
    });

    it("uses one bulk profile query and performs no writes", async () => {
        const data = await setup();
        const exercise = await createExercise(data.owner.tenant.id);
        await data.profileRepository.create(profile(data.owner.tenant.id, exercise.id));
        const findMany = vi.spyOn(
            data.database.prisma.exercisePrescriptionProfile,
            "findMany",
        );
        const create = vi.spyOn(data.database.prisma.exercisePrescriptionProfile, "create");
        const update = vi.spyOn(data.database.prisma.exercisePrescriptionProfile, "update");
        const remove = vi.spyOn(data.database.prisma.exercisePrescriptionProfile, "delete");

        await data.repository.findReadyForProgramme(criteria(data.owner.tenant.id));
        expect(findMany).toHaveBeenCalledTimes(1);
        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
    });

    it("propagates profile database failures", async () => {
        const failure = new Error("database unavailable");
        const exercise = await createExercise((await createTestUser()).tenant.id);
        const exerciseRepository = {
            findEligibleForProgramme: vi.fn().mockResolvedValue([
                domainExercise(exercise.id, exercise.tenantId),
            ]),
        } as unknown as PrismaExerciseRepository;
        const database = {
            prisma: {
                exercisePrescriptionProfile: {
                    findMany: vi.fn().mockRejectedValue(failure),
                },
            },
        } as unknown as DatabaseService;
        const repository = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            exerciseRepository,
            database,
        );

        await expect(repository.findReadyForProgramme(criteria(exercise.tenantId)))
            .rejects.toBe(failure);
    });

    it("propagates mapper failures for malformed profile rows", async () => {
        const tenantId = randomUUID();
        const exerciseId = randomUUID();
        const exerciseRepository = {
            findEligibleForProgramme: vi.fn().mockResolvedValue([
                domainExercise(exerciseId, tenantId),
            ]),
        } as unknown as PrismaExerciseRepository;
        const database = {
            prisma: {
                exercisePrescriptionProfile: {
                    findMany: vi.fn().mockResolvedValue([
                        {
                            ...persistenceProfile(randomUUID(), tenantId, exerciseId),
                            defaultSets: 0,
                        },
                    ]),
                },
            },
        } as unknown as DatabaseService;
        const repository = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            exerciseRepository,
            database,
        );

        await expect(repository.findReadyForProgramme(criteria(tenantId)))
            .rejects.toThrow("Default sets must be a positive integer.");
    });

    it("fails on ambiguous active rows rather than concealing a duplicate", async () => {
        const tenantId = randomUUID();
        const exerciseId = randomUUID();
        const exerciseRepository = {
            findEligibleForProgramme: vi.fn().mockResolvedValue([
                domainExercise(exerciseId, tenantId),
            ]),
        } as unknown as PrismaExerciseRepository;
        const database = {
            prisma: {
                exercisePrescriptionProfile: {
                    findMany: vi.fn().mockResolvedValue([
                        persistenceProfile(randomUUID(), tenantId, exerciseId),
                        {
                            ...persistenceProfile(randomUUID(), tenantId, exerciseId),
                            version: 2,
                        },
                    ]),
                },
            },
        } as unknown as DatabaseService;
        const repository = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            exerciseRepository,
            database,
        );

        await expect(repository.findReadyForProgramme(criteria(tenantId)))
            .rejects.toThrow("Ambiguous active prescription profiles.");
    });
});
