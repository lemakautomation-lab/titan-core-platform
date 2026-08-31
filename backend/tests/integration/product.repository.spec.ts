import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { Product } from "../../src/domain/entities/product.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { ProductStatus } from "../../src/domain/enums/product-status.enum";
import { PrismaProductRepository } from "../../src/infrastructure/repositories/product.repository";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";


const database =
    new DatabaseService();

const repository =
    new PrismaProductRepository(
        database,
    );

let testTenantId: string;


beforeAll(
    async () => {
        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `TITAN Product Test Tenant ${crypto.randomUUID()}`,
                    slug:
                        `titan-product-test-${crypto.randomUUID()}`,
                },
            });

        testTenantId =
            tenant.id;
    },
);


afterAll(
    async () => {
        await testPrisma.product.deleteMany({
            where: {
                tenantId: testTenantId,
            },
        });

        await testPrisma.tenant.delete({
            where: {
                id: testTenantId,
            },
        });
    },
);


describe(
    "Product Repository Persistence",
    () => {

        it(
            "creates and retrieves an active product by id and slug",
            async () => {

                const product =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "TITAN Athlete",
                        `titan-athlete-${crypto.randomUUID()}`,
                        "TITAN Athlete commercial product",
                        9999,
                        "ZAR",
                        BillingInterval.MONTHLY,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                const created =
                    await repository.create(
                        product,
                    );

                expect(created.id).toBe(
                    product.id,
                );

                expect(created.name).toBe(
                    "TITAN Athlete",
                );

                expect(created.slug).toBe(
                    product.slug,
                );

                expect(created.priceCents).toBe(
                    9999,
                );

                expect(created.currency).toBe(
                    "ZAR",
                );

                expect(created.billingInterval).toBe(
                    BillingInterval.MONTHLY,
                );

                const byId =
                    await repository.findById(
                        product.id,
                    );

                expect(byId).not.toBeNull();

                expect(byId?.id).toBe(
                    product.id,
                );

                const bySlug =
                    await repository.findBySlug(
                        product.slug,
                    );

                expect(bySlug).not.toBeNull();

                expect(bySlug?.id).toBe(
                    product.id,
                );

                await testPrisma.product.delete({
                    where: {
                        id: product.id,
                    },
                });
            },
        );


        it(
            "lists only active products",
            async () => {

                const activeProduct =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "Active Product",
                        `active-${crypto.randomUUID()}`,
                        null,
                        5000,
                        "ZAR",
                        BillingInterval.ONE_TIME,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                const inactiveProduct =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "Inactive Product",
                        `inactive-${crypto.randomUUID()}`,
                        null,
                        7500,
                        "ZAR",
                        BillingInterval.ONE_TIME,
                        ProductStatus.INACTIVE,
                        new Date(),
                        new Date(),
                    );

                await repository.create(
                    activeProduct,
                );

                await repository.create(
                    inactiveProduct,
                );

                const products =
                    await repository.findAll();

                expect(
                    products.some(
                        (product) =>
                            product.id ===
                            activeProduct.id,
                    ),
                ).toBe(true);

                expect(
                    products.some(
                        (product) =>
                            product.id ===
                            inactiveProduct.id,
                    ),
                ).toBe(false);

                await testPrisma.product.deleteMany({
                    where: {
                        id: {
                            in: [
                                activeProduct.id,
                                inactiveProduct.id,
                            ],
                        },
                    },
                });
            },
        );


        it(
            "updates an active product",
            async () => {

                const product =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "Original Product",
                        `original-${crypto.randomUUID()}`,
                        "Original description",
                        10000,
                        "ZAR",
                        BillingInterval.MONTHLY,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                await repository.create(
                    product,
                );

                const updatedProduct =
                    new Product(
                        product.id,
                        testTenantId,
                        "Updated Product",
                        product.slug,
                        "Updated description",
                        12500,
                        "ZAR",
                        BillingInterval.QUARTERLY,
                        ProductStatus.ACTIVE,
                        product.createdAt,
                        new Date(),
                    );

                const updated =
                    await repository.update(
                        updatedProduct,
                    );

                expect(updated.name).toBe(
                    "Updated Product",
                );

                expect(updated.description).toBe(
                    "Updated description",
                );

                expect(updated.priceCents).toBe(
                    12500,
                );

                expect(updated.billingInterval).toBe(
                    BillingInterval.QUARTERLY,
                );

                await testPrisma.product.delete({
                    where: {
                        id: product.id,
                    },
                });
            },
        );


        it(
            "soft deletes an active product and excludes it from active queries",
            async () => {

                const product =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "Deletable Product",
                        `deletable-${crypto.randomUUID()}`,
                        null,
                        15000,
                        "ZAR",
                        BillingInterval.ANNUALLY,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                await repository.create(
                    product,
                );

                await repository.delete(
                    product.id,
                );

                const byId =
                    await repository.findById(
                        product.id,
                    );

                expect(byId).toBeNull();

                const persisted =
                    await testPrisma.product.findUnique({
                        where: {
                            id: product.id,
                        },
                    });

                expect(
                    persisted?.status,
                ).toBe("INACTIVE");

                await testPrisma.product.delete({
                    where: {
                        id: product.id,
                    },
                });
            },
        );


        it(
            "rejects duplicate product slugs at the database boundary",
            async () => {

                const slug =
                    `duplicate-${crypto.randomUUID()}`;

                const first =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "First Product",
                        slug,
                        null,
                        1000,
                        "ZAR",
                        BillingInterval.ONE_TIME,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                const second =
                    new Product(
                        crypto.randomUUID(),
                        testTenantId,
                        "Second Product",
                        slug,
                        null,
                        2000,
                        "ZAR",
                        BillingInterval.ONE_TIME,
                        ProductStatus.ACTIVE,
                        new Date(),
                        new Date(),
                    );

                await repository.create(
                    first,
                );

                await expect(
                    repository.create(
                        second,
                    ),
                ).rejects.toThrow();

                await testPrisma.product.deleteMany({
                    where: {
                        id: {
                            in: [
                                first.id,
                                second.id,
                            ],
                        },
                    },
                });
            },
        );

    },
);
