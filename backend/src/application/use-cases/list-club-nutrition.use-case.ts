export interface ClubNutritionPage {
    organisationId: string;
    nutrition: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface ClubNutritionReader {
    read(tenantId: string, userId: string, limit: number, cursor: string | null): Promise<ClubNutritionPage | null>;
}

export class ListClubNutritionUseCase {
    constructor(private readonly reader: ClubNutritionReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
