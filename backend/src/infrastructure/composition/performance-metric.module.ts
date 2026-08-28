import { DatabaseService } from "../database/database.service";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";

const databaseService =
  new DatabaseService();

const repository =
  new PrismaPerformanceMetricRepository(
    databaseService,
  );

export const performanceMetricModule = {
  repository,
};
