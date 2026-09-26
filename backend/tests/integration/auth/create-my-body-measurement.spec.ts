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
            firstName: "Body",
            lastName: "Measurement",
            countryCode: "ZA",
            status,
        },
    });
}

describe(
    "Create my body measurement API",
    () => {

        beforeEach(
            async () => {
                await rateLimitModule
                    .resetAuthRateLimiter();
            },
        );

        it(
            "rejects an unauthenticated request",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .send({
                            heightCm: 180,
                            weightKg: 81,
                        });

                expect(response.status).toBe(401);
            },
        );

        it(
            "calculates and persists BMI for the authenticated Athlete",
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            heightCm: 180,
                            weightKg: 81,
                            bodyFatPercentage: 15,
                            bodyFatMethod: "DEXA",
                            recordedAt:
                                "2026-09-14T12:00:00.000Z",
                        });

                expect(response.status).toBe(201);
                expect(response.body.athleteId).toBe(
                    athlete.id,
                );
                expect(response.body.tenantId).toBe(
                    user.tenantId,
                );
                expect(response.body.heightCm).toBe(180);
                expect(response.body.weightKg).toBe(81);
                expect(response.body.bmi).toBe(25);
                expect(response.body.bodyFatPercentage).toBe(15);
                expect(response.body.bodyFatMethod).toBe("DEXA");
                expect(response.body.bodyFatSource).toBe("ATHLETE_MANUAL");

                const persisted =
                    await testPrisma
                        .athleteBodyMeasurement
                        .findUniqueOrThrow({
                            where: {
                                id: response.body.id,
                            },
                        });

                expect(persisted.athleteId).toBe(
                    athlete.id,
                );
                expect(persisted.bmi.toNumber()).toBe(25);
                expect(persisted.bodyFatMethod).toBe("DEXA");
            },
        );

        it("keeps earlier observations when a new one is recorded", async () => {
            const { user, password } = await createTestUser();
            const athlete = await createAthlete(user);
            const token = await login(user.tenantId, user.email, password);
            for (const weightKg of [81, 79]) {
                const response = await request(app)
                    .post("/api/v1/auth/me/body-measurements")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ heightCm: 180, weightKg });
                expect(response.status).toBe(201);
            }
            const history = await testPrisma.athleteBodyMeasurement.findMany({
                where: { tenantId: user.tenantId, athleteId: athlete.id },
                orderBy: { createdAt: "asc" },
            });
            expect(history.map((entry) => entry.weightKg.toNumber()))
                .toEqual([81, 79]);
        });

        it(
            "supports an omitted body-fat percentage",
            async () => {
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            heightCm: 175,
                            weightKg: 70,
                        });

                expect(response.status).toBe(201);
                expect(
                    response.body.bodyFatPercentage,
                ).toBeNull();
                expect(response.body.bmi).toBe(22.86);
            },
        );

        it.each([
            [{ heightCm: 0, weightKg: 80 }],
            [{ heightCm: 301, weightKg: 80 }],
            [{ heightCm: 180, weightKg: 0 }],
            [{ heightCm: 180, weightKg: 1001 }],
            [{ heightCm: 180, weightKg: 80, bodyFatPercentage: 15 }],
            [{ heightCm: 180, weightKg: 80, bodyFatPercentage: 15, bodyFatMethod: "INVALID" }],
            [{ heightCm: 180, weightKg: 80, bodyFatMethod: "DEXA" }],
            [{
                heightCm: 180,
                weightKg: 80,
                bodyFatPercentage: 101,
            }],
            [{
                heightCm: 180,
                weightKg: 80,
                recordedAt: "invalid",
            }],
        ])(
            "rejects invalid measurement input %#",
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send(payload);

                expect(response.status).toBe(400);
            },
        );

        it.each([
            "userId",
            "athleteId",
            "tenantId",
            "bmi",
            "unknownField",
        ])(
            "rejects protected or unknown field %s",
            async (field) => {
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            heightCm: 180,
                            weightKg: 80,
                            [field]: "forbidden",
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Invalid body-measurement payload.",
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            heightCm: 180,
                            weightKg: 80,
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
                        .post(
                            "/api/v1/auth/me/body-measurements",
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            heightCm: 180,
                            weightKg: 80,
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Athlete profile is not active.",
                );
            },
        );

        it(
            "enforces database measurement constraints",
            async () => {
                const {
                    user,
                } = await createTestUser();

                const athlete =
                    await createAthlete(user);

                await expect(
                    testPrisma
                        .athleteBodyMeasurement
                        .create({
                            data: {
                                tenantId:
                                    user.tenantId,
                                athleteId:
                                    athlete.id,
                                heightCm: -1,
                                weightKg: 80,
                                bmi: 25,
                            },
                        }),
                ).rejects.toThrow();
            },
        );

        it(
            "enforces composite Athlete tenant ownership",
            async () => {
                const first =
                    await createTestUser();

                const second =
                    await createTestUser();

                const athlete =
                    await createAthlete(first.user);

                await expect(
                    testPrisma
                        .athleteBodyMeasurement
                        .create({
                            data: {
                                tenantId:
                                    second.user.tenantId,
                                athleteId:
                                    athlete.id,
                                heightCm: 180,
                                weightKg: 80,
                                bmi: 24.69,
                            },
                        }),
                ).rejects.toThrow();
            },
        );
    },
);