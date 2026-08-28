import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { DeletePerformanceMetricCommand } from "../commands/delete-performance-metric.command";

export class DeletePerformanceMetricUseCase {
  constructor(
    private readonly repository: PerformanceMetricRepository
  ) {}

  async execute(command: DeletePerformanceMetricCommand) {
    return this.repository.delete(
      command.id,
      command.tenantId
    );
  }
}
