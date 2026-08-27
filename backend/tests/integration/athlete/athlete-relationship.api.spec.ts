import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Athlete Relationship API Tenant Isolation", () => {

    it(
        "denies reading a relationship belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "athlete_relationships.read",
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

            const relationship =
                await testPrisma.athleteRelationship.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        athleteId:
                            athlete.id,

                        relationshipType:
                            "COACH",

                        relatedEntityId:
                            "tenant-b-coach",
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
                        `/api/v1/athlete-relationships/${relationship.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(404);

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


    it(
        "does not return relationships for an athlete belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "athlete_relationships.read",
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

            await testPrisma.athleteRelationship.create({
                data: {
                    tenantId:
                        tenantBUser.tenant.id,

                    athleteId:
                        athlete.id,

                    relationshipType:
                        "COACH",

                    relatedEntityId:
                        "tenant-b-coach",
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
                        `/api/v1/athlete-relationships/athlete/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            expect(
                response.body,
            ).toHaveLength(0);

            await testPrisma.athleteRelationship.deleteMany({
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
