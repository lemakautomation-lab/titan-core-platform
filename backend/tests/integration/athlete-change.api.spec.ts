import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/performance-measurements/trends/change";
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
    tenantId, firstName: "Change", lastName: randomUUID(),
  } });
  const sport = await testPrisma.sport.create({ data: {
    tenantId, name: "Change sport", slug: `change-${randomUUID()}`,
  } });
  const metric = await testPrisma.performanceMetric.create({ data: {
    tenantId, athleteId: athlete.id, sportId: sport.id,
    name: "Speed", slug: "speed", dataType: "DECIMAL",
  } });
  return { athlete, metric };
}
describe("Mission 073.3 change API", () => {
  it("requires authentication and read permission", async () => {
    expect((await request(app).get(path)).status).toBe(401);
    const user = await tokenFor(["performance-measurements.create"]);
    expect((await request(app).get(path).set("Authorization", `Bearer ${user.token}`)).status).toBe(403);
  });
  it("rejects supplied tenant and isolates foreign athlete", async () => {
    const owner = await tokenFor(["performance-measurements.read"]);
    const foreign = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(owner.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id };
    expect((await request(app).get(path).set("Authorization", `Bearer ${owner.token}`)
      .query({ ...query, tenantId: owner.tenantId })).status).toBe(400);
    expect((await request(app).get(path).set("Authorization", `Bearer ${owner.token}`)
      .query({ ...query, relativeThreshold: 2 })).status).toBe(400);
    expect((await request(app).get(path).set("Authorization", `Bearer ${foreign.token}`)
      .query(query)).status).toBe(404);
  });
  it("returns sparse data, then a material change above the default 2% threshold", async () => {
    const user = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(user.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id };
    const auth = { Authorization: `Bearer ${user.token}` };
    const empty = await request(app).get(path).set(auth).query(query);
    expect(empty.body.data.status).toBe("INSUFFICIENT_DATA");
    const now = Date.now();
    for (const [daysAgo, value] of [[45, 100], [44, 100], [43, 100], [5, 103], [4, 103], [3, 103]]) {
      await testPrisma.performanceMeasurement.create({ data: {
        tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
        value, recordedAt: new Date(now - daysAgo * 86_400_000),
      } });
    }
    const change = await request(app).get(path).set(auth).query(query);
    expect(change.status).toBe(200);
    expect(change.body.data).toMatchObject({ status: "CHANGE", previousMean: 100,
      currentMean: 103, effectiveThreshold: 2, changeDirection: "INCREASE" });
    const broad = await request(app).get(path).set(auth).query({ ...query, relativeThreshold: 0.05 });
    expect(broad.body.data.status).toBe("NO_CHANGE");
  });
});
