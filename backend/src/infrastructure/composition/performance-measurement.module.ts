import { DatabaseService } from "../database/database.service";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";
import { PrismaPerformanceMeasurementCorrectionTransaction } from "../transactions/performance-measurement-correction.transaction";
import { CreatePerformanceMeasurementUseCase } from "../../application/use-cases/create-performance-measurement.use-case";
import { CreatePerformanceMeasurementCorrectionUseCase } from "../../application/use-cases/create-performance-measurement-correction.use-case";
import { ListRecentPerformanceMeasurementsUseCase } from "../../application/use-cases/list-recent-performance-measurements.use-case";
import { CreateAthleteBaselineUseCase } from "../../application/use-cases/create-athlete-baseline.use-case";
import { PrismaAthleteBaselineVersionRepository } from "../repositories/athlete-baseline-version.repository";
import { DetectAthleteImprovementUseCase } from "../../application/use-cases/detect-athlete-improvement.use-case";

const database = new DatabaseService();
const measurements = new PrismaPerformanceMeasurementRepository(database);
const athletes = new PrismaAthleteRepository(database);
const metrics = new PrismaPerformanceMetricRepository(database);
const correctionTransaction = new PrismaPerformanceMeasurementCorrectionTransaction(database);

export const performanceMeasurementModule = {
    detectImprovementUseCase: new DetectAthleteImprovementUseCase(athletes, metrics, measurements),
    createUseCase: new CreatePerformanceMeasurementUseCase(measurements, athletes, metrics),
    createCorrectionUseCase: new CreatePerformanceMeasurementCorrectionUseCase(
        measurements, athletes, metrics, correctionTransaction,
    ),
    listUseCase: new ListRecentPerformanceMeasurementsUseCase(measurements, athletes, metrics),
    createBaselineUseCase: new CreateAthleteBaselineUseCase(
        athletes, metrics, measurements,
        new PrismaAthleteBaselineVersionRepository(database),
    ),
};
