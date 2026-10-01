import { AuditLogStatus } from "../../domain/entities/audit-log.entity";
import {
    buildTrainerAiFacts,
    explainTrainerAiFacts,
    hasFactsForTrainerAiQuery,
    trainerAiLimitations,
    validateTrainerAiAssistance,
    TrainerAiUnavailableError,
    type TrainerAiAssistanceProvider,
    type TrainerAiAssistanceResult,
    type TrainerAiQueryType,
} from "../ai-trainer/trainer-assistance";
import { Result } from "../common/result";
import type { GetTrainerClientReportUseCase } from "./get-trainer-client-report.use-case";
import type { ListTrainerSessionSchedulesUseCase } from "./list-trainer-session-schedules.use-case";
import { ListTrainerSessionSchedulesQuery } from "../queries/trainer/list-trainer-session-schedules.query";

const auditAction = "AI_TRAINER_ASSISTANCE";
const auditResource = "AI_TRAINER_ASSISTANT";

export interface TrainerAiAuditLogger {
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

export interface TrainerAiAuditIdentity {
    provider: "OPENAI";
    model: string;
    policyVersion: string;
}

type AuditOutcome =
    | "GENERATED"
    | "INSUFFICIENT_DATA"
    | "ACCESS_DENIED"
    | "ATHLETE_NOT_FOUND"
    | "DATA_FAILURE"
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export class GenerateTrainerAiAssistanceUseCase {
    constructor(
        private readonly report: Pick<GetTrainerClientReportUseCase, "execute">,
        private readonly schedules: Pick<ListTrainerSessionSchedulesUseCase, "execute">,
        private readonly provider: TrainerAiAssistanceProvider,
        private readonly audit: TrainerAiAuditLogger,
        private readonly auditIdentity: TrainerAiAuditIdentity,
        private readonly now: () => Date = () => new Date(),
    ) {}

    private outcomeForDataError(error: string): AuditOutcome {
        if (error === "Athlete not found.") {
            return "ATHLETE_NOT_FOUND";
        }

        if (
            error === "Active Trainer access is required." ||
            error === "Active Trainer client relationship is required."
        ) {
            return "ACCESS_DENIED";
        }

        return "DATA_FAILURE";
    }

    private async recordAudit(
        input: Readonly<{
            tenantId: string;
            userId: string;
            athleteId: string;
            queryType: TrainerAiQueryType;
            acknowledgement: true;
            requestId: string;
        }>,
        details: Readonly<{
            status: AuditLogStatus;
            outcome: AuditOutcome;
            providerInvoked: boolean;
            adherenceAvailable: boolean;
            performanceAvailable: boolean;
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
                policyVersion: this.auditIdentity.policyVersion,
                explicitTransferAcknowledgement: input.acknowledgement,
                correlationId: input.requestId,
                queryType: input.queryType,
                outcome: details.outcome,
                coverage: {
                    adherence: details.adherenceAvailable,
                    performance: details.performanceAvailable,
                    programmes: details.programmesAvailable,
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
        athleteId: string;
        queryType: TrainerAiQueryType;
        acknowledgement: true;
        requestId: string;
    }>): Promise<Result<TrainerAiAssistanceResult>> {
        const reportResult = await this.report.execute({
            tenantId: input.tenantId,
            userId: input.userId,
            athleteId: input.athleteId,
            limit: 25,
        });

        if (!reportResult.isSuccess || !reportResult.value) {
            const error = reportResult.error ?? "Trainer client report could not be loaded.";

            await this.recordAudit(input, {
                status: AuditLogStatus.FAILURE,
                outcome: this.outcomeForDataError(error),
                providerInvoked: false,
                adherenceAvailable: false,
                performanceAvailable: false,
                programmesAvailable: false,
            });

            return Result.failure(error);
        }

        const now = this.now();
        const startsFrom = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

        const scheduleResult = await this.schedules.execute(
            new ListTrainerSessionSchedulesQuery(
                input.tenantId,
                input.userId,
                startsFrom,
                now,
                input.athleteId,
            ),
        );

        if (!scheduleResult.isSuccess || !scheduleResult.value) {
            const error = scheduleResult.error ?? "Trainer session history could not be loaded.";

            await this.recordAudit(input, {
                status: AuditLogStatus.FAILURE,
                outcome: this.outcomeForDataError(error),
                providerInvoked: false,
                adherenceAvailable: false,
                performanceAvailable: false,
                programmesAvailable: false,
            });

            return Result.failure(error);
        }

        const facts = buildTrainerAiFacts(
            reportResult.value,
            scheduleResult.value,
        );
        const explanation = explainTrainerAiFacts(
            facts,
            reportResult.value.generatedAt,
        );
        const limitations = trainerAiLimitations();
        const coverage = {
            adherenceAvailable: facts.adherence.totalPastSessions > 0,
            performanceAvailable: facts.performanceTrends.length > 0,
            programmesAvailable: facts.programmes.length > 0,
        };

        if (!hasFactsForTrainerAiQuery(input.queryType, facts)) {
            await this.recordAudit(input, {
                status: AuditLogStatus.SUCCESS,
                outcome: "INSUFFICIENT_DATA",
                providerInvoked: false,
                ...coverage,
            });

            return Result.success({
                status: "INSUFFICIENT_DATA" as const,
                queryType: input.queryType,
                assistance: null,
                explanation,
                limitations,
                generatedAt: this.now().toISOString(),
            });
        }

        let assistance;

        try {
            assistance = validateTrainerAiAssistance(
                await this.provider.generate(
                    input.queryType,
                    facts,
                ),
            );
        } catch (error) {
            const unavailable =
                error instanceof TrainerAiUnavailableError
                    ? error
                    : new TrainerAiUnavailableError("PROVIDER_FAILURE");

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
            status: "GENERATED" as const,
            queryType: input.queryType,
            assistance,
            explanation,
            limitations,
            generatedAt: this.now().toISOString(),
        });
    }
}
