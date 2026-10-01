import type { TrainerClientReportDto } from "../dto/trainer/trainer-client-report.dto";
import type { TrainerSessionScheduleDto } from "../dto/trainer/trainer-session-schedule.dto";
import { TrainerSessionScheduleStatus } from "../../domain/enums/trainer-session-schedule-status.enum";

export type TrainerAiQueryType =
    | "ADHERENCE"
    | "PERFORMANCE_TRENDS"
    | "PROGRAMME_PROPOSAL"
    | "PROGRESS_REPORT";

export type TrainerAiTrendDirection =
    | "UP"
    | "DOWN"
    | "UNCHANGED"
    | "INSUFFICIENT_DATA";

export interface TrainerAiAdherenceFacts {
    windowDays: 28;
    totalPastSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    unresolvedPastSessions: number;
    completionRatePercent: number | null;
}

export interface TrainerAiPerformanceTrendFact {
    metricSlug: string;
    unit: string | null;
    latestValue: number;
    previousValue: number | null;
    delta: number | null;
    direction: TrainerAiTrendDirection;
    measurementCount: number;
}

export interface TrainerAiProgrammeFact {
    trainingFrequency: number;
    sessionDurationMinutes: number;
    status: string;
}

export interface TrainerAiFacts {
    adherence: TrainerAiAdherenceFacts;
    performanceTrends: TrainerAiPerformanceTrendFact[];
    programmes: TrainerAiProgrammeFact[];
}

export interface TrainerAiAssistance {
    summary: string;
    observations: string[];
    considerations: string[];
}

export interface TrainerAiAssistanceResult {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    queryType: TrainerAiQueryType;
    assistance: TrainerAiAssistance | null;
    explanation: TrainerAiExplanation;
    limitations: TrainerAiLimitations;
    generatedAt: string;
}

export interface TrainerAiAssistanceProvider {
    generate(
        queryType: TrainerAiQueryType,
        facts: TrainerAiFacts,
    ): Promise<TrainerAiAssistance>;
}

export type TrainerAiUnavailableReason =
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export class TrainerAiUnavailableError extends Error {
    constructor(
        public readonly reason: TrainerAiUnavailableReason = "PROVIDER_FAILURE",
    ) {
        super("Trainer AI assistance is temporarily unavailable.");
        this.name = "TrainerAiUnavailableError";
    }
}

function safeMetricSlug(value: string): string {
    const trimmed = value.trim();

    return /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(trimmed)
        ? trimmed
        : "metric";
}

function safeUnit(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();

    return /^[a-z0-9%./_-]{1,20}$/i.test(trimmed)
        ? trimmed
        : null;
}

function rounded(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
}

export function buildTrainerAiFacts(
    report: TrainerClientReportDto,
    sessions: TrainerSessionScheduleDto[],
): TrainerAiFacts {
    const totalPastSessions = sessions.length;
    const completedSessions = sessions.filter(
        session => session.status === TrainerSessionScheduleStatus.COMPLETED,
    ).length;
    const cancelledSessions = sessions.filter(
        session => session.status === TrainerSessionScheduleStatus.CANCELLED,
    ).length;
    const unresolvedPastSessions = sessions.filter(
        session => session.status === TrainerSessionScheduleStatus.SCHEDULED,
    ).length;

    const performanceTrends = report.performance
        .slice(0, 12)
        .map(item => {
            const latestValue = item.latestMeasurement?.value;
            const previousValue = item.previousMeasurement?.value;

            const latest =
                typeof latestValue === "number" && Number.isFinite(latestValue)
                    ? latestValue
                    : null;
            const previous =
                typeof previousValue === "number" && Number.isFinite(previousValue)
                    ? previousValue
                    : null;

            if (latest === null) {
                return null;
            }

            const direction: TrainerAiTrendDirection =
                previous === null
                    ? "INSUFFICIENT_DATA"
                    : latest > previous
                        ? "UP"
                        : latest < previous
                            ? "DOWN"
                            : "UNCHANGED";

            return {
                metricSlug: safeMetricSlug(item.metric.slug),
                unit: safeUnit(item.metric.unit),
                latestValue: rounded(latest),
                previousValue: previous === null ? null : rounded(previous),
                delta: previous === null ? null : rounded(latest - previous),
                direction,
                measurementCount: Math.max(0, item.measurementCount),
            };
        })
        .filter((item): item is TrainerAiPerformanceTrendFact => item !== null);

    const programmes = report.workoutProgrammes
        .filter(programme => programme.status === "ACTIVE")
        .slice(0, 5)
        .filter(
            programme =>
                Number.isInteger(programme.trainingFrequency) &&
                programme.trainingFrequency > 0 &&
                Number.isInteger(programme.sessionDurationMinutes) &&
                programme.sessionDurationMinutes > 0,
        )
        .map(programme => ({
            trainingFrequency: programme.trainingFrequency,
            sessionDurationMinutes: programme.sessionDurationMinutes,
            status: programme.status,
        }));

    return {
        adherence: {
            windowDays: 28,
            totalPastSessions,
            completedSessions,
            cancelledSessions,
            unresolvedPastSessions,
            completionRatePercent:
                totalPastSessions === 0
                    ? null
                    : Math.round((completedSessions / totalPastSessions) * 100),
        },
        performanceTrends,
        programmes,
    };
}

