import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import { Payment } from "../../src/domain/entities/payment.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { PrismaPaymentRepository } from "../../src/infrastructure/repositories/payment.repository";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database=new DatabaseService();
const repository=new PrismaPaymentRepository(database);

const tenantIds: string[]=[];
const userIds: string[]=[];
const productIds: string[]=[];
const priceIds: string[]=[];

let tenantAId: string;
let tenantBId: string;
let userAId: string;
let userBId: string;
let productAId: string;
let priceAId: string;

beforeAll(async () => {

    const tenantA=await testPrisma.tenant.create({
        data: {
            name: `Payment Tenant A ${crypto.randomUUID()}`,
            slug: `payment-a-${crypto.randomUUID()}`,
        },
    });

    const tenantB=await testPrisma.tenant.create({
        data: {
            name: `Payment Tenant B ${crypto.randomUUID()}`,
            slug: `payment-b-${crypto.randomUUID()}`,
        },
    });

    tenantAId=tenantA.id;
    tenantBId=tenantB.id;
    tenantIds.push(tenantAId,tenantBId);

    const userA=await testPrisma.user.create({
        data: {
            tenantId: tenantAId,
            email: `payment-a-${crypto.randomUUID()}@titan.test`,
            passwordHash: "test-hash",
        },
    });

    const userB=await testPrisma.user.create({
        data: {
            tenantId: tenantBId,
            email: `payment-b-${crypto.randomUUID()}@titan.test`,
            passwordHash: "test-hash",
        },
    });

    userAId=userA.id;
    userBId=userB.id;
    userIds.push(userAId,userBId);

    const productA=await testPrisma.product.create({
        data: {
            tenantId: tenantAId,
            name: "Payment Test Product",
            slug: `payment-product-${crypto.randomUUID()}`,
            priceCents: 19900,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
        },
    });

    productAId=productA.id;
    productIds.push(productAId);

    const priceA=await testPrisma.productPrice.create({
        data: {
            productId: productAId,
            amountMinor: 19900,
            currency: "ZAR",
            billingInterval: BillingInterval.MONTHLY,
        },
    });

    priceAId=priceA.id;
    priceIds.push(priceAId);

});

afterAll(async () => {

    await testPrisma.payment.deleteMany({
        where: {
            tenantId: {
                in: tenantIds,
            },
        },
    });

    await testPrisma.productPrice.deleteMany({
        where: {
            id: {
                in: priceIds,
            },
        },
    });

    await testPrisma.product.deleteMany({
        where: {
            id: {
                in: productIds,
            },
        },
    });

    await testPrisma.user.deleteMany({
        where: {
            id: {
                in: userIds,
            },
        },
    });

    await testPrisma.tenant.deleteMany({
        where: {
            id: {
                in: tenantIds,
            },
        },
    });

});

function createPayment(
    tenantId: string=tenantAId,
    userId: string=userAId,
): Payment {

    return Payment.create(
        tenantId,
        userId,
        productAId,
        priceAId,
        19900,
        "ZAR",
        BillingInterval.MONTHLY,
    );

}

describe("Payment repository tenant isolation", () => {

    it("persists and retrieves a pending payment", async () => {

        const payment=createPayment();
        const created=await repository.create(payment);
        const found=await repository.findById(
            created.id,
            tenantAId,
        );

        expect(found?.id).toBe(payment.id);
        expect(found?.tenantId).toBe(tenantAId);
        expect(found?.amountMinor).toBe(19900);
        expect(found?.currency).toBe("ZAR");

    });

    it("does not retrieve payment through another tenant", async () => {

        const created=await repository.create(
            createPayment(),
        );

        expect(
            await repository.findById(
                created.id,
                tenantBId,
            ),
        ).toBeNull();

    });

    it("rejects a cross-tenant user association", async () => {

        await expect(
            repository.create(
                createPayment(
                    tenantAId,
                    userBId,
                ),
            ),
        ).rejects.toThrow();

    });

    it("returns only a confirmed payment as access evidence", async () => {

        const payment=createPayment();
        await repository.create(payment);

        expect(
            await repository.findLatestConfirmed(
                userAId,
                productAId,
                tenantAId,
            ),
        ).toBeNull();

        payment.confirm(
            `provider-${crypto.randomUUID()}`,
        );
        await repository.update(payment);

        const confirmed=
            await repository.findLatestConfirmed(
                userAId,
                productAId,
                tenantAId,
            );

        expect(confirmed?.id).toBe(payment.id);

        expect(
            await repository.findLatestConfirmed(
                userAId,
                productAId,
                tenantBId,
            ),
        ).toBeNull();

    });

});