import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";

import { testPrisma } from "../helpers/prisma-test.client";
import { createTestUser } from "../factories/user.factory";


describe("Product API RBAC and lifecycle", () => {

    it(
        "creates, reads, updates, lists and deletes a product",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "products.create",
                        "products.read",
                        "products.update",
                        "products.delete",
                    ],
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const createResponse =
                await request(app)
                    .post("/api/v1/products")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "TITAN Health Premium",
                        slug: "titan-health-premium",
                        description: "Premium TITAN Health access",
                        priceCents: 9999,
                        currency: "zar",
                        billingInterval: "MONTHLY",
                    });

            console.log("\nCREATE RESPONSE BODY:", JSON.stringify(createResponse.body, null, 2)); expect(createResponse.status).toBe(201);
            expect(createResponse.body.name)
                .toBe("TITAN Health Premium");
            expect(createResponse.body.slug)
                .toBe("titan-health-premium");
            expect(createResponse.body.priceCents)
                .toBe(9999);
            expect(createResponse.body.currency)
                .toBe("ZAR");
            expect(createResponse.body.billingInterval)
                .toBe("MONTHLY");

            const productId =
                createResponse.body.id;

            const getResponse =
                await request(app)
                    .get(`/api/v1/products/${productId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.id).toBe(productId);

            const listResponse =
                await request(app)
                    .get("/api/v1/products")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(listResponse.status).toBe(200);
            expect(
                listResponse.body.some(
                    (product: { id: string }) =>
                        product.id === productId,
                ),
            ).toBe(true);

            const updateResponse =
                await request(app)
                    .put(`/api/v1/products/${productId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "TITAN Health Premium Plus",
                        slug: "titan-health-premium-plus",
                        description: "Updated premium access",
                        priceCents: 14999,
                        currency: "ZAR",
                        billingInterval: "ANNUALLY",
                    });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.name)
                .toBe("TITAN Health Premium Plus");
            expect(updateResponse.body.slug)
                .toBe("titan-health-premium-plus");
            expect(updateResponse.body.priceCents)
                .toBe(14999);
            expect(updateResponse.body.billingInterval)
                .toBe("ANNUALLY");

            const deleteResponse =
                await request(app)
                    .delete(`/api/v1/products/${productId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deleteResponse.status).toBe(204);

            const deletedResponse =
                await request(app)
                    .get(`/api/v1/products/${productId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deletedResponse.status).toBe(404);
        },
    );


    it(
        "enforces product permissions",
        async () => {

            const user =
                await createTestUser();

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .post("/api/v1/products")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Unauthorized Product",
                        slug: "unauthorized-product",
                        description: null,
                        priceCents: 1000,
                        currency: "ZAR",
                        billingInterval: "MONTHLY",
                    });

            expect(response.status).toBe(403);
        },
    );


    it(
        "rejects duplicate product slugs",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "products.create",
                    ],
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const firstResponse =
                await request(app)
                    .post("/api/v1/products")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Monthly Product",
                        slug: "monthly-product",
                        description: null,
                        priceCents: 1999,
                        currency: "ZAR",
                        billingInterval: "MONTHLY",
                    });

            expect(firstResponse.status).toBe(201);

            const duplicateResponse =
                await request(app)
                    .post("/api/v1/products")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Duplicate Product",
                        slug: "monthly-product",
                        description: null,
                        priceCents: 2999,
                        currency: "ZAR",
                        billingInterval: "MONTHLY",
                    });

            expect(duplicateResponse.status).toBe(400);

            await testPrisma.product.delete({
                where: {
                    id: firstResponse.body.id,
                },
            });
        },
    );


    it(
        "requires authentication",
        async () => {

            const response =
                await request(app)
                    .get("/api/v1/products");

            expect(response.status).toBe(401);
        },
    );

});





