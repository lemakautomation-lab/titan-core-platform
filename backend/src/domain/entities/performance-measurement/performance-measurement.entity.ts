import { randomUUID } from "crypto";

export class PerformanceMeasurement {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly metricId: string,
        public readonly value: number,
        public readonly recordedAt: Date,
        public readonly createdAt: Date,
        public readonly sourceType: string | null = null,
        public readonly sourceId: string | null = null,
        public readonly sourceObservationId: string | null = null,
        public readonly correctsMeasurementId: string | null = null,
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        metricId: string,
        value: number,
        recordedAt?: Date,
        sourceType?: string,
        sourceId?: string,
        sourceObservationId?: string,
        correctsMeasurementId?: string | null,
    ): PerformanceMeasurement {

        if (!tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        if (!metricId?.trim()) {
            throw new Error("Metric ID is required.");
        }

        if (
            typeof value !== "number" ||
            !Number.isFinite(value)
        ) {
            throw new Error(
                "Performance measurement value must be finite.",
            );
        }

        const effectiveRecordedAt =
            recordedAt ?? new Date();

        if (Number.isNaN(effectiveRecordedAt.getTime())) {
            throw new Error(
                "Performance measurement date is invalid.",
            );
        }

        const provenance = [sourceType, sourceId, sourceObservationId];
        if (provenance.some(value => !value?.trim())) {
            throw new Error("Complete performance measurement provenance is required.");
        }

        return new PerformanceMeasurement(
            randomUUID(),
            tenantId,
            athleteId,
            metricId,
            value,
            effectiveRecordedAt,
            new Date(),
            sourceType!.trim(),
            sourceId!.trim(),
            sourceObservationId!.trim(),
            correctsMeasurementId?.trim() || null,
        );
    }
}
