export interface ClubAthletesPage {
    organisationId: string;
    athletes: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubAthletesReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubAthletesPage | null>;
}

export class ListClubAthletesUseCase {
    constructor(private readonly reader: ClubAthletesReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
