import { AthleteOnboardingRequirement } from "../../../domain/services/athlete-onboarding-readiness.service";

export interface AthleteOnboardingStatusDto {
    complete: boolean;
    missingRequirements:
        AthleteOnboardingRequirement[];
}