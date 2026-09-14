export enum PerformanceBodyModelType {
    MALE = "MALE",
    FEMALE = "FEMALE",
}

export function validatePerformanceBodyModelType(
    value: unknown,
): PerformanceBodyModelType {
    if (
        typeof value !== "string" ||
        !Object.values(
            PerformanceBodyModelType,
        ).includes(
            value as PerformanceBodyModelType,
        )
    ) {
        throw new Error(
            "Performance body model type must be MALE or FEMALE.",
        );
    }

    return value as PerformanceBodyModelType;
}