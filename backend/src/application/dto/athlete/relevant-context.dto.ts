export interface RelevantContextDto {
    readonly body: unknown;
    readonly recovery: {
        readonly latest: {
            readonly value: number;
            readonly recordedAt: string;
        } | null;
    };
    readonly nutrition: {
        readonly latest: {
            readonly goalClassification?: string;
            readonly macroTargets: {
                readonly caloriesKcal: number;
                readonly proteinGrams: number;
                readonly carbohydrateGrams: number;
                readonly fatGrams: number;
            };
            readonly hydrationGuidance: {
                readonly dailyWaterLitres: number;
                readonly unit: "LITRES_PER_DAY";
            };
            readonly createdAt: string;
        } | null;
    };
}
