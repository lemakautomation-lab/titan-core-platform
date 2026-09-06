import { describe, expect, it } from "vitest";

import {
    PerformanceEvidenceEvaluator,
} from "../../src/domain/services/performance-evidence-evaluator.service";

describe("PerformanceEvidenceEvaluator", () => {
    const evaluator = new PerformanceEvidenceEvaluator();

    const measurement = (value: number, recordedAt: string) => ({
        value,
        recordedAt: new Date(recordedAt),
    });

    it("requires at least two measurements", () => {
        expect(
            evaluator.evaluate({
                measurements: [
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection: "HIGHER_IS_BETTER",
            }),
        ).toEqual({
            evidenceSufficient: false,
            performanceImproved: false,
        });
    });

    it("detects improvement when higher values are better", () => {
        expect(
            evaluator.evaluate({
                measurements: [
                    measurement(110, "2026-09-02T10:00:00Z"),
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection: "HIGHER_IS_BETTER",
            }),
        ).toEqual({
            evidenceSufficient: true,
            performanceImproved: true,
        });
    });

    it("detects improvement when lower values are better", () => {
        expect(
            evaluator.evaluate({
                measurements: [
                    measurement(90, "2026-09-02T10:00:00Z"),
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection: "LOWER_IS_BETTER",
            }),
        ).toEqual({
            evidenceSufficient: true,
            performanceImproved: true,
        });
    });

    it("holds when values are unchanged", () => {
        expect(
            evaluator.evaluate({
                measurements: [
                    measurement(100, "2026-09-02T10:00:00Z"),
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection: "HIGHER_IS_BETTER",
            }),
        ).toEqual({
            evidenceSufficient: true,
            performanceImproved: false,
        });
    });

    it("does not assume higher values are better", () => {
        expect(
            evaluator.evaluate({
                measurements: [
                    measurement(110, "2026-09-02T10:00:00Z"),
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection: "LOWER_IS_BETTER",
            }),
        ).toEqual({
            evidenceSufficient: true,
            performanceImproved: false,
        });
    });

    it("rejects an invalid improvement direction", () => {
        expect(() =>
            evaluator.evaluate({
                measurements: [
                    measurement(110, "2026-09-02T10:00:00Z"),
                    measurement(100, "2026-09-01T10:00:00Z"),
                ],
                improvementDirection:
                    "UNKNOWN" as never,
            }),
        ).toThrow(
            "Performance improvement direction is required.",
        );
    });
});
