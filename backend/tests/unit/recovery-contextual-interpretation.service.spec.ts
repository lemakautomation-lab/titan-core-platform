import { describe, expect, it } from "vitest";
import { RecoveryContextualInterpretationService } from "../../src/domain/services/recovery-contextual-interpretation.service";
import { RecoveryTrendPoint } from "../../src/domain/services/recovery-trend.service";
import { SleepTracking } from "../../src/domain/entities/sleep-tracking.entity";
import { RestTracking } from "../../src/domain/entities/rest-tracking.entity";
import { TrainingStress } from "../../src/domain/entities/training-stress.entity";

const trend: RecoveryTrendPoint = {
    recordedAt: new Date("2026-09-10T10:00:00.000Z"),
    value: 6,
    direction: "FALLING",
};

function sleep(): SleepTracking {
    return SleepTracking.create(
        "tenant-1",
        "athlete-1",
        7,
        new Date("2026-09-10T08:00:00.000Z"),
        "SYSTEM",
        "test",
        "sleep-1",
    );
}

function rest(): RestTracking {
    return RestTracking.create(
        "tenant-1",
        "athlete-1",
        6,
        new Date("2026-09-10T09:00:00.000Z"),
        "SYSTEM",
        "test",
        "rest-1",
    );
}

function trainingStress(): TrainingStress {
    return TrainingStress.create(
        "tenant-1",
        "athlete-1",
        5,
        new Date("2026-09-10T09:30:00.000Z"),
        "SYSTEM",
        "test",
        "stress-1",
    );
}

describe("Recovery Contextual Interpretation Service", () => {
    it("returns the trend with no contextual signals", () => {
        const result =
            RecoveryContextualInterpretationService.interpret(
                trend,
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                },
            );

        expect(result.direction).toBe("FALLING");
        expect(result.contextAvailable).toBe(false);
        expect(result.contextSources).toEqual([]);
        expect(result.summary).toContain("contextual signals available: none");
    });

    it("identifies supplied sleep and rest context", () => {
        const result =
            RecoveryContextualInterpretationService.interpret(
                trend,
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                    sleep: sleep(),
                    rest: rest(),
                },
            );

        expect(result.contextAvailable).toBe(true);
        expect(result.contextSources).toEqual(["SLEEP", "REST"]);
    });

    it("identifies training stress context without interpreting its value", () => {
        const result =
            RecoveryContextualInterpretationService.interpret(
                trend,
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                    trainingStress: trainingStress(),
                },
            );

        expect(result.contextSources).toEqual(["TRAINING_STRESS"]);
        expect(result.summary).toContain("TRAINING_STRESS");
        expect(result.summary).not.toContain("better");
        expect(result.summary).not.toContain("worse");
    });

    it("rejects context from another tenant", () => {
        expect(() =>
            RecoveryContextualInterpretationService.interpret(
                trend,
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                    sleep: SleepTracking.create(
                        "tenant-2",
                        "athlete-1",
                        7,
                        new Date("2026-09-10T08:00:00.000Z"),
                        "SYSTEM",
                        "test",
                        "sleep-2",
                    ),
                },
            ),
        ).toThrow("Recovery context ownership does not match.");
    });

    it("rejects context from another athlete", () => {
        expect(() =>
            RecoveryContextualInterpretationService.interpret(
                trend,
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                    rest: RestTracking.create(
                        "tenant-1",
                        "athlete-2",
                        6,
                        new Date("2026-09-10T09:00:00.000Z"),
                        "SYSTEM",
                        "test",
                        "rest-2",
                    ),
                },
            ),
        ).toThrow("Recovery context ownership does not match.");
    });

    it("preserves observational trend semantics", () => {
        const result =
            RecoveryContextualInterpretationService.interpret(
                {
                    ...trend,
                    direction: "RISING",
                },
                {
                    tenantId: "tenant-1",
                    athleteId: "athlete-1",
                    sleep: sleep(),
                    trainingStress: trainingStress(),
                },
            );

        expect(result.direction).toBe("RISING");
        expect(result.summary).toBe(
            "Recovery trend is RISING; contextual signals available: SLEEP, TRAINING_STRESS.",
        );
    });
});
