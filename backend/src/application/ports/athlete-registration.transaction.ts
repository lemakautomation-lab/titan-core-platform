import { AthleteRegistrationDto } from "../dto/athlete/athlete-registration.dto";

export interface AthleteRegistrationInput {
    consumerTenantSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    countryCode: string;
    dateOfBirth: Date;
}

export interface AthleteRegistrationTransaction {
    execute(
        input: Readonly<AthleteRegistrationInput>,
    ): Promise<AthleteRegistrationDto>;
}