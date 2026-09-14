import { describe, expect, it } from "vitest";

import { Payment } from "../../src/domain/entities/payment.entity";
import { BillingInterval } from "../../src/domain/enums/billing-interval.enum";
import { PaymentStatus } from "../../src/domain/enums/payment-status.enum";
import { PaymentAccessPolicyService } from "../../src/domain/services/payment-access-policy.service";

function createPayment(): Payment {

    return Payment.create(
        "tenant-1",
        "user-1",
        "product-1",
        "price-1",
        19900,
        "zar",
        BillingInterval.MONTHLY,
    );

}

describe("Payment-before-access policy", () => {

    it("creates a pending immutable price snapshot", () => {

        const payment=createPayment();

        expect(payment.status).toBe(PaymentStatus.PENDING);
        expect(payment.amountMinor).toBe(19900);
        expect(payment.currency).toBe("ZAR");

    });

    it("denies access while payment is pending", () => {

        const policy=new PaymentAccessPolicyService();

        expect(policy.canAccess(createPayment())).toBe(false);
        expect(policy.canAccess(null)).toBe(false);

    });

    it("allows access only after confirmation", () => {

        const payment=createPayment();
        const policy=new PaymentAccessPolicyService();

        payment.confirm("provider-transaction-1");

        expect(payment.status).toBe(PaymentStatus.CONFIRMED);
        expect(payment.providerReference).toBe(
            "provider-transaction-1",
        );
        expect(payment.confirmedAt).not.toBeNull();
        expect(policy.canAccess(payment)).toBe(true);

    });

    it.each([
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUNDED,
    ])("denies access for %s", (status) => {

        const payment=createPayment();

        if(status === PaymentStatus.FAILED) {
            payment.fail();
        } else if(status === PaymentStatus.CANCELLED) {
            payment.cancel();
        } else {
            payment.confirm("provider-transaction-1");
            payment.refund();
        }

        expect(
            new PaymentAccessPolicyService().canAccess(payment),
        ).toBe(false);

    });

    it("rejects confirmation without provider evidence", () => {

        const payment=createPayment();

        expect(() => payment.confirm("   ")).toThrow(
            "A valid provider reference is required.",
        );
        expect(payment.status).toBe(PaymentStatus.PENDING);

    });

    it("prevents repeated confirmation", () => {

        const payment=createPayment();
        payment.confirm("provider-transaction-1");

        expect(
            () => payment.confirm("provider-transaction-2"),
        ).toThrow(
            "Only a pending payment can be confirmed.",
        );

    });

    it("rejects invalid payment amounts", () => {

        expect(
            () => Payment.create(
                "tenant-1",
                "user-1",
                "product-1",
                "price-1",
                0,
                "ZAR",
                BillingInterval.MONTHLY,
            ),
        ).toThrow(
            "Payment amount must be a positive integer.",
        );

    });

});