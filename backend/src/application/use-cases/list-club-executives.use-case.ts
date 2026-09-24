export interface ClubExecutivePage {
    organisationId: string;
    organisationName: string;
    activeChildOrganisationCount: number;
    executives: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubExecutiveReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubExecutivePage | null>;
}

export class ListClubExecutivesUseCase {
    constructor(private readonly reader: ClubExecutiveReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
