import { describe, expect, it, vi } from "vitest";

import { CreateWorkoutProgrammeCommand } from "../../src/application/commands/create-workout-programme.command";
import { CreateTrainerWorkoutProgrammeUseCase } from "../../src/application/use-cases/create-trainer-workout-programme.use-case";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";

describe("Mission 064.5 - Trainer programme creation boundary", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-user-1";
    const athleteId = "athlete-1";

    function command() {
        return new CreateWorkoutProgrammeCommand(
            tenantId,
            trainerUserId,
            athleteId,
            "Strength Programme",
            "Trainer-created programme",
            "STRENGTH",
            "INTERMEDIATE",
            3,
            60,
            null,
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
        relationship?: ReturnType<typeof relationship> | null;
    }) {
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

        const createWorkoutProgramme = {
            execute: vi.fn().mockResolvedValue({
                isSuccess: true,
                value: { id: "programme-1" },
            }),
        };

        return {
            relationshipRepository,
            trainerAccess,
            createWorkoutProgramme,
        };
    }

    it("rejects programme creation without active Trainer access", async () => {
        const d = dependencies({ accessGranted: false });

        const useCase = new CreateTrainerWorkoutProgrammeUseCase(
            d.relationshipRepository as never,
            d.trainerAccess as never,
            d.createWorkoutProgramme as never,
        );

        const result = await useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );
        expect(d.createWorkoutProgramme.execute)
            .not.toHaveBeenCalled();
    });

    it("rejects an Athlete who is not an active Trainer client", async () => {
        const d = dependencies({ relationship: null });

        const useCase = new CreateTrainerWorkoutProgrammeUseCase(
            d.relationshipRepository as never,
            d.trainerAccess as never,
            d.createWorkoutProgramme as never,
        );

        const result = await useCase.execute(command());

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

        expect(d.createWorkoutProgramme.execute)
            .not.toHaveBeenCalled();
    });

    it("rejects an inactive Trainer-client relationship", async () => {
        const d = dependencies({
            relationship: relationship(RecordStatus.INACTIVE),
        });

        const useCase = new CreateTrainerWorkoutProgrammeUseCase(
            d.relationshipRepository as never,
            d.trainerAccess as never,
            d.createWorkoutProgramme as never,
        );

        const result = await useCase.execute(command());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );

        expect(d.createWorkoutProgramme.execute)
            .not.toHaveBeenCalled();
    });

    it("delegates valid Trainer programme creation to the existing engine", async () => {
        const d = dependencies();

        const useCase = new CreateTrainerWorkoutProgrammeUseCase(
            d.relationshipRepository as never,
            d.trainerAccess as never,
            d.createWorkoutProgramme as never,
        );

        const cmd = command();
        const result = await useCase.execute(cmd);

        expect(result.isSuccess).toBe(true);

        expect(d.createWorkoutProgramme.execute)
            .toHaveBeenCalledTimes(1);

        expect(d.createWorkoutProgramme.execute)
            .toHaveBeenCalledWith(cmd);
    });
});
