import { RecordStatus } from "../../../domain/enums/record-status.enum";

export interface CoachAthleteDto {
    athleteId: string;
    firstName: string;
    lastName: string;
    countryCode: string | null;
    status: RecordStatus;
    relationshipId: string;
    relationshipStatus: RecordStatus;
    startsAt: Date | null;
    endsAt: Date | null;
}
