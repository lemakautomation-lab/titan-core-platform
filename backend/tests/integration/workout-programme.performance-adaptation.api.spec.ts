import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { testPrisma } from "../helpers/prisma-test.client";
import { createTestUser } from "../factories/user.factory";

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId, email, password });

    expect(response.status).toBe(200);
    return response.body.data.accessToken;
}

async function createPerformanceContext(tenantId: string) {
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Adaptation",
            lastName: "Athlete",
        },
    });

    const sport = await testPrisma.sport.create({
        data: {
            tenantId,
            name: `Adaptation Sport ${athlete.id}`,
            slug: `adaptation-sport-${athlete.id}`,
        },
    });

    const metric = await testPrisma.performanceMetric.create({
        data: {
            tenantId,
            athleteId: athlete.id,
            sportId: sport.id,
            name: "Sprint speed",
            slug: "sprint-speed",
            unit: "m/s",
            dataType: "NUMBER",
        },
    });

    const measurement = await testPrisma.performanceMeasurement.create({
        data: {
            tenantId,
            athleteId: athlete.id,
            metricId: metric.id,
            value: 12.5,
            recordedAt: new Date("2026-08-31T10:00:00.000Z"),
        },
    });

    const programme = await testPrisma.workoutProgramme.create({
        data: {
            tenantId,
            athleteId: athlete.id,
            name: "Performance Adaptation Programme",
            description: null,
            goal: "Strength",
            experience: "Intermediate",
            trainingFrequency: 4,
            sessionDurationMinutes: 60,
            sportId: sport.id,
        },
    });

    return { athlete, metric, measurement, programme };
}

