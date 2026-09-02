import { randomUUID } from "node:crypto";
import { RecordStatus } from "../../domain/enums/record-status.enum";
import {
  PerformanceMetric,
  PerformanceMetricValidationError,
} from "../../domain/entities/performance-metric.entity";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { SportRepository } from "../../domain/repositories/sport.repository";
import { CreatePerformanceMetricCommand } from "../commands/create-performance-metric.command";
import { ValidationException } from "../../shared/exceptions/validation.exception";
import { NotFoundException } from "../../shared/exceptions/not-found.exception";

export class CreatePerformanceMetricUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository,
    private readonly athleteRepository: AthleteRepository,
    private readonly sportRepository: SportRepository,
  ) {}

  async execute(command: CreatePerformanceMetricCommand) {
    const athlete = await this.athleteRepository.findById(
      command.athleteId,
      command.tenantId,
    );

    if (!athlete) {
      throw new NotFoundException("Athlete not found.");
    }

    const sport = await this.sportRepository.findById(
      command.sportId,
      command.tenantId,
    );

    if (!sport) {
      throw new NotFoundException("Sport not found.");
    }

    let metric: PerformanceMetric;

    try {
      metric = PerformanceMetric.create({
        id: randomUUID(),
        tenantId: command.tenantId,
        athleteId: command.athleteId,
        sportId: command.sportId,
        name: command.name.trim(),
        slug: command.slug.trim().toLowerCase(),
        description: command.description,
        unit: command.unit,
        dataType: command.dataType,
        status: RecordStatus.ACTIVE,
        createdAt: new Date(),
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

    return this.repository.create(metric);
  }
}
