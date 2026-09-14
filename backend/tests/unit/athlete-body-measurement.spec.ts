import {
    describe,
    expect,
    it,
} from "vitest";

import { AthleteBodyMeasurement } from "../../src/domain/entities/athlete-body-measurement.entity";

describe(
    "Athlete body measurement",
    () => {

        it(
            "calculates BMI from metric height and weight",
            () => {
                const measurement =
                    AthleteBodyMeasurement.create({
                        tenantId: "tenant-1",
                        athleteId: "athlete-1",
                        heightCm: 180,
                        weightKg: 81,
                        bodyFatPercentage: 15,
                        recordedAt:
                            "2026-09-14T12:00:00.000Z",
                    });

                expect(measurement.bmi).toBe(25);
                expect(
                    measurement.bodyFatPercentage,
                ).toBe(15);
            },
        );

        it.each([
            [0, 80],
            [301, 80],
            [180, 0],
            [180, 1001],
        ])(
            "rejects invalid height %s or weight %s",
            (heightCm, weightKg) => {
                expect(
                    () => AthleteBodyMeasurement.create({
                        tenantId: "tenant-1",
                        athleteId: "athlete-1",
                        heightCm,
                        weightKg,
                    }),
                ).toThrow();
            },
        );

        it(
            "rejects non-finite measurements",
            () => {
                expect(
                    () => AthleteBodyMeasurement.create({
                        tenantId: "tenant-1",
                        athleteId: "athlete-1",
                        heightCm: Number.NaN,
                        weightKg: 80,
                    }),
                ).toThrow(
                    "Height must be a finite number.",
                );
            },
        );

        it(
            "rejects body-fat percentage outside its bounds",
            () => {
                expect(
                    () => AthleteBodyMeasurement.create({
                        tenantId: "tenant-1",
                        athleteId: "athlete-1",
                        heightCm: 180,
                        weightKg: 80,
                        bodyFatPercentage: 101,
                    }),
                ).toThrow(
                    "Body-fat percentage must be between 0 and 100.",
                );
            },
        );

        it(
            "rejects an invalid recorded date",
            () => {
                expect(
                    () => AthleteBodyMeasurement.create({
                        tenantId: "tenant-1",
                        athleteId: "athlete-1",
                        heightCm: 180,
                        weightKg: 80,
                        recordedAt: "invalid",
                    }),
                ).toThrow(
                    "Body-measurement date is invalid.",
                );
            },
        );
    },
);