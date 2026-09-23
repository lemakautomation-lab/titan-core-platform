import { describe, expect, it, vi } from "vitest";

import { GetPerformanceProfessionalWorkflowUseCase } from "../../src/application/use-cases/get-performance-professional-workflow.use-case";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";

function createHarness(options?: {
    athlete?: unknown;
    relationship?: unknown;
}) {
    const athlete =
        options && "athlete" in options
            ? options.athlete
            : { id: "athlete-1" };

    const relationship =
        options && "relationship" in options
            ? options.relationship
            : { isActive: () => true };

    const athleteRepository = {
        findById: vi.fn().mockResolvedValue(athlete),
    };

    const relationshipRepository = {
        findByAthleteAndRelatedEntity:
            vi.fn().mockResolvedValue(relationship),
    };

    const performanceMetricRepository = {
        findAllByAthleteId:
            vi.fn().mockResolvedValue([]),
    };

    const performanceMeasurementRepository = {
        listRecentEffectiveForMetric:
            vi.fn().mockResolvedValue([]),
    };

    const recoveryTrackingRepository = {
        listRecentForAthlete:
            vi.fn().mockResolvedValue([]),
    };

    const trainingStressRepository = {
        listRecentForAthlete:
            vi.fn().mockResolvedValue([]),
    };

    const workoutProgrammeRepository = {
        findAllByAthleteId:
            vi.fn().mockResolvedValue([]),
    };

    const useCase =
        new GetPerformanceProfessionalWorkflowUseCase(
            athleteRepository as never,
            relationshipRepository as never,
            performanceMetricRepository as never,
            performanceMeasurementRepository as never,
            recoveryTrackingRepository as never,
            trainingStressRepository as never,
            workoutProgrammeRepository as never,
        );

    return {
        useCase,
        athleteRepository,
        relationshipRepository,
        performanceMetricRepository,
        performanceMeasurementRepository,
        recoveryTrackingRepository,
        trainingStressRepository,
        workoutProgrammeRepository,
    };
}

const query = {
    tenantId: "tenant-1",
    userId: "professional-1",
    athleteId: "athlete-1",
    limit: 25,
};

describe("Mission 068.1 performance professional workflow", () => {
    it("rejects an invalid workflow limit before repository access", async () => {
        const h = createHarness();

        const result = await h.useCase.execute({
            ...query,
            limit: 0,
        });

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Workflow limit must be an integer between 1 and 100.",
        );

        expect(h.athleteRepository.findById)
            .not.toHaveBeenCalled();
    });

    it("requires the athlete to exist inside the authenticated tenant", async () => {
        const h = createHarness({
            athlete: null,
        });

        const result = await h.useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Athlete not found.");

        expect(h.athleteRepository.findById)
            .toHaveBeenCalledWith(
                "athlete-1",
                "tenant-1",
            );

        expect(
            h.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).not.toHaveBeenCalled();
    });

    it("requires an active PERFORMANCE_PROFESSIONAL relationship", async () => {
        const h = createHarness({
            relationship: null,
        });

        const result = await h.useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete not found.",
        );

        expect(
            h.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).toHaveBeenCalledWith(
            "athlete-1",
            "professional-1",
            AthleteRelationshipType.PERFORMANCE_PROFESSIONAL,
            "tenant-1",
        );

        expect(
            h.performanceMetricRepository
                .findAllByAthleteId,
        ).not.toHaveBeenCalled();

        expect(
            h.recoveryTrackingRepository
                .listRecentForAthlete,
        ).not.toHaveBeenCalled();

        expect(
            h.trainingStressRepository
                .listRecentForAthlete,
        ).not.toHaveBeenCalled();

        expect(
            h.workoutProgrammeRepository
                .findAllByAthleteId,
        ).not.toHaveBeenCalled();
    });

    it("rejects an inactive PERFORMANCE_PROFESSIONAL relationship", async () => {
        const h = createHarness({
            relationship: {
                isActive: () => false,
            },
        });

        const result = await h.useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete not found.",
        );

        expect(
            h.performanceMetricRepository
                .findAllByAthleteId,
        ).not.toHaveBeenCalled();
    });

    it("returns tenant-scoped workflow data for an authorized professional", async () => {
        const h = createHarness();

        const result = await h.useCase.execute(query);

        expect(result.isSuccess).toBe(true);

        expect(
            h.performanceMetricRepository
                .findAllByAthleteId,
        ).toHaveBeenCalledWith(
            "athlete-1",
            "tenant-1",
        );

        expect(
            h.recoveryTrackingRepository
                .listRecentForAthlete,
        ).toHaveBeenCalledWith(
            "tenant-1",
            "athlete-1",
            25,
        );

        expect(
            h.trainingStressRepository
                .listRecentForAthlete,
        ).toHaveBeenCalledWith(
            "tenant-1",
            "athlete-1",
            25,
        );

        expect(
            h.workoutProgrammeRepository
                .findAllByAthleteId,
        ).toHaveBeenCalledWith(
            "athlete-1",
            "tenant-1",
        );

        expect(result.value).toEqual({
            athleteId: "athlete-1",
            performance: [],
            recovery: [],
            trainingStress: [],
            workoutProgrammes: [],
        });
    });
});