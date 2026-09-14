import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { UpdateMyAthleteGoalsCommand } from "../../src/application/commands/update-my-athlete-goals.command";
import { AthleteGoalsUpdateTransaction } from "../../src/application/ports/athlete-goals-update.transaction";
import { UpdateMyAthleteGoalsUseCase } from "../../src/application/use-cases/update-my-athlete-goals.use-case";
import { AthleteGoal } from "../../src/domain/entities/athlete-goal.entity";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";

function createTransaction():
AthleteGoalsUpdateTransaction {
    return {
        execute: vi.fn(
            async (input) => ({
                athleteId: "athlete-1",
                tenantId: input.tenantId,
                primaryGoal:
                    ProgrammeGoalClassification.STRENGTH,
                secondaryGoals: [
                    ProgrammeGoalClassification.MOBILITY,
                    ProgrammeGoalClassification.GENERAL_FITNESS,
                ],
            }),
        ),
    };
}

describe(
    "Update my athlete goals",
    () => {

        it(
            "accepts multiple canonical goals with one primary",
            () => {
                const selection =
                    AthleteGoal.validateSelection(
                        ProgrammeGoalClassification.STRENGTH,
                        [
                            ProgrammeGoalClassification.GENERAL_FITNESS,
                            ProgrammeGoalClassification.MOBILITY,
                        ],
                    );

                expect(selection).toEqual({
                    primaryGoal:
                        ProgrammeGoalClassification.STRENGTH,
                    secondaryGoals: [
                        ProgrammeGoalClassification.MOBILITY,
                        ProgrammeGoalClassification.GENERAL_FITNESS,
                    ],
                });
            },
        );

        it(
            "rejects an invalid classification",
            () => {
                expect(
                    () => AthleteGoal.validateSelection(
                        "INVALID",
                        [],
                    ),
                ).toThrow(
                    "Athlete goal classification is invalid.",
                );
            },
        );

        it(
            "rejects duplicate secondary goals",
            () => {
                expect(
                    () => AthleteGoal.validateSelection(
                        ProgrammeGoalClassification.STRENGTH,
                        [
                            ProgrammeGoalClassification.MOBILITY,
                            ProgrammeGoalClassification.MOBILITY,
                        ],
                    ),
                ).toThrow(
                    "Secondary athlete goals must be unique.",
                );
            },
        );

        it(
            "rejects the primary goal as secondary",
            () => {
                expect(
                    () => AthleteGoal.validateSelection(
                        ProgrammeGoalClassification.STRENGTH,
                        [
                            ProgrammeGoalClassification.STRENGTH,
                        ],
                    ),
                ).toThrow(
                    "Primary athlete goal cannot also be secondary.",
                );
            },
        );

        it(
            "passes authenticated identity to one transaction",
            async () => {
                const transaction = createTransaction();

                const useCase =
                    new UpdateMyAthleteGoalsUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyAthleteGoalsCommand(
                            "user-1",
                            "tenant-1",
                            ProgrammeGoalClassification.STRENGTH,
                            [
                                ProgrammeGoalClassification.MOBILITY,
                            ],
                        ),
                    );

                expect(result.isSuccess).toBe(true);
                expect(
                    transaction.execute,
                ).toHaveBeenCalledOnce();

                const input =
                    vi.mocked(
                        transaction.execute,
                    ).mock.calls[0][0];

                expect(input.userId).toBe("user-1");
                expect(input.tenantId).toBe("tenant-1");
                expect(Object.isFrozen(input)).toBe(true);
            },
        );

        it(
            "returns a controlled transaction failure",
            async () => {
                const transaction = createTransaction();

                vi.mocked(
                    transaction.execute,
                ).mockRejectedValueOnce(
                    new Error(
                        "Athlete profile not found.",
                    ),
                );

                const useCase =
                    new UpdateMyAthleteGoalsUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyAthleteGoalsCommand(
                            "user-1",
                            "tenant-1",
                            ProgrammeGoalClassification.STRENGTH,
                            [],
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe(
                    "Athlete profile not found.",
                );
            },
        );
    },
);