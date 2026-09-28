import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const path = "/api/v1/performance-measurements/baselines";
async function tokenFor(permissions: string[], tenantId?: string) {
  const person = await createTestUser({ tenantId, permissions });
  const response = await request(app).post("/api/v1/auth/login").send({
    tenantId: person.tenant.id, email: person.user.email, password: person.password,
  });
  expect(response.status).toBe(200);
  return { token: response.body.data.accessToken as string, tenantId: person.tenant.id };
}
async function metricScope(tenantId: string) {
  const athlete = await testPrisma.athlete.create({ data: {
    tenantId, firstName: "Baseline", lastName: randomUUID(),
  } });
  const sport = await testPrisma.sport.create({ data: {
    tenantId, name: "Baseline sport", slug: `baseline-${randomUUID()}`,
  } });
  const metric = await testPrisma.performanceMetric.create({ data: {
    tenantId, athleteId: athlete.id, sportId: sport.id,
    name: "Speed", slug: "speed", dataType: "DECIMAL",
  } });
  return { athlete, metric };
}

describe("Mission 072 baseline API", () => {
  it("requires authentication and both read and create permissions", async () => {
    expect((await request(app).post(path).send({})).status).toBe(401);
    const onlyRead = await tokenFor(["performance-measurements.read"]);
    expect((await request(app).post(path)
      .set("Authorization", `Bearer ${onlyRead.token}`).send({})).status).toBe(403);
    const onlyCreate = await tokenFor(["performance-measurements.create"]);
    expect((await request(app).post(path)
      .set("Authorization", `Bearer ${onlyCreate.token}`).send({})).status).toBe(403);
  });

  it("rejects client-supplied scope and invalid policy", async () => {
    const user = await tokenFor(["performance-measurements.create", "performance-measurements.read"]);
    const headers = { Authorization: `Bearer ${user.token}` };
    expect((await request(app).post(path).set(headers).send({
      athleteId: "a", metricId: "m", tenantId: user.tenantId,
    })).status).toBe(400);
    expect((await request(app).post(path).set(headers).send({
      athleteId: "a", metricId: "m", minimumSamples: 1,
    })).status).toBe(400);
  });

  it("isolates foreign athletes and reports insufficient data without a value", async () => {
    const owner = await tokenFor(["performance-measurements.create", "performance-measurements.read"]);
    const foreign = await tokenFor(["performance-measurements.create", "performance-measurements.read"]);
    const ids = await metricScope(owner.tenantId);
    const body = { athleteId: ids.athlete.id, metricId: ids.metric.id };
    expect((await request(app).post(path)
      .set("Authorization", `Bearer ${foreign.token}`).send(body)).status).toBe(404);
    const response = await request(app).post(path)
      .set("Authorization", `Bearer ${owner.token}`).send(body);
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      tenantId: owner.tenantId, athleteId: ids.athlete.id,
      metricId: ids.metric.id, version: 1, status: "INSUFFICIENT_DATA",
      sampleCount: 0, requiredSamples: 3,
    });
    expect(response.body.data.value).toBeUndefined();
  });

  it("creates a calculated version from effective numeric history", async () => {
    const user = await tokenFor(["performance-measurements.create", "performance-measurements.read"]);
    const ids = await metricScope(user.tenantId);
    for (const value of [10, 20, 30]) {
      await testPrisma.performanceMeasurement.create({ data: {
        tenantId: user.tenantId, athleteId: ids.athlete.id,
        metricId: ids.metric.id, value,
        recordedAt: new Date(Date.now() - 86_400_000),
      } });
    }
    const response = await request(app).post(path)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ athleteId: ids.athlete.id, metricId: ids.metric.id });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: "READY", value: 20, sampleCount: 3, version: 1,
    });
    expect(await testPrisma.athleteBaselineVersion.count({ where: {
      tenantId: user.tenantId, athleteId: ids.athlete.id, metricId: ids.metric.id,
    } })).toBe(1);
  });
});
