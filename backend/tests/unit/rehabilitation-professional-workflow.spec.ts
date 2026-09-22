import { describe, expect, it, vi } from "vitest";

import { GetRehabilitationProfessionalWorkflowUseCase } from "../../src/application/use-cases/get-rehabilitation-professional-workflow.use-case";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";
import { RecoveryTracking } from "../../src/domain/entities/recovery-tracking/recovery-tracking.entity";

function createDependencies() {
    return {
        athleteRepository: {
            findById: vi.fn(),
        },
        relationshipRepository: {
            findByAthleteAndRelatedEntity: vi.fn(),
        },
        recoveryTrackingRepository: {
            listRecentForAthlete: vi.fn(),
        },
    };
}

function createUseCase(
    dependencies: ReturnType<typeof createDependencies>,
) {
    return new GetRehabilitationProfessionalWorkflowUseCase(
        dependencies.athleteRepository as never,
        dependencies.relationshipRepository as never,
        dependencies.recoveryTrackingRepository as never,
    );
}

const query = {
    tenantId: "tenant-1",
    userId: "professional-1",
    athleteId: "athlete-1",
    limit: 25,
};

describe("Mission 068.4 - Rehabilitation Professional workflow", () => {
    it("rejects an invalid limit before repository access", async () => {
        const dependencies = createDependencies();
        const useCase = createUseCase(dependencies);

        const result = await useCase.execute({
            ...query,
            limit: 101,
        });

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Workflow limit must be an integer between 1 and 100.",
        );
        expect(
            dependencies.athleteRepository.findById,
        ).not.toHaveBeenCalled();
    });

    it("requires the Athlete inside the authenticated tenant", async () => {
        const dependencies = createDependencies();
        dependencies.athleteRepository.findById
            .mockResolvedValue(null);

        const result =
            await createUseCase(dependencies).execute(query);

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

        dependencies.athleteRepository.findById
            .mockResolvedValue({ id: query.athleteId });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue(null);

        const result =
            await createUseCase(dependencies).execute(query);

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
            dependencies.recoveryTrackingRepository
                .listRecentForAthlete,
        ).not.toHaveBeenCalled();
    });

    it("rejects an inactive relationship", async () => {
        const dependencies = createDependencies();

        dependencies.athleteRepository.findById
            .mockResolvedValue({ id: query.athleteId });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue({
                isActive: () => false,
            });

        const result =
            await createUseCase(dependencies).execute(query);

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Performance Professional athlete relationship is required.",
        );

        expect(
            dependencies.recoveryTrackingRepository
                .listRecentForAthlete,
        ).not.toHaveBeenCalled();
    });

    it("returns bounded tenant-scoped recovery observations", async () => {
        const dependencies = createDependencies();
        const recordedAt = new Date("2026-09-22T10:00:00.000Z");
        const createdAt = new Date("2026-09-22T10:01:00.000Z");

        dependencies.athleteRepository.findById
            .mockResolvedValue({ id: query.athleteId });

        dependencies.relationshipRepository
            .findByAthleteAndRelatedEntity
            .mockResolvedValue({
                isActive: () => true,
            });

        dependencies.recoveryTrackingRepository
            .listRecentForAthlete
            .mockResolvedValue([
                new RecoveryTracking(
                    "recovery-1",
                    query.tenantId,
                    query.athleteId,
                    82,
                    recordedAt,
                    createdAt,
                    "DEVICE",
                    "device-1",
                    "observation-1",
                ),
            ]);

        const result =
            await createUseCase(dependencies).execute(query);

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual({
            athleteId: query.athleteId,
            recovery: [
                {
                    id: "recovery-1",
                    athleteId: query.athleteId,
                    value: 82,
                    recordedAt: recordedAt.toISOString(),
                    createdAt: createdAt.toISOString(),
                    sourceType: "DEVICE",
                    sourceId: "device-1",
                    sourceObservationId: "observation-1",
                },
            ],
        });

        expect(
            dependencies.recoveryTrackingRepository
                .listRecentForAthlete,
        ).toHaveBeenCalledWith(
            query.tenantId,
            query.athleteId,
            query.limit,
        );
    });
});
