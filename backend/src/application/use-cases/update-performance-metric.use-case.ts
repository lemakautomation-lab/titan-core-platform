import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { UpdatePerformanceMetricCommand } from "../commands/update-performance-metric.command";
import { PerformanceMetricDto } from "../dto/performance-metric/performance-metric.dto";
import { PerformanceMetricMapper } from "../mappers/performance-metric.mapper";

export class UpdatePerformanceMetricUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(
    command: UpdatePerformanceMetricCommand,
  ): Promise<PerformanceMetricDto> {

    const metric = await this.repository.findById(
      command.id,
      command.tenantId,
    );

    if (!metric) {
      throw new Error("Performance metric not found");
    }

    const updated = PerformanceMetric.create({
      id: metric.id,
      tenantId: metric.tenantId,
      athleteId: metric.athleteId,
      sportId: metric.sportId,
      name: command.name?.trim() ?? metric.name,
      slug: command.slug?.trim().toLowerCase() ?? metric.slug,
      description:
        command.description === undefined
          ? metric.description
          : command.description,
      unit:
        command.unit === undefined
          ? metric.unit
          : command.unit,
      dataType:
        command.dataType?.trim().toUpperCase() ??
        metric.dataType,
      status: metric.status,
      createdAt: metric.createdAt,
      updatedAt: new Date(),
    });

    const result = await this.repository.update(updated);

    return PerformanceMetricMapper.toDto(result);
  }
}
