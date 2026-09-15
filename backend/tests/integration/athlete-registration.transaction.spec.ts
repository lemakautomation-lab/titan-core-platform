import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { PrismaAthleteRegistrationTransaction } from "../../src/infrastructure/transactions/athlete-registration.transaction";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const transaction =
    new PrismaAthleteRegistrationTransaction(
        new DatabaseService(),
    );

const slug =
    `consumer-signup-${crypto.randomUUID()}`;

let tenantId: string;
const email =
    `athlete-signup-${crypto.randomUUID()}@titan.test`;

beforeAll(async () => {
    const tenant =
        await testPrisma.tenant.create({
            data: {
                name:
                    "Athlete Signup Consumer Tenant",
                slug,
            },
        });

    tenantId = tenant.id;
});

afterAll(async () => {
    const users =
        await testPrisma.user.findMany({
            where: {
                tenantId,
                email,
            },
            select: {
                id: true,
            },
        });

    const userIds =
        users.map((user) => user.id);

    await testPrisma.athleteDigitalTwin
        .deleteMany({
            where: {
                tenantId,
            },
        });

    await testPrisma.athlete.deleteMany({
        where: {
            tenantId,
            userId: {
                in: userIds,
            },
        },
    });

    await testPrisma.user.deleteMany({
        where: {
            id: {
                in: userIds,
            },
        },
    });

    await testPrisma.tenant.delete({
        where: {
            id: tenantId,
        },
    });
});

describe("Athlete self-signup transaction", () => {
    it(
        "atomically creates User, Athlete and Digital Twin",
        async () => {
            const result =
                await transaction.execute({
                    consumerTenantSlug:
                        slug,
                    firstName:
                        " Titan ",
                    lastName:
                        " Athlete ",
                    email:
                        ` ${email.toUpperCase()} `,
                    password:
                        "Password123!",
                    countryCode:
                        "za",
                    dateOfBirth:
                        new Date(
                            "1995-01-01T00:00:00.000Z",
                        ),
                });

            expect(result.email).toBe(email);
            expect(result.tenantId).toBe(
                tenantId,
            );

            const user =
                await testPrisma.user
                    .findUniqueOrThrow({
                        where: {
                            id: result.userId,
                        },
                    });

            const athlete =
                await testPrisma.athlete
                    .findUniqueOrThrow({
                        where: {
                            id: result.athleteId,
                        },
                    });

            const twin =
                await testPrisma
                    .athleteDigitalTwin
                    .findUniqueOrThrow({
                        where: {
                            id:
                                result.digitalTwinId,
                        },
                    });

            expect(user.email).toBe(email);
            expect(user.passwordHash)
                .not.toBe("Password123!");
            expect(user.selectedUserType)
                .toBe("ATHLETE");
            expect(athlete.userId)
                .toBe(user.id);
            expect(athlete.countryCode)
                .toBe("ZA");
            expect(twin.athleteId)
                .toBe(athlete.id);

            expect(
                await testPrisma.userRole.count({
                    where: {
                        userId: user.id,
                    },
                }),
            ).toBe(0);

            expect(
                await testPrisma
                    .userTypeEntitlement
                    .count({
                        where: {
                            userId: user.id,
                        },
                    }),
            ).toBe(0);
        },
    );

    it(
        "rejects duplicate email without creating another Athlete",
        async () => {
            await expect(
                transaction.execute({
                    consumerTenantSlug:
                        slug,
                    firstName: "Duplicate",
                    lastName: "Athlete",
                    email,
                    password:
                        "Password123!",
                    countryCode: "ZA",
                    dateOfBirth:
                        new Date(
                            "1995-01-01T00:00:00.000Z",
                        ),
                }),
            ).rejects.toThrow(
                "Email already exists for this tenant.",
            );

            expect(
                await testPrisma.user.count({
                    where: {
                        tenantId,
                        email,
                    },
                }),
            ).toBe(1);

            expect(
                await testPrisma.athlete.count({
                    where: {
                        tenantId,
                    },
                }),
            ).toBe(1);
        },
    );

    it("rejects an unavailable tenant", async () => {
        await expect(
            transaction.execute({
                consumerTenantSlug:
                    "missing-consumer-tenant",
                firstName: "Missing",
                lastName: "Tenant",
                email:
                    "missing@titan.test",
                password:
                    "Password123!",
                countryCode: "ZA",
                dateOfBirth:
                    new Date(
                        "1995-01-01T00:00:00.000Z",
                    ),
            }),
        ).rejects.toThrow(
            "Athlete registration is unavailable.",
        );
    });

    it("rejects a future date of birth", async () => {
        await expect(
            transaction.execute({
                consumerTenantSlug: slug,
                firstName: "Future",
                lastName: "Athlete",
                email:
                    "future@titan.test",
                password:
                    "Password123!",
                countryCode: "ZA",
                dateOfBirth:
                    new Date(
                        "2999-01-01T00:00:00.000Z",
                    ),
            }),
        ).rejects.toThrow(
            "Athlete date of birth must be a valid, non-future date.",
        );
    });
});