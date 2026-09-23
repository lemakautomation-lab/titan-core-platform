import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const endpoint = "/api/v1/performance-director/teams";
const permission = "performance-director.teams.read";

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id, email: identity.user.email,
        password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 069.3 authorised cross-team visibility", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication and the dedicated teams permission", async () => {
        expect((await request(app).get(endpoint)).status).toBe(401);
        const director = await createTestUser({
            permissions: ["performance-director.command-centre.read"],
        });
        const token = await tokenFor(director);
        expect((await request(app).get(endpoint).set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });

    it("validates the page request and hides absent or unassigned departments", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const token = await tokenFor(director);
        for (const query of [{ limit: "0" }, { limit: "101" }, { limit: "1.5" }, { cursor: "invalid" }]) {
            expect((await request(app).get(endpoint).query(query)
                .set("Authorization", `Bearer ${token}`)).status).toBe(400);
        }
        const response = await request(app).get(endpoint).set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Department page not found." });
    });

    it("pages active teams across coaches in the same organisation only", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const tenantId = director.tenant.id;
        const coachA = await createTestUser({ tenantId });
        const coachB = await createTestUser({ tenantId });
        const outsider = await createTestUser({ tenantId });
        const inactiveCoach = await createTestUser({ tenantId });
        const foreign = await createTestUser();
        const own = await testPrisma.organisation.create({ data: {
            tenantId, name: "Own", slug: `own-${randomUUID()}`,
        } });
        const other = await testPrisma.organisation.create({ data: {
            tenantId, name: "Other", slug: `other-${randomUUID()}`,
        } });
        for (const user of [director, coachA, coachB, inactiveCoach]) {
            await testPrisma.user.update({ where: { id: user.user.id },
                data: { organisationId: own.id },
            });
        }
        await testPrisma.user.update({ where: { id: outsider.user.id },
            data: { organisationId: other.id },
        });
        await testPrisma.user.update({ where: { id: inactiveCoach.user.id },
            data: { status: "INACTIVE" },
        });
        const team = (name: string, coachUserId: string, scope = tenantId, status: "ACTIVE" | "INACTIVE" = "ACTIVE") =>
            testPrisma.coachTeam.create({ data: { tenantId: scope, coachUserId, name, status } });

        const a = await team("A team", coachA.user.id);
        const b = await team("B team", coachB.user.id);
        const c = await team("C team", coachA.user.id);
        const outside = await team("Outside", outsider.user.id);
        await team("Inactive coach", inactiveCoach.user.id);
        await team("Inactive team", coachA.user.id, tenantId, "INACTIVE");
        await team("Foreign tenant", foreign.user.id, foreign.tenant.id);

        const token = await tokenFor(director);
        const fetchPage = (cursor?: string) => request(app).get(endpoint)
            .query({ limit: "1", ...(cursor ? { cursor } : {}) })
            .set("Authorization", `Bearer ${token}`);
        const first = await fetchPage();
        expect(first.status).toBe(200);
        expect(first.body).toEqual({
            organisationId: own.id, teams: [{ id: a.id, name: a.name }], nextCursor: a.id,
        });
        const second = await fetchPage(first.body.nextCursor);
        expect(second.status).toBe(200);
        expect(second.body).toEqual({
            organisationId: own.id, teams: [{ id: b.id, name: b.name }], nextCursor: b.id,
        });
        const third = await fetchPage(second.body.nextCursor);
        expect(third.status).toBe(200);
        expect(third.body).toEqual({
            organisationId: own.id, teams: [{ id: c.id, name: c.name }], nextCursor: null,
        });
        const foreignCursor = await fetchPage(outside.id);
        expect(foreignCursor.status).toBe(404);
        expect(foreignCursor.body).toEqual({ error: "Department page not found." });
    });
});
