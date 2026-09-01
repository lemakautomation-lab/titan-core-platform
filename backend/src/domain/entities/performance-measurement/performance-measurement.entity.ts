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
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        metricId: string,
        value: number,
        recordedAt?: Date,
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

        return new PerformanceMeasurement(
            randomUUID(),
            tenantId,
            athleteId,
            metricId,
            value,
            effectiveRecordedAt,
            new Date(),
        );
    }
}
