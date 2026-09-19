import { describe, expect, it, vi } from "vitest";

import { UpdateTrainerSessionWorkflowCommand } from "../../src/application/commands/update-trainer-session-workflow.command";
import { UpdateTrainerSessionWorkflowUseCase } from "../../src/application/use-cases/update-trainer-session-workflow.use-case";
import { TrainerSessionSchedule } from "../../src/domain/entities/trainer-session-schedule.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainerSessionScheduleStatus } from "../../src/domain/enums/trainer-session-schedule-status.enum";

describe("Mission 064.11 - Trainer session workflow application", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-1";
    const athleteId = "athlete-1";
    const now = new Date("2026-09-20T12:00:00.000Z");

    function schedule(trainerId = trainerUserId) {
        return TrainerSessionSchedule.create(
            tenantId,
            trainerId,
            athleteId,
            "Training Session",
            null,
            new Date("2026-09-21T10:00:00.000Z"),
            new Date("2026-09-21T11:00:00.000Z"),
            now,
        );
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        schedule?: TrainerSessionSchedule | null;
        relationshipActive?: boolean;
    }) {
        const persisted =
            options?.schedule === undefined
                ? schedule()
                : options.schedule;

        return {
            scheduleRepository: {
                findById: vi.fn().mockResolvedValue(persisted),
                update: vi.fn().mockImplementation(
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
        return new UpdateTrainerSessionWorkflowUseCase(
            d.scheduleRepository as never,
            d.relationshipRepository as never,
            d.trainerAccess as never,
        );
    }

    function command(status: TrainerSessionScheduleStatus) {
        return new UpdateTrainerSessionWorkflowCommand(
            "schedule-1",
            tenantId,
            trainerUserId,
            status,
        );
    }

    it("completes an owned scheduled session", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.COMPLETED),
            now,
        );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe(
            TrainerSessionScheduleStatus.COMPLETED,
        );
        expect(d.scheduleRepository.update).toHaveBeenCalledOnce();
    });

    it("cancels an owned scheduled session", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.CANCELLED),
            now,
        );

        expect(result.isSuccess).toBe(true);
        expect(result.value?.status).toBe(
            TrainerSessionScheduleStatus.CANCELLED,
        );
    });

    it("rejects inactive Trainer access", async () => {
        const d = dependencies({ accessGranted: false });

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.COMPLETED),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );
        expect(d.scheduleRepository.update).not.toHaveBeenCalled();
    });

    it("hides sessions owned by another Trainer", async () => {
        const d = dependencies({
            schedule: schedule("trainer-2"),
        });

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.COMPLETED),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Trainer session schedule not found.",
        );
    });

    it("rejects an inactive Trainer client relationship", async () => {
        const d = dependencies({
            relationshipActive: false,
        });

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.CANCELLED),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
    });

    it("rejects an invalid workflow status", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(
                TrainerSessionScheduleStatus.SCHEDULED,
            ),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Trainer session workflow status is invalid.",
        );
        expect(d.scheduleRepository.update).not.toHaveBeenCalled();
    });

    it("rejects a second terminal transition", async () => {
        const value = schedule();
        value.complete(now);

        const d = dependencies({ schedule: value });

        const result = await useCase(d).execute(
            command(TrainerSessionScheduleStatus.CANCELLED),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Only a scheduled session can be cancelled.",
        );
        expect(d.scheduleRepository.update).not.toHaveBeenCalled();
    });
});
