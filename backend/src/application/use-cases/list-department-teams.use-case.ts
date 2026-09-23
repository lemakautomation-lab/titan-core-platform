export interface DepartmentTeamsPage {
    organisationId: string;
    teams: Array<{ id: string; name: string }>;
    nextCursor: string | null;
}

export interface DepartmentTeamsReader {
    read(
        tenantId: string,
        userId: string,
        limit: number,
        cursor: string | null,
    ): Promise<DepartmentTeamsPage | null>;
}

export class ListDepartmentTeamsUseCase {
    constructor(private readonly reader: DepartmentTeamsReader) {}

    execute(tenantId: string, userId: string, limit: number, cursor: string | null) {
        return this.reader.read(tenantId, userId, limit, cursor);
    }
}
