import { TrainerRegistrationDto } from "../dto/trainer/trainer-registration.dto";

export interface TrainerRegistrationInput {
    consumerTenantSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface TrainerRegistrationTransaction {
    execute(
        input: Readonly<TrainerRegistrationInput>,
    ): Promise<TrainerRegistrationDto>;
}
