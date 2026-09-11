import { describe, expect, it } from "vitest";
import { RecoveryTrendService } from "../../src/domain/services/recovery-trend.service";
import { RestTracking } from "../../src/domain/entities/rest-tracking.entity";

function observation(
    value: number,
    recordedAt: string,
): RestTracking {
    return RestTracking.create(
        "tenant-1",
        "athlete-1",
        value,
        new Date(recordedAt),
        "SYSTEM",
        "test",
        `observation-${recordedAt}`,
    );
}

describe("Recovery Trend Service", () => {
    it("returns no trend points for empty observations", () => {
        expect(RecoveryTrendService.evaluate([])).toEqual([]);
    });

    it("marks the first observation as stable", () => {
        const result = RecoveryTrendService.evaluate([
            observation(7, "2026-09-01T10:00:00.000Z"),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].direction).toBe("STABLE");
    });

    it("detects rising observations", () => {
        const result = RecoveryTrendService.evaluate([
            observation(5, "2026-09-01T10:00:00.000Z"),
            observation(7, "2026-09-02T10:00:00.000Z"),
        ]);

        expect(result.map(point => point.direction))
            .toEqual(["STABLE", "RISING"]);
    });

    it("detects falling observations", () => {
        const result = RecoveryTrendService.evaluate([
            observation(7, "2026-09-01T10:00:00.000Z"),
            observation(5, "2026-09-02T10:00:00.000Z"),
        ]);

        expect(result.map(point => point.direction))
            .toEqual(["STABLE", "FALLING"]);
    });

    it("detects stable observations", () => {
        const result = RecoveryTrendService.evaluate([
            observation(7, "2026-09-01T10:00:00.000Z"),
            observation(7, "2026-09-02T10:00:00.000Z"),
        ]);

        expect(result.map(point => point.direction))
            .toEqual(["STABLE", "STABLE"]);
    });

    it("orders observations chronologically without mutating input", () => {
        const first = observation(5, "2026-09-01T10:00:00.000Z");
        const second = observation(7, "2026-09-02T10:00:00.000Z");

        const input = [second, first];
        const result = RecoveryTrendService.evaluate(input);

        expect(result.map(point => point.value))
            .toEqual([5, 7]);
        expect(input).toEqual([second, first]);
    });

    it("does not assign better or worse semantics to direction", () => {
        const result = RecoveryTrendService.evaluate([
            observation(8, "2026-09-01T10:00:00.000Z"),
            observation(6, "2026-09-02T10:00:00.000Z"),
        ]);

        expect(result[1].direction).toBe("FALLING");
    });
});
