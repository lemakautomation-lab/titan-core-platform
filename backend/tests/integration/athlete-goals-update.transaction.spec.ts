import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { PrismaAthleteGoalsUpdateTransaction } from "../../src/infrastructure/transactions/athlete-goals-update.transaction";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const transaction =
    new PrismaAthleteGoalsUpdateTransaction(
        new DatabaseService(),
    );

let tenantId: string;
let otherTenantId: string;
let userId: string;
let athleteId: string;
let missingAthleteUserId: string;
let inactiveUserId: string;

beforeAll(
    async () => {
        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Athlete Goals Tenant ${crypto.randomUUID()}`,
                    slug:
                        `athlete-goals-${crypto.randomUUID()}`,
                },
            });

        const otherTenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Other Athlete Goals Tenant ${crypto.randomUUID()}`,
                    slug:
                        `other-athlete-goals-${crypto.randomUUID()}`,
                },
            });

        tenantId = tenant.id;
        otherTenantId = otherTenant.id;

        const user =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `goals-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                },
            });

        userId = user.id;

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId,
                    userId,
                    firstName: "Goals",
                    lastName: "Athlete",
                    countryCode: "ZA",
                },
            });

        athleteId = athlete.id;

        const missingAthleteUser =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `missing-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                },
            });

        missingAthleteUserId =
            missingAthleteUser.id;

        const inactiveUser =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `inactive-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                },
            });

        inactiveUserId = inactiveUser.id;

        await testPrisma.athlete.create({
                data: {
                    tenantId,
                    userId: inactiveUserId,
                    firstName: "Inactive",
                    lastName: "Athlete",
                    countryCode: "ZA",
                    status: "INACTIVE",
                },
            });

    },
);

afterAll(
    async () => {
        await testPrisma.athleteGoal.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.athlete.deleteMany({
            where: {
                tenantId,
            },
        });

        await testPrisma.user.deleteMany({
            where: {
                id: {
                    in: [
                        userId,
                        missingAthleteUserId,
                        inactiveUserId,
                    ],
                },
            },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: [
                        tenantId,
                        otherTenantId,
                    ],
                },
            },
        });
    },
);

describe(
    "Athlete-goals atomic transaction",
    () => {

        it(
            "persists one primary and multiple deterministic secondary goals",
            async () => {
                const result =
                    await transaction.execute({
                        userId,
                        tenantId,
                        primaryGoal: "STRENGTH",
                        secondaryGoals: [
                            "GENERAL_FITNESS",
                            "MOBILITY",
                        ],
                    });

                expect(result).toEqual({
                    athleteId,
                    tenantId,
                    primaryGoal: "STRENGTH",
                    secondaryGoals: [
                        "MOBILITY",
                        "GENERAL_FITNESS",
                    ],
                });

                const persisted =
                    await testPrisma.athleteGoal.findMany({
                        where: {
                            tenantId,
                            athleteId,
                        },
                    });

                expect(persisted).toHaveLength(3);
                expect(
                    persisted.filter(
                        (goal) => goal.isPrimary,
                    ),
                ).toHaveLength(1);
            },
        );

        it(
            "atomically replaces the complete selection",
            async () => {
                await transaction.execute({
                    userId,
                    tenantId,
                    primaryGoal: "POWER",
                    secondaryGoals: ["SPEED"],
                });

                const persisted =
                    await testPrisma.athleteGoal.findMany({
                        where: {
                            tenantId,
                            athleteId,
                        },
                    });

                expect(
                    persisted.map(
                        (goal) => goal.classification,
                    ).sort(),
                ).toEqual([
                    "POWER",
                    "SPEED",
                ]);

                expect(
                    persisted.find(
                        (goal) => goal.isPrimary,
                    )?.classification,
                ).toBe("POWER");
            },
        );

        it(
            "rejects cross-tenant authenticated ownership",
            async () => {
                await expect(
                    transaction.execute({
                        userId,
                        tenantId: otherTenantId,
                        primaryGoal: "STRENGTH",
                        secondaryGoals: [],
                    }),
                ).rejects.toThrow(
                    "User not found.",
                );
            },
        );

        it(
            "rejects a User without an Athlete",
            async () => {
                await expect(
                    transaction.execute({
                        userId: missingAthleteUserId,
                        tenantId,
                        primaryGoal: "STRENGTH",
                        secondaryGoals: [],
                    }),
                ).rejects.toThrow(
                    "Athlete profile not found.",
                );
            },
        );

        it(
            "rejects an inactive Athlete",
            async () => {
                await expect(
                    transaction.execute({
                        userId: inactiveUserId,
                        tenantId,
                        primaryGoal: "STRENGTH",
                        secondaryGoals: [],
                    }),
                ).rejects.toThrow(
                    "Athlete profile is not active.",
                );
            },
        );

        it(
            "preserves previous goals when validation fails",
            async () => {
                await transaction.execute({
                    userId,
                    tenantId,
                    primaryGoal: "ENDURANCE",
                    secondaryGoals: ["MOBILITY"],
                });

                await expect(
                    transaction.execute({
                        userId,
                        tenantId,
                        primaryGoal: "INVALID",
                        secondaryGoals: [],
                    }),
                ).rejects.toThrow(
                    "Athlete goal classification is invalid.",
                );

                const persisted =
                    await testPrisma.athleteGoal.findMany({
                        where: {
                            tenantId,
                            athleteId,
                        },
                    });

                expect(
                    persisted.map(
                        (goal) => goal.classification,
                    ).sort(),
                ).toEqual([
                    "ENDURANCE",
                    "MOBILITY",
                ]);
            },
        );

        it(
            "enforces unique classifications in the database",
            async () => {
                await testPrisma.athleteGoal.deleteMany({
                    where: {
                        tenantId,
                        athleteId,
                    },
                });

                await testPrisma.athleteGoal.create({
                    data: {
                        tenantId,
                        athleteId,
                        classification: "STRENGTH",
                        isPrimary: false,
                    },
                });

                await expect(
                    testPrisma.athleteGoal.create({
                        data: {
                            tenantId,
                            athleteId,
                            classification: "STRENGTH",
                            isPrimary: false,
                        },
                    }),
                ).rejects.toThrow();
            },
        );

        it(
            "enforces at most one primary goal in the database",
            async () => {
                await testPrisma.athleteGoal.deleteMany({
                    where: {
                        tenantId,
                        athleteId,
                    },
                });

                await testPrisma.athleteGoal.create({
                    data: {
                        tenantId,
                        athleteId,
                        classification: "STRENGTH",
                        isPrimary: true,
                    },
                });

                await expect(
                    testPrisma.athleteGoal.create({
                        data: {
                            tenantId,
                            athleteId,
                            classification: "POWER",
                            isPrimary: true,
                        },
                    }),
                ).rejects.toThrow();
            },
        );
    },
);