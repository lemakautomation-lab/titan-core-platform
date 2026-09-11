import { describe, expect, it, vi } from "vitest";

import {
    CreateRestTrackingUseCase,
    CreateRestTrackingCommand,
} from "../../src/application/use-cases/create-rest-tracking.use-case";

import {
    ListRecentRestTrackingUseCase,
    ListRecentRestTrackingQuery,
} from "../../src/application/use-cases/list-recent-rest-tracking.use-case";

import { RestTracking } from "../../src/domain/entities/rest-tracking.entity";
import { AthleteRepository } from "../../src/domain/repositories/athlete.repository";
import { RestTrackingRepository } from "../../src/domain/repositories/rest-tracking.repository";

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
    trackings: RestTracking[] = [],
): RestTrackingRepository {
    return {
        createIdempotently: vi.fn(
            async (
                tracking: RestTracking,
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
    } as unknown as RestTrackingRepository;
}

describe(
    "Rest Tracking Application Boundary",
    () => {

        it(
            "creates rest tracking for a valid athlete",
            async () => {
                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRestTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const recordedAt =
                    new Date("2026-09-10T10:00:00.000Z");

                const command:
                    CreateRestTrackingCommand = {
                        tenantId,
                        athleteId,
                        value: 7.5,
                        recordedAt,
                        sourceType: "SYSTEM",
                        sourceId: "application-test",
                        sourceObservationId: "rest-1",
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
                    .toBe(7.5);
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
                    new CreateRestTrackingUseCase(
                        repository,
                        createAthleteRepository([]),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 7,
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
            "rejects invalid rest tracking values",
            async () => {
                const repository =
                    createTrackingRepository();

                const useCase =
                    new CreateRestTrackingUseCase(
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
                        "Rest tracking value must be finite.",
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
                    new CreateRestTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 7,
                        sourceType: "SYSTEM",
                        sourceId: "",
                        sourceObservationId: "observation-1",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Complete rest tracking provenance is required.",
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
                    new RestTracking(
                        "original-id",
                        tenantId,
                        athleteId,
                        8,
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
                    new CreateRestTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 8,
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
                    new CreateRestTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const result =
                    await useCase.execute({
                        tenantId,
                        athleteId,
                        value: 7,
                        sourceType: "SYSTEM",
                        sourceId: "source",
                        sourceObservationId: "observation",
                    });

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Rest observation identity already exists with different data.",
                    );
            },
        );

        it(
            "rejects a non-positive recent-rest limit",
            async () => {
                const repository =
                    createTrackingRepository();

                const useCase =
                    new ListRecentRestTrackingUseCase(
                        repository,
                        createAthleteRepository(),
                    );

                const query:
                    ListRecentRestTrackingQuery = {
                        tenantId,
                        athleteId,
                        limit: 0,
                    };

                const result =
                    await useCase.execute(query);

                expect(result.isSuccess).toBe(false);
                expect(result.error)
                    .toBe(
                        "Rest tracking limit must be positive.",
                    );

                expect(
                    repository.listRecentForAthlete,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "rejects a recent-rest limit above 100",
            async () => {
                const repository =
                    createTrackingRepository();

                const useCase =
                    new ListRecentRestTrackingUseCase(
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
                        "Rest tracking limit must be an integer between 1 and 100.",
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
                    new RestTracking(
                        "tracking-1",
                        tenantId,
                        athleteId,
                        6.5,
                        new Date("2026-09-09T10:00:00.000Z"),
                        new Date("2026-09-09T10:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation-1",
                    ),
                    new RestTracking(
                        "tracking-2",
                        tenantId,
                        athleteId,
                        7.5,
                        new Date("2026-09-10T10:00:00.000Z"),
                        new Date("2026-09-10T10:01:00.000Z"),
                        "SYSTEM",
                        "source",
                        "observation-2",
                    ),
                    new RestTracking(
                        "other-athlete",
                        tenantId,
                        otherAthleteId,
                        9,
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
                    new ListRecentRestTrackingUseCase(
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
                    new ListRecentRestTrackingUseCase(
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
