import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const endpoint = "/api/v1/performance-director/command-centre";
const permission = "performance-director.command-centre.read";

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id,
        email: identity.user.email,
        password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 069.1 department command centre", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication and the dedicated permission", async () => {
        expect((await request(app).get(endpoint)).status).toBe(401);
        const other = await createTestUser({ permissions: ["organisations.read"] });
        const token = await tokenFor(other);
        expect((await request(app).get(endpoint).set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });

    it("counts only active records in the actor's assigned organisation", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const outsider = await createTestUser({ tenantId: director.tenant.id });
        const inactive = await createTestUser({ tenantId: director.tenant.id });
        const own = await testPrisma.organisation.create({ data: {
            tenantId: director.tenant.id,
            name: "Director Department",
            slug: `director-department-${director.user.id}`,
        } });
        const other = await testPrisma.organisation.create({ data: {
            tenantId: director.tenant.id,
            name: "Other Department",
            slug: `other-department-${director.user.id}`,
        } });
        await testPrisma.user.update({ where: { id: director.user.id }, data: { organisationId: own.id } });
        await testPrisma.user.update({ where: { id: outsider.user.id }, data: { organisationId: other.id } });
        await testPrisma.user.update({ where: { id: inactive.user.id }, data: {
            organisationId: own.id, status: "INACTIVE",
        } });
        await testPrisma.athlete.create({ data: {
            tenantId: director.tenant.id, organisationId: own.id,
            firstName: "Own", lastName: "Athlete",
        } });
        await testPrisma.athlete.create({ data: {
            tenantId: director.tenant.id, organisationId: other.id,
            firstName: "Other", lastName: "Athlete",
        } });
        await testPrisma.athlete.create({ data: {
            tenantId: director.tenant.id, organisationId: own.id,
            firstName: "Inactive", lastName: "Athlete", status: "INACTIVE",
        } });

        const token = await tokenFor(director);
        const response = await request(app).get(endpoint).set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            organisationId: own.id, organisationName: own.name, staffCount: 1, athleteCount: 1,
        });
    });

    it("does not expose a department without an active assigned organisation", async () => {
        const director = await createTestUser({ permissions: [permission] });
        const token = await tokenFor(director);
        const response = await request(app).get(endpoint).set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Department not found." });
    });
});