describe("Workout Programme performance adaptation API", () => {
    it("applies an authorised bounded adaptation and records its rationale", async () => {
        const actor = await createTestUser({
            permissions: ["workout-programmes.update"],
        });
        const context = await createPerformanceContext(actor.tenant.id);
        const accessToken = await login(
            actor.tenant.id,
            actor.user.email,
            actor.password,
        );

        const response = await request(app)
            .post(
                `/api/v1/workout-programmes/${context.programme.id}/performance-adaptation`,
            )
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                athleteId: context.athlete.id,
                metricId: context.metric.id,
                trainingFrequencyDelta: 1,
                sessionDurationMinutesDelta: -15,
                rationale: "Reviewed by an authorised coach.",
            });

        expect(response.status).toBe(200);
        expect(response.body.trainingFrequency).toBe(5);
        expect(response.body.sessionDurationMinutes).toBe(45);
        expect(response.body.tenantId).toBe(actor.tenant.id);

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: context.programme.id },
        });
        expect(persisted?.trainingFrequency).toBe(5);
        expect(persisted?.sessionDurationMinutes).toBe(45);

        const audit = await testPrisma.auditLog.findFirst({
            where: {
                tenantId: actor.tenant.id,
                userId: actor.user.id,
                action: "WORKOUT_PROGRAMME_PERFORMANCE_ADAPTATION",
                resource: "WORKOUT_PROGRAMME",
                resourceId: context.programme.id,
            },
            orderBy: { createdAt: "desc" },
        });

        expect(audit).not.toBeNull();
        expect(audit?.metadata).toMatchObject({
            athleteId: context.athlete.id,
            metricId: context.metric.id,
            measurementId: context.measurement.id,
            rationale: "Reviewed by an authorised coach.",
            previousTrainingFrequency: 4,
            trainingFrequency: 5,
            previousSessionDurationMinutes: 60,
            sessionDurationMinutes: 45,
        });
    });

    it("denies adaptation without workout-programmes.update", async () => {
        const actor = await createTestUser();
        const accessToken = await login(
            actor.tenant.id,
            actor.user.email,
            actor.password,
        );

        const response = await request(app)
            .post(
                "/api/v1/workout-programmes/programme-id/performance-adaptation",
            )
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                athleteId: "athlete-id",
                metricId: "metric-id",
                trainingFrequencyDelta: 1,
                sessionDurationMinutesDelta: 0,
                rationale: "Must be denied by RBAC.",
            });

        expect(response.status).toBe(403);
    });

    it("does not expose or mutate another tenant's programme", async () => {
        const actor = await createTestUser({
            permissions: ["workout-programmes.update"],
        });
        const otherTenantUser = await createTestUser();
        const otherContext = await createPerformanceContext(
            otherTenantUser.tenant.id,
        );
        const accessToken = await login(
            actor.tenant.id,
            actor.user.email,
            actor.password,
        );

        const response = await request(app)
            .post(
                `/api/v1/workout-programmes/${otherContext.programme.id}/performance-adaptation`,
            )
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                athleteId: otherContext.athlete.id,
                metricId: otherContext.metric.id,
                trainingFrequencyDelta: 1,
                sessionDurationMinutesDelta: 15,
                rationale: "Cross-tenant request must fail.",
            });

        expect(response.status).toBe(404);

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: otherContext.programme.id },
        });
        expect(persisted?.trainingFrequency).toBe(4);
        expect(persisted?.sessionDurationMinutes).toBe(60);
    });

    it("rejects adjustments outside the approved bounds", async () => {
        const actor = await createTestUser({
            permissions: ["workout-programmes.update"],
        });
        const context = await createPerformanceContext(actor.tenant.id);
        const accessToken = await login(
            actor.tenant.id,
            actor.user.email,
            actor.password,
        );

        const response = await request(app)
            .post(
                `/api/v1/workout-programmes/${context.programme.id}/performance-adaptation`,
            )
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                athleteId: context.athlete.id,
                metricId: context.metric.id,
                trainingFrequencyDelta: 2,
                sessionDurationMinutesDelta: 16,
                rationale: "Invalid adjustment.",
            });

        expect(response.status).toBe(400);

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: context.programme.id },
        });
        expect(persisted?.trainingFrequency).toBe(4);
        expect(persisted?.sessionDurationMinutes).toBe(60);
    });

    it("serializes concurrent deltas without losing an adaptation", async () => {
        const actor = await createTestUser({
            permissions: ["workout-programmes.update"],
        });
        const context = await createPerformanceContext(actor.tenant.id);
        const accessToken = await login(
            actor.tenant.id,
            actor.user.email,
            actor.password,
        );
        const endpoint =
            `/api/v1/workout-programmes/${context.programme.id}/performance-adaptation`;
        const payload = {
            athleteId: context.athlete.id,
            metricId: context.metric.id,
            trainingFrequencyDelta: 1,
            sessionDurationMinutesDelta: 0,
            rationale: "Concurrent authorised adaptation.",
        };

        const firstRequest = request(app)
            .post(endpoint)
            .set("Authorization", `Bearer ${accessToken}`)
            .send(payload);
        const secondRequest = request(app)
            .post(endpoint)
            .set("Authorization", `Bearer ${accessToken}`)
            .send(payload);

        const [firstResponse, secondResponse] = await Promise.all([
            firstRequest,
            secondRequest,
        ]);

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);

        const persisted = await testPrisma.workoutProgramme.findUnique({
            where: { id: context.programme.id },
        });
        expect(context.programme.trainingFrequency).toBe(4);
        expect(persisted?.trainingFrequency).toBe(6);

        const audits = await testPrisma.auditLog.findMany({
            where: {
                tenantId: actor.tenant.id,
                resourceId: context.programme.id,
                action: "WORKOUT_PROGRAMME_PERFORMANCE_ADAPTATION",
            },
        });
        expect(audits).toHaveLength(2);

        const transitions = audits
            .map(audit => audit.metadata as {
                previousTrainingFrequency: number;
                trainingFrequency: number;
            })
            .map(metadata =>
                `${metadata.previousTrainingFrequency}->${metadata.trainingFrequency}`,
            )
            .sort();

        expect(transitions).toEqual(["4->5", "5->6"]);
    });
});
