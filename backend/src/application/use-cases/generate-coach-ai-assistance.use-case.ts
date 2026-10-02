import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import {
    buildCoachAthleteAiFacts,
    buildCoachSquadAiFacts,
    coachAiLimitations,
    explainCoachAiFacts,
    hasFactsForCoachAiQuery,
    validateCoachAiAssistance,
    CoachAiUnavailableError,
    type CoachAiAssistanceProvider,
    type CoachAiAssistanceResult,
    type CoachAiFacts,
    type CoachAiQueryType,
    type CoachAiTargetType,
} from "../ai-coach/coach-assistance";
import { Result } from "../common/result";
import type { GetCoachAthleteMonitoringUseCase } from "./get-coach-athlete-monitoring.use-case";
import type { GetCoachSquadPerformanceDashboardUseCase } from "./get-coach-squad-performance-dashboard.use-case";
import type { GetCoachSquadTeamTrendsUseCase } from "./get-coach-squad-team-trends.use-case";
import type { GetCoachSquadTrainingLoadUseCase } from "./get-coach-squad-training-load.use-case";

const auditAction = "AI_COACH_ASSISTANCE";
const auditResource = "AI_COACH_ASSISTANT";

export interface CoachAiAuditLogger {
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

export interface CoachAiAuditIdentity {
    provider: "OPENAI";
    model: string;
    policyVersion: string;
}

type AuditOutcome =
    | "GENERATED"
    | "INSUFFICIENT_DATA"
    | "ACCESS_DENIED"
    | "TARGET_NOT_FOUND"
    | "DATA_FAILURE"
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export class GenerateCoachAiAssistanceUseCase {
    constructor(
        private readonly squadDashboard:
            Pick<GetCoachSquadPerformanceDashboardUseCase, "execute">,
        private readonly squadTrends:
            Pick<GetCoachSquadTeamTrendsUseCase, "execute">,
        private readonly squadTrainingLoad:
            Pick<GetCoachSquadTrainingLoadUseCase, "execute">,
        private readonly athleteMonitoring:
            Pick<GetCoachAthleteMonitoringUseCase, "execute">,
        private readonly provider:
            CoachAiAssistanceProvider,
        private readonly audit:
            CoachAiAuditLogger,
        private readonly auditIdentity:
            CoachAiAuditIdentity,
        private readonly now:
            () => Date = () => new Date(),
    ) {}

    private outcomeForDataError(
        error: string,
    ): AuditOutcome {
        if (
            error === "Athlete not found." ||
            error === "Coach squad not found."
        ) {
            return "TARGET_NOT_FOUND";
        }

        if (
            error ===
            "Active Coach athlete relationship is required." ||
            error ===
            "Active Coach athlete relationships are required."
        ) {
            return "ACCESS_DENIED";
        }

        return "DATA_FAILURE";
    }

    private coverage(
        facts: CoachAiFacts | null,
    ) {
        return {
            squadAvailable:
                facts?.squad !== null &&
                facts?.squad !== undefined &&
                facts.squad.memberCount > 0,
            performanceAvailable:
                facts?.athlete
                    ? facts.athlete.performanceTrends.length > 0
                    : (facts?.squad?.trendMetrics.length ?? 0) > 0,
            trainingLoadAvailable:
                facts?.athlete
                    ? facts.athlete.trainingLoad.observationCount > 0
                    : (facts?.squad?.trainingLoad.observationCount ?? 0) > 0,
            programmesAvailable:
                facts?.athlete
                    ? facts.athlete.programmes.length > 0
                    : (facts?.squad?.workoutProgrammeCount ?? 0) > 0,
        };
    }

    private async recordAudit(
        input: Readonly<{
            tenantId: string;
            userId: string;
            targetId: string;
            targetType: CoachAiTargetType;
            queryType: CoachAiQueryType;
            acknowledgement: true;
            requestId: string;
        }>,
        details: Readonly<{
            status: AuditLogStatus;
            outcome: AuditOutcome;
            providerInvoked: boolean;
            squadAvailable: boolean;
            performanceAvailable: boolean;
            trainingLoadAvailable: boolean;
            programmesAvailable: boolean;
        }>,
    ): Promise<void> {
        await this.audit.log(
            input.tenantId,
            input.userId,
            auditAction,
            auditResource,
            input.targetId,
            details.status,
            {
                schemaVersion: 1,
                policyVersion:
                    this.auditIdentity.policyVersion,
                explicitTransferAcknowledgement:
                    input.acknowledgement,
                correlationId: input.requestId,
                queryType: input.queryType,
                targetType: input.targetType,
                outcome: details.outcome,
                coverage: {
                    squad: details.squadAvailable,
                    performance:
                        details.performanceAvailable,
                    trainingLoad:
                        details.trainingLoadAvailable,
                    programmes:
                        details.programmesAvailable,
                },
                provider:
                    this.auditIdentity.provider,
                model:
                    this.auditIdentity.model,
                providerInvoked:
                    details.providerInvoked,
            },
        );
    }

    private targetIsValid(
        queryType: CoachAiQueryType,
        targetType: CoachAiTargetType,
    ): boolean {
        return queryType === "SQUAD_INTELLIGENCE"
            ? targetType === "SQUAD"
            : targetType === "ATHLETE";
    }

    async execute(input: Readonly<{
        tenantId: string;
        userId: string;
        targetId: string;
        targetType: CoachAiTargetType;
        queryType: CoachAiQueryType;
        acknowledgement: true;
        requestId: string;
    }>): Promise<Result<CoachAiAssistanceResult>> {
        if (
            !this.targetIsValid(
                input.queryType,
                input.targetType,
            )
        ) {
            await this.recordAudit(input, {
                status: AuditLogStatus.FAILURE,
                outcome: "DATA_FAILURE",
                providerInvoked: false,
                ...this.coverage(null),
            });

            return Result.failure(
                "Coach AI task target is invalid.",
            );
        }

        let facts: CoachAiFacts;

        if (input.targetType === "SQUAD") {
            const [
                dashboardResult,
                trendResult,
                trainingLoadResult,
            ] = await Promise.all([
                this.squadDashboard.execute({
                    tenantId: input.tenantId,
                    userId: input.userId,
                    squadId: input.targetId,
                    limit: 12,
                }),
                this.squadTrends.execute({
                    tenantId: input.tenantId,
                    userId: input.userId,
                    squadId: input.targetId,
                    limit: 12,
                }),
                this.squadTrainingLoad.execute({
                    tenantId: input.tenantId,
                    userId: input.userId,
                    squadId: input.targetId,
                    limit: 12,
                }),
            ]);

            if (
                !dashboardResult.isSuccess ||
                !dashboardResult.value ||
                !trendResult.isSuccess ||
                !trendResult.value ||
                !trainingLoadResult.isSuccess ||
                !trainingLoadResult.value
            ) {
                const error =
                    dashboardResult.error ??
                    trendResult.error ??
                    trainingLoadResult.error ??
                    "Coach squad intelligence could not be loaded.";

                await this.recordAudit(input, {
                    status: AuditLogStatus.FAILURE,
                    outcome:
                        this.outcomeForDataError(error),
                    providerInvoked: false,
                    ...this.coverage(null),
                });

                return Result.failure(error);
            }

            facts = buildCoachSquadAiFacts(
                dashboardResult.value,
                trendResult.value,
                trainingLoadResult.value,
            );
        } else {
            const monitoringResult =
                await this.athleteMonitoring.execute({
                    tenantId: input.tenantId,
                    userId: input.userId,
                    athleteId: input.targetId,
                    limit: 12,
                });

            if (
                !monitoringResult.isSuccess ||
                !monitoringResult.value
            ) {
                const error =
                    monitoringResult.error ??
                    "Coach athlete monitoring could not be loaded.";

                await this.recordAudit(input, {
                    status: AuditLogStatus.FAILURE,
                    outcome:
                        this.outcomeForDataError(error),
                    providerInvoked: false,
                    ...this.coverage(null),
                });

                return Result.failure(error);
            }

            facts = buildCoachAthleteAiFacts(
                monitoringResult.value,
            );
        }

        const retrievedAt =
            this.now().toISOString();
        const explanation =
            explainCoachAiFacts(
                facts,
                retrievedAt,
            );
        const limitations =
            coachAiLimitations();
        const coverage =
            this.coverage(facts);

        if (
            !hasFactsForCoachAiQuery(
                input.queryType,
                facts,
            )
        ) {
            await this.recordAudit(input, {
                status: AuditLogStatus.SUCCESS,
                outcome: "INSUFFICIENT_DATA",
                providerInvoked: false,
                ...coverage,
            });

            return Result.success({
                status: "INSUFFICIENT_DATA",
                queryType: input.queryType,
                targetType: input.targetType,
                assistance: null,
                explanation,
                limitations,
                generatedAt:
                    this.now().toISOString(),
            });
        }

        let assistance;

        try {
            assistance =
                validateCoachAiAssistance(
                    await this.provider.generate(
                        input.queryType,
                        facts,
                    ),
                );
        } catch (error) {
            const unavailable =
                error instanceof
                    CoachAiUnavailableError
                    ? error
                    : new CoachAiUnavailableError(
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
            queryType: input.queryType,
            targetType: input.targetType,
            assistance,
            explanation,
            limitations,
            generatedAt:
                this.now().toISOString(),
        });
    }
}
