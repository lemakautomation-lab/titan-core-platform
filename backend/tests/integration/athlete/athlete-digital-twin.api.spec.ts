import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Athlete Digital Twin API Tenant Isolation", () => {

    it(
        "creates and retrieves an athlete digital twin within the authenticated tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "athlete_digital_twins.create",
                        "athlete_digital_twins.read",
                    ],
                });

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Digital",

                        lastName:
                            "Twin Athlete",
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

            const createResponse =
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
                createResponse.status,
            ).toBe(201);

            expect(
                createResponse.body.tenantId,
            ).toBe(user.tenant.id);

            expect(
                createResponse.body.athleteId,
            ).toBe(athlete.id);

            const twinId =
                createResponse.body.id;

            const getByIdResponse =
                await request(app)
                    .get(
                        `/api/v1/athlete-digital-twins/${twinId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                getByIdResponse.status,
            ).toBe(200);

            expect(
                getByIdResponse.body.id,
            ).toBe(twinId);

            const getByAthleteResponse =
                await request(app)
                    .get(
                        `/api/v1/athlete-digital-twins/athlete/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                getByAthleteResponse.status,
            ).toBe(200);

            expect(
                getByAthleteResponse.body.id,
            ).toBe(twinId);

            await testPrisma.athleteDigitalTwin.delete({
                where: {
                    id:
                        twinId,
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
        "denies retrieving an athlete digital twin belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "athlete_digital_twins.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        firstName:
                            "TenantB",

                        lastName:
                            "Digital Twin Athlete",
                    },
                });

            const twin =
                await testPrisma.athleteDigitalTwin.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        athleteId:
                            athlete.id,
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,

                        email:
                            tenantAUser.user.email,

                        password:
                            tenantAUser.password,
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
            ).toBe(404);

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
        "denies retrieving a digital twin through an athlete belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "athlete_digital_twins.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        firstName:
                            "TenantB",

                        lastName:
                            "Athlete",
                    },
                });

            await testPrisma.athleteDigitalTwin.create({
                data: {
                    tenantId:
                        tenantBUser.tenant.id,

                    athleteId:
                        athlete.id,
                },
            });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,

                        email:
                            tenantAUser.user.email,

                        password:
                            tenantAUser.password,
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
            ).toBe(404);

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


    it(
        "updates digital twin lifecycle through the authenticated API",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "athlete_digital_twins.create",
                        "athlete_digital_twins.read",
                        "athlete_digital_twins.update",
                    ],
                });

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Lifecycle",

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

            const createResponse =
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
                createResponse.status,
            ).toBe(201);

            const twinId =
                createResponse.body.id;

            const activateResponse =
                await request(app)
                    .patch(
                        `/api/v1/athlete-digital-twins/${twinId}/lifecycle`,
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
                activateResponse.status,
            ).toBe(200);

            expect(
                activateResponse.body.id,
            ).toBe(twinId);

            expect(
                activateResponse.body.status,
            ).toBe("ACTIVE");

            const suspendResponse =
                await request(app)
                    .patch(
                        `/api/v1/athlete-digital-twins/${twinId}/lifecycle`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        action:
                            "SUSPEND",
                    });

            expect(
                suspendResponse.status,
            ).toBe(200);

            expect(
                suspendResponse.body.status,
            ).toBe("SUSPENDED");

            await testPrisma.athleteDigitalTwin.delete({
                where: {
                    id:
                        twinId,
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
