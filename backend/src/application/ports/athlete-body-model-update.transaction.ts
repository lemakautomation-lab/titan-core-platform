import { AthleteBodyModelDto } from "../dto/athlete/athlete-body-model.dto";

export interface AthleteBodyModelUpdateInput {
    userId: string;
    tenantId: string;
    modelType: unknown;
}

export interface AthleteBodyModelUpdateTransaction {
    execute(
        input: Readonly<AthleteBodyModelUpdateInput>,
    ): Promise<AthleteBodyModelDto>;
}