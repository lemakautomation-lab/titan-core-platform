export interface ClubConditioningPage {
    organisationId: string;
    conditioning: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubConditioningReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubConditioningPage | null>;
}

export class ListClubConditioningUseCase {
    constructor(private readonly reader: ClubConditioningReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
