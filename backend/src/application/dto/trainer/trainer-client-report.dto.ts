import { PerformanceMetricDto } from "../performance-metric/performance-metric.dto";
import { PerformanceMeasurementDto } from "../performance-measurement.dto";
import { WorkoutProgrammeDto } from "../workout-programme/workout-programme.dto";
import { TrainerClientMonitoringObservationDto } from "./trainer-client-monitoring.dto";

export interface TrainerClientReportMetricDto {
    metric: PerformanceMetricDto;
    latestMeasurement: PerformanceMeasurementDto | null;
    previousMeasurement: PerformanceMeasurementDto | null;
    measurementCount: number;
}

export interface TrainerClientReportSummaryDto {
    metricCount: number;
    recoveryObservationCount: number;
    trainingStressObservationCount: number;
    workoutProgrammeCount: number;
}

export interface TrainerClientReportDto {
    athleteId: string;
    generatedAt: string;
    summary: TrainerClientReportSummaryDto;
    performance: TrainerClientReportMetricDto[];
    recovery: TrainerClientMonitoringObservationDto[];
    trainingStress: TrainerClientMonitoringObservationDto[];
    workoutProgrammes: WorkoutProgrammeDto[];
}
