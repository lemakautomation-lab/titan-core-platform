import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { RegisterAthleteCommand } from "../../src/application/commands/register-athlete.command";
import { AthleteRegistrationTransaction } from "../../src/application/ports/athlete-registration.transaction";
import { RegisterAthleteUseCase } from "../../src/application/use-cases/register-athlete.use-case";
import { getConsumerTenantSlug } from "../../src/config/consumer-tenant.config";

describe("Register Athlete application boundary", () => {
    it("normalizes configured consumer tenant slug", () => {
        expect(
            getConsumerTenantSlug(
                "  titan-health-consumer  ",
            ),
        ).toBe("titan-health-consumer");
    });

    it("rejects missing or invalid configuration", () => {
        expect(
            () => getConsumerTenantSlug(
                undefined,
                "production",
            ),
        ).toThrow(
            "TITAN Health consumer tenant is not configured.",
        );

        expect(
            () => getConsumerTenantSlug("Invalid Slug"),
        ).toThrow(
            "TITAN Health consumer tenant is not configured.",
        );
    });

    it(
        "passes server-owned tenant and signup data to one transaction",
        async () => {
            const transaction:
                AthleteRegistrationTransaction = {
                    execute: vi.fn(
                        async (input) => ({
                            userId: "user-1",
                            athleteId: "athlete-1",
                            digitalTwinId: "twin-1",
                            tenantId: "tenant-1",
                            email: input.email,
                        }),
                    ),
                };

            const useCase =
                new RegisterAthleteUseCase(
                    transaction,
                    "titan-health-consumer",
                );

            const dateOfBirth =
                new Date(
                    "1995-01-01T00:00:00.000Z",
                );

            const result =
                await useCase.execute(
                    new RegisterAthleteCommand(
                        "Titan",
                        "Athlete",
                        "athlete@example.com",
                        "Password123!",
                        "ZA",
                        dateOfBirth,
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

            expect(input.consumerTenantSlug).toBe(
                "titan-health-consumer",
            );
            expect(input.dateOfBirth).toBe(
                dateOfBirth,
            );
            expect(Object.isFrozen(input)).toBe(
                true,
            );
        },
    );

    it("returns a controlled transaction failure", async () => {
        const transaction:
            AthleteRegistrationTransaction = {
                execute: vi.fn(
                    async () => {
                        throw new Error(
                            "Email already exists.",
                        );
                    },
                ),
            };

        const useCase =
            new RegisterAthleteUseCase(
                transaction,
                "titan-health-consumer",
            );

        const result =
            await useCase.execute(
                new RegisterAthleteCommand(
                    "Titan",
                    "Athlete",
                    "athlete@example.com",
                    "Password123!",
                    "ZA",
                    new Date(
                        "1995-01-01T00:00:00.000Z",
                    ),
                ),
            );

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Email already exists.",
        );
    });
});