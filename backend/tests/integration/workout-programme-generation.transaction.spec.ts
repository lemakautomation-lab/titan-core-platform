import { randomUUID } from "crypto";

import { describe, expect, it, vi } from "vitest";

import { Prisma } from "../../src/generated/prisma/client";

import { GenerateWorkoutProgrammeCommand } from "../../src/application/commands/generate-workout-programme.command";
import { GenerateWorkoutProgrammeRequest } from "../../src/application/commands/generate-workout-programme-request";
import { GenerateWorkoutProgrammeUseCase } from "../../src/application/use-cases/generate-workout-programme.use-case";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../src/domain/value-objects/programme-generation-input.value-object";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteRepository } from "../../src/infrastructure/repositories/athlete.repository";
import { PrismaExerciseRepository } from "../../src/infrastructure/repositories/exercise.repository";
import { PrismaProgrammeExercisePrescriptionCandidateRepository } from "../../src/infrastructure/repositories/programme-exercise-prescription-candidate.repository";
import { PrismaSportRepository } from "../../src/infrastructure/repositories/sport.repository";
import { PrismaWorkoutProgrammeGenerationTransaction } from "../../src/infrastructure/transactions/workout-programme-generation.transaction";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function context() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: owner.tenant.id,
            firstName: "R5B2",
            lastName: randomUUID(),
        },
    });
    const sport = await testPrisma.sport.create({
        data: {
            tenantId: owner.tenant.id,
            name: `R5B2 ${randomUUID()}`,
            slug: `r5b2-${randomUUID()}`,
        },
    });
    const exercise = await testPrisma.exercise.create({
        data: {
            tenantId: owner.tenant.id,
            name: `R5B2 ${randomUUID()}`,
            slug: `r5b2-${randomUUID()}`,
            movement: "Push",
            muscleGroups: ["Chest"],
            equipment: [],
            trainingObjective: "STRENGTH",
            difficulty: "BEGINNER",
            sportId: sport.id,
        },
    });
    const profile = await testPrisma.exercisePrescriptionProfile.create({
        data: {
            tenantId: owner.tenant.id,
            exerciseId: exercise.id,
            goalClassification: ProgrammeGoalClassification.STRENGTH,
            trainingExperience: TrainingExperienceLevel.BEGINNER,
            version: 1,
            prescriptionMode: ExercisePrescriptionMode.REPETITIONS,
            defaultSets: 2,
            defaultRepetitions: 8,
            defaultDurationSeconds: null,
            defaultRestSeconds: 30,
            estimatedSetDurationSeconds: 20,
            status: "ACTIVE",
        },
    });
    return { owner, other, athlete, sport, exercise, profile };
}

function useCase(
    database = new DatabaseService(),
    candidateRepository?: {
        findReadyForProgramme: PrismaProgrammeExercisePrescriptionCandidateRepository["findReadyForProgramme"];
    },
    transaction = new PrismaWorkoutProgrammeGenerationTransaction(database),
) {
    const exerciseRepository = new PrismaExerciseRepository(database);
    return new GenerateWorkoutProgrammeUseCase(
        new PrismaAthleteRepository(database),
        new PrismaSportRepository(database),
        candidateRepository ?? new PrismaProgrammeExercisePrescriptionCandidateRepository(
            exerciseRepository, database,
        ),
        transaction,
    );
}

function retryableConflict() {
    return new Prisma.PrismaClientKnownRequestError(
        "Transaction failed due to a write conflict or a deadlock.",
        { code: "P2034", clientVersion: "7.9.1" },
    );
}

