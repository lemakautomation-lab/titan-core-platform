import { describe, expect, it, vi } from "vitest";

import { ListTrainerSessionSchedulesQuery } from "../../src/application/queries/trainer/list-trainer-session-schedules.query";
import { ListTrainerSessionSchedulesUseCase } from "../../src/application/use-cases/list-trainer-session-schedules.use-case";
import { TrainerSessionSchedule } from "../../src/domain/entities/trainer-session-schedule.entity";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";

describe("Mission 064.10 - Trainer session schedule retrieval", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-1";
    const athleteId = "athlete-1";
    const from = new Date("2026-09-20T00:00:00.000Z");
    const before = new Date("2026-09-27T00:00:00.000Z");

    function relationship(status = RecordStatus.ACTIVE) {
        return {
            status,
            isActive: () => status === RecordStatus.ACTIVE,
        };
    }

    function schedule() {
        return TrainerSessionSchedule.create(
            tenantId,
            trainerUserId,
            athleteId,
            "Training Session",
            null,
            new Date("2026-09-21T10:00:00.000Z"),
            new Date("2026-09-21T11:00:00.000Z"),
            new Date("2026-09-19T12:00:00.000Z"),
        );
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        athlete?: object | null;
        relationship?: ReturnType<typeof relationship> | null;
    }) {
        return {
            scheduleRepository: {
                listForTrainer:
                    vi.fn().mockResolvedValue([schedule()]),
            },
            athleteRepository: {
                findById:
                    vi.fn().mockResolvedValue(
                        options?.athlete === undefined
                            ? { id: athleteId, tenantId }
                            : options.athlete,
                    ),
            },
            relationshipRepository: {
                findByAthleteAndRelatedEntity:
                    vi.fn().mockResolvedValue(
                        options?.relationship === undefined
                            ? relationship()
                            : options.relationship,
                    ),
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
        return new ListTrainerSessionSchedulesUseCase(
            d.scheduleRepository as never,
            d.athleteRepository as never,
            d.relationshipRepository as never,
            d.trainerAccess as never,
        );
    }

    it("rejects an invalid date window", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                before,
                from,
            ),
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Session schedule date range is invalid.",
        );
        expect(d.scheduleRepository.listForTrainer)
            .not.toHaveBeenCalled();
    });

    it("rejects retrieval without active Trainer access", async () => {
        const d = dependencies({ accessGranted: false });

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                from,
                before,
            ),
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );
    });

    it("retrieves the authenticated Trainer calendar", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                from,
                before,
            ),
        );

        expect(result.isSuccess).toBe(true);
        expect(result.value).toHaveLength(1);

        expect(d.scheduleRepository.listForTrainer)
            .toHaveBeenCalledWith(
                tenantId,
                trainerUserId,
                from,
                before,
                undefined,
            );

        expect(d.athleteRepository.findById)
            .not.toHaveBeenCalled();
    });

    it("rejects an unknown tenant-scoped Athlete filter", async () => {
        const d = dependencies({ athlete: null });

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                from,
                before,
                athleteId,
            ),
        );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Athlete not found.");
        expect(d.scheduleRepository.listForTrainer)
            .not.toHaveBeenCalled();
    });

    it("rejects an Athlete filter without an active Trainer relationship", async () => {
        const d = dependencies({ relationship: null });

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                from,
                before,
                athleteId,
            ),
        );

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

    it("retrieves an authorized Athlete calendar filter", async () => {
        const d = dependencies();

        const result = await useCase(d).execute(
            new ListTrainerSessionSchedulesQuery(
                tenantId,
                trainerUserId,
                from,
                before,
                athleteId,
            ),
        );

        expect(result.isSuccess).toBe(true);

        expect(d.scheduleRepository.listForTrainer)
            .toHaveBeenCalledWith(
                tenantId,
                trainerUserId,
                from,
                before,
                athleteId,
            );
    });
});
