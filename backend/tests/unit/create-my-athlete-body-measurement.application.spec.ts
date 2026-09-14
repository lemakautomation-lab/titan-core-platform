import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { CreateMyAthleteBodyMeasurementCommand } from "../../src/application/commands/create-my-athlete-body-measurement.command";
import { AthleteBodyMeasurementCreateTransaction } from "../../src/application/ports/athlete-body-measurement-create.transaction";
import { CreateMyAthleteBodyMeasurementUseCase } from "../../src/application/use-cases/create-my-athlete-body-measurement.use-case";

function createTransaction():
AthleteBodyMeasurementCreateTransaction {
    return {
        execute: vi.fn(
            async (input) => ({
                id: "measurement-1",
                athleteId: "athlete-1",
                tenantId: input.tenantId,
                heightCm: 180,
                weightKg: 81,
                bmi: 25,
                bodyFatPercentage: 15,
                recordedAt:
                    "2026-09-14T12:00:00.000Z",
                createdAt:
                    "2026-09-14T12:00:00.000Z",
            }),
        ),
    };
}

describe(
    "Create my Athlete body measurement",
    () => {

        it(
            "passes authenticated identity to one transaction",
            async () => {
                const transaction=createTransaction();
                const useCase=
                    new CreateMyAthleteBodyMeasurementUseCase(
                        transaction,
                    );

                const result=await useCase.execute(
                    new CreateMyAthleteBodyMeasurementCommand(
                        "user-1",
                        "tenant-1",
                        180,
                        81,
                        15,
                        "2026-09-14T12:00:00.000Z",
                    ),
                );

                expect(result.isSuccess).toBe(true);
                expect(
                    transaction.execute,
                ).toHaveBeenCalledOnce();

                const input=
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
                const transaction=createTransaction();

                vi.mocked(
                    transaction.execute,
                ).mockRejectedValueOnce(
                    new Error(
                        "Athlete profile not found.",
                    ),
                );

                const useCase=
                    new CreateMyAthleteBodyMeasurementUseCase(
                        transaction,
                    );

                const result=await useCase.execute(
                    new CreateMyAthleteBodyMeasurementCommand(
                        "user-1",
                        "tenant-1",
                        180,
                        81,
                        null,
                        undefined,
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