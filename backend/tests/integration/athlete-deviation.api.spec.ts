import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/performance-measurements/trends/deviation";
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
    tenantId, firstName: "Deviation", lastName: randomUUID(),
  } });
  const sport = await testPrisma.sport.create({ data: {
    tenantId, name: "Deviation sport", slug: `deviation-${randomUUID()}`,
  } });
  const metric = await testPrisma.performanceMetric.create({ data: {
    tenantId, athleteId: athlete.id, sportId: sport.id,
    name: "Speed", slug: "speed", dataType: "DECIMAL",
  } });
  return { athlete, metric };
}
describe("Mission 073.5 deviation API", () => {
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
  it("requires a ready baseline and a post-baseline effective observation", async () => {
    const user = await tokenFor(["performance-measurements.read"]);
    const ids = await scope(user.tenantId);
    const query = { athleteId: ids.athlete.id, metricId: ids.metric.id };
    const auth = { Authorization: `Bearer ${user.token}` };
    const absent = await request(app).get(path).set(auth).query(query);
    expect(absent.body.data.status).toBe("NO_BASELINE");
    const asOf = new Date(Date.now() - 10 * 86_400_000);
    await testPrisma.athleteBaselineVersion.create({ data: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
      version: 1, status: "INSUFFICIENT_DATA", method: "ARITHMETIC_MEAN",
      lookbackDays: 90, minimumSamples: 3, asOf, sampleCount: 0,
    } });
    expect((await request(app).get(path).set(auth).query(query)).body.data.status).toBe("BASELINE_NOT_READY");
    await testPrisma.athleteBaselineVersion.create({ data: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
      version: 2, status: "READY", method: "ARITHMETIC_MEAN",
      lookbackDays: 90, minimumSamples: 3, asOf, sampleCount: 3, value: 100,
      earliestRecordedAt: new Date(asOf.getTime() - 3 * 86_400_000),
      latestRecordedAt: new Date(asOf.getTime() - 86_400_000),
    } });
    expect((await request(app).get(path).set(auth).query(query)).body.data.status).toBe("NO_NEW_MEASUREMENT");
    const old = await testPrisma.performanceMeasurement.create({ data: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
      value: 120, recordedAt: new Date(Date.now() - 2 * 86_400_000),
    } });
    const current = await request(app).get(path).set(auth).query(query);
    expect(current.body.data).toMatchObject({ status: "DEVIATION", baselineVersion: 2,
      baselineValue: 100, measurementValue: 120, measurementId: old.id, direction: "ABOVE" });
    const broad = await request(app).get(path).set(auth).query({ ...query, relativeThreshold: 0.25 });
    expect(broad.body.data.status).toBe("NO_DEVIATION");
    await testPrisma.performanceMeasurement.create({ data: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
      value: 94, recordedAt: new Date(Date.now() - 86_400_000), correctsMeasurementId: old.id,
    } });
    const corrected = await request(app).get(path).set(auth).query(query);
    expect(corrected.body.data).toMatchObject({ status: "DEVIATION", measurementValue: 94, direction: "BELOW" });
  });
});
