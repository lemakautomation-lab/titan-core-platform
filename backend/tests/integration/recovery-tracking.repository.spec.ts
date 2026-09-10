import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { RecoveryTracking } from "../../src/domain/entities/recovery-tracking/recovery-tracking.entity";
import { PrismaRecoveryTrackingRepository } from "../../src/infrastructure/repositories/recovery-tracking/recovery-tracking.repository";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";


const database =
    new DatabaseService();

const repository =
    new PrismaRecoveryTrackingRepository(
        database,
    );

let testTenantId: string;
let testAthleteId: string;


beforeAll(
    async () => {
        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `TITAN Recovery Test Tenant ${crypto.randomUUID()}`,
                    slug:
                        `titan-recovery-test-${crypto.randomUUID()}`,
                },
            });

        testTenantId =
            tenant.id;

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId:
                        testTenantId,
                    firstName:
                        "Recovery",
                    lastName:
                        "Test",
                    status:
                        "ACTIVE",
                },
            });

        testAthleteId =
            athlete.id;
    },
);


afterAll(
    async () => {
        await testPrisma.recoveryTracking.deleteMany({
            where: {
                tenantId:
                    testTenantId,
            },
        });

        await testPrisma.athlete.delete({
            where: {
                id: testAthleteId,
            },
        });

        await testPrisma.tenant.delete({
            where: {
                id: testTenantId,
            },
        });
    },
);


