import { describe, expect, it, vi } from "vitest";

import { AssignTrainerWorkoutProgrammeCommand } from "../../src/application/commands/assign-trainer-workout-programme.command";
import { AssignTrainerWorkoutProgrammeUseCase } from "../../src/application/use-cases/assign-trainer-workout-programme.use-case";
import { WorkoutProgramme } from "../../src/domain/entities/workout-programme.entity";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";

describe("Mission 064.6 - Trainer client workout assignment", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-user-1";
    const currentAthleteId = "athlete-current";
    const targetAthleteId = "athlete-target";
    const programmeId = "programme-1";

    function command() {
        return new AssignTrainerWorkoutProgrammeCommand(
            programmeId,
            tenantId,
            trainerUserId,
            targetAthleteId,
        );
    }

    function programme() {
        return new WorkoutProgramme(
            programmeId,
            tenantId,
            currentAthleteId,
            "Strength Programme",
            null,
            "Strength",
            "Intermediate",
            3,
            60,
            null,
            RecordStatus.ACTIVE,
            new Date("2026-09-19T00:00:00.000Z"),
            new Date("2026-09-19T00:00:00.000Z"),
        );
    }

    function relationship(
        status: RecordStatus = RecordStatus.ACTIVE,
    ) {
        return {
            status,
            isActive: () =>
                status === RecordStatus.ACTIVE,
        };
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        programme?: WorkoutProgramme | null;
        athlete?: object | null;
        relationship?: ReturnType<typeof relationship> | null;
    }) {
        const storedProgramme =
            options?.programme === undefined
                ? programme()
                : options.programme;

        const workoutProgrammeRepository = {
            findById:
                vi.fn().mockResolvedValue(
                    storedProgramme,
                ),
            update:
                vi.fn().mockImplementation(
                    async (value) => value,
                ),
        };

        const athleteRepository = {
            findById:
                vi.fn().mockResolvedValue(
                    options?.athlete === undefined
                        ? { id: targetAthleteId }
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
            workoutProgrammeRepository,
            athleteRepository,
            relationshipRepository,
            trainerAccess,
            storedProgramme,
        };
    }

    function useCase(
        d: ReturnType<typeof dependencies>,
    ) {
        return new AssignTrainerWorkoutProgrammeUseCase(
            d.workoutProgrammeRepository as never,
            d.athleteRepository as never,
            d.relationshipRepository as never,
            d.trainerAccess as never,
        );
    }

    it("rejects assignment without active Trainer access", async () => {
        const d = dependencies({
            accessGranted: false,
        });

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );

        expect(
            d.workoutProgrammeRepository.findById,
        ).not.toHaveBeenCalled();

        expect(
            d.workoutProgrammeRepository.update,
        ).not.toHaveBeenCalled();
    });

    it("rejects a missing Workout Programme", async () => {
        const d = dependencies({
            programme: null,
        });

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Workout Programme not found.",
        );

        expect(
            d.workoutProgrammeRepository.findById,
        ).toHaveBeenCalledWith(
            programmeId,
            tenantId,
        );

        expect(
            d.workoutProgrammeRepository.update,
        ).not.toHaveBeenCalled();
    });

    it("rejects a missing target Athlete", async () => {
        const d = dependencies({
            athlete: null,
        });

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete not found.",
        );

        expect(
            d.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).not.toHaveBeenCalled();

        expect(
            d.workoutProgrammeRepository.update,
        ).not.toHaveBeenCalled();
    });

    it("rejects an Athlete who is not an active Trainer client", async () => {
        const d = dependencies({
            relationship: null,
        });

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );

        expect(
            d.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).toHaveBeenCalledWith(
            targetAthleteId,
            trainerUserId,
            AthleteRelationshipType.TRAINER,
            tenantId,
        );

        expect(
            d.workoutProgrammeRepository.update,
        ).not.toHaveBeenCalled();
    });

    it("rejects an inactive Trainer-client relationship", async () => {
        const d = dependencies({
            relationship:
                relationship(RecordStatus.INACTIVE),
        });

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );

        expect(
            d.workoutProgrammeRepository.update,
        ).not.toHaveBeenCalled();
    });

    it("assigns and persists the programme for an active Trainer client", async () => {
        const d = dependencies();

        const result =
            await useCase(d).execute(command());

        expect(result.isSuccess).toBe(true);

        expect(d.storedProgramme?.athleteId)
            .toBe(targetAthleteId);

        expect(
            d.workoutProgrammeRepository.update,
        ).toHaveBeenCalledTimes(1);

        expect(
            d.workoutProgrammeRepository.update,
        ).toHaveBeenCalledWith(
            d.storedProgramme,
            tenantId,
        );

        expect(result.value?.athleteId)
            .toBe(targetAthleteId);
    });
});
