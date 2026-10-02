import {
    describe,
    expect,
    it,
} from "vitest";

import {
    GenerateCoachAiAssistanceUseCase,
    type CoachAiAuditLogger,
} from "../../src/application/use-cases/generate-coach-ai-assistance.use-case";
import {
    type CoachAiAssistanceProvider,
} from "../../src/application/ai-coach/coach-assistance";
import { Result } from "../../src/application/common/result";
import { AuditLogStatus } from "../../src/domain/entities/audit-log.entity";
import type { GetCoachAthleteMonitoringUseCase } from "../../src/application/use-cases/get-coach-athlete-monitoring.use-case";
import type { GetCoachSquadPerformanceDashboardUseCase } from "../../src/application/use-cases/get-coach-squad-performance-dashboard.use-case";
import type { GetCoachSquadTeamTrendsUseCase } from "../../src/application/use-cases/get-coach-squad-team-trends.use-case";
import type { GetCoachSquadTrainingLoadUseCase } from "../../src/application/use-cases/get-coach-squad-training-load.use-case";

describe("Mission 076 - Generate Coach AI assistance", () => {
    it("generates bounded training support and records a privacy-safe audit", async () => {
        const auditEvents:
            Array<{
                action: string;
                resource: string;
                status: AuditLogStatus;
                metadata:
                    Record<string, unknown> |
                    null |
                    undefined;
            }> = [];

        const audit: CoachAiAuditLogger = {
            async log(
                _tenantId,
                _userId,
                action,
                resource,
                _resourceId,
                status,
                metadata,
            ) {
                auditEvents.push({
                    action,
                    resource,
                    status,
                    metadata,
                });
            },
        };

        const provider:
            CoachAiAssistanceProvider = {
                async generate() {
                    return {
                        summary:
                            "Training support requires Coach review.",
                        observations: [
                            "A bounded active programme is available.",
                        ],
                        considerations: [
                            "Review the programme before making changes.",
                        ],
                    };
                },
            };

        const unusedDashboard = {
            execute: async () =>
                Result.failure("unused"),
        } as unknown as
            Pick<GetCoachSquadPerformanceDashboardUseCase, "execute">;

        const unusedTrends = {
            execute: async () =>
                Result.failure("unused"),
        } as unknown as
            Pick<GetCoachSquadTeamTrendsUseCase, "execute">;

        const unusedLoad = {
            execute: async () =>
                Result.failure("unused"),
        } as unknown as
            Pick<GetCoachSquadTrainingLoadUseCase, "execute">;

        const monitoring = {
            execute: async () =>
                Result.success({
                    athleteId:
                        "11111111-1111-4111-8111-111111111111",
                    performance: [],
                    recovery: [],
                    trainingStress: [],
                    workoutProgrammes: [{
                        id:
                            "22222222-2222-4222-8222-222222222222",
                        tenantId:
                            "33333333-3333-4333-8333-333333333333",
                        athleteId:
                            "11111111-1111-4111-8111-111111111111",
                        name: "Private",
                        description: null,
                        goal: "Private goal",
                        experience:
                            "INTERMEDIATE",
                        trainingFrequency: 4,
                        sessionDurationMinutes: 60,
                        sportId: null,
                        status: "ACTIVE",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }],
                }),
        } as unknown as
            Pick<GetCoachAthleteMonitoringUseCase, "execute">;

        const useCase =
            new GenerateCoachAiAssistanceUseCase(
                unusedDashboard,
                unusedTrends,
                unusedLoad,
                monitoring,
                provider,
                audit,
                {
                    provider: "OPENAI",
                    model: "gpt-test",
                    policyVersion:
                        "TITAN-AI-COACH-76.7-test",
                },
                () =>
                    new Date(
                        "2026-10-01T08:00:00.000Z",
                    ),
            );

        const result =
            await useCase.execute({
                tenantId:
                    "33333333-3333-4333-8333-333333333333",
                userId:
                    "44444444-4444-4444-8444-444444444444",
                targetId:
                    "11111111-1111-4111-8111-111111111111",
                targetType: "ATHLETE",
                queryType:
                    "TRAINING_SUPPORT",
                acknowledgement: true,
                requestId:
                    "55555555-5555-4555-8555-555555555555",
            });

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe(
            "GENERATED",
        );

        expect(auditEvents).toHaveLength(1);
        expect(auditEvents[0]).toMatchObject({
            action:
                "AI_COACH_ASSISTANCE",
            resource:
                "AI_COACH_ASSISTANT",
            status:
                AuditLogStatus.SUCCESS,
        });
        expect(
            auditEvents[0].metadata,
        ).toMatchObject({
            queryType:
                "TRAINING_SUPPORT",
            targetType: "ATHLETE",
            outcome: "GENERATED",
            providerInvoked: true,
            explicitTransferAcknowledgement:
                true,
        });

        const metadata =
            JSON.stringify(
                auditEvents[0].metadata,
            );

        expect(metadata)
            .not.toContain("Private goal");
        expect(metadata)
            .not.toContain(
                "Training support requires Coach review.",
            );
    });
});
