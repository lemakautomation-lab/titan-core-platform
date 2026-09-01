import { describe, expect, it, vi } from "vitest";

import { AdaptWorkoutProgrammeFromPerformanceUseCase } from "../../src/application/use-cases/adapt-workout-programme-from-performance.use-case";
import { AdaptWorkoutProgrammeFromPerformanceCommand } from "../../src/application/commands/adapt-workout-programme-from-performance.command";
import { WorkoutProgramme } from "../../src/domain/entities/workout-programme.entity";
import { PerformanceMetric } from "../../src/domain/entities/performance-metric.entity";
import { PerformanceMeasurement } from "../../src/domain/entities/performance-measurement/performance-measurement.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { WorkoutProgrammeRepository } from "../../src/domain/repositories/workout-programme.repository";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../src/domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../src/domain/repositories/performance-measurement/performance-measurement.repository";
import { WorkoutProgrammePerformanceAdaptationTransaction } from "../../src/application/ports/workout-programme-performance-adaptation.transaction";

const tenantId = "tenant-1";
const actorUserId = "user-1";
const athleteId = "athlete-1";
const metricId = "metric-1";
const programmeId = "programme-1";

function createFixture(overrides?: {
    programmeAthleteId?: string;
    metricAthleteId?: string;
    measurement?: PerformanceMeasurement | null;
}) {
    const programme = new WorkoutProgramme(
        programmeId,
        tenantId,
        overrides?.programmeAthleteId ?? athleteId,
        "Strength",
        null,
        "Strength",
        "Intermediate",
        4,
        60,
        null,
        RecordStatus.ACTIVE,
        new Date("2026-01-01T00:00:00.000Z"),
        new Date("2026-01-01T00:00:00.000Z"),
    );

    const metric = PerformanceMetric.create({
        id: metricId,
        tenantId,
        athleteId: overrides?.metricAthleteId ?? athleteId,
        sportId: "sport-1",
        name: "Sprint speed",
        slug: "sprint-speed",
        unit: "m/s",
        dataType: "NUMBER",
        status: RecordStatus.ACTIVE,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const measurement = overrides?.measurement === undefined
        ? new PerformanceMeasurement(
            "measurement-1",
            tenantId,
            athleteId,
            metricId,
            12.5,
            new Date("2026-08-31T10:00:00.000Z"),
            new Date("2026-08-31T10:00:01.000Z"),
        )
        : overrides.measurement;

    const workoutRepository = {
        findById: vi.fn(async () => programme),
    } as unknown as WorkoutProgrammeRepository;

    const athleteRepository = {
        findById: vi.fn(async (id: string, requestedTenantId: string) =>
            id === athleteId && requestedTenantId === tenantId
                ? { id, tenantId: requestedTenantId }
                : null,
        ),
    } as unknown as AthleteRepository;

    const metricRepository = {
        findById: vi.fn(async () => metric),
    } as unknown as PerformanceMetricRepository;

    const measurementRepository = {
        listRecentForMetric: vi.fn(
            async () => measurement ? [measurement] : [],
        ),
    } as unknown as PerformanceMeasurementRepository;

    const adaptationTransaction = {
        execute: vi.fn(async (input) => {
            programme.adaptFromPerformance(
                input.trainingFrequencyDelta,
                input.sessionDurationMinutesDelta,
            );
            return programme;
        }),
    } as WorkoutProgrammePerformanceAdaptationTransaction;

    return {
        useCase: new AdaptWorkoutProgrammeFromPerformanceUseCase(
            workoutRepository,
            athleteRepository,
            metricRepository,
            measurementRepository,
            adaptationTransaction,
        ),
        workoutRepository,
        measurementRepository,
        adaptationTransaction,
    };
}

function command(overrides: Partial<{
    trainingFrequencyDelta: number;
    sessionDurationMinutesDelta: number;
}> = {}) {
    return new AdaptWorkoutProgrammeFromPerformanceCommand(
        programmeId,
        tenantId,
        actorUserId,
        athleteId,
        metricId,
        overrides.trainingFrequencyDelta ?? 1,
        overrides.sessionDurationMinutesDelta ?? 15,
        "Authorised adjustment after reviewed sprint measurement.",
    );
}

describe("Athlete performance adaptation application boundary", () => {
    it("applies bounded deltas using verified evidence and writes an audit log", async () => {
        const fixture = createFixture();

        const result = await fixture.useCase.execute(command());

        expect(result.isSuccess).toBe(true);
        expect(result.value?.trainingFrequency).toBe(5);
        expect(result.value?.sessionDurationMinutes).toBe(75);
        expect(fixture.adaptationTransaction.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                programmeId,
                tenantId,
                actorUserId,
                athleteId,
                metricId,
                measurementId: "measurement-1",
                trainingFrequencyDelta: 1,
                sessionDurationMinutesDelta: 15,
            }),
        );
        expect(fixture.measurementRepository.listRecentForMetric)
            .toHaveBeenCalledWith(tenantId, athleteId, metricId, 1);
    });

    it("rejects an out-of-bounds adjustment before repository access", async () => {
        const fixture = createFixture();

        const result = await fixture.useCase.execute(command({
            trainingFrequencyDelta: 2,
        }));

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Training frequency delta must be -1, 0 or 1.",
        );
        expect(fixture.workoutRepository.findById).not.toHaveBeenCalled();
        expect(fixture.adaptationTransaction.execute).not.toHaveBeenCalled();
    });

    it("rejects a programme belonging to another athlete", async () => {
        const fixture = createFixture({
            programmeAthleteId: "athlete-2",
        });

        const result = await fixture.useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Workout Programme does not belong to athlete.",
        );
        expect(fixture.adaptationTransaction.execute).not.toHaveBeenCalled();
    });

    it("rejects a metric belonging to another athlete", async () => {
        const fixture = createFixture({ metricAthleteId: "athlete-2" });

        const result = await fixture.useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Performance metric does not belong to athlete.",
        );
        expect(fixture.adaptationTransaction.execute).not.toHaveBeenCalled();
    });

    it("requires recent measurement evidence", async () => {
        const fixture = createFixture({ measurement: null });

        const result = await fixture.useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Recent performance measurement evidence is required.",
        );
        expect(fixture.adaptationTransaction.execute).not.toHaveBeenCalled();
    });

    it("defensively rejects incorrectly scoped measurement evidence", async () => {
        const fixture = createFixture({
            measurement: new PerformanceMeasurement(
                "measurement-2",
                "tenant-2",
                athleteId,
                metricId,
                12,
                new Date("2026-08-31T10:00:00.000Z"),
                new Date("2026-08-31T10:00:01.000Z"),
            ),
        });

        const result = await fixture.useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Performance measurement evidence is invalid.",
        );
        expect(fixture.adaptationTransaction.execute).not.toHaveBeenCalled();
    });
});
