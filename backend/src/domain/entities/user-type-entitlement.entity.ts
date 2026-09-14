import { randomUUID } from "crypto";

import { Payment } from "./payment.entity";
import { Product } from "./product.entity";
import { BillingInterval } from "../enums/billing-interval.enum";
import { EntitlementStatus } from "../enums/entitlement-status.enum";
import { OnboardingUserType } from "../enums/onboarding-user-type.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export class UserTypeEntitlement {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly paymentId: string,
        public readonly productId: string,
        public readonly userType: OnboardingUserType,
        public status: EntitlementStatus,
        public readonly validFrom: Date,
        public readonly validUntil: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    static issue(
        payment: Payment,
        product: Product,
        selectedUserType: OnboardingUserType | null,
        issuedAt: Date = new Date(),
    ): UserTypeEntitlement {

        if (payment.status !== PaymentStatus.CONFIRMED) {
            throw new Error(
                "A confirmed payment is required.",
            );
        }

        if (
            payment.tenantId !== product.tenantId ||
            payment.productId !== product.id
        ) {
            throw new Error(
                "Payment and Product ownership do not match.",
            );
        }

        if (
            selectedUserType === null ||
            product.entitlementUserType === null ||
            selectedUserType !== product.entitlementUserType
        ) {
            throw new Error(
                "Selected user type does not match the Product.",
            );
        }

        const validFrom =
            new Date(issuedAt);

        const validUntil =
            UserTypeEntitlement.calculateExpiry(
                validFrom,
                payment.billingInterval,
            );

        return new UserTypeEntitlement(
            randomUUID(),
            payment.tenantId,
            payment.userId,
            payment.id,
            product.id,
            selectedUserType,
            EntitlementStatus.ACTIVE,
            validFrom,
            validUntil,
            validFrom,
            validFrom,
        );
    }

    isActive(
        payment: Payment,
        at: Date = new Date(),
    ): boolean {

        return (
            this.status === EntitlementStatus.ACTIVE &&
            payment.status === PaymentStatus.CONFIRMED &&
            payment.id === this.paymentId &&
            payment.tenantId === this.tenantId &&
            payment.userId === this.userId &&
            (
                this.validUntil === null ||
                at < this.validUntil
            )
        );
    }

    expire(
        at: Date = new Date(),
    ): void {

        if (
            this.validUntil === null ||
            at < this.validUntil
        ) {
            throw new Error(
                "Entitlement has not reached expiry.",
            );
        }

        this.status =
            EntitlementStatus.EXPIRED;

        this.updatedAt =
            new Date(at);
    }

    revoke(
        at: Date = new Date(),
    ): void {

        if (
            this.status !==
            EntitlementStatus.ACTIVE
        ) {
            throw new Error(
                "Only an active entitlement can be revoked.",
            );
        }

        this.status =
            EntitlementStatus.REVOKED;

        this.updatedAt =
            new Date(at);
    }

    private static calculateExpiry(
        validFrom: Date,
        billingInterval: BillingInterval,
    ): Date | null {

        if (
            billingInterval ===
            BillingInterval.ONE_TIME
        ) {
            return null;
        }

        const validUntil =
            new Date(validFrom);

        if (
            billingInterval ===
            BillingInterval.MONTHLY
        ) {
            validUntil.setUTCMonth(
                validUntil.getUTCMonth() + 1,
            );
        }
        else if (
            billingInterval ===
            BillingInterval.QUARTERLY
        ) {
            validUntil.setUTCMonth(
                validUntil.getUTCMonth() + 3,
            );
        }
        else if (
            billingInterval ===
            BillingInterval.ANNUALLY
        ) {
            validUntil.setUTCFullYear(
                validUntil.getUTCFullYear() + 1,
            );
        }
        else {
            throw new Error(
                "Unsupported billing interval.",
            );
        }

        return validUntil;
    }

}