export function hasFactsForTrainerAiQuery(
    queryType: TrainerAiQueryType,
    facts: TrainerAiFacts,
): boolean {
    const hasAdherence = facts.adherence.totalPastSessions > 0;
    const hasTrends = facts.performanceTrends.some(
        trend => trend.direction !== "INSUFFICIENT_DATA",
    );
    const hasProgrammes = facts.programmes.length > 0;

    switch (queryType) {
        case "ADHERENCE":
            return hasAdherence;
        case "PERFORMANCE_TRENDS":
            return hasTrends;
        case "PROGRAMME_PROPOSAL":
            return hasProgrammes || hasTrends || hasAdherence;
        case "PROGRESS_REPORT":
            return hasProgrammes || hasTrends || hasAdherence;
    }
}

function safeText(value: unknown, limit: number): value is string {
    return typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= limit &&
        !Array.from(value).some(
            character =>
                character.charCodeAt(0) < 32 ||
                character === "<" ||
                character === ">",
        );
}

export function validateTrainerAiAssistance(
    value: unknown,
): TrainerAiAssistance {
    if (!value || typeof value !== "object") {
        throw new TrainerAiUnavailableError("INVALID_OUTPUT");
    }

    const record = value as Record<string, unknown>;

    if (
        Object.keys(record).sort().join(",") !==
            "considerations,observations,summary" ||
        !safeText(record.summary, 800) ||
        !Array.isArray(record.observations) ||
        record.observations.length < 1 ||
        record.observations.length > 5 ||
        !record.observations.every(item => safeText(item, 320)) ||
        !Array.isArray(record.considerations) ||
        record.considerations.length < 1 ||
        record.considerations.length > 5 ||
        !record.considerations.every(item => safeText(item, 320))
    ) {
        throw new TrainerAiUnavailableError("INVALID_OUTPUT");
    }

    return {
        summary: record.summary,
        observations: record.observations as string[],
        considerations: record.considerations as string[],
    };
}

export interface TrainerAiExplanation {
    version: 1;
    retrievedAt: string;
    facts: TrainerAiFacts;
    sources: {
        adherence: "USED" | "NO_USABLE_FACTS";
        performance: "USED" | "NO_USABLE_FACTS";
        programmes: "USED" | "NO_USABLE_FACTS";
    };
}

export function explainTrainerAiFacts(
    facts: TrainerAiFacts,
    retrievedAt: string,
): TrainerAiExplanation {
    return {
        version: 1,
        retrievedAt,
        facts,
        sources: {
            adherence:
                facts.adherence.totalPastSessions > 0
                    ? "USED"
                    : "NO_USABLE_FACTS",
            performance:
                facts.performanceTrends.length > 0
                    ? "USED"
                    : "NO_USABLE_FACTS",
            programmes:
                facts.programmes.length > 0
                    ? "USED"
                    : "NO_USABLE_FACTS",
        },
    };
}

export interface TrainerAiLimitations {
    confidence: "NOT_ASSESSED";
    notices: string[];
}

export function trainerAiLimitations(): TrainerAiLimitations {
    return {
        confidence: "NOT_ASSESSED",
        notices: [
            "Session completion reflects Trainer schedule workflow status, not proof that every prescribed exercise was performed.",
            "Numeric movement is reported as higher, lower or unchanged; TITAN does not infer improvement direction without authoritative metric semantics.",
            "Programme information is a bounded snapshot of active frequency and duration only; programme names, descriptions, goals and notes are excluded from the AI payload.",
            "AI output may be incomplete or incorrect. The Trainer remains responsible for professional review and approval before changing a programme.",
            "This assistant does not diagnose, treat, assess exercise safety or provide medical advice.",
        ],
    };
}
