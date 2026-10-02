import type { TrainerClientMonitoringDto } from "../dto/trainer/trainer-client-monitoring.dto";

export type CoachAiQueryType =
    | "SQUAD_INTELLIGENCE"
    | "TRAINING_SUPPORT"
    | "PERFORMANCE_QUERY";

export type CoachAiTargetType =
    | "SQUAD"
    | "ATHLETE";

export type CoachAiTrendDirection =
    | "UP"
    | "DOWN"
    | "UNCHANGED"
    | "INSUFFICIENT_DATA";

export interface CoachAiPerformanceTrendFact {
    metricSlug: string;
    unit: string | null;
    latestValue: number;
    previousValue: number | null;
    delta: number | null;
    direction: CoachAiTrendDirection;
    measurementCount: number;
}

export interface CoachAiTrainingLoadFact {
    observationCount: number;
    latestValue: number | null;
    previousValue: number | null;
    delta: number | null;
    direction: CoachAiTrendDirection;
}

export interface CoachAiProgrammeFact {
    trainingFrequency: number;
    sessionDurationMinutes: number;
    status: string;
}

export interface CoachAiSquadTrendFact {
    metricSlug: string;
    unit: string | null;
    athleteCount: number;
    pointCount: number;
    averageValue: number;
    minimumValue: number;
    maximumValue: number;
}

export interface CoachAiSquadFacts {
    memberCount: number;
    performanceMetricCount: number;
    performanceMeasurementCount: number;
    workoutProgrammeCount: number;
    trendMetrics: CoachAiSquadTrendFact[];
    trainingLoad: {
        athletesWithObservations: number;
        observationCount: number;
        latestAverageValue: number | null;
    };
}

export interface CoachAiAthleteFacts {
    performanceTrends: CoachAiPerformanceTrendFact[];
    trainingLoad: CoachAiTrainingLoadFact;
    programmes: CoachAiProgrammeFact[];
}

export interface CoachAiFacts {
    targetType: CoachAiTargetType;
    squad: CoachAiSquadFacts | null;
    athlete: CoachAiAthleteFacts | null;
}

export interface CoachAiAssistance {
    summary: string;
    observations: string[];
    considerations: string[];
}

export interface CoachAiExplanation {
    version: 1;
    retrievedAt: string;
    facts: CoachAiFacts;
    sources: {
        squad: "USED" | "NOT_APPLICABLE" | "NO_USABLE_FACTS";
        performance: "USED" | "NOT_APPLICABLE" | "NO_USABLE_FACTS";
        trainingLoad: "USED" | "NOT_APPLICABLE" | "NO_USABLE_FACTS";
        programmes: "USED" | "NOT_APPLICABLE" | "NO_USABLE_FACTS";
    };
}

export interface CoachAiLimitations {
    confidence: "NOT_ASSESSED";
    notices: string[];
}

export interface CoachAiAssistanceResult {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    queryType: CoachAiQueryType;
    targetType: CoachAiTargetType;
    assistance: CoachAiAssistance | null;
    explanation: CoachAiExplanation;
    limitations: CoachAiLimitations;
    generatedAt: string;
}

export interface CoachAiAssistanceProvider {
    generate(
        queryType: CoachAiQueryType,
        facts: CoachAiFacts,
    ): Promise<CoachAiAssistance>;
}

export type CoachAiUnavailableReason =
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export class CoachAiUnavailableError extends Error {
    constructor(
        public readonly reason: CoachAiUnavailableReason = "PROVIDER_FAILURE",
    ) {
        super("Coach AI assistance is temporarily unavailable.");
        this.name = "CoachAiUnavailableError";
    }
}

export interface CoachSquadDashboardSnapshot {
    memberCount: number;
    athletes: Array<{
        performanceMetricCount: number;
        performanceMeasurementCount: number;
        workoutProgrammeCount: number;
    }>;
}

export interface CoachSquadTrendSnapshot {
    metrics: Array<{
        slug: string;
        unit: string | null;
        athleteCount: number;
        pointCount: number;
        points: Array<{
            value: number;
        }>;
    }>;
}

