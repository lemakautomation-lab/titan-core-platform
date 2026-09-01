import { describe, expect, it } from "vitest";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaWorkoutProgrammePerformanceAdaptationTransaction } from "../../src/infrastructure/transactions/workout-programme-performance-adaptation.transaction";
import { testPrisma } from "../helpers/prisma-test.client";
import { createTestUser } from "../factories/user.factory";

async function createContext() {
    const actor = await createTestUser();
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: actor.tenant.id,
            firstName: "Atomic",
            lastName: "Athlete",
        },
    });
    const sport = await testPrisma.sport.create({
        data: {
            tenantId: actor.tenant.id,
            name: `Atomic Sport ${athlete.id}`,
            slug: `atomic-sport-${athlete.id}`,
        },
    });
    const metric = await testPrisma.performanceMetric.create({
        data: {
            tenantId: actor.tenant.id,
            athleteId: athlete.id,
            sportId: sport.id,
            name: "Atomic metric",
            slug: "atomic-metric",
            unit: "score",
            dataType: "NUMBER",
        },
    });
    const measurement = await testPrisma.performanceMeasurement.create({
        data: {
            tenantId: actor.tenant.id,
            athleteId: athlete.id,
            metricId: metric.id,
            value: 10,
        },
    });
    const programme = await testPrisma.workoutProgramme.create({
        data: {
            tenantId: actor.tenant.id,
            athleteId: athlete.id,
            name: "Atomic Programme",
            description: null,
            goal: "Strength",
            experience: "Intermediate",
            trainingFrequency: 4,
            sessionDurationMinutes: 60,
            sportId: sport.id,
        },
    });

    return { actor, athlete, metric, measurement, programme };
}

describe("Workout Programme performance adaptation transaction", () => {
    it("rolls back the programme mutation when mandatory audit persistence fails", async () => {
        const context = await createContext();
        const transaction =
            new PrismaWorkoutProgrammePerformanceAdaptationTransaction(
                new DatabaseService(),
            );

        await expect(transaction.execute({
            programmeId: context.programme.id,
            tenantId: context.actor.tenant.id,
            actorUserId: "missing-actor-user-id",
            athleteId: context.athlete.id,
            metricId: context.metric.id,
            measurementId: context.measurement.id,
            trainingFrequencyDelta: 1,
            sessionDurationMinutesDelta: 15,
            rationale: "Audit insertion must fail atomically.",
        })).rejects.toBeDefined();

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: context.programme.id },
        });
        expect(persisted?.trainingFrequency).toBe(4);
        expect(persisted?.sessionDurationMinutes).toBe(60);

        const audits = await testPrisma.auditLog.count({
            where: {
                resourceId: context.programme.id,
                action: "WORKOUT_PROGRAMME_PERFORMANCE_ADAPTATION",
            },
        });
        expect(audits).toBe(0);
    });

    it("rejects invalid evidence inside the transaction without mutation or audit", async () => {
        const context = await createContext();
        const transaction =
            new PrismaWorkoutProgrammePerformanceAdaptationTransaction(
                new DatabaseService(),
            );

        await expect(transaction.execute({
            programmeId: context.programme.id,
            tenantId: context.actor.tenant.id,
            actorUserId: context.actor.user.id,
            athleteId: context.athlete.id,
            metricId: context.metric.id,
            measurementId: "missing-measurement-id",
            trainingFrequencyDelta: 1,
            sessionDurationMinutesDelta: 15,
            rationale: "Invalid evidence must fail.",
        })).rejects.toThrow(
            "Performance measurement evidence is invalid.",
        );

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: context.programme.id },
        });
        expect(persisted?.trainingFrequency).toBe(4);
        expect(persisted?.sessionDurationMinutes).toBe(60);

        const audits = await testPrisma.auditLog.count({
            where: {
                resourceId: context.programme.id,
                action: "WORKOUT_PROGRAMME_PERFORMANCE_ADAPTATION",
            },
        });
        expect(audits).toBe(0);
    });
});
