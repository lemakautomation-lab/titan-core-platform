import { describe, expect, it, vi } from "vitest";

import { GetTrainerClientMonitoringUseCase } from "../../src/application/use-cases/get-trainer-client-monitoring.use-case";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { AthleteRelationshipType } from "../../src/domain/enums/athlete-relationship-type.enum";

describe("Mission 064.7 - Trainer client monitoring", () => {
    const tenantId = "tenant-1";
    const trainerUserId = "trainer-user-1";
    const athleteId = "athlete-1";

    function relationship(
        status: RecordStatus = RecordStatus.ACTIVE,
    ) {
        return {
            status,
            isActive: () =>
                status === RecordStatus.ACTIVE,
        };
    }

    function dependencies(options?: {
        accessGranted?: boolean;
        athlete?: object | null;
        relationship?:
            ReturnType<typeof relationship> | null;
    }) {
        const athleteRepository = {
            findById:
                vi.fn().mockResolvedValue(
                    options?.athlete === undefined
                        ? { id: athleteId }
                        : options.athlete,
                ),
        };

        const relationshipRepository = {
            findByAthleteAndRelatedEntity:
                vi.fn().mockResolvedValue(
                    options?.relationship === undefined
                        ? relationship()
                        : options.relationship,
                ),
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

        const trainerAccess = {
            execute:
                vi.fn().mockResolvedValue({
                    isSuccess: true,
                    value: {
                        accessGranted:
                            options?.accessGranted ?? true,
                    },
                }),
        };

        return {
            athleteRepository,
            relationshipRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            recoveryTrackingRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
            trainerAccess,
        };
    }

    function useCase(
        d: ReturnType<typeof dependencies>,
    ) {
        return new GetTrainerClientMonitoringUseCase(
            d.athleteRepository as never,
            d.relationshipRepository as never,
            d.performanceMetricRepository as never,
            d.performanceMeasurementRepository as never,
            d.recoveryTrackingRepository as never,
            d.trainingStressRepository as never,
            d.workoutProgrammeRepository as never,
            d.trainerAccess as never,
        );
    }

    function query(limit = 25) {
        return {
            tenantId,
            userId: trainerUserId,
            athleteId,
            limit,
        };
    }

    it("rejects monitoring without active Trainer access", async () => {
        const d = dependencies({
            accessGranted: false,
        });

        const result =
            await useCase(d).execute(query());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer access is required.",
        );

        expect(
            d.athleteRepository.findById,
        ).not.toHaveBeenCalled();
    });

    it("rejects a missing Athlete in the tenant", async () => {
        const d = dependencies({
            athlete: null,
        });

        const result =
            await useCase(d).execute(query());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Athlete not found.",
        );

        expect(
            d.athleteRepository.findById,
        ).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );

        expect(
            d.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).not.toHaveBeenCalled();
    });

    it("rejects an Athlete without an active Trainer relationship", async () => {
        const d = dependencies({
            relationship: null,
        });

        const result =
            await useCase(d).execute(query());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );

        expect(
            d.relationshipRepository
                .findByAthleteAndRelatedEntity,
        ).toHaveBeenCalledWith(
            athleteId,
            trainerUserId,
            AthleteRelationshipType.TRAINER,
            tenantId,
        );

        expect(
            d.performanceMetricRepository
                .findAllByAthleteId,
        ).not.toHaveBeenCalled();
    });

    it("rejects an inactive Trainer relationship", async () => {
        const d = dependencies({
            relationship:
                relationship(RecordStatus.INACTIVE),
        });

        const result =
            await useCase(d).execute(query());

        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe(
            "Active Trainer client relationship is required.",
        );
    });

    it.each([
        0,
        101,
        1.5,
    ])(
        "rejects invalid monitoring limit %s",
        async limit => {
            const d = dependencies();

            const result =
                await useCase(d).execute(
                    query(limit),
                );

            expect(result.isSuccess).toBe(false);
            expect(result.error).toBe(
                "Monitoring limit must be an integer between 1 and 100.",
            );

            expect(
                d.trainerAccess.execute,
            ).not.toHaveBeenCalled();
        },
    );

    it("performs bounded client monitoring reads", async () => {
        const d = dependencies();

        const result =
            await useCase(d).execute(
                query(17),
            );

        expect(result.isSuccess).toBe(true);

        expect(
            d.performanceMetricRepository
                .findAllByAthleteId,
        ).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );

        expect(
            d.recoveryTrackingRepository
                .listRecentForAthlete,
        ).toHaveBeenCalledWith(
            tenantId,
            athleteId,
            17,
        );

        expect(
            d.trainingStressRepository
                .listRecentForAthlete,
        ).toHaveBeenCalledWith(
            tenantId,
            athleteId,
            17,
        );

        expect(
            d.workoutProgrammeRepository
                .findAllByAthleteId,
        ).toHaveBeenCalledWith(
            athleteId,
            tenantId,
        );

        expect(result.value).toEqual({
            athleteId,
            performance: [],
            recovery: [],
            trainingStress: [],
            workoutProgrammes: [],
        });
    });
});