import {
    explainGuidance,
    guidanceEscalation,
    guidanceLimitations,
    guidanceFacts,
    validateGuidance,
    GuidanceUnavailableError,
    type GuidanceExplanation,
    type GuidanceLimitations,
    type PerformanceGuidanceProvider,
} from "../ai-athlete/performance-guidance";
import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import type { GetMyAiAthleteDataUseCase } from "./get-my-ai-athlete-data.use-case";

const auditAction = "AI_ATHLETE_GUIDANCE";
const auditResource = "AI_ATHLETE_ASSISTANT";

export interface AiGuidanceAuditLogger {
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

export interface AiGuidanceAuditIdentity {
    provider: "OPENAI";
    model: string;
    policyVersion: string;
}

type AuditOutcome = "GENERATED" | "INSUFFICIENT_DATA" | "ATHLETE_NOT_FOUND"
    | "PROVIDER_FAILURE" | "INVALID_OUTPUT";
type AuditCoverage = GuidanceLimitations["coverage"] | "NOT_AVAILABLE";
type AuditSourceState = GuidanceExplanation["sources"]["goals"] | "NOT_EVALUATED";

export class GetMyAiAthleteGuidanceUseCase {
    constructor(
        private readonly data: Pick<GetMyAiAthleteDataUseCase, "execute">,
        private readonly provider: PerformanceGuidanceProvider,
        private readonly audit: AiGuidanceAuditLogger,
        private readonly auditIdentity: AiGuidanceAuditIdentity,
    ) {}

    private async recordAudit(input: Readonly<{
        tenantId: string;
        userId: string;
        consent: true;
        requestId: string;
    }>, details: Readonly<{
        athleteId: string | null;
        status: AuditLogStatus;
        outcome: AuditOutcome;
        coverage: AuditCoverage;
        goalsSource: AuditSourceState;
        trainingSource: AuditSourceState;
        providerInvoked: boolean;
    }>): Promise<void> {
        await this.audit.log(
            input.tenantId,
            input.userId,
            auditAction,
            auditResource,
            details.athleteId,
            details.status,
            {
                schemaVersion: 1,
                policyVersion: this.auditIdentity.policyVersion,
                explicitConsent: input.consent,
                correlationId: input.requestId,
                outcome: details.outcome,
                coverage: details.coverage,
                sources: {
                    goals: details.goalsSource,
                    training: details.trainingSource,
                },
                provider: this.auditIdentity.provider,
                model: this.auditIdentity.model,
                providerInvoked: details.providerInvoked,
            },
        );
    }

    async execute(input: Readonly<{
        tenantId: string;
        userId: string;
        consent: true;
        requestId: string;
    }>) {
        const data = await this.data.execute(input);
        if (!data) {
            await this.recordAudit(input, {
                athleteId: null,
                status: AuditLogStatus.FAILURE,
                outcome: "ATHLETE_NOT_FOUND",
                coverage: "NOT_AVAILABLE",
                goalsSource: "NOT_EVALUATED",
                trainingSource: "NOT_EVALUATED",
                providerInvoked: false,
            });
            return null;
        }

        const facts = guidanceFacts(data.sources);
        const explanation = explainGuidance(data.sources, facts, data.generatedAt);
        const limitations = guidanceLimitations(facts);
        const escalation = guidanceEscalation();
        if (!facts.goals.length && !facts.trainingFrequencies.length) {
            await this.recordAudit(input, {
                athleteId: data.context.athleteId,
                status: AuditLogStatus.SUCCESS,
                outcome: "INSUFFICIENT_DATA",
                coverage: limitations.coverage,
                goalsSource: explanation.sources.goals,
                trainingSource: explanation.sources.training,
                providerInvoked: false,
            });
            return { status: "INSUFFICIENT_DATA" as const, guidance: null, explanation, limitations, escalation, generatedAt: new Date().toISOString() };
        }

        let guidance;
        try {
            guidance = validateGuidance(await this.provider.generate(facts));
        } catch (error) {
            const outcome: AuditOutcome = error instanceof GuidanceUnavailableError
                ? error.reason
                : "PROVIDER_FAILURE";
            await this.recordAudit(input, {
                athleteId: data.context.athleteId,
                status: AuditLogStatus.FAILURE,
                outcome,
                coverage: limitations.coverage,
                goalsSource: explanation.sources.goals,
                trainingSource: explanation.sources.training,
                providerInvoked: true,
            });
            if (error instanceof GuidanceUnavailableError) throw error;
            throw new GuidanceUnavailableError("PROVIDER_FAILURE");
        }

        await this.recordAudit(input, {
            athleteId: data.context.athleteId,
            status: AuditLogStatus.SUCCESS,
            outcome: "GENERATED",
            coverage: limitations.coverage,
            goalsSource: explanation.sources.goals,
            trainingSource: explanation.sources.training,
            providerInvoked: true,
        });
        return { status: "GENERATED" as const, guidance, explanation, limitations, escalation, generatedAt: new Date().toISOString() };
    }
}
