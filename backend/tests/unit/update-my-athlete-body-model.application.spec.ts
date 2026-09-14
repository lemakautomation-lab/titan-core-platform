import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { UpdateMyAthleteBodyModelCommand } from "../../src/application/commands/update-my-athlete-body-model.command";
import { AthleteBodyModelUpdateTransaction } from "../../src/application/ports/athlete-body-model-update.transaction";
import { UpdateMyAthleteBodyModelUseCase } from "../../src/application/use-cases/update-my-athlete-body-model.use-case";
import { PerformanceBodyModelType } from "../../src/domain/enums/performance-body-model-type.enum";

describe(
    "Update my Athlete body model",
    () => {

        it(
            "passes authenticated identity to one transaction",
            async () => {
                const transaction:
                    AthleteBodyModelUpdateTransaction = {
                        execute: vi.fn(
                            async (input) => ({
                                athleteId:
                                    "athlete-1",
                                tenantId:
                                    input.tenantId,
                                modelType:
                                    PerformanceBodyModelType
                                        .MALE,
                            }),
                        ),
                    };

                const useCase =
                    new UpdateMyAthleteBodyModelUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyAthleteBodyModelCommand(
                            "user-1",
                            "tenant-1",
                            "MALE",
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
            "returns controlled transaction failure",
            async () => {
                const transaction:
                    AthleteBodyModelUpdateTransaction = {
                        execute: vi.fn(
                            async () => {
                                throw new Error(
                                    "Athlete profile not found.",
                                );
                            },
                        ),
                    };

                const useCase =
                    new UpdateMyAthleteBodyModelUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyAthleteBodyModelCommand(
                            "user-1",
                            "tenant-1",
                            "FEMALE",
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