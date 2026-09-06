export type PerformanceImprovementDirection =
    | "HIGHER_IS_BETTER"
    | "LOWER_IS_BETTER";

export interface PerformanceEvidenceMeasurement {
    value: number;
    recordedAt: Date;
}

export interface PerformanceEvidenceInput {
    measurements: PerformanceEvidenceMeasurement[];
    improvementDirection: PerformanceImprovementDirection;
}

export interface PerformanceEvidenceEvaluation {
    evidenceSufficient: boolean;
    performanceImproved: boolean;
}

export class PerformanceEvidenceEvaluator {
    evaluate(
        input: PerformanceEvidenceInput,
    ): PerformanceEvidenceEvaluation {
        if (
            !input ||
            !Array.isArray(input.measurements)
        ) {
            throw new Error("Performance measurements are required.");
        }

        if (
            input.improvementDirection !== "HIGHER_IS_BETTER" &&
            input.improvementDirection !== "LOWER_IS_BETTER"
        ) {
            throw new Error("Performance improvement direction is required.");
        }

        if (input.measurements.length < 2) {
            return {
                evidenceSufficient: false,
                performanceImproved: false,
            };
        }

        const measurements = [...input.measurements]
            .sort(
                (a, b) =>
                    b.recordedAt.getTime() -
                    a.recordedAt.getTime(),
            );

        const latest = measurements[0];
        const previous = measurements[1];

        if (
            !Number.isFinite(latest.value) ||
            !Number.isFinite(previous.value)
        ) {
            throw new Error("Performance measurement values must be finite.");
        }

        if (
            Number.isNaN(latest.recordedAt.getTime()) ||
            Number.isNaN(previous.recordedAt.getTime())
        ) {
            throw new Error("Performance measurement dates must be valid.");
        }

        const performanceImproved =
            input.improvementDirection === "HIGHER_IS_BETTER"
                ? latest.value > previous.value
                : latest.value < previous.value;

        return {
            evidenceSufficient: true,
            performanceImproved,
        };
    }
}
