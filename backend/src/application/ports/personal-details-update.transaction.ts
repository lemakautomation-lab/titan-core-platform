import { PersonalDetailsDto } from "../dto/user/personal-details.dto";

export interface PersonalDetailsUpdateInput {

    userId: string;

    tenantId: string;

    firstName: string;

    lastName: string;

    email: string;

    contactNumber: string | null;

    countryCode: string;

    dateOfBirth: Date | null;

}

export interface PersonalDetailsUpdateTransaction {

    execute(
        input: Readonly<PersonalDetailsUpdateInput>,
    ): Promise<PersonalDetailsDto>;

}
