import crypto from "crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permissions = [
    "coach-squads.read",
    "performance-measurements.read",
];

async function login(
    user: Awaited<ReturnType<typeof createTestUser>>,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            tenantId: user.tenant.id,
            email: user.user.email,
            password: user.password,
        });

    expect(response.status).toBe(200);

    return response.body.data.accessToken as string;
}

describe("Mission 067.6 role/tenant-scoped comparisons", () => {
    it("requires both tenant-scoped comparison permissions", async () => {
        const squadOnly = await createTestUser({
            permissions: ["coach-squads.read"],
        });

        const performanceOnly = await createTestUser({
            tenantId: squadOnly.tenant.id,
            permissions: ["performance-measurements.read"],
        });

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: squadOnly.tenant.id,
                coachUserId: squadOnly.user.id,
                name: "067.6 RBAC Squad",
            },
        });

        for (const user of [squadOnly, performanceOnly]) {
            const token = await login(user);

            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squad.id}/individual-comparison`,
                )
                .query({
                    athleteAId: crypto.randomUUID(),
                    athleteBId: crypto.randomUUID(),
                })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        }
    });

    it("does not expose another coach or another tenant comparison scope", async () => {
        const coach = await createTestUser({ permissions });

        const sameTenantCoach = await createTestUser({
            tenantId: coach.tenant.id,
            permissions,
        });

        const foreignTenantCoach = await createTestUser({
            permissions,
        });

        const sameTenantForeignOwner =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coach.tenant.id,
                    coachUserId: sameTenantCoach.user.id,
                    name: "067.6 Other Coach",
                },
            });

        const foreignTenantSquad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: foreignTenantCoach.tenant.id,
                    coachUserId: foreignTenantCoach.user.id,
                    name: "067.6 Foreign Tenant",
                },
            });

        const token = await login(coach);

        for (
            const squadId of [
                sameTenantForeignOwner.id,
                foreignTenantSquad.id,
            ]
        ) {
            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squadId}/individual-comparison`,
                )
                .query({
                    athleteAId: crypto.randomUUID(),
                    athleteBId: crypto.randomUUID(),
                })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        }
    });
});