async function assertNoPartial(data: Awaited<ReturnType<typeof context>>) {
    expect(await testPrisma.workoutProgrammeGeneration.count({
        where: { tenantId: data.owner.tenant.id, programme: { athleteId: data.athlete.id } },
    })).toBe(0);
    expect(await testPrisma.workoutProgramme.count({
        where: { tenantId: data.owner.tenant.id, athleteId: data.athlete.id },
    })).toBe(0);
    expect(await testPrisma.workoutProgrammeSession.count({
        where: { programme: { athleteId: data.athlete.id, tenantId: data.owner.tenant.id } },
    })).toBe(0);
    expect(await testPrisma.workoutProgrammeExercisePrescription.count({
        where: {
            session: {
                programme: { athleteId: data.athlete.id, tenantId: data.owner.tenant.id },
            },
        },
    })).toBe(0);
    expect(await testPrisma.auditLog.count({
        where: { tenantId: data.owner.tenant.id, action: "WORKOUT_PROGRAMME_GENERATED" },
    })).toBe(0);
}

function request(data: Awaited<ReturnType<typeof context>>, key: string, actor?: string) {
    return new GenerateWorkoutProgrammeRequest(
        new GenerateWorkoutProgrammeCommand(
            data.owner.tenant.id,
            actor ?? data.owner.user.id,
            ProgrammeGenerationInput.create({
                athleteId: data.athlete.id,
                goal: ProgrammeGenerationGoal.create(
                    ProgrammeGoalClassification.STRENGTH,
                ),
                trainingExperience: TrainingExperienceLevel.BEGINNER,
                sportId: data.sport.id,
                availableEquipment: [],
                trainingFrequency: 2,
                sessionDurationMinutes: 10,
            }),
        ),
        key,
    );
}

