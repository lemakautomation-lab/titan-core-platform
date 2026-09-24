import { DepartmentCommandCentreReader } from "./get-department-command-centre.use-case";
import { DepartmentPerformanceIntelligenceReader } from "./get-department-performance-intelligence.use-case";

export class GetDepartmentRoleReportUseCase {
    constructor(
        private readonly commandCentre: DepartmentCommandCentreReader,
        private readonly intelligence: DepartmentPerformanceIntelligenceReader,
    ) {}

    async execute(tenantId: string, userId: string, days: 7 | 30 | 90) {
        const summary = await this.commandCentre.read(tenantId, userId);
        if (!summary) return null;
        const measurements = await this.intelligence.read(tenantId, userId, days);
        if (!measurements || measurements.organisationId !== summary.organisationId) return null;
        return {
            organisationId: summary.organisationId,
            organisationName: summary.organisationName,
            days,
            staffCount: summary.staffCount,
            activeAthleteCount: measurements.activeAthleteCount,
            measuredAthleteCount: measurements.measuredAthleteCount,
            effectiveMeasurementCount: measurements.effectiveMeasurementCount,
            latestMeasurementAt: measurements.latestMeasurementAt,
        };
    }
}
