import { describe, expect, it, vi } from "vitest";

import { GetTrainerClientAiAssistanceUseCase } from "../../src/application/use-cases/get-trainer-client-ai-assistance.use-case";

describe("Mission 064.9 - Trainer AI assistance", () => {
    const query = {
        tenantId: "tenant-1",
        userId: "trainer-user-1",
        athleteId: "athlete-1",
        limit: 25,
    };

    it("propagates the secured report boundary failure", async () => {
        const report = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: false,
                error: "Active Trainer client relationship is required.",
            }),
        };

        const ai = {
            generate: vi.fn(),
        };

        const result =
            await new GetTrainerClientAiAssistanceUseCase(
                report as never,
                ai,
            ).execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
        expect(ai.generate).not.toHaveBeenCalled();
    });

    it("passes only the secured factual report to the AI port", async () => {
        const factualReport = {
            athleteId: query.athleteId,
            generatedAt: "2026-09-19T10:00:00.000Z",
            summary: {
                metricCount: 0,
                recoveryObservationCount: 0,
                trainingStressObservationCount: 0,
                workoutProgrammeCount: 0,
            },
            performance: [],
            recovery: [],
            trainingStress: [],
            workoutProgrammes: [],
        };

        const report = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: factualReport,
            }),
        };

        const ai = {
            generate: vi.fn().mockResolvedValue({
                assistance: "Review the available client information.",
            }),
        };

        const result =
            await new GetTrainerClientAiAssistanceUseCase(
                report as never,
                ai,
            ).execute(query);

        expect(ai.generate).toHaveBeenCalledTimes(1);
        expect(ai.generate).toHaveBeenCalledWith({
            report: factualReport,
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value?.athleteId).toBe(query.athleteId);
        expect(result.value?.assistance).toBe(
            "Review the available client information.",
        );

        expect(
            Number.isNaN(
                Date.parse(result.value!.generatedAt),
            ),
        ).toBe(false);
    });

    it("fails safely when AI assistance is unavailable", async () => {
        const report = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: {
                    athleteId: query.athleteId,
                },
            }),
        };

        const ai = {
            generate: vi.fn().mockRejectedValue(
                new Error("AI assistance is unavailable."),
            ),
        };

        const result =
            await new GetTrainerClientAiAssistanceUseCase(
                report as never,
                ai,
            ).execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "AI assistance is unavailable.",
        );
    });
});
