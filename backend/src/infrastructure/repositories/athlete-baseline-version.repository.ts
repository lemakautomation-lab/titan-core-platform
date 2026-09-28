import { randomUUID } from "node:crypto";
import type { BaselineDefinition } from "../../domain/entities/athlete-baseline/baseline-definition";
import type { BaselineCalculationResult } from "../../domain/services/athlete-baseline-calculator.service";
import type { AthleteBaselineVersionRepository } from "../../domain/repositories/athlete-baseline-version.repository";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteBaselineVersionRepository implements AthleteBaselineVersionRepository {
  constructor(private readonly database: DatabaseService) {}

  async append(definition: BaselineDefinition, asOf: Date, result: BaselineCalculationResult) {
    return this.database.transaction(async tx => {
      // Same athlete/metric scope is serialized even when two workers append concurrently.
      const scope = `${definition.tenantId}:${definition.athleteId}:${definition.metricId}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${scope}, 0))::text`;
      const last = await tx.athleteBaselineVersion.findFirst({
        where: {
          tenantId: definition.tenantId,
          athleteId: definition.athleteId,
          metricId: definition.metricId,
        },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const version = (last?.version ?? 0) + 1;
      const row = await tx.athleteBaselineVersion.create({
        data: {
          id: randomUUID(),
          tenantId: definition.tenantId,
          athleteId: definition.athleteId,
          metricId: definition.metricId,
          version,
          status: result.status,
          method: definition.method,
          lookbackDays: definition.lookbackDays,
          minimumSamples: definition.minimumSamples,
          asOf,
          sampleCount: result.sampleCount,
          value: result.status === "READY" ? result.value : null,
          earliestRecordedAt: result.status === "READY" ? result.earliestRecordedAt : null,
          latestRecordedAt: result.status === "READY" ? result.latestRecordedAt : null,
        },
        select: { id: true, version: true },
      });
      return row;
    });
  }
}
