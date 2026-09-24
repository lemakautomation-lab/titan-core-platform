export interface ClubRehabilitationPage {
    organisationId: string;
    rehabilitation: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubRehabilitationReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubRehabilitationPage | null>;
}

export class ListClubRehabilitationUseCase {
    constructor(private readonly reader: ClubRehabilitationReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
