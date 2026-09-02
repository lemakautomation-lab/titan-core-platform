import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { WorkoutProgrammeExercisePrescription } from "../../src/domain/entities/workout-programme-exercise-prescription.entity";
import { WorkoutProgrammeSession } from "../../src/domain/entities/workout-programme-session.entity";
import { WorkoutProgrammeStructure } from "../../src/domain/entities/workout-programme-structure.entity";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaWorkoutProgrammeStructureRepository } from "../../src/infrastructure/repositories/workout-programme-structure.repository";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function context() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: owner.tenant.id,
            firstName: "Structure",
            lastName: "Athlete",
        },
    });
    const sport = await testPrisma.sport.create({
        data: {
            tenantId: owner.tenant.id,
            name: `Structure ${randomUUID()}`,
            slug: `structure-${randomUUID()}`,
        },
    });
    const programme = await testPrisma.workoutProgramme.create({
        data: {
            tenantId: owner.tenant.id,
            athleteId: athlete.id,
            sportId: sport.id,
            name: "Structured programme",
            goal: "Strength",
            experience: "Intermediate",
            trainingFrequency: 3,
            sessionDurationMinutes: 45,
        },
    });
    const exercise = await testPrisma.exercise.create({
        data: {
            tenantId: owner.tenant.id,
            name: `Exercise ${randomUUID()}`,
            slug: `exercise-${randomUUID()}`,
            movement: "Push",
            muscleGroups: ["Chest"],
            equipment: [],
            trainingObjective: "Strength",
            difficulty: "Intermediate",
        },
    });

    return { owner, other, athlete, sport, programme, exercise };
}

function structure(
    tenantId: string,
    programmeId: string,
    exerciseId: string,
) {
    const firstSessionId = randomUUID();
    const secondSessionId = randomUUID();
    const second = WorkoutProgrammeSession.restore(
        secondSessionId,
        tenantId,
        programmeId,
        3,
        "Third session",
        [WorkoutProgrammeExercisePrescription.create(
            tenantId,
            secondSessionId,
            exerciseId,
            1,
            2,
            null,
            60,
            30,
        )],
        new Date(),
        new Date(),
    );
    const first = WorkoutProgrammeSession.restore(
        firstSessionId,
        tenantId,
        programmeId,
        1,
        "First session",
        [WorkoutProgrammeExercisePrescription.create(
            tenantId,
            firstSessionId,
            exerciseId,
            1,
            3,
            10,
            null,
            60,
        )],
        new Date(),
        new Date(),
    );

    return WorkoutProgrammeStructure.create(
        tenantId,
        programmeId,
        [second, first],
    );
}

