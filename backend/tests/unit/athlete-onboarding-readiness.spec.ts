import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { GetMyAthleteOnboardingStatusUseCase } from "../../src/application/use-cases/get-my-athlete-onboarding-status.use-case";
import { AthleteOnboardingStatusQuery } from "../../src/application/ports/athlete-onboarding-status.query";
import {
    AthleteOnboardingReadiness,
    AthleteOnboardingRequirement,
} from "../../src/domain/services/athlete-onboarding-readiness.service";

const completeEvidence = {
    selectedAthleteType: true,
    activeAthleteEntitlement: true,
    athleteProfile: true,
    firstName: true,
    surname: true,
    email: true,
    contactNumber: true,
    country: true,
    dateOfBirth: true,
    athleteGoals: true,
    bodyMeasurement: true,
};

describe(
    "Athlete onboarding readiness",
    () => {

        it(
            "reports complete when every requirement is satisfied",
            () => {
                expect(
                    AthleteOnboardingReadiness
                        .evaluate(completeEvidence),
                ).toEqual({
                    complete: true,
                    missingRequirements: [],
                });
            },
        );

        it(
            "returns missing requirements in canonical order",
            () => {
                const result =
                    AthleteOnboardingReadiness
                        .evaluate({
                            ...completeEvidence,
                            selectedAthleteType: false,
                            contactNumber: false,
                            athleteGoals: false,
                            bodyMeasurement: false,
                        });

                expect(result.complete).toBe(false);
                expect(
                    result.missingRequirements,
                ).toEqual([
                    AthleteOnboardingRequirement
                        .SELECTED_USER_TYPE,
                    AthleteOnboardingRequirement
                        .CONTACT_NUMBER,
                    AthleteOnboardingRequirement
                        .ATHLETE_GOALS,
                    AthleteOnboardingRequirement
                        .BODY_MEASUREMENT,
                ]);
            },
        );

        it(
            "passes authenticated identity to one query",
            async () => {
                const query:
                    AthleteOnboardingStatusQuery = {
                        execute: vi.fn(
                            async () => ({
                                complete: true,
                                missingRequirements: [],
                            }),
                        ),
                    };

                const useCase =
                    new GetMyAthleteOnboardingStatusUseCase(
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
            "returns a controlled query failure",
            async () => {
                const query:
                    AthleteOnboardingStatusQuery = {
                        execute: vi.fn(
                            async () => {
                                throw new Error(
                                    "User not found.",
                                );
                            },
                        ),
                    };

                const useCase =
                    new GetMyAthleteOnboardingStatusUseCase(
                        query,
                    );

                const result =
                    await useCase.execute({
                        userId: "user-1",
                        tenantId: "tenant-1",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe(
                    "User not found.",
                );
            },
        );
    },
);