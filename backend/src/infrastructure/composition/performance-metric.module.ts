import { DatabaseService } from "../database/database.service";

import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";

import { CreatePerformanceMetricUseCase } from "../../application/use-cases/create-performance-metric.use-case";
import { GetPerformanceMetricByIdUseCase } from "../../application/use-cases/get-performance-metric-by-id.use-case";
import { ListPerformanceMetricsUseCase } from "../../application/use-cases/list-performance-metrics.use-case";
import { UpdatePerformanceMetricUseCase } from "../../application/use-cases/update-performance-metric.use-case";
import { DeletePerformanceMetricUseCase } from "../../application/use-cases/delete-performance-metric.use-case";

const databaseService =
    new DatabaseService();

const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(
        databaseService,
    );

export const performanceMetricModule = {

    createPerformanceMetricUseCase:
        new CreatePerformanceMetricUseCase(
            performanceMetricRepository,
        ),

    getPerformanceMetricByIdUseCase:
        new GetPerformanceMetricByIdUseCase(
            performanceMetricRepository,
        ),

    listPerformanceMetricsUseCase:
        new ListPerformanceMetricsUseCase(
            performanceMetricRepository,
        ),

    updatePerformanceMetricUseCase:
        new UpdatePerformanceMetricUseCase(
            performanceMetricRepository,
        ),

    deletePerformanceMetricUseCase:
        new DeletePerformanceMetricUseCase(
            performanceMetricRepository,
        ),
};
