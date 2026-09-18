import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { RegisterTrainerCommand } from "../../src/application/commands/register-trainer.command";
import { RegisterTrainerUseCase } from "../../src/application/use-cases/register-trainer.use-case";
import { TrainerRegistrationTransaction } from "../../src/application/ports/trainer-registration.transaction";

describe("Register Trainer application boundary", () => {
    it(
        "passes the configured consumer tenant and Trainer fields to the transaction",
        async () => {
            const execute = vi.fn().mockResolvedValue({
                userId: "user-1",
                tenantId: "tenant-1",
                email: "trainer@titan.test",
            });

            const transaction: TrainerRegistrationTransaction = {
                execute,
            };

            const useCase =
                new RegisterTrainerUseCase(
                    transaction,
                    "titan-health-consumer-test",
                );

            const result =
                await useCase.execute(
                    new RegisterTrainerCommand(
                        "Titan",
                        "Trainer",
                        "trainer@titan.test",
                        "Password123!",
                    ),
                );

            expect(result.isSuccess).toBe(true);

            expect(execute).toHaveBeenCalledOnce();

            expect(execute).toHaveBeenCalledWith({
                consumerTenantSlug:
                    "titan-health-consumer-test",
                firstName: "Titan",
                lastName: "Trainer",
                email: "trainer@titan.test",
                password: "Password123!",
            });

            expect(result.value).toEqual({
                userId: "user-1",
                tenantId: "tenant-1",
                email: "trainer@titan.test",
            });
        },
    );

    it(
        "returns a controlled transaction failure",
        async () => {
            const transaction: TrainerRegistrationTransaction = {
                execute: vi.fn().mockRejectedValue(
                    new Error(
                        "Trainer registration is unavailable.",
                    ),
                ),
            };

            const useCase =
                new RegisterTrainerUseCase(
                    transaction,
                    "titan-health-consumer-test",
                );

            const result =
                await useCase.execute(
                    new RegisterTrainerCommand(
                        "Titan",
                        "Trainer",
                        "trainer@titan.test",
                        "Password123!",
                    ),
                );

            expect(result.isSuccess).toBe(false);

            expect(result.error).toBe(
                "Trainer registration is unavailable.",
            );
        },
    );
});