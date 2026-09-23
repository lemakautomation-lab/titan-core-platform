export interface DepartmentCommandCentre {
    organisationId: string;
    organisationName: string;
    staffCount: number;
    athleteCount: number;
}

export interface DepartmentCommandCentreReader {
    read(tenantId: string, userId: string): Promise<DepartmentCommandCentre | null>;
}

export class GetDepartmentCommandCentreUseCase {
    constructor(private readonly reader: DepartmentCommandCentreReader) {}

    execute(tenantId: string, userId: string): Promise<DepartmentCommandCentre | null> {
        return this.reader.read(tenantId, userId);
    }
}
