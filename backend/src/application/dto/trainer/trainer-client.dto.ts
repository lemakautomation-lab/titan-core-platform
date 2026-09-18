export interface TrainerClientDto {
    athleteId: string;
    firstName: string;
    lastName: string;
    countryCode: string | null;
    status: string;
    relationshipId: string;
    relationshipStatus: string;
    startsAt: Date | null;
    endsAt: Date | null;
}
