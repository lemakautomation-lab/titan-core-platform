import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Athlete Digital Twin API Authorization", () => {

    it(
        "denies digital twin creation without the required permission",
        async () => {

            const user =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Protected",

                        lastName:
                            "Athlete",
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .post("/api/v1/athlete-digital-twins")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId:
                            athlete.id,
                    });

            expect(
                response.status,
            ).toBe(403);

            const twin =
                await testPrisma.athleteDigitalTwin.findFirst({
                    where: {
                        athleteId:
                            athlete.id,
                    },
                });

            expect(
                twin,
            ).toBeNull();

            await testPrisma.athlete.delete({
                where: {
                    id:
                        athlete.id,
                },
            });
        },
    );


    it(
        "denies digital twin reading without the required permission",
        async () => {

            const user =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Protected",

                        lastName:
                            "Athlete",
                    },
                });

            const twin =
                await testPrisma.athleteDigitalTwin.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        athleteId:
                            athlete.id,
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(
                        `/api/v1/athlete-digital-twins/${twin.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            await testPrisma.athleteDigitalTwin.delete({
                where: {
                    id:
                        twin.id,
                },
            });

            await testPrisma.athlete.delete({
                where: {
                    id:
                        athlete.id,
                },
            });
        },
    );


    it(
        "denies digital twin lifecycle updates without the required permission",
        async () => {

            const user =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Lifecycle",

                        lastName:
                            "Protected Athlete",
                    },
                });

            const twin =
                await testPrisma.athleteDigitalTwin.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        athleteId:
                            athlete.id,
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .patch(
                        `/api/v1/athlete-digital-twins/${twin.id}/lifecycle`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        action:
                            "ACTIVATE",
                    });

            expect(
                response.status,
            ).toBe(403);

            const persistedTwin =
                await testPrisma.athleteDigitalTwin.findUnique({
                    where: {
                        id:
                            twin.id,
                    },
                });

            expect(
                persistedTwin?.status,
            ).toBe("ACTIVE");

            await testPrisma.athleteDigitalTwin.delete({
                where: {
                    id:
                        twin.id,
                },
            });

            await testPrisma.athlete.delete({
                where: {
                    id:
                        athlete.id,
                },
            });
        },
    );


    it(
        "denies digital twin reading by athlete without the required permission",
        async () => {

            const user =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Athlete",

                        lastName:
                            "Protected",
                    },
                });

            await testPrisma.athleteDigitalTwin.create({
                data: {
                    tenantId:
                        user.tenant.id,

                    athleteId:
                        athlete.id,
                },
            });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(
                        `/api/v1/athlete-digital-twins/athlete/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            await testPrisma.athleteDigitalTwin.deleteMany({
                where: {
                    athleteId:
                        athlete.id,
                },
            });

            await testPrisma.athlete.delete({
                where: {
                    id:
                        athlete.id,
                },
            });
        },
    );

});

