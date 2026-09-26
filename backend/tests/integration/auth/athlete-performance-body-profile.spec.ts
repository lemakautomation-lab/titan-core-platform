import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../../src/app";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

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

async function createAthlete(
    user: {
        id: string;
        tenantId: string;
    },
    status: "ACTIVE" | "INACTIVE" = "ACTIVE",
) {
    return testPrisma.athlete.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            firstName: "Performance",
            lastName: "Body",
            countryCode: "ZA",
            status,
        },
    });
}

describe(
    "Authenticated Athlete performance body profile",
    () => {

        beforeEach(
            async () => {
                await rateLimitModule
                    .resetAuthRateLimiter();
            },
        );

        it.each([
            ["put", "/api/v1/auth/me/body-model"],
            ["get", "/api/v1/auth/me/performance-body"],
        ])(
            "rejects unauthenticated %s requests",
            async (method, path) => {
                const operation =
                    method === "put"
                        ? request(app).put(path).send({
                            modelType: "MALE",
                        })
                        : request(app).get(path);

                const response = await operation;

                expect(response.status).toBe(401);
            },
        );

        it.each([
            "MALE",
            "FEMALE",
        ])(
            "persists explicit model selection %s",
            async (modelType) => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await createAthlete(user);

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .put(
                            "/api/v1/auth/me/body-model",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            modelType,
                        });

                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    athleteId: athlete.id,
                    tenantId: user.tenantId,
                    modelType,
                });

                const persisted =
                    await testPrisma.athlete
                        .findUniqueOrThrow({
                            where: {
                                id: athlete.id,
                            },
                        });

                expect(
                    persisted.bodyModelType,
                ).toBe(modelType);
            },
        );

        it.each([
            [{ modelType: "male" }],
            [{ modelType: "OTHER" }],
            [{
                modelType: "MALE",
                athleteId: "forbidden",
            }],
            [{
                modelType: "MALE",
                tenantId: "forbidden",
            }],
        ])(
            "rejects invalid model payload %#",
            async (payload) => {
                const {
                    user,
                    password,
                } = await createTestUser();

                await createAthlete(user);

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .put(
                            "/api/v1/auth/me/body-model",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send(payload);

                expect(response.status).toBe(400);
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
                        .put(
                            "/api/v1/auth/me/body-model",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            modelType: "MALE",
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Athlete profile not found.",
                );
            },
        );

        it(
            "rejects an inactive Athlete",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                await createAthlete(
                    user,
                    "INACTIVE",
                );

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/performance-body",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Athlete profile is not active.",
                );
            },
        );

        it(
            "returns null selection and empty history without inference",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await createAthlete(user);

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/performance-body",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    athleteId: athlete.id,
                    tenantId: user.tenantId,
                    modelType: null,
                    measurements: [],
                });
            },
        );

        it(
            "returns selected model and chronological measurement history",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await createAthlete(user);

                await testPrisma.athlete.update({
                    where: {
                        id: athlete.id,
                    },
                    data: {
                        bodyModelType: "FEMALE",
                    },
                });

                await testPrisma
                    .athleteBodyMeasurement
                    .createMany({
                        data: [
                            {
                                tenantId:
                                    user.tenantId,
                                athleteId:
                                    athlete.id,
                                heightCm: 170,
                                weightKg: 68,
                                bmi: 23.53,
                                bodyFatPercentage:
                                    24,
                                recordedAt:
                                    new Date(
                                        "2026-09-14T12:00:00.000Z",
                                    ),
                            },
                            {
                                tenantId:
                                    user.tenantId,
                                athleteId:
                                    athlete.id,
                                heightCm: 170,
                                weightKg: 70,
                                bmi: 24.22,
                                bodyFatPercentage:
                                    25,
                                recordedAt:
                                    new Date(
                                        "2026-08-14T12:00:00.000Z",
                                    ),
                            },
                        ],
                    });

                const token =
                    await login(
                        user.tenantId,
                        user.email,
                        password,
                    );

                const response =
                    await request(app)
                        .get(
                            "/api/v1/auth/me/performance-body",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        );

                expect(response.status).toBe(200);
                expect(response.body.modelType).toBe(
                    "FEMALE",
                );
                expect(
                    response.body.measurements,
                ).toHaveLength(2);
                expect(
                    response.body.measurements[0]
                        .weightKg,
                ).toBe(70);
                expect(
                    response.body.measurements[1]
                        .weightKg,
                ).toBe(68);
                expect(response.body.measurements[0].bodyFatMethod).toBeNull();
                expect(response.body.measurements[0].bodyFatSource).toBeNull();
            },
        );
    },
);