import { describe, expect, it, vi } from "vitest";

import { UpdateTrainerSessionScheduleCommand } from "../../src/application/commands/update-trainer-session-schedule.command";
import { UpdateTrainerSessionScheduleUseCase } from "../../src/application/use-cases/update-trainer-session-schedule.use-case";
import { TrainerSessionSchedule } from "../../src/domain/entities/trainer-session-schedule.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";

describe("Mission 064.10 - Trainer session rescheduling", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-1";
    const athleteId = "athlete-1";
    const now = new Date("2026-09-19T12:00:00.000Z");

    function schedule(trainerId = trainerUserId) {
        return TrainerSessionSchedule.create(
            tenantId,
            trainerId,
            athleteId,
            "Original Session",
            null,
            new Date("2026-09-20T10:00:00.000Z"),
            new Date("2026-09-20T11:00:00.000Z"),
            now,
        );
    }

    function command(
        startsAt = new Date("2026-09-21T10:00:00.000Z"),
        endsAt = new Date("2026-09-21T11:00:00.000Z"),
    ) {
        return new UpdateTrainerSessionScheduleCommand(
            "schedule-1",
            tenantId,
            trainerUserId,
            "Updated Session",
            "Updated notes",
            startsAt,
            endsAt,
        );
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        schedule?: TrainerSessionSchedule | null;
        relationshipActive?: boolean;
        conflict?: TrainerSessionSchedule | null;
    }) {
        const persisted =
            options?.schedule === undefined
                ? schedule()
                : options.schedule;

        return {
            scheduleRepository: {
                findById: vi.fn().mockResolvedValue(persisted),
                findConflicting:
                    vi.fn().mockResolvedValue(
                        options?.conflict ?? null,
                    ),
                update:
                    vi.fn().mockImplementation(
                        async value => value,
                    ),
            },
            relationshipRepository: {
                findByAthleteAndRelatedEntity:
                    vi.fn().mockResolvedValue({
                        status:
                            options?.relationshipActive === false
                                ? RecordStatus.INACTIVE
                                : RecordStatus.ACTIVE,
                        isActive: () =>
                            options?.relationshipActive !== false,
                    }),
            },
            trainerAccess: {
                execute: vi.fn().mockResolvedValue({
                    isSuccess: true,
                    value: {
                        accessGranted:
                            options?.accessGranted ?? true,
                    },
                }),
            },
        };
    }

    function useCase(d: ReturnType<typeof dependencies>) {
        return new UpdateTrainerSessionScheduleUseCase(
            d.scheduleRepository as never,
            d.relationshipRepository as never,
            d.trainerAccess as never,
        );
    }

    it("rejects update without active Trainer access", async () => {
        const d = dependencies({ accessGranted: false });
        const result = await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );
    });

    it("rejects a missing schedule", async () => {
        const d = dependencies({ schedule: null });
        const result = await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Trainer session schedule not found.",
        );
    });

    it("rejects a schedule owned by another Trainer", async () => {
        const d = dependencies({
            schedule: schedule("trainer-2"),
        });

        const result = await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Trainer session schedule not found.",
        );
        expect(d.scheduleRepository.update)
            .not.toHaveBeenCalled();
    });

    it("rejects an inactive client relationship", async () => {
        const d = dependencies({
            relationshipActive: false,
        });

        const result = await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
    });

    it("rejects a non-future reschedule", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(
                now,
                new Date("2026-09-19T13:00:00.000Z"),
            ),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Session start time must be in the future.",
        );
    });

    it("rejects a conflicting reschedule", async () => {
        const d = dependencies({
            conflict: schedule(),
        });
        const cmd = command();

        const result = await useCase(d).execute(cmd, now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toContain("conflicts");

        expect(d.scheduleRepository.findConflicting)
            .toHaveBeenCalledWith(
                tenantId,
                trainerUserId,
                athleteId,
                cmd.startsAt,
                cmd.endsAt,
                expect.any(String),
            );

        expect(d.scheduleRepository.update)
            .not.toHaveBeenCalled();
    });

    it("updates a valid owned session", async () => {
        const d = dependencies();
        const cmd = command();

        const result = await useCase(d).execute(cmd, now);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.title).toBe("Updated Session");
        expect(result.value?.notes).toBe("Updated notes");
        expect(result.value?.startsAt).toEqual(cmd.startsAt);
        expect(result.value?.endsAt).toEqual(cmd.endsAt);

        expect(d.scheduleRepository.update)
            .toHaveBeenCalledTimes(1);
    });
});
