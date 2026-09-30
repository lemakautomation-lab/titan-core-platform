import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";
const path = "/api/v1/ai-athlete-assistant/data";
async function actor(permissions: string[] = []) {
    const person = await createTestUser({ permissions });
    const login = await request(app).post("/api/v1/auth/login").send({
        tenantId: person.tenant.id, email: person.user.email, password: person.password,
    });
    expect(login.status).toBe(200);
    return { ...person, auth: { Authorization: `Bearer ${login.body.data.accessToken}` } };
}
async function ownAthlete(person: Awaited<ReturnType<typeof actor>>) {
    return testPrisma.athlete.create({ data: { tenantId: person.tenant.id, userId: person.user.id,
        firstName: "Synthetic", lastName: "Assistant" } });
}
describe("Mission 074.2 authorised assistant retrieval", () => {
    it("requires authentication and personal scope", async () => {
        expect((await request(app).get(path)).status).toBe(401);
        const person = await actor();
        expect((await request(app).get(path).set(person.auth)).status).toBe(404);
        await ownAthlete(person);
        expect((await request(app).get(path).set(person.auth).query({ tenantId: person.tenant.id })).status).toBe(400);
    });
    it("withholds every source without its independent permission", async () => {
        const person = await actor();
        const athlete = await ownAthlete(person);
        const response = await request(app).get(path).set(person.auth);
        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toBe("no-store");
        expect(response.body.data.sources).toEqual({ athleteId: athlete.id,
            training: null, nutrition: null, recovery: null, wearables: null,
            performanceTests: null, goals: null, sportRequirements: null });
    });
    it("returns only permitted own goals, excluding another athlete and tenant", async () => {
        const person = await actor(["athlete-goals.read"]);
        const athlete = await ownAthlete(person);
        const other = await testPrisma.athlete.create({ data: { tenantId: person.tenant.id,
            firstName: "Other", lastName: "Athlete" } });
        const foreign = await actor(["athlete-goals.read"]);
        const foreignAthlete = await ownAthlete(foreign);
        for (const [tenantId, athleteId, classification] of [
            [person.tenant.id, athlete.id, "STRENGTH"],
            [person.tenant.id, other.id, "POWER"],
            [foreign.tenant.id, foreignAthlete.id, "ENDURANCE"],
        ] as const) {
            await testPrisma.athleteGoal.create({ data: { tenantId, athleteId, classification, isPrimary: true } });
        }
        const response = await request(app).get(path).set(person.auth);
        expect(response.status).toBe(200);
        expect(response.body.data.sources.goals).toEqual({ athleteId: athlete.id,
            primaryGoal: "STRENGTH", secondaryGoals: [] });
        expect(response.body.data.sources.training).toBeNull();
        expect((await request(app).get(path).set(person.auth).query({ athleteId: foreignAthlete.id })).status).toBe(400);
        await testPrisma.athlete.update({ where: { id: athlete.id }, data: { status: "INACTIVE" } });
        expect((await request(app).get(path).set(person.auth)).status).toBe(404);
    });
});
