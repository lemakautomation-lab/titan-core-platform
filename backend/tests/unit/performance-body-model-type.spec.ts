import {
    describe,
    expect,
    it,
} from "vitest";

import {
    PerformanceBodyModelType,
    validatePerformanceBodyModelType,
} from "../../src/domain/enums/performance-body-model-type.enum";

describe(
    "Performance body model type",
    () => {

        it.each([
            PerformanceBodyModelType.MALE,
            PerformanceBodyModelType.FEMALE,
        ])(
            "accepts explicit model type %s",
            (modelType) => {
                expect(
                    validatePerformanceBodyModelType(
                        modelType,
                    ),
                ).toBe(modelType);
            },
        );

        it.each([
            null,
            undefined,
            "",
            "OTHER",
            "male",
            "female",
        ])(
            "rejects invalid model selection %#",
            (modelType) => {
                expect(
                    () =>
                        validatePerformanceBodyModelType(
                            modelType,
                        ),
                ).toThrow(
                    "Performance body model type must be MALE or FEMALE.",
                );
            },
        );
    },
);