export enum AthleteOnboardingRequirement {
    SELECTED_USER_TYPE =
        "SELECTED_USER_TYPE",
    ACTIVE_ATHLETE_ENTITLEMENT =
        "ACTIVE_ATHLETE_ENTITLEMENT",
    ATHLETE_PROFILE =
        "ATHLETE_PROFILE",
    FIRST_NAME =
        "FIRST_NAME",
    SURNAME =
        "SURNAME",
    EMAIL =
        "EMAIL",
    CONTACT_NUMBER =
        "CONTACT_NUMBER",
    COUNTRY =
        "COUNTRY",
    DATE_OF_BIRTH =
        "DATE_OF_BIRTH",
    ATHLETE_GOALS =
        "ATHLETE_GOALS",
    BODY_MEASUREMENT =
        "BODY_MEASUREMENT",
}

export interface AthleteOnboardingEvidence {
    selectedAthleteType: boolean;
    activeAthleteEntitlement: boolean;
    athleteProfile: boolean;
    firstName: boolean;
    surname: boolean;
    email: boolean;
    contactNumber: boolean;
    country: boolean;
    dateOfBirth: boolean;
    athleteGoals: boolean;
    bodyMeasurement: boolean;
}

export interface AthleteOnboardingReadinessResult {
    complete: boolean;
    missingRequirements:
        AthleteOnboardingRequirement[];
}

export class AthleteOnboardingReadiness {

    static evaluate(
        evidence:
            Readonly<AthleteOnboardingEvidence>,
    ): AthleteOnboardingReadinessResult {

        const checks: readonly [
            AthleteOnboardingRequirement,
            boolean,
        ][] = [
            [
                AthleteOnboardingRequirement
                    .SELECTED_USER_TYPE,
                evidence.selectedAthleteType,
            ],
            [
                AthleteOnboardingRequirement
                    .ACTIVE_ATHLETE_ENTITLEMENT,
                evidence.activeAthleteEntitlement,
            ],
            [
                AthleteOnboardingRequirement
                    .ATHLETE_PROFILE,
                evidence.athleteProfile,
            ],
            [
                AthleteOnboardingRequirement
                    .FIRST_NAME,
                evidence.firstName,
            ],
            [
                AthleteOnboardingRequirement
                    .SURNAME,
                evidence.surname,
            ],
            [
                AthleteOnboardingRequirement
                    .EMAIL,
                evidence.email,
            ],
            [
                AthleteOnboardingRequirement
                    .CONTACT_NUMBER,
                evidence.contactNumber,
            ],
            [
                AthleteOnboardingRequirement
                    .COUNTRY,
                evidence.country,
            ],
            [
                AthleteOnboardingRequirement
                    .DATE_OF_BIRTH,
                evidence.dateOfBirth,
            ],
            [
                AthleteOnboardingRequirement
                    .ATHLETE_GOALS,
                evidence.athleteGoals,
            ],
            [
                AthleteOnboardingRequirement
                    .BODY_MEASUREMENT,
                evidence.bodyMeasurement,
            ],
        ];

        const missingRequirements =
            checks
                .filter(([, satisfied]) =>
                    !satisfied)
                .map(([requirement]) =>
                    requirement);

        return {
            complete:
                missingRequirements.length === 0,
            missingRequirements,
        };
    }
}