import { DatabaseService } from "../database/database.service";

/** Issues access only from a paid period and its still-confirmed source payment. */
export class PaidPeriodEntitlementService {
    constructor(private readonly database: DatabaseService) {}

    async issue(tenantId: string, paymentId: string) {
        if(!tenantId?.trim() || !paymentId?.trim()) {
            throw new Error("Tenant and payment are required.");
        }

        try {
            return await this.database.prisma.$transaction(async (tx) => {
                const period = await tx.billingSubscriptionPeriod.findFirst({
                    where: {tenantId, paymentId},
                    include: {
                        payment: {include: {product: true, user: true}},
                    },
                });
                if(!period || period.payment.status !== "CONFIRMED" ||
                    !period.payment.confirmedAt || !period.payment.providerReference) {
                    throw new Error("A confirmed subscription payment is required.");
                }
                const {payment} = period;
                const userType = payment.product.entitlementUserType;
                if(!userType || payment.user.selectedUserType !== userType ||
                    payment.user.status !== "ACTIVE") {
                    throw new Error("Active user type does not match the paid product.");
                }

                const existing = await tx.userTypeEntitlement.findFirst({
                    where: {tenantId, paymentId},
                });
                if(existing) {
                    if(existing.userId !== payment.userId ||
                        existing.productId !== payment.productId ||
                        existing.userType !== userType ||
                        existing.validFrom.getTime() !== period.periodStart.getTime() ||
                        existing.validUntil?.getTime() !== period.periodEnd.getTime()) {
                        throw new Error("Existing entitlement does not match the paid period.");
                    }
                    return existing;
                }

                return tx.userTypeEntitlement.create({data: {
                    tenantId,
                    userId: payment.userId,
                    productId: payment.productId,
                    paymentId,
                    userType,
                    status: "ACTIVE",
                    validFrom: period.periodStart,
                    validUntil: period.periodEnd,
                }});
            });
        } catch(error) {
            // A concurrent identical request can lose the unique payment race.
            const winner = await this.database.prisma.userTypeEntitlement.findFirst({
                where: {tenantId, paymentId},
            });
            if(winner && (error as {code?: string}).code === "P2002") {
                return winner;
            }
            throw error;
        }
    }
}
