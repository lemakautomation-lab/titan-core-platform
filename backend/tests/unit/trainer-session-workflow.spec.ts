import { describe, expect, it } from "vitest";

import { TrainerSessionSchedule } from "../../src/domain/entities/trainer-session-schedule.entity";
import { TrainerSessionScheduleStatus } from "../../src/domain/enums/trainer-session-schedule-status.enum";

describe("Mission 064.11 - Trainer session business workflow", () => {
    const now = new Date("2026-09-19T12:00:00.000Z");

    function schedule() {
        return TrainerSessionSchedule.create(
            "tenant-1",
            "trainer-1",
            "athlete-1",
            "Training Session",
            null,
            new Date("2026-09-20T10:00:00.000Z"),
            new Date("2026-09-20T11:00:00.000Z"),
            now,
        );
    }

    it("completes a scheduled session", () => {
        const value = schedule();
        const changedAt = new Date("2026-09-20T11:00:00.000Z");

        value.complete(changedAt);

        expect(value.status).toBe(
            TrainerSessionScheduleStatus.COMPLETED,
        );
        expect(value.updatedAt).toEqual(changedAt);
    });

    it("cancels a scheduled session", () => {
        const value = schedule();

        value.cancel();

        expect(value.status).toBe(
            TrainerSessionScheduleStatus.CANCELLED,
        );
    });

    it("rejects transitions from terminal states", () => {
        const completed = schedule();
        completed.complete();

        expect(() => completed.cancel()).toThrow(
            "Only a scheduled session can be cancelled.",
        );

        const cancelled = schedule();
        cancelled.cancel();

        expect(() => cancelled.complete()).toThrow(
            "Only a scheduled session can be completed.",
        );
    });

    it("rejects detail changes after a terminal transition", () => {
        const value = schedule();
        value.complete();

        expect(() =>
            value.updateDetails(
                "Changed",
                null,
                new Date("2026-09-21T10:00:00.000Z"),
                new Date("2026-09-21T11:00:00.000Z"),
            ),
        ).toThrow(
            "Only a scheduled session can be updated.",
        );
    });
});
