export interface HydrationGuidance {
    readonly dailyWaterLitres: number;
    readonly unit: "LITRES_PER_DAY";
}

export function createHydrationGuidance(
    dailyWaterLitres: number,
): HydrationGuidance {
    if (
        typeof dailyWaterLitres !== "number" ||
        !Number.isFinite(dailyWaterLitres) ||
        dailyWaterLitres <= 0
    ) {
        throw new Error(
            "Hydration dailyWaterLitres must be a finite positive number.",
        );
    }

    return Object.freeze({
        dailyWaterLitres,
        unit: "LITRES_PER_DAY" as const,
    });
}
