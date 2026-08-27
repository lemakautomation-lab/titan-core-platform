import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Athlete Relationship API Authorization", () => {

    it(
        "denies relationship creation without the required permission",
        async () => {

            const user =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        firstName:
                            "Authorized",

                        lastName:
                            "Tenant Athlete",
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
                    .post("/api/v1/athlete-relationships")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId:
                            athlete.id,

                        relationshipType:
                            "COACH",

                        relatedEntityId:
                            "coach-without-permission",

                        startsAt:
                            new Date().toISOString(),
                    });

            expect(
                response.status,
            ).toBe(403);

            const relationship =
                await testPrisma.athleteRelationship.findFirst({
                    where: {
                        athleteId:
                            athlete.id,
                    },
                });

            expect(
                relationship,
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
        "denies relationship reading without the required permission",
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

            const relationship =
                await testPrisma.athleteRelationship.create({
                    data: {
                        tenantId:
                            user.tenant.id,

                        athleteId:
                            athlete.id,

                        relationshipType:
                            "COACH",

                        relatedEntityId:
                            "protected-coach",
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
                        `/api/v1/athlete-relationships/${relationship.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            await testPrisma.athleteRelationship.delete({
                where: {
                    id:
                        relationship.id,
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
