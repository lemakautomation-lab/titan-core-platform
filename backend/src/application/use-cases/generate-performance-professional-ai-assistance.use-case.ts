import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import {
    buildPerformanceProfessionalAiFacts,
    explainPerformanceProfessionalAiFacts,
    hasPerformanceProfessionalAiFacts,
    performanceProfessionalAiLimitations,
    validatePerformanceProfessionalAiAssistance,
    PerformanceProfessionalAiUnavailableError,
    type PerformanceProfessionalAiProvider,
    type PerformanceProfessionalAiResult,
} from "../ai-performance-professional/performance-professional-assistance";
import { Result } from "../common/result";
import type { GetPerformanceProfessionalWorkflowUseCase } from "./get-performance-professional-workflow.use-case";

const auditAction =
    "AI_PERFORMANCE_PROFESSIONAL_ASSISTANCE";
const auditResource =
    "AI_PERFORMANCE_PROFESSIONAL_ASSISTANT";

export interface PerformanceProfessionalAiAuditLogger {
    log(
        tenantId: string,
        userId: string | null,
        action: string,
        resource: string,
        resourceId: string | null,
        status: AuditLogStatus,
        metadata?: Record<string, unknown> | null,
    ): Promise<unknown>;
}

export interface PerformanceProfessionalAiAuditIdentity {
    provider: "OPENAI";
    model: string;
    policyVersion: string;
}

type AuditOutcome =
    | "GENERATED"
    | "INSUFFICIENT_DATA"
    | "WORKFLOW_DENIED"
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export class GeneratePerformanceProfessionalAiAssistanceUseCase {
    constructor(
        private readonly workflow:
            Pick<
                GetPerformanceProfessionalWorkflowUseCase,
                "execute"
            >,
        private readonly provider:
            PerformanceProfessionalAiProvider,
        private readonly audit:
            PerformanceProfessionalAiAuditLogger,
        private readonly auditIdentity:
            PerformanceProfessionalAiAuditIdentity,
        private readonly now:
            () => Date = () => new Date(),
    ) {}

    private async recordAudit(
        input: Readonly<{
            tenantId: string;
            userId: string;
            athleteId: string;
            acknowledgement: true;
            requestId: string;
        }>,
        details: Readonly<{
            status: AuditLogStatus;
            outcome: AuditOutcome;
            providerInvoked: boolean;
            performanceAvailable: boolean;
            recoveryAvailable: boolean;
            trainingStressAvailable: boolean;
            programmesAvailable: boolean;
        }>,
    ): Promise<void> {
        await this.audit.log(
            input.tenantId,
            input.userId,
            auditAction,
            auditResource,
            input.athleteId,
            details.status,
            {
                schemaVersion: 1,
                policyVersion:
                    this.auditIdentity.policyVersion,
                explicitTransferAcknowledgement:
                    input.acknowledgement,
                correlationId:
                    input.requestId,
                outcome:
                    details.outcome,
                coverage: {
                    performance:
                        details.performanceAvailable,
                    recovery:
                        details.recoveryAvailable,
                    trainingStress:
                        details.trainingStressAvailable,
                    programmes:
                        details.programmesAvailable,
                },
                confidence:
                    "NOT_ASSESSED",
                professionalReviewRequired:
                    true,
                automaticAction:
                    false,
                provider:
                    this.auditIdentity.provider,
                model:
                    this.auditIdentity.model,
                providerInvoked:
                    details.providerInvoked,
            },
        );
    }

    async execute(
        input: Readonly<{
            tenantId: string;
            userId: string;
            athleteId: string;
            acknowledgement: true;
            requestId: string;
        }>,
    ): Promise<
        Result<PerformanceProfessionalAiResult>
    > {
        const workflowResult =
            await this.workflow.execute({
                tenantId: input.tenantId,
                userId: input.userId,
                athleteId: input.athleteId,
                limit: 12,
            });

        if (
            !workflowResult.isSuccess ||
            !workflowResult.value
        ) {
            await this.recordAudit(input, {
                status: AuditLogStatus.FAILURE,
                outcome: "WORKFLOW_DENIED",
                providerInvoked: false,
                performanceAvailable: false,
                recoveryAvailable: false,
                trainingStressAvailable: false,
                programmesAvailable: false,
            });

            return Result.failure(
                workflowResult.error ??
                    "Athlete workflow could not be loaded.",
            );
        }

        const facts =
            buildPerformanceProfessionalAiFacts(
                workflowResult.value,
            );

        const retrievedAt =
            this.now().toISOString();

        const explanation =
            explainPerformanceProfessionalAiFacts(
                facts,
                retrievedAt,
            );

        const limitations =
            performanceProfessionalAiLimitations();

        const coverage = {
            performanceAvailable:
                facts.performanceMeasurementCount > 0,
            recoveryAvailable:
                facts.recovery.length > 0,
            trainingStressAvailable:
                facts.trainingStress.length > 0,
            programmesAvailable:
                facts.workoutProgrammeCount > 0,
        };

        if (
            !hasPerformanceProfessionalAiFacts(facts)
        ) {
            await this.recordAudit(input, {
                status: AuditLogStatus.SUCCESS,
                outcome: "INSUFFICIENT_DATA",
                providerInvoked: false,
                ...coverage,
            });

            return Result.success({
                status: "INSUFFICIENT_DATA",
                assistance: null,
                confidence: "NOT_ASSESSED",
                professionalReviewRequired: true,
                automaticAction: false,
                explanation,
                limitations,
                generatedAt:
                    this.now().toISOString(),
            });
        }

        let assistance;

        try {
            assistance =
                validatePerformanceProfessionalAiAssistance(
                    await this.provider.generate(facts),
                );
        }
        catch (error) {
            const unavailable =
                error instanceof
                PerformanceProfessionalAiUnavailableError
                    ? error
                    : new PerformanceProfessionalAiUnavailableError(
                        "PROVIDER_FAILURE",
                    );

            await this.recordAudit(input, {
                status: AuditLogStatus.FAILURE,
                outcome: unavailable.reason,
                providerInvoked: true,
                ...coverage,
            });

            throw unavailable;
        }

        await this.recordAudit(input, {
            status: AuditLogStatus.SUCCESS,
            outcome: "GENERATED",
            providerInvoked: true,
            ...coverage,
        });

        return Result.success({
            status: "GENERATED",
            assistance,
            confidence: "NOT_ASSESSED",
            professionalReviewRequired: true,
            automaticAction: false,
            explanation,
            limitations,
            generatedAt:
                this.now().toISOString(),
        });
    }
}
