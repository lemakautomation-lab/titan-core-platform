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
) {
    return testPrisma.athlete.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            firstName: "Goals",
            lastName: "Athlete",
            countryCode: "ZA",
        },
    });
}

describe(
    "Update my athlete goals API",
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
                        .put("/api/v1/auth/me/goals")
                        .send({
                            primaryGoal: "STRENGTH",
                            secondaryGoals: [
                                "MOBILITY",
                            ],
                        });

                expect(response.status).toBe(401);
            },
        );

        it(
            "updates the authenticated Athlete goals",
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "STRENGTH",
                            secondaryGoals: [
                                "GENERAL_FITNESS",
                                "MOBILITY",
                            ],
                        });

                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    athleteId: athlete.id,
                    tenantId: user.tenantId,
                    primaryGoal: "STRENGTH",
                    secondaryGoals: [
                        "MOBILITY",
                        "GENERAL_FITNESS",
                    ],
                });
            },
        );

        it(
            "leaves another Athlete unchanged",
            async () => {
                const first =
                    await createTestUser();

                const second =
                    await createTestUser();

                await createAthlete(first.user);

                const otherAthlete =
                    await createAthlete(second.user);

                await testPrisma.athleteGoal.create({
                    data: {
                        tenantId:
                            second.user.tenantId,
                        athleteId:
                            otherAthlete.id,
                        classification:
                            "ENDURANCE",
                        isPrimary: true,
                    },
                });

                const token =
                    await login(
                        first.user.tenantId,
                        first.user.email,
                        first.password,
                    );

                const response =
                    await request(app)
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "POWER",
                            secondaryGoals: [],
                        });

                expect(response.status).toBe(200);

                const unchanged =
                    await testPrisma.athleteGoal.findMany({
                        where: {
                            tenantId:
                                second.user.tenantId,
                            athleteId:
                                otherAthlete.id,
                        },
                    });

                expect(unchanged).toHaveLength(1);
                expect(
                    unchanged[0].classification,
                ).toBe("ENDURANCE");
                expect(
                    unchanged[0].isPrimary,
                ).toBe(true);
            },
        );

        it.each([
            "userId",
            "athleteId",
            "tenantId",
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "STRENGTH",
                            secondaryGoals: [],
                            [field]: "forbidden",
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Invalid athlete-goals payload.",
                );
            },
        );

        it(
            "rejects a malformed request",
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "STRENGTH",
                            secondaryGoals: "MOBILITY",
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Invalid athlete-goals payload.",
                );
            },
        );

        it.each([
            {
                primaryGoal: "INVALID",
                secondaryGoals: [],
            },
            {
                primaryGoal: "STRENGTH",
                secondaryGoals: [
                    "MOBILITY",
                    "MOBILITY",
                ],
            },
            {
                primaryGoal: "STRENGTH",
                secondaryGoals: [
                    "STRENGTH",
                ],
            },
        ])(
            "rejects invalid goal selection %#",
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send(payload);

                expect(response.status).toBe(400);
            },
        );

        it(
            "preserves existing goals after invalid input",
            async () => {
                const {
                    user,
                    password,
                } = await createTestUser();

                const athlete =
                    await createAthlete(user);

                await testPrisma.athleteGoal.create({
                    data: {
                        tenantId: user.tenantId,
                        athleteId: athlete.id,
                        classification: "ENDURANCE",
                        isPrimary: true,
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "INVALID",
                            secondaryGoals: [],
                        });

                expect(response.status).toBe(400);

                const preserved =
                    await testPrisma.athleteGoal.findMany({
                        where: {
                            tenantId: user.tenantId,
                            athleteId: athlete.id,
                        },
                    });

                expect(preserved).toHaveLength(1);
                expect(
                    preserved[0].classification,
                ).toBe("ENDURANCE");
                expect(
                    preserved[0].isPrimary,
                ).toBe(true);
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
                        .put("/api/v1/auth/me/goals")
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            primaryGoal: "STRENGTH",
                            secondaryGoals: [],
                        });

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Athlete profile not found.",
                );
            },
        );
    },
);