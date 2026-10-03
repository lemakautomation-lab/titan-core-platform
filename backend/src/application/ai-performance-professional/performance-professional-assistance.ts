export type PerformanceProfessionalAiStatus =
    | "GENERATED"
    | "INSUFFICIENT_DATA";

export type PerformanceProfessionalAiFailureReason =
    | "PROVIDER_FAILURE"
    | "INVALID_OUTPUT";

export interface PerformanceProfessionalAiFacts {
    athleteId: string;
    performanceMetricCount: number;
    performanceMeasurementCount: number;
    recovery: readonly {
        value: unknown;
        recordedAt: string;
    }[];
    trainingStress: readonly {
        value: unknown;
        recordedAt: string;
    }[];
    workoutProgrammeCount: number;
}

export interface PerformanceProfessionalAiAssistance {
    summary: string;
    observations: readonly string[];
    considerations: readonly string[];
}

export interface PerformanceProfessionalAiExplanation {
    retrievedAt: string;
    provenance: Readonly<{
        performanceMetricCount: number;
        performanceMeasurementCount: number;
        recoveryObservationCount: number;
        trainingStressObservationCount: number;
        workoutProgrammeCount: number;
    }>;
}

export interface PerformanceProfessionalAiResult {
    status: PerformanceProfessionalAiStatus;
    assistance: PerformanceProfessionalAiAssistance | null;
    confidence: "NOT_ASSESSED";
    professionalReviewRequired: true;
    automaticAction: false;
    explanation: PerformanceProfessionalAiExplanation;
    limitations: readonly string[];
    generatedAt: string;
}

export interface PerformanceProfessionalAiProvider {
    generate(
        facts: PerformanceProfessionalAiFacts,
    ): Promise<unknown>;
}

export class PerformanceProfessionalAiUnavailableError
    extends Error {
    constructor(
        readonly reason:
            PerformanceProfessionalAiFailureReason,
    ) {
        super(reason);
        this.name =
            "PerformanceProfessionalAiUnavailableError";
    }
}

interface WorkflowInput {
    athleteId: string;
    performance: readonly {
        measurements: readonly unknown[];
    }[];
    recovery: readonly {
        value: unknown;
        recordedAt: string;
    }[];
    trainingStress: readonly {
        value: unknown;
        recordedAt: string;
    }[];
    workoutProgrammes: readonly unknown[];
}

function boundedNumericObservations(
    observations: readonly {
        value: unknown;
        recordedAt: string;
    }[],
): readonly {
    value: number;
    recordedAt: string;
}[] {
    return observations
        .slice(0, 12)
        .flatMap(observation => {
            if (
                typeof observation.value !== "number" ||
                !Number.isFinite(observation.value)
            ) {
                return [];
            }

            return [{
                value: observation.value,
                recordedAt: observation.recordedAt,
            }];
        });
}

export function buildPerformanceProfessionalAiFacts(
    workflow: WorkflowInput,
): PerformanceProfessionalAiFacts {
    return {
        athleteId: workflow.athleteId,
        performanceMetricCount:
            workflow.performance.length,
        performanceMeasurementCount:
            workflow.performance.reduce(
                (total, metric) =>
                    total + metric.measurements.length,
                0,
            ),
        recovery:
            boundedNumericObservations(
                workflow.recovery,
            ),
        trainingStress:
            boundedNumericObservations(
                workflow.trainingStress,
            ),
        workoutProgrammeCount:
            workflow.workoutProgrammes.length,
    };
}

export function hasPerformanceProfessionalAiFacts(
    facts: PerformanceProfessionalAiFacts,
): boolean {
    return (
        facts.performanceMeasurementCount > 0 ||
        facts.recovery.length > 0 ||
        facts.trainingStress.length > 0 ||
        facts.workoutProgrammeCount > 0
    );
}

export function explainPerformanceProfessionalAiFacts(
    facts: PerformanceProfessionalAiFacts,
    retrievedAt: string,
): PerformanceProfessionalAiExplanation {
    return {
        retrievedAt,
        provenance: {
            performanceMetricCount:
                facts.performanceMetricCount,
            performanceMeasurementCount:
                facts.performanceMeasurementCount,
            recoveryObservationCount:
                facts.recovery.length,
            trainingStressObservationCount:
                facts.trainingStress.length,
            workoutProgrammeCount:
                facts.workoutProgrammeCount,
        },
    };
}

export function performanceProfessionalAiLimitations():
    readonly string[] {
    return [
        "This assistance is based only on the bounded authorised TITAN data supplied for this request.",
        "The available information is a limited snapshot and does not establish readiness, causation or future performance.",
        "This assistance is not a clinical assessment, diagnosis, prescription or treatment recommendation.",
        "TITAN AI cannot autonomously change an Athlete record, training load, workout programme or professional plan.",
        "A qualified Performance Professional remains the decision authority and must review any assistance before acting.",
    ];
}

function validText(
    value: unknown,
    maximumLength: number,
): value is string {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= maximumLength
    );
}

function validTextArray(
    value: unknown,
    maximumItems: number,
    maximumLength: number,
): value is string[] {
    return (
        Array.isArray(value) &&
        value.length >= 1 &&
        value.length <= maximumItems &&
        value.every(item =>
            validText(item, maximumLength),
        )
    );
}

const prohibited =
    /\b(diagnos(?:e|is)|prescrib(?:e|ed|ing)|treat(?:ment)?|medication|supplement dosage|increase training load|decrease training load|change the programme)\b/i;

export function validatePerformanceProfessionalAiAssistance(
    value: unknown,
): PerformanceProfessionalAiAssistance {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw new PerformanceProfessionalAiUnavailableError(
            "INVALID_OUTPUT",
        );
    }

    const record =
        value as Record<string, unknown>;

    const keys =
        Object.keys(record).sort().join(",");

    if (
        keys !==
        "considerations,observations,summary" ||
        !validText(record.summary, 1200) ||
        !validTextArray(
            record.observations,
            5,
            500,
        ) ||
        !validTextArray(
            record.considerations,
            5,
            500,
        )
    ) {
        throw new PerformanceProfessionalAiUnavailableError(
            "INVALID_OUTPUT",
        );
    }

    const combined = [
        record.summary,
        ...record.observations,
        ...record.considerations,
    ].join(" ");

    if (prohibited.test(combined)) {
        throw new PerformanceProfessionalAiUnavailableError(
            "INVALID_OUTPUT",
        );
    }

    return {
        summary: record.summary,
        observations: [...record.observations],
        considerations: [...record.considerations],
    };
}
