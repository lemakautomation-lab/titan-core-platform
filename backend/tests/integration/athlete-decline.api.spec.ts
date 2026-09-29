import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/performance-measurements/trends/decline";
async function tokenFor(permissions: string[]) {
  const person = await createTestUser({ permissions });
  const login = await request(app).post("/api/v1/auth/login").send({
    tenantId: person.tenant.id, email: person.user.email, password: person.password,
  });
  expect(login.status).toBe(200);
  return { token: login.body.data.accessToken as string, tenantId: person.tenant.id };
}
async function scope(tenantId: string) {
  const athlete = await testPrisma.athlete.create({ data: {
    tenantId, firstName: "Decline", lastName: randomUUID(),
  } });
  const sport = await testPrisma.sport.create({ data: {
    tenantId, name: "Decline sport", slug: `decline-${randomUUID()}`,
  } });
  const metric = await testPrisma.performanceMetric.create({ data: {
    tenantId, athleteId: athlete.id, sportId: sport.id,
    name: "Speed", slug: "speed", dataType: "DECIMAL",
  } });
  return { athlete, metric };
}

describe("Mission 073.2 decline API", () => {
  it("requires authentication and read permission", async () => {
    expect((await request(app).get(path)).status).toBe(401);
    const user = await tokenFor(["performance-measurements.create"]);
    expect((await request(app).get(path).set("Authorization", `Bearer ${user.token}`)).status).toBe(403);
  });
  it("enforces policy and tenant ownership", async () => {
    const owner = await tokenFor(["performance-measurements.read"]);
    const foreign = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(owner.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id, direction: "HIGHER_IS_BETTER" };
    expect((await request(app).get(path).set("Authorization", `Bearer ${owner.token}`)
      .query({ ...query, tenantId: owner.tenantId })).status).toBe(400);
    expect((await request(app).get(path).set("Authorization", `Bearer ${foreign.token}`)
      .query(query)).status).toBe(404);
  });
  it("returns insufficient data, then detects decline with the same signed comparison", async () => {
    const user = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(user.tenantId);
    const auth = { Authorization: `Bearer ${user.token}` };
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id, direction: "HIGHER_IS_BETTER" };
    const empty = await request(app).get(path).set(auth).query(query);
    expect(empty.status).toBe(200);
    expect(empty.body.data.status).toBe("INSUFFICIENT_DATA");
    const now = Date.now();
    for (const [daysAgo, value] of [[45, 12], [44, 12], [43, 12], [5, 10], [4, 10], [3, 10]]) {
      await testPrisma.performanceMeasurement.create({ data: {
        tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
        value, recordedAt: new Date(now - daysAgo * 86_400_000),
      } });
    }
    const decline = await request(app).get(path).set(auth).query(query);
    expect(decline.status).toBe(200);
    expect(decline.body.data).toMatchObject({ status: "DECLINE", signedChange: -2,
      previousMean: 12, currentMean: 10, previousCount: 3, currentCount: 3 });
    const opposite = await request(app).get(path).set(auth)
      .query({ ...query, direction: "LOWER_IS_BETTER" });
    expect(opposite.body.data.status).toBe("NO_DECLINE");
  });
});
