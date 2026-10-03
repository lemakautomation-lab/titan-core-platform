import {
    describe,
    expect,
    it,
} from "vitest";

import { AuditLogStatus } from "../../src/domain/entities/audit-log.entity";
import { Result } from "../../src/application/common/result";
import {
    GeneratePerformanceProfessionalAiAssistanceUseCase,
    type PerformanceProfessionalAiAuditLogger,
} from "../../src/application/use-cases/generate-performance-professional-ai-assistance.use-case";
import type { GetPerformanceProfessionalWorkflowUseCase } from "../../src/application/use-cases/get-performance-professional-workflow.use-case";
import {
    PerformanceProfessionalAiUnavailableError,
    type PerformanceProfessionalAiProvider,
} from "../../src/application/ai-performance-professional/performance-professional-assistance";

const tenantId =
    "11111111-1111-4111-8111-111111111111";

const userId =
    "22222222-2222-4222-8222-222222222222";

const athleteId =
    "33333333-3333-4333-8333-333333333333";

const input = {
    tenantId,
    userId,
    athleteId,
    acknowledgement: true as const,
    requestId:
        "mission-077-correlation-id",
};

const identity = {
    provider: "OPENAI" as const,
    model: "gpt-test",
    policyVersion:
        "TITAN-AI-PERFORMANCE-PROFESSIONAL-77.7-v1",
};

function workflowWithFacts():
    Pick<
        GetPerformanceProfessionalWorkflowUseCase,
        "execute"
    > {
    return {
        execute: async () =>
            Result.success({
                athleteId,
                performance: [
                    {
                        metric: {} as never,
                        measurements: [
                            {} as never,
                        ],
                    },
                ],
                recovery: [],
                trainingStress: [],
                workoutProgrammes: [],
            }),
    };
}

describe(
    "Mission 077 - Performance Professional AI audit safety",
    () => {
        it(
            "records provider failure before propagating the controlled failure",
            async () => {
                const audits: Array<{
                    status: AuditLogStatus;
                    metadata:
                        Record<string, unknown> |
                        null |
                        undefined;
                }> = [];

                const audit:
                    PerformanceProfessionalAiAuditLogger = {
                    async log(
                        _tenantId,
                        _userId,
                        _action,
                        _resource,
                        _resourceId,
                        status,
                        metadata,
                    ) {
                        audits.push({
                            status,
                            metadata,
                        });
                    },
                };

                const provider:
                    PerformanceProfessionalAiProvider = {
                    async generate() {
                        throw new PerformanceProfessionalAiUnavailableError(
                            "PROVIDER_FAILURE",
                        );
                    },
                };

                const useCase =
                    new GeneratePerformanceProfessionalAiAssistanceUseCase(
                        workflowWithFacts(),
                        provider,
                        audit,
                        identity,
                    );

                await expect(
                    useCase.execute(input),
                ).rejects.toMatchObject({
                    reason:
                        "PROVIDER_FAILURE",
                });

                expect(audits)
                    .toHaveLength(1);

                expect(
                    audits[0].status,
                ).toBe(
                    AuditLogStatus.FAILURE,
                );

                expect(
                    audits[0].metadata,
                ).toMatchObject({
                    policyVersion:
                        identity.policyVersion,
                    correlationId:
                        input.requestId,
                    explicitTransferAcknowledgement:
                        true,
                    outcome:
                        "PROVIDER_FAILURE",
                    providerInvoked:
                        true,
                    confidence:
                        "NOT_ASSESSED",
                    professionalReviewRequired:
                        true,
                    automaticAction:
                        false,
                });
            },
        );

        it(
            "rejects invalid provider output and records INVALID_OUTPUT",
            async () => {
                const audits: Array<{
                    status: AuditLogStatus;
                    metadata:
                        Record<string, unknown> |
                        null |
                        undefined;
                }> = [];

                const audit:
                    PerformanceProfessionalAiAuditLogger = {
                    async log(
                        _tenantId,
                        _userId,
                        _action,
                        _resource,
                        _resourceId,
                        status,
                        metadata,
                    ) {
                        audits.push({
                            status,
                            metadata,
                        });
                    },
                };

                const provider:
                    PerformanceProfessionalAiProvider = {
                    async generate() {
                        return {
                            summary:
                                "Incomplete output",
                        };
                    },
                };

                const useCase =
                    new GeneratePerformanceProfessionalAiAssistanceUseCase(
                        workflowWithFacts(),
                        provider,
                        audit,
                        identity,
                    );

                await expect(
                    useCase.execute(input),
                ).rejects.toMatchObject({
                    reason:
                        "INVALID_OUTPUT",
                });

                expect(audits)
                    .toHaveLength(1);

                expect(
                    audits[0].status,
                ).toBe(
                    AuditLogStatus.FAILURE,
                );

                expect(
                    audits[0].metadata,
                ).toMatchObject({
                    outcome:
                        "INVALID_OUTPUT",
                    providerInvoked:
                        true,
                    correlationId:
                        input.requestId,
                });
            },
        );

        it(
            "awaits the audit write before resolving successful assistance",
            async () => {
                let auditStarted = false;
                let releaseAudit:
                    (() => void) |
                    undefined;

                const auditGate =
                    new Promise<void>(
                        resolve => {
                            releaseAudit =
                                resolve;
                        },
                    );

                const audit:
                    PerformanceProfessionalAiAuditLogger = {
                    async log() {
                        auditStarted = true;
                        await auditGate;
                    },
                };

                const provider:
                    PerformanceProfessionalAiProvider = {
                    async generate() {
                        return {
                            summary:
                                "Review the supplied bounded TITAN observations.",
                            observations: [
                                "One bounded performance observation is available.",
                            ],
                            considerations: [
                                "Review it in the Athlete's wider training context.",
                            ],
                        };
                    },
                };

                const useCase =
                    new GeneratePerformanceProfessionalAiAssistanceUseCase(
                        workflowWithFacts(),
                        provider,
                        audit,
                        identity,
                    );

                let resolved = false;

                const execution =
                    useCase
                        .execute(input)
                        .then(result => {
                            resolved = true;
                            return result;
                        });

                await new Promise<void>(
                    resolve =>
                        setTimeout(
                            resolve,
                            0,
                        ),
                );

                expect(
                    auditStarted,
                ).toBe(true);

                expect(
                    resolved,
                ).toBe(false);

                if (!releaseAudit) {
                    throw new Error(
                        "Audit release handle missing.",
                    );
                }

                releaseAudit();

                const result =
                    await execution;

                expect(
                    resolved,
                ).toBe(true);

                expect(
                    result.isSuccess,
                ).toBe(true);

                expect(
                    result.value,
                ).toMatchObject({
                    status:
                        "GENERATED",
                    confidence:
                        "NOT_ASSESSED",
                    professionalReviewRequired:
                        true,
                    automaticAction:
                        false,
                });
            },
        );
    },
);
