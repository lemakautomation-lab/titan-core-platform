import { describe, expect, it, vi } from "vitest";

import {
    CreateRecoveryTrackingUseCase,
    CreateRecoveryTrackingCommand,
} from "../../src/application/use-cases/create-recovery-tracking.use-case";

import {
    ListRecentRecoveryTrackingUseCase,
    ListRecentRecoveryTrackingQuery,
} from "../../src/application/use-cases/list-recent-recovery-tracking.use-case";

import { RecoveryTracking } from "../../src/domain/entities/recovery-tracking/recovery-tracking.entity";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { RecoveryTrackingRepository } from "../../src/domain/repositories/recovery-tracking/recovery-tracking.repository";

const tenantId = "tenant-1";
const athleteId = "athlete-1";
const otherAthleteId = "athlete-2";

function createAthleteRepository(
    athleteIds: string[] = [athleteId],
): AthleteRepository {

    return {
        findById: vi.fn(
            async (
                id: string,
                requestedTenantId: string,
            ) => {

                if (
                    requestedTenantId !== tenantId ||
                    !athleteIds.includes(id)
                ) {
                    return null;
                }

                return {
                    id,
                    tenantId: requestedTenantId,
                } as never;
            },
        ),
    } as unknown as AthleteRepository;
}

function createTrackingRepository(
    trackings: RecoveryTracking[] = [],
): RecoveryTrackingRepository {

    return {
        createIdempotently: vi.fn(
            async (
                tracking: RecoveryTracking,
            ) => {

                trackings.push(tracking);

                return {
                    kind: "created" as const,
                    tracking,
                };
            },
        ),

        listRecentForAthlete: vi.fn(
            async (
                requestedTenantId: string,
                requestedAthleteId: string,
                limit: number,
            ) => {

                return trackings
                    .filter(
                        tracking =>
                            tracking.tenantId === requestedTenantId &&
                            tracking.athleteId === requestedAthleteId,
                    )
                    .slice(0, limit);
            },
        ),
    } as unknown as RecoveryTrackingRepository;
}

describe(
    "Recovery Tracking Application Boundary",
    () => {

        it(
            "creates recovery tracking for a valid athlete",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const recordedAt =
                    new Date("2026-09-10T10:00:00.000Z");

                const command:
                    CreateRecoveryTrackingCommand = {
                        tenantId,
                        athleteId,
                        value: 72.5,
                        recordedAt,
                        sourceType: "SYSTEM",
                        sourceId: "application-test",
                        sourceObservationId: "recovery-1",
                    };

                const result =
                    await useCase.execute(command);

                expect(result.isSuccess).toBe(true);
                expect(result.value).toBeDefined();
                expect(result.value?.tracking.tenantId)
                    .toBe(tenantId);
                expect(result.value?.tracking.athleteId)
                    .toBe(athleteId);
                expect(result.value?.tracking.value)
                    .toBe(72.5);
                expect(result.value?.tracking.recordedAt)
                    .toEqual(recordedAt);
                expect(result.value?.replayed)
                    .toBe(false);

                expect(
                    repository.createIdempotently,
                ).toHaveBeenCalledTimes(1);
            },
        );

        it(
            "rejects creation when the athlete does not exist",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository([]),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 50,
                        sourceType: "SYSTEM",
                        sourceId: "application-test",
                        sourceObservationId: "missing-athlete",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe("Athlete not found.");

                expect(
                    repository.createIdempotently,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects invalid recovery tracking values",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: Number.NaN,
                        sourceType: "SYSTEM",
                        sourceId: "application-test",
                        sourceObservationId: "invalid-value",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Recovery tracking value must be finite.",
                    );

                expect(
                    repository.createIdempotently,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "requires complete provenance for a new observation",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 60,
                        sourceType: "SYSTEM",
                        sourceId: "",
                        sourceObservationId: "observation-1",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Complete recovery tracking provenance is required.",
                    );

                expect(
                    repository.createIdempotently,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "returns the original observation and replayed true for an identical retry",
            async () => {

                const original =
                    new RecoveryTracking(
                        "original-id",
                        tenantId,
                        athleteId,
                        80,
                        new Date("2026-09-10T08:00:00.000Z"),
                        new Date("2026-09-10T08:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation",
                    );

                const repository =
                    createTrackingRepository();

                vi.mocked(repository.createIdempotently)
                    .mockResolvedValue({
                        kind: "replayed",
                        tracking: original,
                    });

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 80,
                        recordedAt: original.recordedAt,
                        sourceType: "SYSTEM",
                        sourceId: "source",
                        sourceObservationId: "observation",
                    });

                expect(result.value)
                    .toEqual({
                        tracking: original,
                        replayed: true,
                    });
            },
        );

        it(
            "returns a deterministic failure for an identity conflict",
            async () => {

                const repository =
                    createTrackingRepository();

                vi.mocked(repository.createIdempotently)
                    .mockResolvedValue({
                        kind: "idempotency-conflict",
                    });

                const useCase =
                    new CreateRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 70,
                        sourceType: "SYSTEM",
                        sourceId: "source",
                        sourceObservationId: "observation",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Recovery observation identity already exists with different data.",
                    );
            },
        );

        it(
            "rejects a non-positive recent-recovery limit",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new ListRecentRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const query:
                    ListRecentRecoveryTrackingQuery = {
                        tenantId,
                        athleteId,
                        limit: 0,
                    };

                const result =
                    await useCase.execute(query);

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Recovery tracking limit must be positive.",
                    );

                expect(
                    repository.listRecentForAthlete,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects a recent-recovery limit above 100",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new ListRecentRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        limit: 101,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Recovery tracking limit must be an integer between 1 and 100.",
                    );

                expect(
                    repository.listRecentForAthlete,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "lists recent tracking using tenant and athlete scope",
            async () => {

                const trackings = [
                    new RecoveryTracking(
                        "tracking-1",
                        tenantId,
                        athleteId,
                        70,
                        new Date("2026-09-09T10:00:00.000Z"),
                        new Date("2026-09-09T10:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation-1",
                    ),
                    new RecoveryTracking(
                        "tracking-2",
                        tenantId,
                        athleteId,
                        75,
                        new Date("2026-09-10T10:00:00.000Z"),
                        new Date("2026-09-10T10:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation-2",
                    ),
                    new RecoveryTracking(
                        "other-athlete",
                        tenantId,
                        otherAthleteId,
                        90,
                        new Date("2026-09-10T11:00:00.000Z"),
                        new Date("2026-09-10T11:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation-3",
                    ),
                ];

                const repository =
                    createTrackingRepository(trackings);

                const useCase =
                    new ListRecentRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        limit: 2,
                    });

                expect(result.isSuccess).toBe(true);
                expect(result.value).toHaveLength(2);
                expect(
                    result.value?.every(
                        tracking =>
                            tracking.tenantId === tenantId &&
                            tracking.athleteId === athleteId,
                    ),
                ).toBe(true);

                expect(
                    repository.listRecentForAthlete,
                ).toHaveBeenCalledWith(
                    tenantId,
                    athleteId,
                    2,
                );
            },
        );

        it(
            "rejects listing when the athlete does not exist",
            async () => {

                const repository =
                    createTrackingRepository();

                const useCase =
                    new ListRecentRecoveryTrackingUseCase(
                        repository,
                        createAthleteRepository([]),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        limit: 10,
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe("Athlete not found.");

                expect(
                    repository.listRecentForAthlete,
                ).not.toHaveBeenCalled();
            },
        );

    },
);
