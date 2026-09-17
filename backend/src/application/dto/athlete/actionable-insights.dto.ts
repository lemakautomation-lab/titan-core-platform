export type ActionableInsightType =
    | "RECORD_MEASUREMENT"
    | "ESTABLISH_COMPARISON"
    | "PROGRESSION_SIGNAL"
    | "REVIEW_SIGNAL";

export interface ActionableInsightDto {
    readonly type: ActionableInsightType;
    readonly metricId: string;
    readonly metricName: string;
    readonly message: string;
}

export interface ActionableInsightsDto {
    readonly insights: readonly ActionableInsightDto[];
}
