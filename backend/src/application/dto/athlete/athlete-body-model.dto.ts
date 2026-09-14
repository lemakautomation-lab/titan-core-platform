import { PerformanceBodyModelType } from "../../../domain/enums/performance-body-model-type.enum";

export interface AthleteBodyModelDto {
    athleteId: string;
    tenantId: string;
    modelType: PerformanceBodyModelType;
}