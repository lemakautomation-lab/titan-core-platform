import { describe, expect, it, vi } from "vitest";

import { GenerateTrainerAiAssistanceUseCase } from "../../src/application/use-cases/generate-trainer-ai-assistance.use-case";

const input = {
    tenantId: "tenant-1",
    userId: "trainer-user-1",
    athleteId: "11111111-1111-4111-8111-111111111111",
    queryType: "PROGRESS_REPORT" as const,
    acknowledgement: true as const,
    requestId: "request-1",
};

const reportValue = {
    athleteId: input.athleteId,
    generatedAt: "2026-09-30T20:00:00.000Z",
    summary: {
        metricCount: 0,
        recoveryObservationCount: 0,
        trainingStressObservationCount: 0,
        workoutProgrammeCount: 1,
    },
    performance: [],
    recovery: [],
    trainingStress: [],
    workoutProgrammes: [
        {
            id: "programme-1",
            tenantId: input.tenantId,
            athleteId: input.athleteId,
            name: "Private programme name",
            description: "Private programme description",
            goal: "Private goal",
            experience: "Private experience",
            trainingFrequency: 4,
            sessionDurationMinutes: 60,
            sportId: null,
            status: "ACTIVE",
            createdAt: new Date("2026-09-01T00:00:00.000Z"),
            updatedAt: new Date("2026-09-01T00:00:00.000Z"),
        },
    ],
};

function createUseCase(overrides?: {
    report?: ReturnType<typeof vi.fn>;
    schedules?: ReturnType<typeof vi.fn>;
    provider?: ReturnType<typeof vi.fn>;
    audit?: ReturnType<typeof vi.fn>;
}) {
    const report = {
        execute: overrides?.report ?? vi.fn().mockResolvedValue({
            isSuccess: true,
            value: reportValue,
        }),
    };
    const schedules = {
        execute: overrides?.schedules ?? vi.fn().mockResolvedValue({
            isSuccess: true,
            value: [],
        }),
    };
    const provider = {
        generate: overrides?.provider ?? vi.fn().mockResolvedValue({
            summary: "Review the bounded client snapshot.",
            observations: ["One active programme is recorded."],
            considerations: ["Confirm the plan with the client before changes."],
        }),
    };
    const audit = {
        log: overrides?.audit ?? vi.fn().mockResolvedValue({}),
    };

    return {
        report,
        schedules,
        provider,
        audit,
        useCase: new GenerateTrainerAiAssistanceUseCase(
            report as never,
            schedules as never,
            provider,
            audit,
            {
                provider: "OPENAI",
                model: "gpt-test",
                policyVersion: "TITAN-AI-TRAINER-75.8-v1",
            },
            () => new Date("2026-09-30T21:00:00.000Z"),
        ),
    };
}

describe("Mission 075 - Trainer AI assistance use case", () => {
    it("generates from bounded facts and writes a successful audit event", async () => {
        const fixture = createUseCase();

        const result = await fixture.useCase.execute(input);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe("GENERATED");
        expect(fixture.provider.generate).toHaveBeenCalledTimes(1);

        const providerPayload = JSON.stringify(
            (fixture.provider.generate as ReturnType<typeof vi.fn>).mock.calls[0],
        );

        expect(providerPayload).not.toContain("Private programme name");
        expect(providerPayload).not.toContain("Private goal");
        expect(providerPayload).not.toContain(input.athleteId);

        expect(fixture.audit.log).toHaveBeenCalledTimes(1);
        expect(fixture.audit.log).toHaveBeenCalledWith(
            input.tenantId,
            input.userId,
            "AI_TRAINER_ASSISTANCE",
            "AI_TRAINER_ASSISTANT",
            input.athleteId,
            "SUCCESS",
            expect.objectContaining({
                explicitTransferAcknowledgement: true,
                correlationId: input.requestId,
                queryType: "PROGRESS_REPORT",
                outcome: "GENERATED",
                providerInvoked: true,
            }),
        );
    });

    it("does not invoke the provider when requested facts are insufficient", async () => {
        const fixture = createUseCase({
            report: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: {
                    ...reportValue,
                    workoutProgrammes: [],
                },
            }),
        });

        const result = await fixture.useCase.execute({
            ...input,
            queryType: "ADHERENCE",
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe("INSUFFICIENT_DATA");
        expect(fixture.provider.generate).not.toHaveBeenCalled();
        expect(fixture.audit.log).toHaveBeenCalledWith(
            input.tenantId,
            input.userId,
            "AI_TRAINER_ASSISTANCE",
            "AI_TRAINER_ASSISTANT",
            input.athleteId,
            "SUCCESS",
            expect.objectContaining({
                outcome: "INSUFFICIENT_DATA",
                providerInvoked: false,
            }),
        );
    });

    it("preserves the secured Trainer-client authorization boundary", async () => {
        const fixture = createUseCase({
            report: vi.fn().mockResolvedValue({
                isSuccess: false,
                error: "Active Trainer client relationship is required.",
            }),
        });

        const result = await fixture.useCase.execute(input);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
        expect(fixture.provider.generate).not.toHaveBeenCalled();
        expect(fixture.audit.log).toHaveBeenCalledWith(
            input.tenantId,
            input.userId,
            "AI_TRAINER_ASSISTANCE",
            "AI_TRAINER_ASSISTANT",
            input.athleteId,
            "FAILURE",
            expect.objectContaining({
                outcome: "ACCESS_DENIED",
                providerInvoked: false,
            }),
        );
    });

    it("fails closed when required audit persistence fails", async () => {
        const fixture = createUseCase({
            audit: vi.fn().mockRejectedValue(
                new Error("Audit persistence unavailable."),
            ),
        });

        await expect(
            fixture.useCase.execute(input),
        ).rejects.toThrow("Audit persistence unavailable.");
    });
});
