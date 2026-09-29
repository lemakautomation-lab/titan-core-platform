import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/ai-athlete-assistant/context";
async function actor() {
    const person = await createTestUser();
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: person.tenant.id, email: person.user.email, password: person.password,
    });
    expect(response.status).toBe(200);
    return { ...person, auth: { Authorization: `Bearer ${response.body.data.accessToken}` } };
}
async function athlete(person: Awaited<ReturnType<typeof actor>>) {
    return testPrisma.athlete.create({ data: { tenantId: person.tenant.id,
        userId: person.user.id, firstName: "Assistant", lastName: randomUUID() } });
}

describe("Mission 074.1 personal assistant context", () => {
    it("requires authentication", async () => {
        expect((await request(app).get(path)).status).toBe(401);
    });
    it("returns only the signed-in athlete context without source data or generated advice", async () => {
        const person = await actor();
        const own = await athlete(person);
        const other = await actor();
        await athlete(other);
        const response = await request(app).get(path).set(person.auth);
        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toBe("no-store");
        expect(response.body.data).toEqual({ athleteId: own.id, contextVersion: 1,
            purpose: "PERFORMANCE_SUPPORT", accessMode: "SELF", generationAvailable: false });
    });
    it("rejects supplied tenant, athlete, user and prompt identifiers", async () => {
        const person = await actor();
        await athlete(person);
        for (const key of ["tenantId", "athleteId", "userId", "prompt"]) {
            expect((await request(app).get(path).set(person.auth).query({ [key]: randomUUID() })).status).toBe(400);
        }
    });
    it("conceals missing and inactive athlete scopes", async () => {
        const person = await actor();
        const other = await actor();
        await athlete(other);
        expect((await request(app).get(path).set(person.auth)).status).toBe(404);
        const own = await athlete(person);
        await testPrisma.athlete.update({ where: { id: own.id }, data: { status: "INACTIVE" } });
        expect((await request(app).get(path).set(person.auth)).status).toBe(404);
        await testPrisma.athlete.update({ where: { id: own.id }, data: { status: "ACTIVE" } });
        await testPrisma.user.update({ where: { id: person.user.id }, data: { status: "INACTIVE" } });
        expect((await request(app).get(path).set(person.auth)).status).toBe(404);
    });
});
