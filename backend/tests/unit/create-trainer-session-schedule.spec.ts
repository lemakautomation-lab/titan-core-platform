import { describe, expect, it, vi } from "vitest";

import { CreateTrainerSessionScheduleCommand } from "../../src/application/commands/create-trainer-session-schedule.command";
import { CreateTrainerSessionScheduleUseCase } from "../../src/application/use-cases/create-trainer-session-schedule.use-case";
import { TrainerSessionSchedule } from "../../src/domain/entities/trainer-session-schedule.entity";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";

describe("Mission 064.10 - Trainer session scheduling boundary", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-user-1";
    const athleteId = "athlete-1";
    const now = new Date("2026-09-19T12:00:00.000Z");

    function command(
        startsAt = new Date("2026-09-20T10:00:00.000Z"),
        endsAt = new Date("2026-09-20T11:00:00.000Z"),
    ) {
        return new CreateTrainerSessionScheduleCommand(
            tenantId,
            trainerUserId,
            athleteId,
            "Training Session",
            "Strength session",
            startsAt,
            endsAt,
        );
    }

    function relationship(status: RecordStatus = RecordStatus.ACTIVE) {
        return {
            status,
            isActive: () => status === RecordStatus.ACTIVE,
        };
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        athlete?: object | null;
        relationship?: ReturnType<typeof relationship> | null;
        conflict?: TrainerSessionSchedule | null;
    }) {
        const scheduleRepository = {
            findConflicting:
                vi.fn().mockResolvedValue(
                    options?.conflict ?? null,
                ),
            create:
                vi.fn().mockImplementation(
                    async (schedule: TrainerSessionSchedule) =>
                        schedule,
                ),
        };

        const athleteRepository = {
            findById:
                vi.fn().mockResolvedValue(
                    options?.athlete === undefined
                        ? { id: athleteId, tenantId }
                        : options.athlete,
                ),
        };

        const relationshipRepository = {
            findByAthleteAndRelatedEntity:
                vi.fn().mockResolvedValue(
                    options?.relationship === undefined
                        ? relationship()
                        : options.relationship,
                ),
        };

        const trainerAccess = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: {
                    accessGranted:
                        options?.accessGranted ?? true,
                },
            }),
        };

        return {
            scheduleRepository,
            athleteRepository,
            relationshipRepository,
            trainerAccess,
        };
    }

    function useCase(
        d: ReturnType<typeof dependencies>,
    ) {
        return new CreateTrainerSessionScheduleUseCase(
            d.scheduleRepository as never,
            d.athleteRepository as never,
            d.relationshipRepository as never,
            d.trainerAccess as never,
        );
    }

    it("rejects scheduling without active Trainer access", async () => {
        const d = dependencies({ accessGranted: false });

        const result =
            await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );
        expect(d.scheduleRepository.create)
            .not.toHaveBeenCalled();
    });

    it("rejects an Athlete outside the tenant boundary", async () => {
        const d = dependencies({ athlete: null });

        const result =
            await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Athlete not found.");

        expect(d.athleteRepository.findById)
            .toHaveBeenCalledWith(
                athleteId,
                tenantId,
            );

        expect(d.scheduleRepository.create)
            .not.toHaveBeenCalled();
    });

    it("rejects an Athlete without an active Trainer relationship", async () => {
        const d = dependencies({ relationship: null });

        const result =
            await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );

        expect(
            d.relationshipRepository.findByAthleteAndRelatedEntity,
        ).toHaveBeenCalledWith(
            athleteId,
            trainerUserId,
            AthleteRelationshipType.TRAINER,
            tenantId,
        );
    });

    it("rejects an inactive Trainer relationship", async () => {
        const d = dependencies({
            relationship: relationship(RecordStatus.INACTIVE),
        });

        const result =
            await useCase(d).execute(command(), now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
    });

    it("rejects an invalid time range", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(
                new Date("2026-09-20T11:00:00.000Z"),
                new Date("2026-09-20T10:00:00.000Z"),
            ),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Session time range is invalid.",
        );
        expect(d.scheduleRepository.findConflicting)
            .not.toHaveBeenCalled();
    });

    it("rejects a session that does not start in the future", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            command(
                new Date("2026-09-19T12:00:00.000Z"),
                new Date("2026-09-19T13:00:00.000Z"),
            ),
            now,
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Session start time must be in the future.",
        );
        expect(d.scheduleRepository.create)
            .not.toHaveBeenCalled();
    });

    it("rejects an overlapping Trainer or Athlete session", async () => {
        const existing = TrainerSessionSchedule.create(
            tenantId,
            trainerUserId,
            "athlete-2",
            "Existing Session",
            null,
            new Date("2026-09-20T10:30:00.000Z"),
            new Date("2026-09-20T11:30:00.000Z"),
            now,
        );

        const d = dependencies({
            conflict: existing,
        });

        const cmd = command();
        const result =
            await useCase(d).execute(cmd, now);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Session conflicts with an existing Trainer or Athlete session.",
        );

        expect(d.scheduleRepository.findConflicting)
            .toHaveBeenCalledWith(
                tenantId,
                trainerUserId,
                athleteId,
                cmd.startsAt,
                cmd.endsAt,
            );

        expect(d.scheduleRepository.create)
            .not.toHaveBeenCalled();
    });

    it("creates a valid tenant-owned Trainer session", async () => {
        const d = dependencies();
        const cmd = command();

        const result =
            await useCase(d).execute(cmd, now);

        expect(result.isSuccess).toBe(true);
        expect(result.value?.tenantId).toBe(tenantId);
        expect(result.value?.trainerUserId)
            .toBe(trainerUserId);
        expect(result.value?.athleteId).toBe(athleteId);
        expect(result.value?.title)
            .toBe("Training Session");

        expect(d.scheduleRepository.create)
            .toHaveBeenCalledTimes(1);
    });
});
