import { describe, expect, it, vi } from "vitest";

import { GetTrainerClientReportUseCase } from "../../src/application/use-cases/get-trainer-client-report.use-case";

describe("Mission 064.8 - Trainer client reports", () => {
    const query = {
        tenantId: "tenant-1",
        userId: "trainer-user-1",
        athleteId: "athlete-1",
        limit: 25,
    };

    it("propagates monitoring authorization failure", async () => {
        const monitoring = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: false,
                error: "Active Trainer client relationship is required.",
            }),
        };

        const result =
            await new GetTrainerClientReportUseCase(
                monitoring as never,
            ).execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
    });

    it("creates a factual report from monitoring data", async () => {
        const latest = {
            id: "measurement-2",
            value: 12,
        };

        const previous = {
            id: "measurement-1",
            value: 10,
        };

        const monitoring = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: {
                    athleteId: query.athleteId,
                    performance: [{
                        metric: {
                            id: "metric-1",
                            name: "Metric",
                        },
                        measurements: [
                            latest,
                            previous,
                        ],
                    }],
                    recovery: [{ id: "recovery-1" }],
                    trainingStress: [{ id: "stress-1" }],
                    workoutProgrammes: [{ id: "programme-1" }],
                },
            }),
        };

        const result =
            await new GetTrainerClientReportUseCase(
                monitoring as never,
            ).execute(query);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.athleteId).toBe(
            query.athleteId,
        );

        expect(result.value?.summary).toEqual({
            metricCount: 1,
            recoveryObservationCount: 1,
            trainingStressObservationCount: 1,
            workoutProgrammeCount: 1,
        });

        expect(result.value?.performance[0]).toMatchObject({
            latestMeasurement: latest,
            previousMeasurement: previous,
            measurementCount: 2,
        });

        expect(
            Number.isNaN(
                Date.parse(result.value!.generatedAt),
            ),
        ).toBe(false);
    });

    it("reports missing measurements without inventing conclusions", async () => {
        const monitoring = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: {
                    athleteId: query.athleteId,
                    performance: [{
                        metric: {
                            id: "metric-1",
                            name: "Metric",
                        },
                        measurements: [],
                    }],
                    recovery: [],
                    trainingStress: [],
                    workoutProgrammes: [],
                },
            }),
        };

        const result =
            await new GetTrainerClientReportUseCase(
                monitoring as never,
            ).execute(query);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.performance[0]).toMatchObject({
            latestMeasurement: null,
            previousMeasurement: null,
            measurementCount: 0,
        });
    });
});
