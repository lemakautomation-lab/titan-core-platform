import { PerformanceMeasurement } from "../../domain/entities/performance-measurement/performance-measurement.entity";
import { PerformanceMeasurementCreateOutcome } from "../../domain/repositories/performance-measurement/performance-measurement.repository";

export interface PerformanceMeasurementCorrectionInput {
    measurement: PerformanceMeasurement;
    actorUserId: string;
}

export interface PerformanceMeasurementCorrectionTransaction {
    execute(input: PerformanceMeasurementCorrectionInput): Promise<PerformanceMeasurementCreateOutcome>;
}
