import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const endpoint = "/api/v1/club/athletes";
const permission = "club.athletes.read";

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id, email: identity.user.email, password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 070.9 club Athlete roster", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication and the independent Athlete roster permission", async () => {
        expect((await request(app).get(endpoint)).status).toBe(401);
        const actor = await createTestUser({ permissions: ["club.teams.read"] });
        const token = await tokenFor(actor);
        expect((await request(app).get(endpoint).set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });

    it("validates pagination and hides a missing club", async () => {
        const actor = await createTestUser({ permissions: [permission] });
        const token = await tokenFor(actor);
        for (const query of [{ limit: "0" }, { limit: "101" }, { limit: "1.5" }, { cursor: "invalid" }]) {
            expect((await request(app).get(endpoint).query(query)
                .set("Authorization", `Bearer ${token}`)).status).toBe(400);
        }
        expect((await request(app).get(endpoint).set("Authorization", `Bearer ${token}`)).body)
            .toEqual({ error: "Club page not found." });
    });

    it("pages only active Athletes directly assigned to the actor's club", async () => {
        const actor = await createTestUser({ permissions: [permission] });
        const tenantId = actor.tenant.id;
        const own = await testPrisma.organisation.create({ data: {
            tenantId, name: "Own club", slug: `own-${randomUUID()}`,
        } });
        const other = await testPrisma.organisation.create({ data: {
            tenantId, name: "Other club", slug: `other-${randomUUID()}`,
        } });
        await testPrisma.user.update({ where: { id: actor.user.id }, data: { organisationId: own.id } });
        const createAthlete = (organisationId: string | null, status: "ACTIVE" | "INACTIVE" = "ACTIVE") =>
            testPrisma.athlete.create({ data: {
                tenantId, organisationId, firstName: "Named", lastName: "Athlete", status,
            } });
        const a = await createAthlete(own.id);
        const b = await createAthlete(own.id);
        const otherAthlete = await createAthlete(other.id);
        await createAthlete(own.id, "INACTIVE");
        await createAthlete(null);
        const foreign = await createTestUser();
        await testPrisma.athlete.create({ data: {
            tenantId: foreign.tenant.id, organisationId: own.id,
            firstName: "Foreign", lastName: "Athlete",
        } });

        const token = await tokenFor(actor);
        const fetchPage = (cursor?: string) => request(app).get(endpoint)
            .query({ limit: "1", ...(cursor ? { cursor } : {}) })
            .set("Authorization", `Bearer ${token}`);
        const ordered = [a.id, b.id].sort();
        const first = await fetchPage();
        expect(first.status).toBe(200);
        expect(first.body).toEqual({ organisationId: own.id,
            athletes: [{ id: ordered[0], name: "Named Athlete" }], nextCursor: ordered[0],
        });
        const second = await fetchPage(first.body.nextCursor);
        expect(second.status).toBe(200);
        expect(second.body.athletes).toEqual([{ id: ordered[1], name: "Named Athlete" }]);
        expect(second.body.nextCursor).toBeNull();
        expect((await fetchPage(otherAthlete.id)).body).toEqual({ error: "Club page not found." });
    });
});
