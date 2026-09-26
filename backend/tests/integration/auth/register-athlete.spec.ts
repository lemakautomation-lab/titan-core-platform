import request from "supertest";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../../src/app";
import { testPrisma } from "../../helpers/prisma-test.client";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";

const consumerSlug =
    "titan-health-consumer-test";

const email =
    `public-athlete-${crypto.randomUUID()}@titan.test`;

let tenantId: string;

beforeAll(async () => {
    const tenant =
        await testPrisma.tenant.upsert({
            where: {
                slug: consumerSlug,
            },
            update: {
                status: "ACTIVE",
            },
            create: {
                name:
                    "TITAN Health Consumer Test",
                slug:
                    consumerSlug,
            },
        });

    tenantId = tenant.id;
});

beforeEach(async () => {
    await rateLimitModule
        .resetAuthRateLimiter();
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

    await testPrisma.session.deleteMany({
        where: {
            userId: {
                in: userIds,
            },
        },
    });

    await testPrisma.athleteDigitalTwin
        .deleteMany({
            where: {
                tenantId,
                athlete: {
                    userId: {
                        in: userIds,
                    },
                },
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

});

describe("Public Athlete registration API", () => {
    const validPayload = {
        firstName: " Titan ",
        lastName: " Athlete ",
        email,
        password: "Password123!",
        countryCode: "za",
        dateOfBirth: "1995-01-01",
    };

    it(
        "creates an onboarding-only Athlete account",
        async () => {
            const response =
                await request(app)
                    .post(
                        "/api/v1/auth/register/athlete",
                    )
                    .send(validPayload);

            expect(response.status).toBe(201);
            expect(response.body.success)
                .toBe(true);
            expect(response.body.data.registration)
                .toMatchObject({
                    tenantId,
                    email,
                });
            expect(
                response.body.data.accessToken,
            ).toEqual(expect.any(String));
            expect(
                response.body.data.user.email,
            ).toBe(email);

            const me = await request(app)
                .get("/api/v1/auth/me")
                .set(
                    "Authorization",
                    `Bearer ${response.body.data.accessToken}`,
                );
            expect(me.status).toBe(200);
            expect(me.body.selectedUserType).toBe("ATHLETE");
            expect(me.body).toMatchObject({
                userId: response.body.data.registration.userId,
                tenantId,
                email,
            });

            const user =
                await testPrisma.user
                    .findUniqueOrThrow({
                        where: {
                            id:
                                response.body.data
                                    .registration
                                    .userId,
                        },
                        include: {
                            athletes: {
                                include: {
                                    athleteDigitalTwins:
                                        true,
                                },
                            },
                            userRoles: true,
                            userTypeEntitlements:
                                true,
                        },
                    });

            expect(user.selectedUserType)
                .toBe("ATHLETE");
            expect(user.userRoles).toHaveLength(0);
            expect(user.userTypeEntitlements)
                .toHaveLength(0);
            expect(user.athletes).toHaveLength(1);
            expect(
                user.athletes[0]
                    .athleteDigitalTwins,
            ).toHaveLength(1);
        },
    );

    it(
        "rejects a duplicate email",
        async () => {
            const response =
                await request(app)
                    .post(
                        "/api/v1/auth/register/athlete",
                    )
                    .send(validPayload);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe(
                "Email already exists for this tenant.",
            );
        },
    );

    it.each([
        ["tenantId"],
        ["selectedUserType"],
        ["roles"],
        ["permissions"],
        ["paymentStatus"],
        ["entitlementStatus"],
        ["unknownField"],
    ])(
        "rejects protected or unknown field %s",
        async (field) => {
            const response =
                await request(app)
                    .post(
                        "/api/v1/auth/register/athlete",
                    )
                    .send({
                        ...validPayload,
                        email:
                            `${field}-${email}`,
                        [field]:
                            "forbidden",
                    });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                "Invalid Athlete registration payload.",
            );
        },
    );

    it(
        "rejects malformed and future dates",
        async () => {
            for (const dateOfBirth of [
                "invalid-date",
                "2999-01-01",
            ]) {
                const response =
                    await request(app)
                        .post(
                            "/api/v1/auth/register/athlete",
                        )
                        .send({
                            ...validPayload,
                            email:
                                `${crypto.randomUUID()}@titan.test`,
                            dateOfBirth,
                        });

                expect(response.status).toBe(400);
            }
        },
    );
});
