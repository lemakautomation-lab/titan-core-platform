import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { TrainingStress } from "../../src/domain/entities/training-stress.entity";
import { PrismaTrainingStressRepository } from "../../src/infrastructure/repositories/training-stress/training-stress.repository";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";


const database =
    new DatabaseService();

const repository =
    new PrismaTrainingStressRepository(
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
                        `TITAN Training Stress Test Tenant ${crypto.randomUUID()}`,
                    slug:
                        `titan-training-stress-test-${crypto.randomUUID()}`,
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
                        "Training",
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
        await testPrisma.trainingStress.deleteMany({
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
    "Training Stress Repository Persistence",
    () => {

        it(
            "creates and retrieves a training stress observation idempotently",
            async () => {

                const recordedAt =
                    new Date(
                        "2026-09-10T08:00:00.000Z",
                    );

                const tracking =
                    TrainingStress.create(
                        testTenantId,
                        testAthleteId,
                        8.25,
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
                        "Expected training stress to be created.",
                    );
                }

                expect(created.tracking.id).toBe(
                    tracking.id,
                );

                expect(created.tracking.value).toBe(
                    8.25,
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
                        "Expected identical training stress observation to replay.",
                    );
                }

                expect(replay.tracking.id).toBe(
                    tracking.id,
                );

                await testPrisma.trainingStress.delete({
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
                    TrainingStress.create(
                        testTenantId,
                        testAthleteId,
                        7.5,
                        recordedAt,
                        sourceType,
                        sourceId,
                        sourceObservationId,
                    );

                const second =
                    new TrainingStress(
                        crypto.randomUUID(),
                        testTenantId,
                        testAthleteId,
                        6.5,
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

                await testPrisma.trainingStress.delete({
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
                    TrainingStress.create(
                        testTenantId,
                        testAthleteId,
                        6.5,
                        new Date("2026-09-08T08:00:00.000Z"),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    ),
                    TrainingStress.create(
                        testTenantId,
                        testAthleteId,
                        7.5,
                        new Date("2026-09-09T08:00:00.000Z"),
                        "TEST",
                        `device-${crypto.randomUUID()}`,
                        `observation-${crypto.randomUUID()}`,
                    ),
                    TrainingStress.create(
                        testTenantId,
                        testAthleteId,
                        8.5,
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
                    8.5,
                );

                expect(recent[1].value).toBe(
                    7.5,
                );

                await testPrisma.trainingStress.deleteMany({
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
                    TrainingStress.create(
                        testTenantId,
                        otherAthlete.id,
                        5.5,
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

                await testPrisma.trainingStress.delete({
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
                                `TITAN Other Training Stress Tenant ${crypto.randomUUID()}`,
                            slug:
                                `titan-other-training-stress-${crypto.randomUUID()}`,
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
                    TrainingStress.create(
                        otherTenant.id,
                        otherAthlete.id,
                        4.5,
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

                await testPrisma.trainingStress.delete({
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