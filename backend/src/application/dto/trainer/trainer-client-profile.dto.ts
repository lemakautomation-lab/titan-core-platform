export interface TrainerClientProfileDto {
    athleteId: string;
    firstName: string;
    lastName: string;
    countryCode: string | null;
    status: string;
    relationshipId: string;
    relationshipStatus: string;
    relationshipStartsAt: Date | null;
}
