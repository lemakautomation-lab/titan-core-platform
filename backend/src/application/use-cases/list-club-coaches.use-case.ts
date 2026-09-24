export interface ClubCoachPage {
    organisationId: string;
    coaches: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubCoachReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubCoachPage | null>;
}

export class ListClubCoachesUseCase {
    constructor(private readonly reader: ClubCoachReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
