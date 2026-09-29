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
import { DetectAthleteDeclineUseCase } from "../../application/use-cases/detect-athlete-decline.use-case";
import { DetectAthletePlateauUseCase } from "../../application/use-cases/detect-athlete-plateau.use-case";
import { DetectAthleteChangeUseCase } from "../../application/use-cases/detect-athlete-change.use-case";
import { DetectAthleteDeviationUseCase } from "../../application/use-cases/detect-athlete-deviation.use-case";

const database = new DatabaseService();
const measurements = new PrismaPerformanceMeasurementRepository(database);
const athletes = new PrismaAthleteRepository(database);
const metrics = new PrismaPerformanceMetricRepository(database);
const correctionTransaction = new PrismaPerformanceMeasurementCorrectionTransaction(database);

export const performanceMeasurementModule = {
    detectImprovementUseCase: new DetectAthleteImprovementUseCase(athletes, metrics, measurements),
    detectDeclineUseCase: new DetectAthleteDeclineUseCase(
        new DetectAthleteImprovementUseCase(athletes, metrics, measurements),
    ),
    detectPlateauUseCase: new DetectAthletePlateauUseCase(
        new DetectAthleteImprovementUseCase(athletes, metrics, measurements),
    ),
    detectChangeUseCase: new DetectAthleteChangeUseCase(
        new DetectAthleteImprovementUseCase(athletes, metrics, measurements),
    ),
    detectDeviationUseCase: new DetectAthleteDeviationUseCase(
        athletes, metrics, measurements, new PrismaAthleteBaselineVersionRepository(database),
    ),
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
