import { PerformanceMetricDto } from "../performance-metric/performance-metric.dto";
import { PerformanceMeasurementDto } from "../performance-measurement.dto";
import { WorkoutProgrammeDto } from "../workout-programme/workout-programme.dto";

export interface TrainerClientMonitoringObservationDto {
    id: string;
    athleteId: string;
    value: number;
    recordedAt: string;
    createdAt: string;
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
}

export interface TrainerClientPerformanceMetricMonitoringDto {
    metric: PerformanceMetricDto;
    measurements: PerformanceMeasurementDto[];
}

export interface TrainerClientMonitoringDto {
    athleteId: string;
    performance: TrainerClientPerformanceMetricMonitoringDto[];
    recovery: TrainerClientMonitoringObservationDto[];
    trainingStress: TrainerClientMonitoringObservationDto[];
    workoutProgrammes: WorkoutProgrammeDto[];
}
