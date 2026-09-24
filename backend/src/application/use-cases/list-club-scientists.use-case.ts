export interface ClubScientistPage {
    organisationId: string;
    scientists: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubScientistReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubScientistPage | null>;
}

export class ListClubScientistsUseCase {
    constructor(private readonly reader: ClubScientistReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
