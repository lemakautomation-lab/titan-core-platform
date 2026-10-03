import {
    describe,
    expect,
    it,
} from "vitest";

import {
    buildPerformanceProfessionalAiFacts,
    explainPerformanceProfessionalAiFacts,
    hasPerformanceProfessionalAiFacts,
    performanceProfessionalAiLimitations,
    PerformanceProfessionalAiUnavailableError,
    validatePerformanceProfessionalAiAssistance,
} from "../../src/application/ai-performance-professional/performance-professional-assistance";

describe(
    "Performance Professional AI assistance policy",
    () => {
        const workflow = {
            athleteId:
                "11111111-1111-4111-8111-111111111111",
            performance: [
                {
                    measurements: [
                        {},
                        {},
                    ],
                },
            ],
            recovery: [
                {
                    value: 7,
                    recordedAt:
                        "2026-10-01T10:00:00.000Z",
                },
            ],
            trainingStress: [
                {
                    value: 5,
                    recordedAt:
                        "2026-10-01T11:00:00.000Z",
                },
            ],
            workoutProgrammes: [
                {},
            ],
        };

        it(
            "builds only bounded professional facts",
            () => {
                const facts =
                    buildPerformanceProfessionalAiFacts(
                        workflow,
                    );

                expect(facts).toEqual({
                    athleteId:
                        workflow.athleteId,
                    performanceMetricCount: 1,
                    performanceMeasurementCount: 2,
                    recovery:
                        workflow.recovery,
                    trainingStress:
                        workflow.trainingStress,
                    workoutProgrammeCount: 1,
                });

                expect(
                    hasPerformanceProfessionalAiFacts(
                        facts,
                    ),
                ).toBe(true);
            },
        );

        it(
            "excludes non-numeric observations from provider facts",
            () => {
                const facts =
                    buildPerformanceProfessionalAiFacts({
                        ...workflow,
                        recovery: [
                            ...workflow.recovery,
                            {
                                value: "unsupported",
                                recordedAt:
                                    "2026-10-01T12:00:00.000Z",
                            },
                        ],
                        trainingStress: [
                            {
                                value: Number.NaN,
                                recordedAt:
                                    "2026-10-01T13:00:00.000Z",
                            },
                            ...workflow.trainingStress,
                        ],
                    });

                expect(facts.recovery).toEqual(
                    workflow.recovery,
                );

                expect(
                    facts.trainingStress,
                ).toEqual(
                    workflow.trainingStress,
                );
            },
        );

        it(
            "returns server generated provenance",
            () => {
                const facts =
                    buildPerformanceProfessionalAiFacts(
                        workflow,
                    );

                expect(
                    explainPerformanceProfessionalAiFacts(
                        facts,
                        "2026-10-02T00:00:00.000Z",
                    ),
                ).toEqual({
                    retrievedAt:
                        "2026-10-02T00:00:00.000Z",
                    provenance: {
                        performanceMetricCount: 1,
                        performanceMeasurementCount: 2,
                        recoveryObservationCount: 1,
                        trainingStressObservationCount: 1,
                        workoutProgrammeCount: 1,
                    },
                });
            },
        );

        it(
            "requires explicit professional limitations",
            () => {
                const limitations =
                    performanceProfessionalAiLimitations();

                expect(
                    limitations.join(" "),
                ).toContain(
                    "decision authority",
                );

                expect(
                    limitations.join(" "),
                ).toContain(
                    "cannot autonomously change",
                );
            },
        );

        it(
            "accepts bounded decision-support output",
            () => {
                expect(
                    validatePerformanceProfessionalAiAssistance(
                        {
                            summary:
                                "Available observations are limited to the supplied TITAN snapshot.",
                            observations: [
                                "Two performance measurements are available.",
                            ],
                            considerations: [
                                "Review the observations in their training context.",
                            ],
                        },
                    ),
                ).toEqual({
                    summary:
                        "Available observations are limited to the supplied TITAN snapshot.",
                    observations: [
                        "Two performance measurements are available.",
                    ],
                    considerations: [
                        "Review the observations in their training context.",
                    ],
                });
            },
        );

        it(
            "rejects unsupported autonomous or clinical output",
            () => {
                expect(
                    () =>
                        validatePerformanceProfessionalAiAssistance(
                            {
                                summary:
                                    "Increase training load immediately.",
                                observations: [
                                    "Observation",
                                ],
                                considerations: [
                                    "Consideration",
                                ],
                            },
                        ),
                ).toThrow(
                    PerformanceProfessionalAiUnavailableError,
                );
            },
        );
    },
);
