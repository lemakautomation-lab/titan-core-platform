import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";
import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";

async function createAthlete(tenantId: string) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Test",
            lastName: "Athlete",
            dateOfBirth: null,
            status: "ACTIVE",
        },
    });
}

async function createSport(
    tenantId: string,
    name = "Football",
    slug = "football",
) {
    return testPrisma.sport.create({
        data: {
            tenantId,
            name,
            slug,
            status: "ACTIVE",
        },
    });
}

async function login(
    tenantId: string,
    email: string,
    password: string,
) {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            tenantId,
            email,
            password,
        });

    expect(response.status).toBe(200);

    return response.body.data.accessToken as string;
}

describe("Performance Metric API Tenant Isolation and RBAC", () => {

    it(
        "creates, reads, lists, updates and deletes a performance metric within the authenticated tenant",
        async () => {
            const user = await createTestUser({
                permissions: [
                    "performance-metrics.create",
                    "performance-metrics.read",
                    "performance-metrics.update",
                    "performance-metrics.delete",
                ],
            });

            const athlete = await createAthlete(user.tenant.id);
            const sport = await createSport(user.tenant.id);

            const accessToken = await login(
                user.tenant.id,
                user.user.email,
                user.password,
            );

            const createResponse = await request(app)
                .post("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    athleteId: athlete.id,
                    sportId: sport.id,
                    name: "Sprint Speed",
                    slug: "sprint-speed",
                    description: "Maximum sprint speed",
                    unit: "km/h",
                    dataType: "DECIMAL",
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.tenantId).toBe(
                user.tenant.id,
            );
            expect(createResponse.body.athleteId).toBe(
                athlete.id,
            );
            expect(createResponse.body.sportId).toBe(
                sport.id,
            );
            expect(createResponse.body.name).toBe(
                "Sprint Speed",
            );
            expect(createResponse.body.slug).toBe(
                "sprint-speed",
            );

            const metricId = createResponse.body.id;

            const getResponse = await request(app)
                .get(
                    `/api/v1/performance-metrics/${metricId}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.id).toBe(metricId);

            const listResponse = await request(app)
                .get("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(listResponse.status).toBe(200);
            expect(
                listResponse.body.data.some(
                    (item: { id: string }) =>
                        item.id === metricId,
                ),
            ).toBe(true);

            const updateResponse = await request(app)
                .put(
                    `/api/v1/performance-metrics/${metricId}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    name: "Top Speed",
                    slug: "top-speed",
                    description: "Updated maximum speed",
                    unit: "km/h",
                    dataType: "DECIMAL",
                });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.name).toBe(
                "Top Speed",
            );
            expect(updateResponse.body.slug).toBe(
                "top-speed",
            );

            const deleteResponse = await request(app)
                .delete(
                    `/api/v1/performance-metrics/${metricId}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(deleteResponse.status).toBe(204);

            const deletedResponse = await request(app)
                .get(
                    `/api/v1/performance-metrics/${metricId}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(deletedResponse.status).toBe(404);
        },
    );

    it(
        "denies reading a performance metric belonging to another tenant",
        async () => {
            const tenantAUser = await createTestUser({
                permissions: [
                    "performance-metrics.read",
                ],
            });

            const tenantBUser = await createTestUser();

            const athlete = await createAthlete(
                tenantBUser.tenant.id,
            );

            const sport = await createSport(
                tenantBUser.tenant.id,
                "Rugby",
                "rugby",
            );

            const metric =
                await testPrisma.performanceMetric.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        athleteId: athlete.id,
                        sportId: sport.id,
                        name: "Acceleration",
                        slug: "acceleration",
                        description: null,
                        unit: "m/s2",
                        dataType: "DECIMAL",
                        status: "ACTIVE",
                    },
                });

            const accessToken = await login(
                tenantAUser.tenant.id,
                tenantAUser.user.email,
                tenantAUser.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/performance-metrics/${metric.id}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(response.status).toBe(404);
        },
    );

    it(
        "does not list performance metrics belonging to another tenant",
        async () => {
            const tenantAUser = await createTestUser({
                permissions: [
                    "performance-metrics.read",
                ],
            });

            const tenantBUser = await createTestUser();

            const athlete = await createAthlete(
                tenantBUser.tenant.id,
            );

            const sport = await createSport(
                tenantBUser.tenant.id,
            );

            const metric =
                await testPrisma.performanceMetric.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        athleteId: athlete.id,
                        sportId: sport.id,
                        name: "Vertical Jump",
                        slug: "vertical-jump",
                        description: null,
                        unit: "cm",
                        dataType: "DECIMAL",
                        status: "ACTIVE",
                    },
                });

            const accessToken = await login(
                tenantAUser.tenant.id,
                tenantAUser.user.email,
                tenantAUser.password,
            );

            const response = await request(app)
                .get("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

            expect(response.status).toBe(200);
            expect(
                response.body.data.some(
                    (item: { id: string }) =>
                        item.id === metric.id,
                ),
            ).toBe(false);
        },
    );

    it(
        "enforces performance metric permissions",
        async () => {
            const user = await createTestUser();

            const athlete = await createAthlete(
                user.tenant.id,
            );

            const sport = await createSport(
                user.tenant.id,
            );

            const accessToken = await login(
                user.tenant.id,
                user.user.email,
                user.password,
            );

            const response = await request(app)
                .post("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    athleteId: athlete.id,
                    sportId: sport.id,
                    name: "Agility",
                    slug: "agility",
                    description: null,
                    unit: "seconds",
                    dataType: "DECIMAL",
                });

            expect(response.status).toBe(403);
        },
    );

    it(
        "rejects duplicate performance metric slugs within the same athlete and sport",
        async () => {
            const user = await createTestUser({
                permissions: [
                    "performance-metrics.create",
                ],
            });

            const athlete = await createAthlete(
                user.tenant.id,
            );

            const sport = await createSport(
                user.tenant.id,
            );

            const accessToken = await login(
                user.tenant.id,
                user.user.email,
                user.password,
            );

            const firstResponse = await request(app)
                .post("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    athleteId: athlete.id,
                    sportId: sport.id,
                    name: "Bench Press Max",
                    slug: "bench-press-max",
                    description: null,
                    unit: "kg",
                    dataType: "INTEGER",
                });

            expect(firstResponse.status).toBe(201);

            const secondResponse = await request(app)
                .post("/api/v1/performance-metrics")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    athleteId: athlete.id,
                    sportId: sport.id,
                    name: "Bench Press Maximum",
                    slug: "bench-press-max",
                    description: null,
                    unit: "kg",
                    dataType: "INTEGER",
                });

            expect(secondResponse.status).not.toBe(201);
        },
    );

});
