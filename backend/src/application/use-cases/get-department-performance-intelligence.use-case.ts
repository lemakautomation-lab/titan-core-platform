export interface DepartmentPerformanceIntelligence {
    organisationId: string;
    days: 7 | 30 | 90;
    activeAthleteCount: number;
    measuredAthleteCount: number;
    effectiveMeasurementCount: number;
    latestMeasurementAt: string | null;
}

export interface DepartmentPerformanceIntelligenceReader {
    read(
        tenantId: string,
        userId: string,
        days: 7 | 30 | 90,
    ): Promise<DepartmentPerformanceIntelligence | null>;
}

export class GetDepartmentPerformanceIntelligenceUseCase {
    constructor(private readonly reader: DepartmentPerformanceIntelligenceReader) {}

    execute(tenantId: string, userId: string, days: 7 | 30 | 90) {
        return this.reader.read(tenantId, userId, days);
    }
}
