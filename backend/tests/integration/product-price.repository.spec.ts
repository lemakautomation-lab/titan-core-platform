import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { ProductPrice } from "../../src/domain/entities/product-price.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { ProductStatus } from "../../src/domain/enums/product-status.enum";
import { PrismaProductPriceRepository } from "../../src/infrastructure/repositories/product-price.repository";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";


const database =
    new DatabaseService();

const repository =
    new PrismaProductPriceRepository(
        database,
    );

let testTenantId: string;


beforeAll(
    async () => {
        const tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        `TITAN Price Test Tenant ${crypto.randomUUID()}`,
                    slug:
                        `titan-price-test-tenant-${crypto.randomUUID()}`,
                },
            });

        testTenantId =
            tenant.id;
    },
);


afterAll(
    async () => {
        await testPrisma.productPrice.deleteMany({ where: { product: { tenantId: testTenantId } } });
        await testPrisma.product.deleteMany({ where: { tenantId: testTenantId } });

        await testPrisma.tenant.delete({
            where: {
                id: testTenantId,
            },
        });
    },
);


async function createTestProduct(): Promise<string> {

    const productId =
        crypto.randomUUID();

    await testPrisma.product.create({
        data: {
            id: productId,
            tenantId: testTenantId,
            name: "TITAN Price Test Product",
            slug: `titan-price-test-${crypto.randomUUID()}`,
            description:
                "Product used for ProductPrice repository integration tests",
            priceCents: 9999,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
            status: ProductStatus.ACTIVE,
        },
    });

    return productId;
}


describe(
    "Product Price Repository Persistence",
    () => {

        it(
            "creates and retrieves a product price by id",
            async () => {

                const productId =
                    await createTestProduct();

                const price =
                    ProductPrice.create(
                        productId,
                        9999,
                        "zar",
                        BillingInterval.MONTHLY,
                    );

                const created =
                    await repository.create(
                        price,
                    );

                expect(created.id).toBe(
                    price.id,
                );

                expect(created.productId).toBe(
                    productId,
                );

                expect(created.amountMinor).toBe(
                    9999,
                );

                expect(created.currency).toBe(
                    "ZAR",
                );

                await testPrisma.productPrice.deleteMany({ where: { productId } });
                await testPrisma.product.delete({ where: { id: productId } });
            },
        );


        it(
            "finds only active prices for a product",
            async () => {

                const productId =
                    await createTestProduct();

                const activePrice =
                    ProductPrice.create(
                        productId,
                        5000,
                        "ZAR",
                        BillingInterval.MONTHLY,
                    );

                const inactivePrice =
                    ProductPrice.create(
                        productId,
                        7500,
                        "ZAR",
                        BillingInterval.QUARTERLY,
                    );

                inactivePrice.deactivate();

                await repository.create(
                    activePrice,
                );

                await repository.create(
                    inactivePrice,
                );

                const prices =
                    await repository.findActiveByProductId(
                        productId,
                    );

                expect(
                    prices.some(
                        (item) =>
                            item.id ===
                            activePrice.id,
                    ),
                ).toBe(true);

                expect(
                    prices.some(
                        (item) =>
                            item.id ===
                            inactivePrice.id,
                    ),
                ).toBe(false);

                await testPrisma.productPrice.deleteMany({
                    where: {
                        productId,
                    },
                });

                await testPrisma.productPrice.deleteMany({ where: { productId } });
                await testPrisma.product.delete({ where: { id: productId } });
            },
        );


        it(
            "returns prices in deterministic billing interval and amount order",
            async () => {

                const productId =
                    await createTestProduct();

                const lowerAmount =
                    ProductPrice.create(
                        productId,
                        5000,
                        "ZAR",
                        BillingInterval.MONTHLY,
                    );

                const higherAmount =
                    ProductPrice.create(
                        productId,
                        10000,
                        "ZAR",
                        BillingInterval.MONTHLY,
                    );

                await repository.create(
                    higherAmount,
                );

                await repository.create(
                    lowerAmount,
                );

                const prices =
                    await repository.findActiveByProductId(
                        productId,
                    );

                expect(
                    prices.map(
                        (item) =>
                            item.amountMinor,
                    ),
                ).toEqual([
                    5000,
                    10000,
                ]);

                await testPrisma.productPrice.deleteMany({
                    where: {
                        productId,
                    },
                });

                await testPrisma.productPrice.deleteMany({ where: { productId } });
                await testPrisma.product.delete({ where: { id: productId } });
            },
        );


        it(
            "updates an existing product price",
            async () => {

                const productId =
                    await createTestProduct();

                const price =
                    ProductPrice.create(
                        productId,
                        9999,
                        "ZAR",
                        BillingInterval.MONTHLY,
                    );

                await repository.create(
                    price,
                );

                price.updateDetails(
                    12500,
                    "ZAR",
                    BillingInterval.QUARTERLY,
                );

                const updated =
                    await repository.update(
                        price,
                    );

                expect(updated.amountMinor).toBe(
                    12500,
                );

                expect(updated.billingInterval).toBe(
                    BillingInterval.QUARTERLY,
                );

                await testPrisma.productPrice.deleteMany({
                    where: {
                        productId,
                    },
                });

                await testPrisma.productPrice.deleteMany({ where: { productId } });
                await testPrisma.product.delete({ where: { id: productId } });
            },
        );


        it(
            "retrieves inactive prices by id while excluding them from active product queries",
            async () => {

                const productId =
                    await createTestProduct();

                const price =
                    ProductPrice.create(
                        productId,
                        15000,
                        "ZAR",
                        BillingInterval.ANNUALLY,
                    );

                price.deactivate();

                await repository.create(
                    price,
                );

                const byId =
                    await repository.findById(
                        price.id,
                    );

                expect(byId).not.toBeNull();

                expect(byId?.status).toBe(
                    "INACTIVE",
                );

                const activePrices =
                    await repository.findActiveByProductId(
                        productId,
                    );

                expect(
                    activePrices.some(
                        (item) =>
                            item.id ===
                            price.id,
                    ),
                ).toBe(false);

                await testPrisma.productPrice.deleteMany({
                    where: {
                        productId,
                    },
                });

                await testPrisma.productPrice.deleteMany({ where: { productId } });
                await testPrisma.product.delete({ where: { id: productId } });
            },
        );


        it(
            "rejects a product price referencing a non-existent product",
            async () => {

                const productId =
                    crypto.randomUUID();

                const price =
                    ProductPrice.create(
                        productId,
                        9999,
                        "ZAR",
                        BillingInterval.MONTHLY,
                    );

                await expect(
                    repository.create(
                        price,
                    ),
                ).rejects.toThrow();
            },
        );

    },
);


