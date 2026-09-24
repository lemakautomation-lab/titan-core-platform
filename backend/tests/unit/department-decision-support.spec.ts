import { describe, expect, it } from "vitest";
import { GetDepartmentDecisionSupportUseCase } from "../../src/application/use-cases/get-department-decision-support.use-case";

describe("Mission 069.5 bounded department decision support", () => {
    it.each([
        [0, 0, "NO_ACTIVE_ATHLETES"],
        [2, 0, "COLLECT_MEASUREMENTS"],
        [2, 1, "REVIEW_MEASUREMENT_COVERAGE"],
        [2, 2, "REVIEW_MEASUREMENT_ACTIVITY"],
    ] as const)("classifies %i athletes and %i observed athletes", async (active, measured, action) => {
        const useCase = new GetDepartmentDecisionSupportUseCase({
            read: async () => ({
                organisationId: "assigned", days: 30, activeAthleteCount: active,
                measuredAthleteCount: measured, effectiveMeasurementCount: measured,
                latestMeasurementAt: null,
            }),
        });
        expect((await useCase.execute("tenant", "user", 30))?.action).toBe(action);
    });

    it("returns no action without an authorised department", async () => {
        const useCase = new GetDepartmentDecisionSupportUseCase({ read: async () => null });
        expect(await useCase.execute("tenant", "user", 7)).toBeNull();
    });
});
