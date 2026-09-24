import { DepartmentPerformanceIntelligenceReader } from "./get-department-performance-intelligence.use-case";

export type DepartmentDecisionAction =
    | "NO_ACTIVE_ATHLETES"
    | "COLLECT_MEASUREMENTS"
    | "REVIEW_MEASUREMENT_COVERAGE"
    | "REVIEW_MEASUREMENT_ACTIVITY";

export class GetDepartmentDecisionSupportUseCase {
    constructor(private readonly intelligence: DepartmentPerformanceIntelligenceReader) {}

    async execute(tenantId: string, userId: string, days: 7 | 30 | 90) {
        const data = await this.intelligence.read(tenantId, userId, days);
        if (!data) return null;
        let action: DepartmentDecisionAction;
        if (data.activeAthleteCount === 0) {
            action = "NO_ACTIVE_ATHLETES";
        } else if (data.measuredAthleteCount === 0) {
            action = "COLLECT_MEASUREMENTS";
        } else if (data.measuredAthleteCount < data.activeAthleteCount) {
            action = "REVIEW_MEASUREMENT_COVERAGE";
        } else {
            action = "REVIEW_MEASUREMENT_ACTIVITY";
        }
        return {
            organisationId: data.organisationId,
            days,
            activeAthleteCount: data.activeAthleteCount,
            measuredAthleteCount: data.measuredAthleteCount,
            effectiveMeasurementCount: data.effectiveMeasurementCount,
            action,
        };
    }
}
