import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const endpoint = "/api/v1/club/rehabilitation";
const permission = "club.rehabilitation.read";

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id, email: identity.user.email, password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 070.7 club rehabilitation", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication and the dedicated rehabilitation permission", async () => {
        expect((await request(app).get(endpoint)).status).toBe(401);
        const actor = await createTestUser({ permissions: ["performance-professional.rehabilitation.read"] });
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

    it("pages only explicitly assigned active professionals in the actor's active club", async () => {
        const actor = await createTestUser({ permissions: [permission] });
        const tenantId = actor.tenant.id;
        const own = await testPrisma.organisation.create({ data: {
            tenantId, name: "Own club", slug: `own-${randomUUID()}`,
        } });
        const other = await testPrisma.organisation.create({ data: {
            tenantId, name: "Other club", slug: `other-${randomUUID()}`,
        } });
        await testPrisma.user.update({ where: { id: actor.user.id }, data: { organisationId: own.id } });
        const role = await testPrisma.role.create({ data: { tenantId, name: "REHABILITATION_PROFESSIONAL" } });
        const createRehabilitation = async (organisationId: string, status: "ACTIVE" | "INACTIVE" = "ACTIVE") => {
            const identity = await createTestUser({ tenantId });
            await testPrisma.user.update({ where: { id: identity.user.id },
                data: { organisationId, status, firstName: "Named", lastName: "Rehabilitation" },
            });
            await testPrisma.userRole.create({ data: { userId: identity.user.id, roleId: role.id } });
            return identity.user.id;
        };
        const firstId = await createRehabilitation(own.id);
        const secondId = await createRehabilitation(own.id);
        const otherId = await createRehabilitation(other.id);
        await createRehabilitation(own.id, "INACTIVE");
        const noRole = await createTestUser({ tenantId });
        await testPrisma.user.update({ where: { id: noRole.user.id }, data: { organisationId: own.id } });

        const token = await tokenFor(actor);
        const fetchPage = (cursor?: string) => request(app).get(endpoint)
            .query({ limit: "1", ...(cursor ? { cursor } : {}) })
            .set("Authorization", `Bearer ${token}`);
        const first = await fetchPage();
        expect(first.status).toBe(200);
        const ordered = [firstId, secondId].sort();
        expect(first.body).toEqual({ organisationId: own.id,
            rehabilitation: [{ id: ordered[0], name: "Named Rehabilitation" }], nextCursor: ordered[0],
        });
        const second = await fetchPage(first.body.nextCursor);
        expect(second.body.rehabilitation).toEqual([{ id: ordered[1], name: "Named Rehabilitation" }]);
        expect(second.body.nextCursor).toBeNull();
        expect((await fetchPage(otherId)).body).toEqual({ error: "Club page not found." });
    });
});