export interface CoachSquadTrainingLoadSnapshot {
    athletes: Array<{
        observationCount: number;
        observations: Array<{
            value: number;
            recordedAt: string;
        }>;
    }>;
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

function direction(
    latest: number | null,
    previous: number | null,
): CoachAiTrendDirection {
    if (latest === null || previous === null) {
        return "INSUFFICIENT_DATA";
    }

    if (latest > previous) {
        return "UP";
    }

    if (latest < previous) {
        return "DOWN";
    }

    return "UNCHANGED";
}

export function buildCoachAthleteAiFacts(
    monitoring: TrainerClientMonitoringDto,
): CoachAiFacts {
    const performanceTrends = monitoring.performance
        .slice(0, 12)
        .map(item => {
            const measurements = [...item.measurements]
                .filter(measurement =>
                    Number.isFinite(measurement.value),
                )
                .sort((a, b) =>
                    b.recordedAt.localeCompare(a.recordedAt),
                );

            const latest = measurements[0]?.value ?? null;
            const previous = measurements[1]?.value ?? null;

            if (latest === null) {
                return null;
            }

            return {
                metricSlug: safeMetricSlug(item.metric.slug),
                unit: safeUnit(item.metric.unit),
                latestValue: rounded(latest),
                previousValue:
                    previous === null
                        ? null
                        : rounded(previous),
                delta:
                    previous === null
                        ? null
                        : rounded(latest - previous),
                direction: direction(latest, previous),
                measurementCount: measurements.length,
            };
        })
        .filter(
            (item): item is CoachAiPerformanceTrendFact =>
                item !== null,
        );

    const stress = [...monitoring.trainingStress]
        .filter(item => Number.isFinite(item.value))
        .sort((a, b) =>
            b.recordedAt.localeCompare(a.recordedAt),
        );

    const latestStress = stress[0]?.value ?? null;
    const previousStress = stress[1]?.value ?? null;

    const programmes = monitoring.workoutProgrammes
        .filter(programme => programme.status === "ACTIVE")
        .slice(0, 5)
        .filter(programme =>
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
        targetType: "ATHLETE",
        squad: null,
        athlete: {
            performanceTrends,
            trainingLoad: {
                observationCount: stress.length,
                latestValue:
                    latestStress === null
                        ? null
                        : rounded(latestStress),
                previousValue:
                    previousStress === null
                        ? null
                        : rounded(previousStress),
                delta:
                    latestStress === null ||
                    previousStress === null
                        ? null
                        : rounded(
                            latestStress - previousStress,
                        ),
                direction: direction(
                    latestStress,
                    previousStress,
                ),
            },
            programmes,
        },
    };
}

export function buildCoachSquadAiFacts(
    dashboard: CoachSquadDashboardSnapshot,
    trends: CoachSquadTrendSnapshot,
    trainingLoad: CoachSquadTrainingLoadSnapshot,
): CoachAiFacts {
    const trendMetrics = trends.metrics
        .slice(0, 12)
        .map(metric => {
            const values = metric.points
                .map(point => point.value)
                .filter(value => Number.isFinite(value));

            if (values.length === 0) {
                return null;
            }

            const total = values.reduce(
                (sum, value) => sum + value,
                0,
            );

            return {
                metricSlug: safeMetricSlug(metric.slug),
                unit: safeUnit(metric.unit),
                athleteCount: Math.max(
                    0,
                    metric.athleteCount,
                ),
                pointCount: Math.max(
                    0,
                    metric.pointCount,
                ),
                averageValue: rounded(
                    total / values.length,
                ),
                minimumValue: rounded(
                    Math.min(...values),
                ),
                maximumValue: rounded(
                    Math.max(...values),
                ),
            };
        })
        .filter(
            (item): item is CoachAiSquadTrendFact =>
                item !== null,
        );

    const latestTrainingLoadValues: number[] = [];
    let observationCount = 0;

    for (const athlete of trainingLoad.athletes) {
        observationCount += Math.max(
            0,
            athlete.observationCount,
        );

        const latest = [...athlete.observations]
            .filter(item => Number.isFinite(item.value))
            .sort((a, b) =>
                b.recordedAt.localeCompare(a.recordedAt),
            )[0];

        if (latest) {
            latestTrainingLoadValues.push(latest.value);
        }
    }

    const latestAverageValue =
        latestTrainingLoadValues.length === 0
            ? null
            : rounded(
                latestTrainingLoadValues.reduce(
                    (sum, value) => sum + value,
                    0,
                ) / latestTrainingLoadValues.length,
            );

    return {
        targetType: "SQUAD",
        athlete: null,
        squad: {
            memberCount: Math.max(0, dashboard.memberCount),
            performanceMetricCount:
                dashboard.athletes.reduce(
                    (total, athlete) =>
                        total +
                        Math.max(
                            0,
                            athlete.performanceMetricCount,
                        ),
                    0,
                ),
            performanceMeasurementCount:
                dashboard.athletes.reduce(
                    (total, athlete) =>
                        total +
                        Math.max(
                            0,
                            athlete.performanceMeasurementCount,
                        ),
                    0,
                ),
            workoutProgrammeCount:
                dashboard.athletes.reduce(
                    (total, athlete) =>
                        total +
                        Math.max(
                            0,
                            athlete.workoutProgrammeCount,
                        ),
                    0,
                ),
            trendMetrics,
            trainingLoad: {
                athletesWithObservations:
                    latestTrainingLoadValues.length,
                observationCount,
                latestAverageValue,
            },
        },
    };
}

export function hasFactsForCoachAiQuery(
    queryType: CoachAiQueryType,
    facts: CoachAiFacts,
): boolean {
    if (queryType === "SQUAD_INTELLIGENCE") {
        return facts.squad !== null &&
            facts.squad.memberCount > 0 &&
            (
                facts.squad.performanceMeasurementCount > 0 ||
                facts.squad.workoutProgrammeCount > 0 ||
                facts.squad.trendMetrics.length > 0 ||
                facts.squad.trainingLoad.observationCount > 0
            );
    }

    if (!facts.athlete) {
        return false;
    }

    if (queryType === "PERFORMANCE_QUERY") {
        return facts.athlete.performanceTrends.length > 0;
    }

    return (
        facts.athlete.performanceTrends.length > 0 ||
        facts.athlete.trainingLoad.observationCount > 0 ||
        facts.athlete.programmes.length > 0
    );
}

function safeText(
    value: unknown,
    limit: number,
): value is string {
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

export function validateCoachAiAssistance(
    value: unknown,
): CoachAiAssistance {
    if (!value || typeof value !== "object") {
        throw new CoachAiUnavailableError(
            "INVALID_OUTPUT",
        );
    }

    const record =
        value as Record<string, unknown>;

    if (
        Object.keys(record).sort().join(",") !==
            "considerations,observations,summary" ||
        !safeText(record.summary, 800) ||
        !Array.isArray(record.observations) ||
        record.observations.length < 1 ||
        record.observations.length > 5 ||
        !record.observations.every(
            item => safeText(item, 320),
        ) ||
        !Array.isArray(record.considerations) ||
        record.considerations.length < 1 ||
        record.considerations.length > 5 ||
        !record.considerations.every(
            item => safeText(item, 320),
        )
    ) {
        throw new CoachAiUnavailableError(
            "INVALID_OUTPUT",
        );
    }

    return {
        summary: record.summary,
        observations:
            record.observations as string[],
        considerations:
            record.considerations as string[],
    };
}

export function explainCoachAiFacts(
    facts: CoachAiFacts,
    retrievedAt: string,
): CoachAiExplanation {
    const athlete = facts.athlete;
    const squad = facts.squad;

    return {
        version: 1,
        retrievedAt,
        facts,
        sources: {
            squad:
                squad === null
                    ? "NOT_APPLICABLE"
                    : squad.memberCount > 0
                        ? "USED"
                        : "NO_USABLE_FACTS",
            performance:
                athlete === null
                    ? (
                        squad === null
                            ? "NOT_APPLICABLE"
                            : (
                                squad.trendMetrics.length > 0 ||
                                squad.performanceMeasurementCount > 0
                                    ? "USED"
                                    : "NO_USABLE_FACTS"
                            )
                    )
                    : athlete.performanceTrends.length > 0
                        ? "USED"
                        : "NO_USABLE_FACTS",
            trainingLoad:
                athlete === null
                    ? (
                        squad === null
                            ? "NOT_APPLICABLE"
                            : squad.trainingLoad.observationCount > 0
                                ? "USED"
                                : "NO_USABLE_FACTS"
                    )
                    : athlete.trainingLoad.observationCount > 0
                        ? "USED"
                        : "NO_USABLE_FACTS",
            programmes:
                athlete === null
                    ? (
                        squad === null
                            ? "NOT_APPLICABLE"
                            : squad.workoutProgrammeCount > 0
                                ? "USED"
                                : "NO_USABLE_FACTS"
                    )
                    : athlete.programmes.length > 0
                        ? "USED"
                        : "NO_USABLE_FACTS",
        },
    };
}

export function coachAiLimitations(): CoachAiLimitations {
    return {
        confidence: "NOT_ASSESSED",
        notices: [
            "Numeric movement is reported as higher, lower or unchanged; TITAN does not infer improvement direction without authoritative metric semantics.",
            "Squad aggregates describe the authorised records supplied to TITAN and do not rank Athletes or establish causation.",
            "Training-load values are stored performance records and are not an assessment of readiness, injury risk or exercise safety.",
            "Programme information is a bounded snapshot of active frequency and duration only; programme names, descriptions, goals and free text are excluded from the AI payload.",
            "AI output may be incomplete or incorrect. The Coach remains responsible for professional review and approval before changing training.",
            "This assistant does not diagnose, treat, assess exercise safety or provide medical advice.",
        ],
    };
}
