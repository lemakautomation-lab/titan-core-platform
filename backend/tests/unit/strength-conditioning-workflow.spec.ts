import { describe, expect, it, vi } from "vitest";

import { GetStrengthConditioningWorkflowUseCase } from "../../src/application/use-cases/get-strength-conditioning-workflow.use-case";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";

function createDependencies() {
    return {
        athleteRepository: {
            findById: vi.fn(),
        },
        relationshipRepository: {
            findByAthleteAndRelatedEntity: vi.fn(),
        },
        trainingStressRepository: {
            listRecentForAthlete: vi.fn(),
        },
        workoutProgrammeRepository: {
            findAllByAthleteId: vi.fn(),
        },
    };
}

function createUseCase(
    dependencies: ReturnType<typeof createDependencies>,
) {
    return new GetStrengthConditioningWorkflowUseCase(
        dependencies.athleteRepository as never,
        dependencies.relationshipRepository as never,
        dependencies.trainingStressRepository as never,
        dependencies.workoutProgrammeRepository as never,
    );
}

const query = {
    tenantId: "tenant-1",
    userId: "professional-1",
    athleteId: "athlete-1",
    limit: 25,
};

describe("Mission 068.2 - Strength & Conditioning workflow", () => {
    it("rejects an invalid workflow limit before repository access", async () => {
        const dependencies = createDependencies();
        const useCase = createUseCase(dependencies);

        const result = await useCase.execute({
            ...query,
            limit: 0,
        });

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Workflow limit must be an integer between 1 and 100.",
        );

        expect(
            dependencies.athleteRepository.findById,
        ).not.toHaveBeenCalled();
    });

    it("requires the athlete to exist inside the authenticated tenant", async () => {
        const dependencies = createDependencies();
        dependencies.athleteRepository.findById.mockResolvedValue(null);

        const useCase = createUseCase(dependencies);
        const result = await useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Athlete not found.");

        expect(
            dependencies.athleteRepository.findById,
        ).toHaveBeenCalledWith(
            query.athleteId,
            query.tenantId,
        );

        expect(
            dependencies.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).not.toHaveBeenCalled();
    });

    it("requires an active Performance Professional relationship", async () => {
        const dependencies = createDependencies();

        dependencies.athleteRepository.findById.mockResolvedValue({
            id: query.athleteId,
        });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue(null);

        const useCase = createUseCase(dependencies);
        const result = await useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Performance Professional athlete relationship is required.",
        );

        expect(
            dependencies.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).toHaveBeenCalledWith(
            query.athleteId,
            query.userId,
            AthleteRelationshipType.PERFORMANCE_PROFESSIONAL,
            query.tenantId,
        );

        expect(
            dependencies.trainingStressRepository.listRecentForAthlete,
        ).not.toHaveBeenCalled();

        expect(
            dependencies.workoutProgrammeRepository.findAllByAthleteId,
        ).not.toHaveBeenCalled();
    });

    it("rejects an inactive Performance Professional relationship", async () => {
        const dependencies = createDependencies();

        dependencies.athleteRepository.findById.mockResolvedValue({
            id: query.athleteId,
        });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue({
                isActive: () => false,
            });

        const useCase = createUseCase(dependencies);
        const result = await useCase.execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Performance Professional athlete relationship is required.",
        );

        expect(
            dependencies.trainingStressRepository.listRecentForAthlete,
        ).not.toHaveBeenCalled();
    });

    it("returns the authorised tenant-scoped Strength & Conditioning workflow", async () => {
        const dependencies = createDependencies();

        dependencies.athleteRepository.findById.mockResolvedValue({
            id: query.athleteId,
        });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue({
                isActive: () => true,
            });

        dependencies.trainingStressRepository
            .listRecentForAthlete
            .mockResolvedValue([]);

        dependencies.workoutProgrammeRepository
            .findAllByAthleteId
            .mockResolvedValue([]);

        const useCase = createUseCase(dependencies);
        const result = await useCase.execute(query);

        expect(result.isSuccess).toBe(true);

        expect(result.value).toEqual({
            athleteId: query.athleteId,
            trainingStress: [],
            workoutProgrammes: [],
        });

        expect(
            dependencies.trainingStressRepository.listRecentForAthlete,
        ).toHaveBeenCalledWith(
            query.tenantId,
            query.athleteId,
            query.limit,
        );

        expect(
            dependencies.workoutProgrammeRepository.findAllByAthleteId,
        ).toHaveBeenCalledWith(
            query.athleteId,
            query.tenantId,
        );
    });
});
