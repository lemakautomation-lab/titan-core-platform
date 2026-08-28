import { randomUUID } from "node:crypto";
import { RecordStatus } from "../../domain/enums/record-status.enum";
import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { CreatePerformanceMetricCommand } from "../commands/create-performance-metric.command";

export class CreatePerformanceMetricUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(command: CreatePerformanceMetricCommand) {
    const metric = PerformanceMetric.create({
      id: randomUUID(),
      tenantId: command.tenantId,
      athleteId: command.athleteId,
      sportId: command.sportId,
      name: command.name.trim(),
      slug: command.slug.trim().toLowerCase(),
      description: command.description?.trim() || null,
      unit: command.unit?.trim() || null,
      dataType: command.dataType.trim().toUpperCase(),
      status: RecordStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.repository.create(metric);
  }
}
