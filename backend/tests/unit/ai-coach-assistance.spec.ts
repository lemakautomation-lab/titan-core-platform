import {
    describe,
    expect,
    it,
} from "vitest";

import {
    buildCoachAthleteAiFacts,
    buildCoachSquadAiFacts,
    coachAiLimitations,
    validateCoachAiAssistance,
    CoachAiUnavailableError,
} from "../../src/application/ai-coach/coach-assistance";
import type { TrainerClientMonitoringDto } from "../../src/application/dto/trainer/trainer-client-monitoring.dto";

describe("Mission 076 - Coach AI facts", () => {
    it("projects bounded Athlete facts without names or programme free text", () => {
        const monitoring = {
            athleteId:
                "11111111-1111-4111-8111-111111111111",
            performance: [{
                metric: {
                    slug: "sprint-20m",
                    unit: "s",
                },
                measurements: [
                    {
                        value: 3.1,
                        recordedAt:
                            "2026-10-01T08:00:00.000Z",
                    },
                    {
                        value: 3.2,
                        recordedAt:
                            "2026-09-30T08:00:00.000Z",
                    },
                ],
            }],
            recovery: [],
            trainingStress: [
                {
                    value: 82,
                    recordedAt:
                        "2026-10-01T08:00:00.000Z",
                },
                {
                    value: 76,
                    recordedAt:
                        "2026-09-30T08:00:00.000Z",
                },
            ],
            workoutProgrammes: [{
                name: "Private programme",
                description: "Private description",
                goal: "Private goal",
                trainingFrequency: 4,
                sessionDurationMinutes: 60,
                status: "ACTIVE",
            }],
        } as unknown as TrainerClientMonitoringDto;

        const facts =
            buildCoachAthleteAiFacts(
                monitoring,
            );

        expect(facts.targetType).toBe(
            "ATHLETE",
        );
        expect(
            facts.athlete?.performanceTrends[0],
        ).toMatchObject({
            metricSlug: "sprint-20m",
            latestValue: 3.1,
            previousValue: 3.2,
            delta: -0.1,
            direction: "DOWN",
        });
        expect(
            facts.athlete?.trainingLoad,
        ).toMatchObject({
            latestValue: 82,
            previousValue: 76,
            delta: 6,
            direction: "UP",
        });
        expect(
            facts.athlete?.programmes,
        ).toEqual([{
            trainingFrequency: 4,
            sessionDurationMinutes: 60,
            status: "ACTIVE",
        }]);

        const serialized =
            JSON.stringify(facts);

        expect(serialized)
            .not.toContain(
                "Private programme",
            );
        expect(serialized)
            .not.toContain(
                "Private description",
            );
        expect(serialized)
            .not.toContain("Private goal");
    });

    it("aggregates squad intelligence without Athlete identity", () => {
        const facts =
            buildCoachSquadAiFacts(
                {
                    memberCount: 2,
                    athletes: [
                        {
                            performanceMetricCount: 1,
                            performanceMeasurementCount: 2,
                            workoutProgrammeCount: 1,
                        },
                        {
                            performanceMetricCount: 1,
                            performanceMeasurementCount: 1,
                            workoutProgrammeCount: 1,
                        },
                    ],
                },
                {
                    metrics: [{
                        slug: "jump-height",
                        unit: "cm",
                        athleteCount: 2,
                        pointCount: 3,
                        points: [
                            { value: 40 },
                            { value: 42 },
                            { value: 44 },
                        ],
                    }],
                },
                {
                    athletes: [
                        {
                            observationCount: 2,
                            observations: [
                                {
                                    value: 70,
                                    recordedAt:
                                        "2026-09-30T08:00:00.000Z",
                                },
                                {
                                    value: 80,
                                    recordedAt:
                                        "2026-10-01T08:00:00.000Z",
                                },
                            ],
                        },
                        {
                            observationCount: 1,
                            observations: [{
                                value: 60,
                                recordedAt:
                                    "2026-10-01T08:00:00.000Z",
                            }],
                        },
                    ],
                },
            );

        expect(facts.squad).toMatchObject({
            memberCount: 2,
            performanceMetricCount: 2,
            performanceMeasurementCount: 3,
            workoutProgrammeCount: 2,
            trainingLoad: {
                athletesWithObservations: 2,
                observationCount: 3,
                latestAverageValue: 70,
            },
        });

        expect(
            facts.squad?.trendMetrics[0],
        ).toMatchObject({
            metricSlug: "jump-height",
            averageValue: 42,
            minimumValue: 40,
            maximumValue: 44,
        });
    });

    it("rejects unsafe provider output and keeps limitations server-owned", () => {
        expect(() =>
            validateCoachAiAssistance({
                summary:
                    "<script>unsafe</script>",
                observations: ["Observation"],
                considerations:
                    ["Consideration"],
            }),
        ).toThrow(CoachAiUnavailableError);

        expect(
            coachAiLimitations().confidence,
        ).toBe("NOT_ASSESSED");
    });
});