describe("Workout Programme structure persistence", () => {
    it("persists and retrieves a complete structure in ordinal order", async () => {
        const data = await context();
        const repository = new PrismaWorkoutProgrammeStructureRepository(
            new DatabaseService(),
        );
        const created = await repository.persistInitialStructure(
            structure(data.owner.tenant.id, data.programme.id, data.exercise.id),
        );

        expect(created.sessions.map(session => session.ordinal)).toEqual([1, 3]);
        const retrieved = await repository.findByProgrammeId(
            data.programme.id,
            data.owner.tenant.id,
        );
        expect(retrieved?.sessions.map(session => session.ordinal)).toEqual([1, 3]);
        expect(retrieved?.sessions[0].prescriptions[0].repetitions).toBe(10);
    });

    it("keeps a manual programme valid without structural children", async () => {
        const data = await context();
        const repository = new PrismaWorkoutProgrammeStructureRepository(
            new DatabaseService(),
        );

        const retrieved = await repository.findByProgrammeId(
            data.programme.id,
            data.owner.tenant.id,
        );
        expect(retrieved?.sessions).toEqual([]);
    });

    it("refuses to replace an existing initial structure", async () => {
        const data = await context();
        const repository = new PrismaWorkoutProgrammeStructureRepository(
            new DatabaseService(),
        );
        await repository.persistInitialStructure(
            structure(data.owner.tenant.id, data.programme.id, data.exercise.id),
        );

        await expect(repository.persistInitialStructure(
            structure(data.owner.tenant.id, data.programme.id, data.exercise.id),
        )).rejects.toThrow("Workout Programme structure already exists.");
    });

    it("rolls back the complete structure when a child is invalid", async () => {
        const data = await context();
        const repository = new PrismaWorkoutProgrammeStructureRepository(
            new DatabaseService(),
        );
        const invalid = structure(
            data.owner.tenant.id,
            data.programme.id,
            randomUUID(),
        );

        await expect(repository.persistInitialStructure(invalid)).rejects.toBeDefined();
        expect(await testPrisma.workoutProgrammeSession.count({
            where: { programmeId: data.programme.id },
        })).toBe(0);
    });

    it("enforces tenant-safe Programme, Session and Exercise relationships", async () => {
        const data = await context();
        const otherAthlete = await testPrisma.athlete.create({
            data: {
                tenantId: data.other.tenant.id,
                firstName: "Other",
                lastName: "Athlete",
            },
        });
        const otherSport = await testPrisma.sport.create({
            data: {
                tenantId: data.other.tenant.id,
                name: `Other ${randomUUID()}`,
                slug: `other-${randomUUID()}`,
            },
        });
        const otherExercise = await testPrisma.exercise.create({
            data: {
                tenantId: data.other.tenant.id,
                name: `Other exercise ${randomUUID()}`,
                slug: `other-exercise-${randomUUID()}`,
                movement: "Pull",
                muscleGroups: ["Back"],
                equipment: [],
                trainingObjective: "Strength",
                difficulty: "Intermediate",
            },
        });

        await expect(testPrisma.workoutProgramme.create({
            data: {
                tenantId: data.owner.tenant.id,
                athleteId: otherAthlete.id,
                name: "Invalid athlete",
                goal: "Strength",
                experience: "Intermediate",
                trainingFrequency: 3,
                sessionDurationMinutes: 45,
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgramme.create({
            data: {
                tenantId: data.owner.tenant.id,
                athleteId: data.athlete.id,
                sportId: otherSport.id,
                name: "Invalid sport",
                goal: "Strength",
                experience: "Intermediate",
                trainingFrequency: 3,
                sessionDurationMinutes: 45,
            },
        })).rejects.toBeDefined();

        const sessionId = randomUUID();
        await expect(testPrisma.workoutProgrammeSession.create({
            data: {
                id: sessionId,
                tenantId: data.other.tenant.id,
                programmeId: data.programme.id,
                ordinal: 1,
                name: "Invalid tenant",
            },
        })).rejects.toBeDefined();

        const validSession = await testPrisma.workoutProgrammeSession.create({
            data: {
                tenantId: data.owner.tenant.id,
                programmeId: data.programme.id,
                ordinal: 1,
                name: "Valid",
            },
        });
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.other.tenant.id,
                sessionId: validSession.id,
                exerciseId: otherExercise.id,
                ordinal: 1,
                sets: 3,
                repetitions: 10,
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: validSession.id,
                exerciseId: otherExercise.id,
                ordinal: 1,
                sets: 3,
                repetitions: 10,
            },
        })).rejects.toBeDefined();
    });

    it("enforces ordering, prescription checks and Exercise restriction", async () => {
        const data = await context();
        const session = await testPrisma.workoutProgrammeSession.create({
            data: {
                tenantId: data.owner.tenant.id,
                programmeId: data.programme.id,
                ordinal: 1,
                name: "Checks",
            },
        });

        await expect(testPrisma.workoutProgrammeSession.create({
            data: {
                tenantId: data.owner.tenant.id,
                programmeId: data.programme.id,
                ordinal: 1,
                name: "Duplicate",
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: session.id,
                exerciseId: data.exercise.id,
                ordinal: 0,
                sets: 0,
                repetitions: 0,
            },
        })).rejects.toBeDefined();

        await testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: session.id,
                exerciseId: data.exercise.id,
                ordinal: 1,
                sets: 3,
                repetitions: 10,
            },
        });
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: session.id,
                exerciseId: data.exercise.id,
                ordinal: 1,
                sets: 3,
                durationSeconds: 30,
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: session.id,
                exerciseId: data.exercise.id,
                ordinal: 2,
                sets: 3,
                repetitions: 10,
                durationSeconds: 30,
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgrammeExercisePrescription.create({
            data: {
                tenantId: data.owner.tenant.id,
                sessionId: session.id,
                exerciseId: data.exercise.id,
                ordinal: 2,
                sets: 3,
                repetitions: 10,
                restSeconds: -1,
            },
        })).rejects.toBeDefined();
        await expect(testPrisma.exercise.delete({
            where: { id: data.exercise.id },
        })).rejects.toBeDefined();
    });
});
