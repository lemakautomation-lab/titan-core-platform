import { PerformanceMeasurement } from "../../domain/entities/performance-measurement/performance-measurement.entity";
import { PerformanceMeasurementDto } from "../dto/performance-measurement.dto";

export const PerformanceMeasurementMapper = {
    toDto(measurement: PerformanceMeasurement): PerformanceMeasurementDto {
        return {
            id: measurement.id,
            athleteId: measurement.athleteId,
            metricId: measurement.metricId,
            value: measurement.value,
            recordedAt: measurement.recordedAt.toISOString(),
            createdAt: measurement.createdAt.toISOString(),
            sourceType: measurement.sourceType,
            sourceId: measurement.sourceId,
            sourceObservationId: measurement.sourceObservationId,
            correctsMeasurementId: measurement.correctsMeasurementId,
        };
    },
};
