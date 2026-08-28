import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";

import { testPrisma } from "../helpers/prisma-test.client";
import { createTestUser } from "../factories/user.factory";


describe("Sport API Tenant Isolation and RBAC", () => {

    it(
        "creates, reads, updates, lists and deletes a sport within the authenticated tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "sports.create",
                        "sports.read",
                        "sports.update",
                        "sports.delete",
                    ],
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
                    .post("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Football",

                        slug:
                            "football",
                    });

            expect(
                createResponse.status,
            ).toBe(201);

            expect(
                createResponse.body.tenantId,
            ).toBe(user.tenant.id);

            expect(
                createResponse.body.name,
            ).toBe("Football");

            expect(
                createResponse.body.slug,
            ).toBe("football");

            const sportId =
                createResponse.body.id;

            const getResponse =
                await request(app)
                    .get(
                        `/api/v1/sports/${sportId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                getResponse.status,
            ).toBe(200);

            expect(
                getResponse.body.id,
            ).toBe(sportId);

            const listResponse =
                await request(app)
                    .get("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                listResponse.status,
            ).toBe(200);

            expect(
                listResponse.body.data.some(
                    (sport: { id: string }) =>
                        sport.id === sportId,
                ),
            ).toBe(true);

            const updateResponse =
                await request(app)
                    .put(
                        `/api/v1/sports/${sportId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Association Football",

                        slug:
                            "association-football",
                    });

            expect(
                updateResponse.status,
            ).toBe(200);

            expect(
                updateResponse.body.name,
            ).toBe("Association Football");

            expect(
                updateResponse.body.slug,
            ).toBe("association-football");

            const deleteResponse =
                await request(app)
                    .delete(
                        `/api/v1/sports/${sportId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                deleteResponse.status,
            ).toBe(204);

            const deletedResponse =
                await request(app)
                    .get(
                        `/api/v1/sports/${sportId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                deletedResponse.status,
            ).toBe(404);
        },
    );


    it(
        "denies reading a sport belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "sports.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const sport =
                await testPrisma.sport.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        name:
                            "Rugby",

                        slug:
                            "rugby",
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
                        `/api/v1/sports/${sport.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(404);

            await testPrisma.sport.delete({
                where: {
                    id:
                        sport.id,
                },
            });
        },
    );


    it(
        "does not list sports belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "sports.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const sport =
                await testPrisma.sport.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        name:
                            "Swimming",

                        slug:
                            "swimming",
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
                    .get("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            expect(
                response.body.data.some(
                    (item: { id: string }) =>
                        item.id === sport.id,
                ),
            ).toBe(false);

            await testPrisma.sport.delete({
                where: {
                    id:
                        sport.id,
                },
            });
        },
    );


    it(
        "enforces sport permissions",
        async () => {

            const user =
                await createTestUser();

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
                    .post("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Tennis",

                        slug:
                            "tennis",
                    });

            expect(
                response.status,
            ).toBe(403);
        },
    );


    it(
        "rejects duplicate sport slugs within the same tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "sports.create",
                    ],
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

            const firstResponse =
                await request(app)
                    .post("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Athletics",

                        slug:
                            "athletics",
                    });

            expect(
                firstResponse.status,
            ).toBe(201);

            const duplicateResponse =
                await request(app)
                    .post("/api/v1/sports")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Track and Field",

                        slug:
                            "athletics",
                    });

            expect(
                duplicateResponse.status,
            ).toBe(400);

            await testPrisma.sport.delete({
                where: {
                    id:
                        firstResponse.body.id,
                },
            });
        },
    );

});


