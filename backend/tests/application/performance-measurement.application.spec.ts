import { describe, expect, it, vi } from "vitest";

import {
    CreatePerformanceMeasurementUseCase,
    CreatePerformanceMeasurementCommand,
} from "../../src/application/use-cases/create-performance-measurement.use-case";

import {
    ListRecentPerformanceMeasurementsUseCase,
    ListRecentPerformanceMeasurementsQuery,
} from "../../src/application/use-cases/list-recent-performance-measurements.use-case";

import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../src/domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../src/domain/repositories/performance-measurement/performance-measurement.repository";
import { PerformanceMetric } from "../../src/domain/entities/performance-metric.entity";

const tenantId = "tenant-1";
const athleteId = "athlete-1";
const otherAthleteId = "athlete-2";
const metricId = "metric-1";

function createAthleteRepository(
    athleteIds: string[] = [athleteId],
): AthleteRepository {

    return {
        findById: vi.fn(
            async (
                id: string,
                requestedTenantId: string,
            ) => {

                if (
                    requestedTenantId !== tenantId ||
                    !athleteIds.includes(id)
                ) {
                    return null;
                }

                return {
                    id,
                    tenantId: requestedTenantId,
                } as never;
            },
        ),
    } as unknown as AthleteRepository;
}

function createMetricRepository(
    metricAthleteId: string = athleteId,
): PerformanceMetricRepository {

    return {
        findById: vi.fn(
            async (
                id: string,
                requestedTenantId: string,
            ) => {

                if (
                    requestedTenantId !== tenantId ||
                    id !== metricId
                ) {
                    return null;
                }

                return PerformanceMetric.create({
                    id,
                    tenantId: requestedTenantId,
                    athleteId: metricAthleteId,
                    sportId: "sport-1",
                    name: "Sprint Speed",
                    slug: "sprint-speed",
                    description: null,
                    unit: "m/s",
                    dataType: "NUMBER",
                    status: "ACTIVE" as never,
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
                });
            },
        ),
    } as unknown as PerformanceMetricRepository;
}

function createMeasurementRepository(
    measurements: PerformanceMeasurement[] = [],
): PerformanceMeasurementRepository {

    return {
        create: vi.fn(
            async (
                measurement: PerformanceMeasurement,
            ) => {

                measurements.push(measurement);

                return measurement;
            },
        ),

        listRecentForMetric: vi.fn(
            async (
                requestedTenantId: string,
                requestedAthleteId: string,
                requestedMetricId: string,
                limit: number,
            ) => {

                return measurements
                    .filter(
                        (measurement) =>
                            measurement.tenantId === requestedTenantId &&
                            measurement.athleteId === requestedAthleteId &&
                            measurement.metricId === requestedMetricId,
                    )
                    .slice(0, limit);
            },
        ),
    } as unknown as PerformanceMeasurementRepository;
}

describe(
    "Performance Measurement Application Boundary",
    () => {

        it(
            "creates a measurement for a valid athlete and metric",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const useCase =
                    new CreatePerformanceMeasurementUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(),
                    );

                const recordedAt =
                    new Date("2026-08-31T10:00:00.000Z");

                const command:
                    CreatePerformanceMeasurementCommand = {
                        tenantId,
                        athleteId,
                        metricId,
                        value: 12.3456,
                        recordedAt,
                    };

                const result =
                    await useCase.execute(command);

                expect(result.isSuccess).toBe(true);
                expect(result.value).toBeDefined();
                expect(result.value?.tenantId).toBe(tenantId);
                expect(result.value?.athleteId).toBe(athleteId);
                expect(result.value?.metricId).toBe(metricId);
                expect(result.value?.value).toBe(12.3456);
                expect(result.value?.recordedAt).toEqual(recordedAt);

                expect(
                    measurementRepository.create,
                ).toHaveBeenCalledTimes(1);
            },
        );

        it(
            "rejects creation when the athlete does not exist",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const athleteRepository =
                    createAthleteRepository([]);

                const metricRepository =
                    createMetricRepository();

                const useCase =
                    new CreatePerformanceMeasurementUseCase(
                        measurementRepository,
                        athleteRepository,
                        metricRepository,
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        value: 10,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe("Athlete not found.");

                expect(
                    measurementRepository.create,
                ).not.toHaveBeenCalled();

                expect(
                    metricRepository.findById,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects creation when the performance metric does not exist",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const metricRepository = {
                    findById: vi.fn(
                        async () => null,
                    ),
                } as unknown as PerformanceMetricRepository;

                const useCase =
                    new CreatePerformanceMeasurementUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        metricRepository,
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        value: 10,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe("Performance metric not found.");

                expect(
                    measurementRepository.create,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects creation when the metric belongs to another athlete",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const useCase =
                    new CreatePerformanceMeasurementUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(otherAthleteId),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        value: 10,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Performance metric does not belong to athlete.",
                    );

                expect(
                    measurementRepository.create,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "propagates domain validation failures as application failures",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const useCase =
                    new CreatePerformanceMeasurementUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        value: Number.NaN,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Performance measurement value must be finite.",
                    );

                expect(
                    measurementRepository.create,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects a non-positive recent-measurement limit",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const useCase =
                    new ListRecentPerformanceMeasurementsUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(),
                    );

                const query:
                    ListRecentPerformanceMeasurementsQuery = {
                        tenantId,
                        athleteId,
                        metricId,
                        limit: 0,
                    };

                const result =
                    await useCase.execute(query);

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Performance measurement limit must be positive.",
                    );

                expect(
                    measurementRepository.listRecentForMetric,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "lists recent measurements using tenant, athlete and metric scope",
            async () => {

                const measurements = [
                    new PerformanceMeasurement(
                        "measurement-1",
                        tenantId,
                        athleteId,
                        metricId,
                        10,
                        new Date("2026-08-31T12:00:00.000Z"),
                        new Date("2026-08-31T12:00:01.000Z"),
                    ),
                    new PerformanceMeasurement(
                        "measurement-2",
                        tenantId,
                        athleteId,
                        metricId,
                        11,
                        new Date("2026-08-31T13:00:00.000Z"),
                        new Date("2026-08-31T13:00:01.000Z"),
                    ),
                ];

                const measurementRepository =
                    createMeasurementRepository(
                        measurements,
                    );

                const useCase =
                    new ListRecentPerformanceMeasurementsUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        limit: 2,
                    });

                expect(result.isSuccess).toBe(true);
                expect(result.value).toHaveLength(2);

                expect(
                    measurementRepository.listRecentForMetric,
                ).toHaveBeenCalledWith(
                    tenantId,
                    athleteId,
                    metricId,
                    2,
                );
            },
        );

        it(
            "rejects listing when the metric belongs to another athlete",
            async () => {

                const measurementRepository =
                    createMeasurementRepository();

                const useCase =
                    new ListRecentPerformanceMeasurementsUseCase(
                        measurementRepository,
                        createAthleteRepository(),
                        createMetricRepository(otherAthleteId),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        metricId,
                        limit: 10,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Performance metric does not belong to athlete.",
                    );

                expect(
                    measurementRepository.listRecentForMetric,
                ).not.toHaveBeenCalled();
            },
        );

    },
);
