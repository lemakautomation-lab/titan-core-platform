export interface ClubDirectorPage {
    organisationId: string;
    directors: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubDirectorReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubDirectorPage | null>;
}

export class ListClubDirectorsUseCase {
    constructor(private readonly reader: ClubDirectorReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
