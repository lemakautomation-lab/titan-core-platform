import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { UpdateMyPersonalDetailsCommand } from "../../src/application/commands/update-my-personal-details.command";
import { PersonalDetailsUpdateTransaction } from "../../src/application/ports/personal-details-update.transaction";
import { UpdateMyPersonalDetailsUseCase } from "../../src/application/use-cases/update-my-personal-details.use-case";

function createTransaction():
PersonalDetailsUpdateTransaction {

    return {
        execute: vi.fn(
            async (input) => ({
                userId: input.userId,
                athleteId: "athlete-1",
                tenantId: input.tenantId,
                firstName:
                    input.firstName.trim(),
                lastName:
                    input.lastName.trim(),
                email:
                    input.email.trim().toLowerCase(),
                contactNumber:
                    input.contactNumber,
                countryCode:
                    input.countryCode
                        .trim()
                        .toUpperCase(),
                dateOfBirth:
                    input.dateOfBirth,
            }),
        ),
    };
}

describe(
    "Update my personal details",
    () => {

        it(
            "passes authenticated identity to one transaction",
            async () => {

                const transaction =
                    createTransaction();

                const useCase =
                    new UpdateMyPersonalDetailsUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyPersonalDetailsCommand(
                            "user-1",
                            "tenant-1",
                            " Titan ",
                            " Athlete ",
                            " ATHLETE@TITAN.TEST ",
                            "+27821234567",
                            "za",
                            new Date(
                                "2000-01-01T00:00:00.000Z",
                            ),
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

                expect(input.userId).toBe(
                    "user-1",
                );

                expect(input.tenantId).toBe(
                    "tenant-1",
                );

                expect(
                    Object.isFrozen(input),
                ).toBe(true);
            },
        );

        it(
            "returns transaction validation failure",
            async () => {

                const transaction =
                    createTransaction();

                vi.mocked(
                    transaction.execute,
                ).mockRejectedValueOnce(
                    new Error(
                        "Athlete first name is required.",
                    ),
                );

                const useCase =
                    new UpdateMyPersonalDetailsUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyPersonalDetailsCommand(
                            "user-1",
                            "tenant-1",
                            "",
                            "Athlete",
                            "athlete@titan.test",
                            null,
                            "ZA",
                            null,
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe(
                    "Athlete first name is required.",
                );
            },
        );

        it(
            "does not reinterpret duplicate-email failure",
            async () => {

                const transaction =
                    createTransaction();

                vi.mocked(
                    transaction.execute,
                ).mockRejectedValueOnce(
                    new Error(
                        "Email already exists for this tenant.",
                    ),
                );

                const useCase =
                    new UpdateMyPersonalDetailsUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new UpdateMyPersonalDetailsCommand(
                            "user-1",
                            "tenant-1",
                            "Titan",
                            "Athlete",
                            "duplicate@titan.test",
                            null,
                            "ZA",
                            null,
                        ),
                    );

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe(
                    "Email already exists for this tenant.",
                );
            },
        );
    },
);
