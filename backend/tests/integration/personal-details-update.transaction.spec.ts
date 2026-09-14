import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { PrismaPersonalDetailsUpdateTransaction } from "../../src/infrastructure/transactions/personal-details-update.transaction";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const transaction =
    new PrismaPersonalDetailsUpdateTransaction(
        new DatabaseService(),
    );

let tenantId: string;
let otherTenantId: string;
let userId: string;
let athleteId: string;
let duplicateUserId: string;

beforeAll(
    async () => {

        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Personal Details Tenant ${crypto.randomUUID()}`,
                    slug:
                        `personal-details-${crypto.randomUUID()}`,
                },
            });

        const otherTenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `Other Personal Details Tenant ${crypto.randomUUID()}`,
                    slug:
                        `other-personal-details-${crypto.randomUUID()}`,
                },
            });

        tenantId = tenant.id;
        otherTenantId = otherTenant.id;

        const user =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email:
                        `athlete-${crypto.randomUUID()}@titan.test`,
                    passwordHash: "test-password-hash",
                    firstName: "Original",
                    lastName: "Athlete",
                    contactNumber: "+27820000001",
                },
            });

        userId = user.id;

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId,
                    userId,
                    firstName: "Original",
                    lastName: "Athlete",
                    countryCode: "ZA",
                },
            });

        athleteId = athlete.id;

        const duplicate =
            await testPrisma.user.create({
                data: {
                    tenantId,
                    email: "duplicate@titan.test",
                    passwordHash: "test-password-hash",
                },
            });

        duplicateUserId = duplicate.id;
    },
);

afterAll(
    async () => {

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
                        duplicateUserId,
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
    "Personal-details atomic transaction",
    () => {

        it(
            "updates User and linked Athlete together",
            async () => {

                const result =
                    await transaction.execute({
                        userId,
                        tenantId,
                        firstName: " Updated ",
                        lastName: " Athlete ",
                        email: " UPDATED@TITAN.TEST ",
                        contactNumber: "+27821234567",
                        countryCode: "gb",
                        dateOfBirth:
                            new Date(
                                "2000-01-01T00:00:00.000Z",
                            ),
                    });

                expect(result.userId).toBe(
                    userId,
                );

                expect(result.athleteId).toBe(
                    athleteId,
                );

                expect(result.email).toBe(
                    "updated@titan.test",
                );

                expect(result.countryCode).toBe(
                    "GB",
                );

                const user =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: userId,
                        },
                    });

                const athlete =
                    await testPrisma.athlete.findUniqueOrThrow({
                        where: {
                            id: athleteId,
                        },
                    });

                expect(user.firstName).toBe(
                    "Updated",
                );

                expect(athlete.firstName).toBe(
                    "Updated",
                );

                expect(user.lastName).toBe(
                    athlete.lastName,
                );
            },
        );

        it(
            "rolls back both records on duplicate email",
            async () => {

                const beforeUser =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: userId,
                        },
                    });

                const beforeAthlete =
                    await testPrisma.athlete.findUniqueOrThrow({
                        where: {
                            id: athleteId,
                        },
                    });

                await expect(
                    transaction.execute({
                        userId,
                        tenantId,
                        firstName: "Changed",
                        lastName: "Name",
                        email: "duplicate@titan.test",
                        contactNumber: "+27821234568",
                        countryCode: "US",
                        dateOfBirth: null,
                    }),
                ).rejects.toThrow(
                    "Email already exists for this tenant.",
                );

                const afterUser =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: userId,
                        },
                    });

                const afterAthlete =
                    await testPrisma.athlete.findUniqueOrThrow({
                        where: {
                            id: athleteId,
                        },
                    });

                expect(afterUser.email).toBe(
                    beforeUser.email,
                );

                expect(afterUser.firstName).toBe(
                    beforeUser.firstName,
                );

                expect(afterAthlete.firstName).toBe(
                    beforeAthlete.firstName,
                );
            },
        );

        it(
            "rejects cross-tenant authenticated ownership",
            async () => {

                await expect(
                    transaction.execute({
                        userId,
                        tenantId: otherTenantId,
                        firstName: "Cross",
                        lastName: "Tenant",
                        email: "cross@titan.test",
                        contactNumber: null,
                        countryCode: "ZA",
                        dateOfBirth: null,
                    }),
                ).rejects.toThrow(
                    "User not found.",
                );
            },
        );

        it(
            "rolls back User changes when Athlete validation fails",
            async () => {

                const before =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: userId,
                        },
                    });

                await expect(
                    transaction.execute({
                        userId,
                        tenantId,
                        firstName: "Should Not Persist",
                        lastName: "Athlete",
                        email: "should-not-persist@titan.test",
                        contactNumber: null,
                        countryCode: "INVALID",
                        dateOfBirth: null,
                    }),
                ).rejects.toThrow(
                    "Athlete country code must contain exactly two letters.",
                );

                const after =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: userId,
                        },
                    });

                expect(after.email).toBe(
                    before.email,
                );

                expect(after.firstName).toBe(
                    before.firstName,
                );
            },
        );
    },
);
