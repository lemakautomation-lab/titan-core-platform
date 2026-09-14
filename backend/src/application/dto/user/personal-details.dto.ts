export interface PersonalDetailsDto {

    userId: string;

    athleteId: string;

    tenantId: string;

    firstName: string;

    lastName: string;

    email: string;

    contactNumber: string | null;

    countryCode: string;

    dateOfBirth: Date | null;

}
