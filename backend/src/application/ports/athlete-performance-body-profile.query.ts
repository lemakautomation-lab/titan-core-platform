import { AthletePerformanceBodyProfileDto } from "../dto/athlete/athlete-performance-body-profile.dto";

export interface AthletePerformanceBodyProfileQueryInput {
    userId: string;
    tenantId: string;
}

export interface AthletePerformanceBodyProfileQuery {
    execute(
        input:
            Readonly<AthletePerformanceBodyProfileQueryInput>,
    ): Promise<AthletePerformanceBodyProfileDto>;
}