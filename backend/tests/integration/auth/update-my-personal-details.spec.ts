import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../../src/app";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {

    const response =
        await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId,
                email,
                password,
            });

    expect(response.status).toBe(200);

    return response.body.data.accessToken;
}

describe(
    "Update my personal details API",
    () => {

        beforeEach(
            async () => {
                await rateLimitModule
                    .resetAuthRateLimiter();
            },
        );

        it(
            "updates only the authenticated User and linked Athlete",
            async () => {

                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await testPrisma.athlete.create({
                        data: {
                            tenantId: user.tenantId,
                            userId: user.id,
                            firstName: "Original",
                            lastName: "Athlete",
                            countryCode: "ZA",
                        },
                    });

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .put("/api/v1/auth/me")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            firstName: " Updated ",
                            lastName: " Athlete ",
                            email: "updated-athlete@titan.test",
                            contactNumber: "+27821234567",
                            countryCode: "gb",
                            dateOfBirth: "2000-01-01T00:00:00.000Z",
                        });

                expect(response.status).toBe(200);
                expect(response.body.userId).toBe(
                    user.id,
                );
                expect(response.body.athleteId).toBe(
                    athlete.id,
                );
                expect(response.body.firstName).toBe(
                    "Updated",
                );
                expect(response.body.countryCode).toBe(
                    "GB",
                );

                const updatedUser =
                    await testPrisma.user.findUniqueOrThrow({
                        where: {
                            id: user.id,
                        },
                    });

                const updatedAthlete =
                    await testPrisma.athlete.findUniqueOrThrow({
                        where: {
                            id: athlete.id,
                        },
                    });

                expect(updatedUser.firstName).toBe(
                    updatedAthlete.firstName,
                );
                expect(updatedUser.lastName).toBe(
                    updatedAthlete.lastName,
                );
            },
        );

        it(
            "rejects an unauthenticated update",
            async () => {

                const response =
                    await request(app)
                        .put("/api/v1/auth/me")
                        .send({
                            firstName: "Titan",
                            lastName: "Athlete",
                            email: "athlete@titan.test",
                            contactNumber: null,
                            countryCode: "ZA",
                            dateOfBirth: null,
                        });

                expect(response.status).toBe(401);
            },
        );

        it(
            "rejects protected account fields",
            async () => {

                const {
                    user,
                    password,
                } = await createTestUser();

                await testPrisma.athlete.create({
                    data: {
                        tenantId: user.tenantId,
                        userId: user.id,
                        firstName: "Titan",
                        lastName: "Athlete",
                        countryCode: "ZA",
                    },
                });

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .put("/api/v1/auth/me")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            firstName: "Titan",
                            lastName: "Athlete",
                            email: user.email,
                            contactNumber: null,
                            countryCode: "ZA",
                            dateOfBirth: null,
                            tenantId: "another-tenant",
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Invalid personal-details payload.",
                );
            },
        );

        it(
            "rejects a User without a linked Athlete",
            async () => {

                const {
                    user,
                    password,
                } = await createTestUser();

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .put("/api/v1/auth/me")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            firstName: "Titan",
                            lastName: "Athlete",
                            email: user.email,
                            contactNumber: null,
                            countryCode: "ZA",
                            dateOfBirth: null,
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Athlete profile not found.",
                );
            },
        );
    },
);