describe("Workout Programme generation atomic transaction", () => {
    it("atomically creates Programme, provenance, structure and one success audit", async () => {
        const data = await context();
        const result = await useCase().execute(request(data, `key-${randomUUID()}`));

        expect(result.status).toBe("created");
        expect(result.programme.id).toBe(result.generation.programmeId);
        expect(result.structure.sessions).toHaveLength(2);
        expect(result.structure.sessions.every(item => item.prescriptions.length > 0))
            .toBe(true);
        expect(await testPrisma.auditLog.count({
            where: {
                tenantId: data.owner.tenant.id,
                action: "WORKOUT_PROGRAMME_GENERATED",
                resourceId: result.programme.id,
                status: "SUCCESS",
            },
        })).toBe(1);
    });

    it("replays the complete original result without duplicate rows or audit", async () => {
        const data = await context();
        const key = `key-${randomUUID()}`;
        const first = await useCase().execute(request(data, key));
        const second = await useCase().execute(request(data, key));
        expect(second.status).toBe("replayed");
        expect(second.programme.id).toBe(first.programme.id);
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: data.owner.tenant.id, idempotencyKey: key },
        })).toBe(1);
        expect(await testPrisma.auditLog.count({
            where: { action: "WORKOUT_PROGRAMME_GENERATED", resourceId: first.programme.id },
        })).toBe(1);
    });

    it("conflicts for the same key with a different actor fingerprint", async () => {
        const data = await context();
        const key = `key-${randomUUID()}`;
        await useCase().execute(request(data, key));
        await expect(useCase().execute(request(data, key, data.other.user.id)))
            .rejects.toThrow("Idempotency key conflict.");
    });

    it("allows different keys to create separate Programmes", async () => {
        const data = await context();
        const first = await useCase().execute(request(data, `key-${randomUUID()}`));
        const second = await useCase().execute(request(data, `key-${randomUUID()}`));
        expect(second.programme.id).not.toBe(first.programme.id);
    });

    it("arbitrates concurrent identical requests as one creation and one replay", async () => {
        const data = await context();
        const key = `key-${randomUUID()}`;

        const outcomes = await Promise.all([
            useCase().execute(request(data, key)),
            useCase().execute(request(data, key)),
        ]);

        expect(outcomes.map(outcome => outcome.status).sort())
            .toEqual(["created", "replayed"]);
        const created = outcomes.filter(outcome => outcome.status === "created");
        const replayed = outcomes.filter(outcome => outcome.status === "replayed");
        expect(created).toHaveLength(1);
        expect(replayed).toHaveLength(1);
        expect(replayed[0].generation.id).toBe(created[0].generation.id);
        expect(replayed[0].programme.id).toBe(created[0].programme.id);

        const programmeId = created[0].programme.id;
        expect(await testPrisma.workoutProgramme.count({
            where: { id: programmeId, tenantId: data.owner.tenant.id },
        })).toBe(1);
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: data.owner.tenant.id, idempotencyKey: key },
        })).toBe(1);
        expect(await testPrisma.workoutProgrammeSession.count({
            where: { programmeId, tenantId: data.owner.tenant.id },
        })).toBe(2);
        expect(await testPrisma.auditLog.count({
            where: {
                tenantId: data.owner.tenant.id,
                action: "WORKOUT_PROGRAMME_GENERATED",
                resourceId: programmeId,
                status: "SUCCESS",
            },
        })).toBe(1);
    });

    it("fails closed when the candidate pool gains an Exercise after preflight", async () => {
        const data = await context();
        const database = new DatabaseService();
        const real = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            new PrismaExerciseRepository(database), database,
        );
        const racing = {
            findReadyForProgramme: async (criteria: Parameters<typeof real.findReadyForProgramme>[0]) => {
                const candidates = await real.findReadyForProgramme(criteria);
                const exercise = await testPrisma.exercise.create({
                    data: {
                        tenantId: data.owner.tenant.id,
                        name: `Added ${randomUUID()}`,
                        slug: `added-${randomUUID()}`,
                        movement: "Pull", muscleGroups: ["Back"], equipment: [],
                        trainingObjective: "STRENGTH", difficulty: "BEGINNER",
                        sportId: data.sport.id,
                    },
                });
                await testPrisma.exercisePrescriptionProfile.create({
                    data: {
                        tenantId: data.owner.tenant.id, exerciseId: exercise.id,
                        goalClassification: "STRENGTH", trainingExperience: "BEGINNER",
                        version: 1, prescriptionMode: "REPETITIONS", defaultSets: 2,
                        defaultRepetitions: 8, defaultRestSeconds: 30,
                        estimatedSetDurationSeconds: 20, status: "ACTIVE",
                    },
                });
                return candidates;
            },
        };
        await expect(useCase(database, racing).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toThrow("Generation candidates changed during transaction.");
        await assertNoPartial(data);
    });

    it.each([
        ["removal", { status: "INACTIVE" as const }],
        ["version/value", { version: 2, defaultSets: 3 }],
    ])("fails closed for profile %s after preflight", async (_name, update) => {
        const data = await context();
        const database = new DatabaseService();
        const real = new PrismaProgrammeExercisePrescriptionCandidateRepository(
            new PrismaExerciseRepository(database), database,
        );
        const racing = {
            findReadyForProgramme: async (criteria: Parameters<typeof real.findReadyForProgramme>[0]) => {
                const candidates = await real.findReadyForProgramme(criteria);
                await testPrisma.exercisePrescriptionProfile.update({
                    where: { id: data.profile.id }, data: update,
                });
                return candidates;
            },
        };
        await expect(useCase(database, racing).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toBeDefined();
        await assertNoPartial(data);
    });

    it("rolls back when the transactional plan fingerprint differs", async () => {
        const data = await context();
        const database = new DatabaseService();
        const real = new PrismaWorkoutProgrammeGenerationTransaction(database);
        const mismatch = {
            execute: (input: Parameters<typeof real.execute>[0]) => real.execute(
                Object.freeze({ ...input, planFingerprint: "c".repeat(64) }),
            ),
        };
        await expect(useCase(database, undefined, mismatch).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toThrow("Generated Programme fingerprint changed.");
        await assertNoPartial(data);
    });

    it("rolls back every row when structure insertion fails", async () => {
        const data = await context();
        const database = new DatabaseService();
        const originalTransaction = database.prisma.$transaction.bind(
            database.prisma,
        ) as any;
        vi.spyOn(database.prisma, "$transaction").mockImplementationOnce((
            (callback: (tx: unknown) => Promise<unknown>, options: unknown) =>
                originalTransaction(async (tx: any) => callback(new Proxy(tx, {
                    get(target, property) {
                        if (property !== "workoutProgrammeSession") {
                            const value = Reflect.get(target, property);
                            return typeof value === "function"
                                ? value.bind(target)
                                : value;
                        }
                        const delegate = target.workoutProgrammeSession;
                        return new Proxy(delegate, {
                            get(delegateTarget, delegateProperty) {
                                if (delegateProperty === "create") {
                                    return () => Promise.reject(
                                        new Error("structure unavailable"),
                                    );
                                }
                                const value = Reflect.get(
                                    delegateTarget,
                                    delegateProperty,
                                );
                                return typeof value === "function"
                                    ? value.bind(delegateTarget)
                                    : value;
                            },
                        });
                    },
                })), options)
        ) as any);
        await expect(useCase(database).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toThrow("structure unavailable");
        await assertNoPartial(data);
    });

    it("uses the governed lock and persistence order", async () => {
        const data = await context();
        const database = new DatabaseService();
        const events: string[] = [];
        const originalTransaction = database.prisma.$transaction.bind(
            database.prisma,
        ) as any;
        vi.spyOn(database.prisma, "$transaction").mockImplementationOnce((
            (callback: (tx: unknown) => Promise<unknown>, options: unknown) =>
                originalTransaction(async (tx: any) => callback(new Proxy(tx, {
                    get(target, property) {
                        if (property === "$queryRaw") {
                            const queryRaw = target.$queryRaw.bind(target);
                            return (...args: unknown[]) => {
                                const sql = Array.isArray(args[0])
                                    ? (args[0] as string[]).join("?")
                                    : String(args[0]);
                                events.push(`raw:${sql.replace(/\s+/gu, " ").trim()}`);
                                return queryRaw(...args);
                            };
                        }
                        const value = Reflect.get(target, property);
                        if (
                            value &&
                            typeof value === "object" &&
                            [
                                "workoutProgrammeGeneration",
                                "exercisePrescriptionProfile",
                                "workoutProgramme",
                            ].includes(String(property))
                        ) {
                            return new Proxy(value, {
                                get(delegate, operation) {
                                    const method = Reflect.get(delegate, operation);
                                    if (typeof method !== "function") {
                                        return method;
                                    }
                                    return (...args: unknown[]) => {
                                        events.push(`${String(property)}.${String(operation)}`);
                                        return method.apply(delegate, args);
                                    };
                                },
                            });
                        }
                        return typeof value === "function" ? value.bind(target) : value;
                    },
                })), options)
        ) as any);

        await useCase(database).execute(request(data, `key-${randomUUID()}`));
        const advisory = events.findIndex(event => event.includes("pg_advisory_xact_lock"));
        const idempotency = events.indexOf("workoutProgrammeGeneration.findUnique");
        const athlete = events.findIndex(event => event.includes('FROM "Athlete"'));
        const sport = events.findIndex(event => event.includes('FROM "Sport"'));
        const exercise = events.findIndex(event => event.includes('FROM "Exercise"'));
        const profile = events.findIndex(event => event.includes('FROM "ExercisePrescriptionProfile"'));
        const persistence = events.indexOf("workoutProgramme.create");
        expect([advisory, idempotency, athlete, sport, exercise, profile, persistence]
            .every(index => index >= 0)).toBe(true);
        expect(advisory).toBeLessThan(idempotency);
        expect(idempotency).toBeLessThan(athlete);
        expect(athlete).toBeLessThan(sport);
        expect(sport).toBeLessThan(exercise);
        expect(exercise).toBeLessThan(profile);
        expect(profile).toBeLessThan(persistence);
        expect(events[exercise]).toContain('ORDER BY "id" ASC');
        expect(events[profile]).toContain('ORDER BY "exerciseId" ASC, "id" ASC');
    });

    it("propagates a retryable conflict unchanged when no generation committed", async () => {
        const data = await context();
        const database = new DatabaseService();
        const error = retryableConflict();
        vi.spyOn(database.prisma, "$transaction").mockRejectedValueOnce(error);
        await expect(useCase(database).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toBe(error);
        await assertNoPartial(data);
    });

    it("does not reinterpret unrelated transaction infrastructure failure", async () => {
        const data = await context();
        const database = new DatabaseService();
        const error = new Error("infrastructure unavailable");
        vi.spyOn(database.prisma, "$transaction").mockRejectedValueOnce(error);
        await expect(useCase(database).execute(request(
            data, `key-${randomUUID()}`,
        ))).rejects.toBe(error);
        await assertNoPartial(data);
    });

    it("fails invariant resolution when post-conflict replay structure is missing", async () => {
        const data = await context();
        const key = `key-${randomUUID()}`;
        const created = await useCase().execute(request(data, key));
        await testPrisma.workoutProgrammeSession.deleteMany({
            where: { programmeId: created.programme.id },
        });
        const database = new DatabaseService();
        vi.spyOn(database.prisma, "$transaction")
            .mockRejectedValueOnce(retryableConflict());
        await expect(useCase(database).execute(request(data, key)))
            .rejects.toThrow("Generated Programme invariant failure.");
        expect(await testPrisma.workoutProgramme.count({
            where: { id: created.programme.id },
        })).toBe(1);
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { programmeId: created.programme.id },
        })).toBe(1);
        expect(await testPrisma.auditLog.count({
            where: { resourceId: created.programme.id, action: "WORKOUT_PROGRAMME_GENERATED" },
        })).toBe(1);
    });

    it.each(["athlete", "sport", "exercise", "profile"])(
        "fails closed and rolls back when %s becomes inactive",
        async target => {
            const data = await context();
            if (target === "athlete") {
                await testPrisma.athlete.update({ where: { id: data.athlete.id }, data: { status: "INACTIVE" } });
            } else if (target === "sport") {
                await testPrisma.sport.update({ where: { id: data.sport.id }, data: { status: "INACTIVE" } });
            } else if (target === "exercise") {
                await testPrisma.exercise.update({ where: { id: data.exercise.id }, data: { status: "INACTIVE" } });
            } else {
                await testPrisma.exercisePrescriptionProfile.update({ where: { id: data.profile.id }, data: { status: "INACTIVE" } });
            }

            await expect(useCase().execute(request(data, `key-${randomUUID()}`)))
                .rejects.toBeDefined();
            expect(await testPrisma.workoutProgrammeGeneration.count({
                where: { tenantId: data.owner.tenant.id, programme: { athleteId: data.athlete.id } },
            })).toBe(0);
        },
    );

    it("rolls back all generated rows when mandatory audit insertion fails", async () => {
        const data = await context();
        const missingActor = randomUUID();
        await expect(useCase().execute(request(
            data,
            `key-${randomUUID()}`,
            missingActor,
        ))).rejects.toBeDefined();
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: data.owner.tenant.id, actorUserId: missingActor },
        })).toBe(0);
        expect(await testPrisma.workoutProgramme.count({
            where: { tenantId: data.owner.tenant.id, athleteId: data.athlete.id },
        })).toBe(0);
    });

    it("does not disclose cross-tenant Athlete availability", async () => {
        const data = await context();
        const otherCommand = new GenerateWorkoutProgrammeCommand(
            data.other.tenant.id,
            data.other.user.id,
            ProgrammeGenerationInput.create({
                athleteId: data.athlete.id,
                goal: ProgrammeGenerationGoal.create(ProgrammeGoalClassification.STRENGTH),
                trainingExperience: TrainingExperienceLevel.BEGINNER,
                sportId: null,
                availableEquipment: [],
                trainingFrequency: 1,
                sessionDurationMinutes: 10,
            }),
        );
        await expect(useCase().execute(new GenerateWorkoutProgrammeRequest(
            otherCommand,
            `key-${randomUUID()}`,
        ))).rejects.toThrow("Generation input is unavailable.");
    });
});
