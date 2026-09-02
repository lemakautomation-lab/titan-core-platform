import {
  PerformanceMetricValidationError,
} from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { UpdatePerformanceMetricCommand } from "../commands/update-performance-metric.command";
import { PerformanceMetricDto } from "../dto/performance-metric/performance-metric.dto";
import { PerformanceMetricMapper } from "../mappers/performance-metric.mapper";
import { NotFoundException } from "../../shared/exceptions/not-found.exception";
import { ValidationException } from "../../shared/exceptions/validation.exception";

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
      throw new NotFoundException("Performance metric not found");
    }

    let updated;

    try {
      updated = metric.updateDetails({
        name: command.name,
        slug: command.slug,
        description: command.description,
        unit: command.unit,
        dataType: command.dataType,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof PerformanceMetricValidationError) {
        throw new ValidationException([{
          field: error.field,
          message: error.message,
        }]);
      }

      throw error;
    }

    const result = await this.repository.update(updated);

    return PerformanceMetricMapper.toDto(result);
  }
}
