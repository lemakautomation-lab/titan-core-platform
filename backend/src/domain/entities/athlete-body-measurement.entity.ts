import { randomUUID } from "crypto";
import { type BodyFatMethod, isBodyFatMethod } from "../enums/body-fat-method.enum";

export interface AthleteBodyMeasurementInput {
    tenantId: string;
    athleteId: string;
    heightCm: unknown;
    weightKg: unknown;
    bodyFatPercentage?: unknown;
    bodyFatMethod?: unknown;
    recordedAt?: unknown;
}

export class AthleteBodyMeasurement {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly heightCm: number,
        public readonly weightKg: number,
        public readonly bmi: number,
        public readonly bodyFatPercentage: number | null,
        public readonly bodyFatMethod: BodyFatMethod | null,
        public readonly bodyFatSource: "ATHLETE_MANUAL" | null,
        public readonly recordedAt: Date,
        public readonly createdAt: Date,
    ) {}

    static create(
        input: Readonly<AthleteBodyMeasurementInput>,
    ): AthleteBodyMeasurement {

        const heightCm =
            AthleteBodyMeasurement.number(
                input.heightCm,
                "Height",
            );

        const weightKg =
            AthleteBodyMeasurement.number(
                input.weightKg,
                "Weight",
            );

        if (heightCm <= 0 || heightCm > 300) {
            throw new Error(
                "Height must be greater than 0 and at most 300 centimetres.",
            );
        }

        if (weightKg <= 0 || weightKg > 1000) {
            throw new Error(
                "Weight must be greater than 0 and at most 1000 kilograms.",
            );
        }

        let bodyFatPercentage: number | null = null;

        if (
            input.bodyFatPercentage !== undefined &&
            input.bodyFatPercentage !== null
        ) {
            bodyFatPercentage =
                AthleteBodyMeasurement.number(
                    input.bodyFatPercentage,
                    "Body-fat percentage",
                );

            if (
                bodyFatPercentage < 0 ||
                bodyFatPercentage > 100
            ) {
                throw new Error(
                    "Body-fat percentage must be between 0 and 100.",
                );
            }
        }

        if (bodyFatPercentage !== null && !isBodyFatMethod(input.bodyFatMethod)) {
            throw new Error("Select a valid body-fat measurement method.");
        }
        if (bodyFatPercentage === null && input.bodyFatMethod !== undefined) {
            throw new Error("A body-fat method requires a body-fat value.");
        }
        const bodyFatMethod = bodyFatPercentage === null
            ? null : input.bodyFatMethod as BodyFatMethod;

        const recordedAt =
            input.recordedAt === undefined
                ? new Date()
                : new Date(
                    input.recordedAt as
                    string | number | Date,
                );

        if (Number.isNaN(recordedAt.getTime())) {
            throw new Error(
                "Body-measurement date is invalid.",
            );
        }

        const heightMetres = heightCm / 100;
        const bmi =
            Math.round(
                (
                    weightKg /
                    (heightMetres * heightMetres)
                ) * 100,
            ) / 100;

        if (!Number.isFinite(bmi) || bmi <= 0) {
            throw new Error(
                "BMI could not be calculated.",
            );
        }

        const now = new Date();

        return new AthleteBodyMeasurement(
            randomUUID(),
            input.tenantId,
            input.athleteId,
            heightCm,
            weightKg,
            bmi,
            bodyFatPercentage,
            bodyFatMethod,
            bodyFatMethod === null ? null : "ATHLETE_MANUAL",
            recordedAt,
            now,
        );
    }

    private static number(
        value: unknown,
        field: string,
    ): number {
        if (
            typeof value !== "number" ||
            !Number.isFinite(value)
        ) {
            throw new Error(
                `${field} must be a finite number.`,
            );
        }

        return value;
    }
}