describe(
    "Recovery Tracking Repository Persistence",
    () => {

        it(
            "creates and retrieves a recovery observation idempotently",
            async () => {

                const recordedAt =
                    new Date(
                        "2026-09-10T08:00:00.000Z",
                    );

                const tracking =
                    RecoveryTracking.create(
                        testTenantId,
                        testAthleteId,
                        82.5,
                        recordedAt,
                        "TEST",
                        "device-001",
                        "observation-001",
                    );

                const created =
                    await repository.createIdempotently(
                        tracking,
                    );

                expect(created.kind).toBe(
                    "created",
                );

                if (created.kind !== "created") {
                    throw new Error(
                        "Expected recovery tracking to be created.",
                    );
                }

                expect(created.tracking.id).toBe(
                    tracking.id,
                );

                expect(created.tracking.value).toBe(
                    82.5,
                );

                const replay =
                    await repository.createIdempotently(
                        tracking,
                    );

                expect(replay.kind).toBe(
                    "replayed",
                );

                if (replay.kind !== "replayed") {
                    throw new Error(
                        "Expected identical recovery observation to replay.",
                    );
                }

                expect(replay.tracking.id).toBe(
                    tracking.id,
                );

                await testPrisma.recoveryTracking.delete({
                    where: {
                        id: tracking.id,
                    },
                });
            },
        );


        it(
            "rejects the same observation identity with different data",
            async () => {

                const sourceType =
                    "TEST";

                const sourceId =
                    `device-${crypto.randomUUID()}`;

                const sourceObservationId =
                    `observation-${crypto.randomUUID()}`;

                const recordedAt =
                    new Date(
                        "2026-09-10T09:00:00.000Z",
                    );

                const first =
                    RecoveryTracking.create(
                        testTenantId,
                        testAthleteId,
                        70,
                        recordedAt,
                        sourceType,
                        sourceId,
                        sourceObservationId,
                    );

                const second =
                    new RecoveryTracking(
                        crypto.randomUUID(),
                        testTenantId,
                        testAthleteId,
                        71,
                        recordedAt,
                        new Date(),
                        sourceType,
                        sourceId,
                        sourceObservationId,
                    );

                const firstResult =
                    await repository.createIdempotently(
                        first,
                    );

                expect(firstResult.kind).toBe(
                    "created",
                );

                const secondResult =
                    await repository.createIdempotently(
                        second,
                    );

                expect(secondResult.kind).toBe(
                    "idempotency-conflict",
                );

                await testPrisma.recoveryTracking.delete({
                    where: {
                        id: first.id,
                    },
                });
            },
        );


        it(
            "lists recent observations newest first with a limit",
            async () => {

                const observations = [
                    RecoveryTracking.create(
                        testTenantId,
                        testAthleteId,
                        60,
                        new Date("2026-09-08T08:00:00.000Z"),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    ),
                    RecoveryTracking.create(
                        testTenantId,
                        testAthleteId,
                        75,
                        new Date("2026-09-09T08:00:00.000Z"),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    ),
                    RecoveryTracking.create(
                        testTenantId,
                        testAthleteId,
                        90,
                        new Date("2026-09-10T08:00:00.000Z"),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    ),
                ];

                for (const observation of observations) {
                    const result =
                        await repository.createIdempotently(
                            observation,
                        );

                    expect(result.kind).toBe(
                        "created",
                    );
                }

                const recent =
                    await repository.listRecentForAthlete(
                        testTenantId,
                        testAthleteId,
                        2,
                    );

                expect(recent).toHaveLength(2);

                expect(recent[0].value).toBe(
                    90,
                );

                expect(recent[1].value).toBe(
                    75,
                );

                await testPrisma.recoveryTracking.deleteMany({
                    where: {
                        id: {
                            in: observations.map(
                                observation =>
                                    observation.id,
                            ),
                        },
                    },
                });
            },
        );


        it(
            "does not return observations from another athlete",
            async () => {

                const otherAthlete =
                    await testPrisma.athlete.create({
                        data: {
                            tenantId:
                                testTenantId,
                            firstName:
                                "Other",
                            lastName:
                                "Athlete",
                            status:
                                "ACTIVE",
                        },
                    });

                const otherTracking =
                    RecoveryTracking.create(
                        testTenantId,
                        otherAthlete.id,
                        55,
                        new Date(
                            "2026-09-10T10:00:00.000Z",
                        ),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    );

                const result =
                    await repository.createIdempotently(
                        otherTracking,
                    );

                expect(result.kind).toBe(
                    "created",
                );

                const recent =
                    await repository.listRecentForAthlete(
                        testTenantId,
                        testAthleteId,
                        100,
                    );

                expect(
                    recent.some(
                        observation =>
                            observation.id ===
                            otherTracking.id,
                    ),
                ).toBe(false);

                await testPrisma.recoveryTracking.delete({
                    where: {
                        id: otherTracking.id,
                    },
                });

                await testPrisma.athlete.delete({
                    where: {
                        id: otherAthlete.id,
                    },
                });
            },
        );


        it(
            "does not return observations from another tenant",
            async () => {

                const otherTenant =
                    await testPrisma.tenant.create({
                        data: {
                            name:
                                `TITAN Other Recovery Tenant ${crypto.randomUUID()}`,
                            slug:
                                `titan-other-recovery-${crypto.randomUUID()}`,
                        },
                    });

                const otherAthlete =
                    await testPrisma.athlete.create({
                        data: {
                            tenantId:
                                otherTenant.id,
                            firstName:
                                "Other",
                            lastName:
                                "Tenant",
                            status:
                                "ACTIVE",
                        },
                    });

                const otherTracking =
                    RecoveryTracking.create(
                        otherTenant.id,
                        otherAthlete.id,
                        45,
                        new Date(
                            "2026-09-10T11:00:00.000Z",
                        ),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    );

                const result =
                    await repository.createIdempotently(
                        otherTracking,
                    );

                expect(result.kind).toBe(
                    "created",
                );

                const recent =
                    await repository.listRecentForAthlete(
                        testTenantId,
                        testAthleteId,
                        100,
                    );

                expect(
                    recent.some(
                        observation =>
                            observation.id ===
                            otherTracking.id,
                    ),
                ).toBe(false);

                await testPrisma.recoveryTracking.delete({
                    where: {
                        id: otherTracking.id,
                    },
                });

                await testPrisma.athlete.delete({
                    where: {
                        id: otherAthlete.id,
                    },
                });

                await testPrisma.tenant.delete({
                    where: {
                        id: otherTenant.id,
                    },
                });
            },
        );

    },
);
