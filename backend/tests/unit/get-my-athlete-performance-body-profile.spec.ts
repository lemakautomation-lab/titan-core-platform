import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { AthletePerformanceBodyProfileQuery } from "../../src/application/ports/athlete-performance-body-profile.query";
import { GetMyAthletePerformanceBodyProfileUseCase } from "../../src/application/use-cases/get-my-athlete-performance-body-profile.use-case";

describe(
    "Get my Athlete performance body profile",
    () => {

        it(
            "passes authenticated identity to one query",
            async () => {
                const query:
                    AthletePerformanceBodyProfileQuery = {
                        execute: vi.fn(
                            async (input) => ({
                                athleteId:
                                    "athlete-1",
                                tenantId:
                                    input.tenantId,
                                modelType: "MALE",
                                measurements: [],
                            }),
                        ),
                    };

                const useCase =
                    new GetMyAthletePerformanceBodyProfileUseCase(
                        query,
                    );

                const result =
                    await useCase.execute({
                        userId: "user-1",
                        tenantId: "tenant-1",
                    });

                expect(result.isSuccess).toBe(true);
                expect(
                    query.execute,
                ).toHaveBeenCalledOnce();

                const input =
                    vi.mocked(
                        query.execute,
                    ).mock.calls[0][0];

                expect(input.userId).toBe("user-1");
                expect(input.tenantId).toBe("tenant-1");
                expect(Object.isFrozen(input)).toBe(true);
            },
        );

        it(
            "returns controlled query failure",
            async () => {
                const query:
                    AthletePerformanceBodyProfileQuery = {
                        execute: vi.fn(
                            async () => {
                                throw new Error(
                                    "Athlete profile not found.",
                                );
                            },
                        ),
                    };

                const useCase =
                    new GetMyAthletePerformanceBodyProfileUseCase(
                        query,
                    );

                const result =
                    await useCase.execute({
                        userId: "user-1",
                        tenantId: "tenant-1",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe(
                    "Athlete profile not found.",
                );
            },
        );
    },
);