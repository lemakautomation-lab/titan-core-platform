import {describe, expect, it} from "vitest";
import {Payment} from "../../src/domain/entities/payment.entity";
import {Product} from "../../src/domain/entities/product.entity";
import {UserTypeEntitlement} from "../../src/domain/entities/user-type-entitlement.entity";
import {BillingInterval} from "../../src/domain/enums/billing-interval.enum";
import {ProductStatus} from "../../src/domain/enums/product-status.enum";
import {OnboardingUserType} from "../../src/domain/enums/onboarding-user-type.enum";

describe("Paid period access boundary", () => {
    it("does not grant a future renewal early", () => {
        const payment = Payment.create("tenant", "user", "product", "price", 100, "ZAR", BillingInterval.MONTHLY);
        payment.confirm("provider-reference");
        const date = new Date("2027-03-01T00:00:00.000Z");
        const product = new Product("product", "tenant", "Monthly", "monthly", null, 100,
            "ZAR", BillingInterval.MONTHLY, ProductStatus.ACTIVE, date, date, OnboardingUserType.TRAINER);
        const entitlement = UserTypeEntitlement.issue(payment, product, OnboardingUserType.TRAINER, date);
        expect(entitlement.isActive(payment, new Date("2027-02-28T23:59:59.999Z"))).toBe(false);
        expect(entitlement.isActive(payment, date)).toBe(true);
        payment.refund();
        expect(entitlement.isActive(payment, date)).toBe(false);
    });
});
