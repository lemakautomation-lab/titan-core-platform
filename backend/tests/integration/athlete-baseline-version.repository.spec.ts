import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { defineAthleteBaseline } from "../../src/domain/entities/athlete-baseline/baseline-definition";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteBaselineVersionRepository } from "../../src/infrastructure/repositories/athlete-baseline-version.repository";
import { testPrisma } from "../helpers/prisma-test.client";

describe("Mission 072.4 immutable version allocation", () => {
  it("allocates sequential versions and rejects a foreign-tenant metric", async () => {
    const tenantId = randomUUID();
    const foreignTenantId = randomUUID();
    const athleteId = randomUUID();
    const sportId = randomUUID();
    const metricId = randomUUID();
    await testPrisma.tenant.create({ data: { id: tenantId, name: "Baseline version", slug: `baseline-version-${tenantId}` } });
    await testPrisma.tenant.create({ data: { id: foreignTenantId, name: "Other tenant", slug: `baseline-version-${foreignTenantId}` } });
    await testPrisma.athlete.create({ data: { id: athleteId, tenantId, firstName: "Version", lastName: "Athlete" } });
    await testPrisma.sport.create({ data: { id: sportId, tenantId, name: "Version sport", slug: `baseline-version-${sportId}` } });
    await testPrisma.performanceMetric.create({ data: {
      id: metricId, tenantId, athleteId, sportId, name: "Speed", slug: "speed", dataType: "DECIMAL",
    } });
    const definition = defineAthleteBaseline({
      tenantId, athleteId, metricId, lookbackDays: 90,
      minimumSamples: 3, method: "ARITHMETIC_MEAN",
    });
    const repo = new PrismaAthleteBaselineVersionRepository(new DatabaseService());
    const asOf = new Date("2026-09-28T12:00:00.000Z");
    const result = { status: "INSUFFICIENT_DATA" as const, sampleCount: 0, requiredSamples: 3 };
    const first = await repo.append(definition, asOf, result);
    const second = await repo.append(definition, asOf, result);
    expect([first.version, second.version]).toEqual([1, 2]);
    expect(await testPrisma.athleteBaselineVersion.count({
      where: { tenantId, athleteId, metricId },
    })).toBe(2);
    await expect(repo.append(
      defineAthleteBaseline({ ...definition, tenantId: foreignTenantId }),
      asOf, result,
    )).rejects.toThrow();
  });
});
