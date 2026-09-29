import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/performance-measurements/trends/context";
async function tokenFor(permissions: string[], tenantId?: string) {
  const person = await createTestUser({ tenantId, permissions });
  const login = await request(app).post("/api/v1/auth/login").send({
    tenantId: person.tenant.id, email: person.user.email, password: person.password,
  });
  expect(login.status).toBe(200);
  return { token: login.body.data.accessToken as string, tenantId: person.tenant.id };
}
async function scope(tenantId: string) {
  const athlete = await testPrisma.athlete.create({ data: {
    tenantId, firstName: "Trend", lastName: randomUUID(),
  } });
  const sport = await testPrisma.sport.create({ data: {
    tenantId, name: "Trend sport", slug: `trend-${randomUUID()}`,
  } });
  const metric = await testPrisma.performanceMetric.create({ data: {
    tenantId, athleteId: athlete.id, sportId: sport.id,
    name: "Time", slug: "time", dataType: "DECIMAL",
  } });
  return { athlete, metric };
}

describe("Mission 073.6 trend context API", () => {
  it("requires authentication and measurement read permission", async () => {
    expect((await request(app).get(path)).status).toBe(401);
    const user = await tokenFor(["performance-measurements.create"]);
    expect((await request(app).get(path).set("Authorization", `Bearer ${user.token}`)).status).toBe(403);
  });
  it("rejects client tenant, missing direction and foreign athlete", async () => {
    const owner = await tokenFor(["performance-measurements.read"]);
    const foreign = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(owner.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id, direction: "LOWER_IS_BETTER" };
    const auth = { Authorization: `Bearer ${owner.token}` };
    expect((await request(app).get(path).set(auth).query({ ...query, tenantId: owner.tenantId })).status).toBe(400);
    expect((await request(app).get(path).set(auth).query({ athleteId: ids.athlete.id, metricId: ids.metric.id })).status).toBe(400);
    expect((await request(app).get(path).set(auth).query({ ...query, windowDays: 0 })).status).toBe(400);
    expect((await request(app).get(path).set("Authorization", `Bearer ${foreign.token}`).query(query)).status).toBe(404);
  });
  it("reports sparse and sufficient sample coverage without a probability claim", async () => {
    const user = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(user.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id, direction: "LOWER_IS_BETTER" };
    const sparse = await request(app).get(path).set("Authorization", `Bearer ${user.token}`).query(query);
    expect(sparse.body.data).toMatchObject({ evidenceLevel: "INSUFFICIENT", comparison: null,
      statisticalConfidence: null });
    const now = Date.now();
    for (const [daysAgo, value] of [[45, 12], [44, 12], [43, 12], [5, 10], [4, 10], [3, 10]]) {
      await testPrisma.performanceMeasurement.create({ data: {
        tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
        value, recordedAt: new Date(now - daysAgo * 86_400_000),
      } });
    }
    const response = await request(app).get(path)
      .set("Authorization", `Bearer ${user.token}`)
      .query(query);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ evidenceLevel: "MINIMUM_COVERAGE",
      evidenceBasis: "SAMPLE_COVERAGE_ONLY", statisticalConfidence: null,
      previousWindow: { sampleCount: 3 }, currentWindow: { sampleCount: 3 },
      comparison: { previousMean: 12, currentMean: 10, signedChange: 2 } });
    expect(await testPrisma.athleteBaselineVersion.count({ where: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
    } })).toBe(0);
  });
});
