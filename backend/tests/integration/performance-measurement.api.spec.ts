import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function login(user: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: user.tenant.id, email: user.user.email, password: user.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

async function scope(tenantId: string, suffix = crypto.randomUUID()) {
    const athlete = await testPrisma.athlete.create({ data: {
        tenantId, firstName: "R5", lastName: suffix,
    } });
    const sport = await testPrisma.sport.create({ data: {
        tenantId, name: `R5 Sport ${suffix}`, slug: `r5-sport-${suffix}`,
    } });
    const metric = await testPrisma.performanceMetric.create({ data: {
        tenantId, athleteId: athlete.id, sportId: sport.id, name: `R5 Metric ${suffix}`,
        slug: `r5-metric-${suffix}`, dataType: "DECIMAL",
    } });
    return { athlete, sport, metric };
}

function observation(ids: { athlete: { id: string }; metric: { id: string } }, sourceObservationId: string, value = 10) {
    return {
        athleteId: ids.athlete.id, metricId: ids.metric.id, value,
        recordedAt: "2026-09-02T12:00:00.000Z", sourceType: "DEVICE",
        sourceId: "r5-device", sourceObservationId,
    };
}

describe("Performance Measurement API", () => {
    it.each([
        ["post", "/api/v1/performance-measurements", {}],
        ["get", "/api/v1/performance-measurements", undefined],
        ["post", `/api/v1/performance-measurements/${crypto.randomUUID()}/corrections`, {}],
    ] as const)("denies unauthenticated %s %s", async (method, path, body) => {
        const call = request(app)[method](path);
        const response = body === undefined ? await call : await call.send(body);
        expect(response.status).toBe(401);
    });

    it.each([
        ["post", "/api/v1/performance-measurements", "performance-measurements.create"],
        ["get", "/api/v1/performance-measurements", "performance-measurements.read"],
        ["post", `/api/v1/performance-measurements/${crypto.randomUUID()}/corrections`, "performance-measurements.correct"],
    ] as const)("denies missing permission and records authorization failure", async (method, path, _permission) => {
        const user = await createTestUser();
        const token = await login(user);
        const before = await testPrisma.securityEvent.count({ where: { userId: user.user.id, eventType: "AUTHORIZATION_FAILURE" } });
        const call = request(app)[method](path).set("Authorization", `Bearer ${token}`);
        const response = method === "post" ? await call.send({}) : await call;
        expect(response.status).toBe(403);
        expect(await testPrisma.securityEvent.count({ where: { userId: user.user.id, eventType: "AUTHORIZATION_FAILURE" } })).toBe(before + 1);
    });

    it("isolates create, read, and correct permissions without cross-permission implication", async () => {
        const createOnly = await createTestUser({ permissions: ["performance-measurements.create"] });
        const readOnly = await createTestUser({ tenantId: createOnly.tenant.id, permissions: ["performance-measurements.read"] });
        const correctOnly = await createTestUser({ tenantId: createOnly.tenant.id, permissions: ["performance-measurements.correct"] });
        const own = await scope(createOnly.tenant.id);
        const original = await testPrisma.performanceMeasurement.create({ data: {
            tenantId: createOnly.tenant.id, athleteId: own.athlete.id, metricId: own.metric.id, value: 10,
            sourceType: "DEVICE", sourceId: "permission-source", sourceObservationId: crypto.randomUUID(),
        } });
        const createToken = await login(createOnly);
        const readToken = await login(readOnly);
        const correctToken = await login(correctOnly);

        expect((await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${createToken}`)
            .send(observation(own, crypto.randomUUID()))).status).toBe(201);
        expect((await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id })
            .set("Authorization", `Bearer ${createToken}`)).status).toBe(403);
        expect((await request(app).post(`/api/v1/performance-measurements/${original.id}/corrections`)
            .set("Authorization", `Bearer ${createToken}`).send({
                athleteId: own.athlete.id, metricId: own.metric.id, value: 11,
                sourceObservationId: crypto.randomUUID(),
            })).status).toBe(403);

        expect((await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id })
            .set("Authorization", `Bearer ${readToken}`)).status).toBe(200);
        expect((await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${readToken}`)
            .send(observation(own, crypto.randomUUID()))).status).toBe(403);
        expect((await request(app).post(`/api/v1/performance-measurements/${original.id}/corrections`)
            .set("Authorization", `Bearer ${readToken}`).send({
                athleteId: own.athlete.id, metricId: own.metric.id, value: 11,
                sourceObservationId: crypto.randomUUID(),
            })).status).toBe(403);

        const correction = await request(app).post(`/api/v1/performance-measurements/${original.id}/corrections`)
            .set("Authorization", `Bearer ${correctToken}`).send({
                athleteId: own.athlete.id, metricId: own.metric.id, value: 11,
                sourceObservationId: crypto.randomUUID(),
            });
        expect(correction.status).toBe(201);
        expect((await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${correctToken}`)
            .send(observation(own, crypto.randomUUID()))).status).toBe(403);
        expect((await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id })
            .set("Authorization", `Bearer ${correctToken}`)).status).toBe(403);

        for (const user of [createOnly, readOnly, correctOnly]) {
            expect(await testPrisma.securityEvent.count({ where: {
                userId: user.user.id, eventType: "AUTHORIZATION_FAILURE",
            } })).toBe(2);
        }
    });

    it("keeps correction authority principal-derived and rejects prohibited authority fields", async () => {
        const actor = await createTestUser({ permissions: ["performance-measurements.correct"] });
        const foreign = await createTestUser();
        const own = await scope(actor.tenant.id);
        const token = await login(actor);
        const originals = await Promise.all([1, 2].map(value =>
            testPrisma.performanceMeasurement.create({ data: {
                tenantId: actor.tenant.id, athleteId: own.athlete.id, metricId: own.metric.id, value,
                sourceType: "DEVICE", sourceId: "authority-source", sourceObservationId: crypto.randomUUID(),
            } }),
        ));
        const acceptedObservationId = crypto.randomUUID();
        const accepted = await request(app).post(`/api/v1/performance-measurements/${originals[0].id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send({
                athleteId: own.athlete.id, metricId: own.metric.id, value: 3,
                sourceObservationId: acceptedObservationId,
                tenantId: foreign.tenant.id, userId: foreign.user.id,
            });
        expect(accepted.status).toBe(201);
        expect(accepted.body.data).toMatchObject({
            sourceType: "USER", sourceId: actor.user.id,
            correctsMeasurementId: originals[0].id,
        });
        const persisted = await testPrisma.performanceMeasurement.findUniqueOrThrow({ where: { id: accepted.body.data.id } });
        expect(persisted.tenantId).toBe(actor.tenant.id);

        const beforeMeasurements = await testPrisma.performanceMeasurement.count();
        const beforeAudits = await testPrisma.auditLog.count({ where: {
            action: "PERFORMANCE_MEASUREMENT_CORRECTION", resource: "PERFORMANCE_MEASUREMENT",
        } });
        const rejected = await request(app).post(`/api/v1/performance-measurements/${originals[1].id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send({
                athleteId: own.athlete.id, metricId: own.metric.id, value: 4,
                sourceObservationId: crypto.randomUUID(), tenantId: foreign.tenant.id,
                userId: foreign.user.id, actorUserId: foreign.user.id,
                sourceType: "DEVICE", sourceId: foreign.user.id,
                correctsMeasurementId: originals[0].id,
            });
        expect(rejected.status).toBe(400);
        expect(await testPrisma.performanceMeasurement.count()).toBe(beforeMeasurements);
        expect(await testPrisma.auditLog.count({ where: {
            action: "PERFORMANCE_MEASUREMENT_CORRECTION", resource: "PERFORMANCE_MEASUREMENT",
        } })).toBe(beforeAudits);
    });

    it("enforces create idempotency, tenant ownership, correction governance, and bounded reads", async () => {
        const user = await createTestUser({ permissions: [
            "performance-measurements.create", "performance-measurements.read", "performance-measurements.correct",
        ] });
        const foreign = await createTestUser();
        const own = await scope(user.tenant.id);
        const ownOther = await scope(user.tenant.id);
        const foreignScope = await scope(foreign.tenant.id);
        const token = await login(user);
        const sourceObservationId = crypto.randomUUID();

        const auditScope = {
            tenantId: user.tenant.id,
            action: "PERFORMANCE_MEASUREMENT_CORRECTION",
            resource: "PERFORMANCE_MEASUREMENT",
        } as const;
        const auditsBeforeCreate = await testPrisma.auditLog.count({ where: auditScope });

        const created = await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...observation(own, sourceObservationId), tenantId: foreign.tenant.id });
        expect(created.status).toBe(201);
        expect(created.body.replayed).toBe(false);
        expect(created.body.data.tenantId).toBeUndefined();
        expect((await testPrisma.performanceMeasurement.findUniqueOrThrow({ where: { id: created.body.data.id } })).tenantId).toBe(user.tenant.id);
        expect(await testPrisma.auditLog.count({ where: auditScope })).toBe(auditsBeforeCreate);

        const replay = await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${token}`).send(observation(own, sourceObservationId));
        expect(replay.status).toBe(200);
        expect(replay.body).toMatchObject({ replayed: true, data: { id: created.body.data.id } });

        const conflict = await request(app).post("/api/v1/performance-measurements")
            .set("Authorization", `Bearer ${token}`).send(observation(own, sourceObservationId, 99));
        expect(conflict.status).toBe(409);
        expect(await testPrisma.performanceMeasurement.count({ where: { tenantId: user.tenant.id, sourceObservationId } })).toBe(1);

        for (const body of [
            observation(foreignScope, crypto.randomUUID()),
            { ...observation(own, crypto.randomUUID()), metricId: foreignScope.metric.id },
            { ...observation(own, crypto.randomUUID()), metricId: ownOther.metric.id },
        ]) {
            expect((await request(app).post("/api/v1/performance-measurements")
                .set("Authorization", `Bearer ${token}`).send(body)).status).toBe(404);
        }

        const correctionBody = {
            athleteId: own.athlete.id, metricId: own.metric.id, value: 11,
            recordedAt: "2026-09-02T13:00:00.000Z", sourceObservationId: crypto.randomUUID(),
        };
        const corrected = await request(app).post(`/api/v1/performance-measurements/${created.body.data.id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send(correctionBody);
        expect(corrected.status).toBe(201);
        expect(corrected.body.data).toMatchObject({
            correctsMeasurementId: created.body.data.id, sourceType: "USER", sourceId: user.user.id,
        });
        expect(corrected.body.data.tenantId).toBeUndefined();
        const correctionAudit = await testPrisma.auditLog.findFirstOrThrow({ where: {
            resourceId: corrected.body.data.id,
            action: "PERFORMANCE_MEASUREMENT_CORRECTION",
            resource: "PERFORMANCE_MEASUREMENT",
        } });
        expect(correctionAudit).toMatchObject({
            tenantId: user.tenant.id,
            userId: user.user.id,
            resourceId: corrected.body.data.id,
            action: "PERFORMANCE_MEASUREMENT_CORRECTION",
            resource: "PERFORMANCE_MEASUREMENT",
        });
        expect(correctionAudit.metadata).toMatchObject({
            originalMeasurementId: created.body.data.id,
            athleteId: own.athlete.id,
            metricId: own.metric.id,
            sourceObservationId: correctionBody.sourceObservationId,
            recordedAt: correctionBody.recordedAt,
        });

        const correctionReplay = await request(app).post(`/api/v1/performance-measurements/${created.body.data.id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send(correctionBody);
        expect(correctionReplay.status).toBe(200);
        expect(correctionReplay.body.data.id).toBe(corrected.body.data.id);
        expect(await testPrisma.auditLog.count({ where: { resourceId: corrected.body.data.id } })).toBe(1);

        const branch = await request(app).post(`/api/v1/performance-measurements/${created.body.data.id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send({ ...correctionBody, sourceObservationId: crypto.randomUUID() });
        expect(branch.status).toBe(409);
        expect(await testPrisma.auditLog.count({ where: { resourceId: corrected.body.data.id } })).toBe(1);

        const identityTarget = await testPrisma.performanceMeasurement.create({ data: {
            tenantId: user.tenant.id, athleteId: own.athlete.id, metricId: own.metric.id, value: 30,
            sourceType: "DEVICE", sourceId: "identity-target", sourceObservationId: crypto.randomUUID(),
        } });
        const collidingObservationId = crypto.randomUUID();
        await testPrisma.performanceMeasurement.create({ data: {
            tenantId: user.tenant.id, athleteId: own.athlete.id, metricId: own.metric.id, value: 31,
            sourceType: "USER", sourceId: user.user.id, sourceObservationId: collidingObservationId,
        } });
        const identityConflict = await request(app).post(`/api/v1/performance-measurements/${identityTarget.id}/corrections`)
            .set("Authorization", `Bearer ${token}`).send({ ...correctionBody, sourceObservationId: collidingObservationId });
        expect(identityConflict.status).toBe(409);
        expect(await testPrisma.auditLog.count({ where: { resourceId: identityTarget.id } })).toBe(0);

        const foreignTarget = await testPrisma.performanceMeasurement.create({ data: {
            tenantId: foreign.tenant.id, athleteId: foreignScope.athlete.id, metricId: foreignScope.metric.id, value: 40,
            sourceType: "DEVICE", sourceId: "foreign-target", sourceObservationId: crypto.randomUUID(),
        } });

        for (const [target, body] of [
            [crypto.randomUUID(), correctionBody],
            [foreignTarget.id, correctionBody],
            [created.body.data.id, { ...correctionBody, athleteId: ownOther.athlete.id }],
            [created.body.data.id, { ...correctionBody, metricId: ownOther.metric.id }],
        ] as const) {
            expect((await request(app).post(`/api/v1/performance-measurements/${target}/corrections`)
                .set("Authorization", `Bearer ${token}`).send(body)).status).toBe(404);
        }

        const raw = await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id, view: "raw", limit: 100 })
            .set("Authorization", `Bearer ${token}`);
        const effective = await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id })
            .set("Authorization", `Bearer ${token}`);
        expect(raw.status).toBe(200);
        const rawIds = raw.body.data.map((row: { id: string }) => row.id);
        const effectiveIds = effective.body.data.map((row: { id: string }) => row.id);
        expect(rawIds).toContain(created.body.data.id);
        expect(rawIds.indexOf(corrected.body.data.id)).toBeLessThan(rawIds.indexOf(created.body.data.id));
        expect(effectiveIds).toContain(corrected.body.data.id);
        expect(effectiveIds).not.toContain(created.body.data.id);
        expect(raw.body.data.every((row: Record<string, unknown>) => row.tenantId === undefined)).toBe(true);
        const auditsBeforeRead = await testPrisma.auditLog.count({ where: auditScope });
        const readAgain = await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: own.athlete.id, metricId: own.metric.id })
            .set("Authorization", `Bearer ${token}`);
        expect(readAgain.status).toBe(200);
        expect(await testPrisma.auditLog.count({ where: auditScope })).toBe(auditsBeforeRead);

        for (const query of [
            { athleteId: own.athlete.id, metricId: own.metric.id, limit: 0 },
            { athleteId: own.athlete.id, metricId: own.metric.id, limit: 101 },
            { athleteId: own.athlete.id, metricId: own.metric.id, limit: 1.5 },
            { athleteId: own.athlete.id, metricId: own.metric.id, view: "latest" },
            { athleteId: own.athlete.id },
        ]) {
            expect((await request(app).get("/api/v1/performance-measurements").query(query)
                .set("Authorization", `Bearer ${token}`)).status).toBe(400);
        }
        expect((await request(app).get("/api/v1/performance-measurements")
            .query({ athleteId: foreignScope.athlete.id, metricId: foreignScope.metric.id })
            .set("Authorization", `Bearer ${token}`)).status).toBe(404);
    });
});
