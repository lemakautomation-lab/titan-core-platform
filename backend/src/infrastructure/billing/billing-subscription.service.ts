import { BillingInterval } from "../../domain/enums/billing-interval.enum";
import { recurringPeriodEnd } from "../../domain/services/billing-period";
import { DatabaseService } from "../database/database.service";

/** Internal boundary: callers must supply provider-verified payment identity. */
export class BillingSubscriptionService {
    constructor(private readonly database: DatabaseService) {}

    async linkConfirmedPayment(input: {
        tenantId: string;
        paymentId: string;
        subscriptionId?: string;
    }) {
        if(!input.tenantId?.trim() || !input.paymentId?.trim()) {
            throw new Error("Tenant and payment are required.");
        }

        return this.database.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findFirst({
                where: { id: input.paymentId, tenantId: input.tenantId },
            });
            if(
                !payment || payment.status !== "CONFIRMED" ||
                !payment.confirmedAt || !payment.providerReference
            ) {
                throw new Error("A confirmed payment with provider evidence is required.");
            }
            if(
                payment.billingInterval !== BillingInterval.MONTHLY &&
                payment.billingInterval !== BillingInterval.ANNUALLY
            ) {
                throw new Error("Only monthly and annual payments can be linked.");
            }

            const prior = await tx.billingSubscriptionPeriod.findUnique({
                where: { paymentId: payment.id },
            });
            if(prior) {
                if(prior.tenantId !== input.tenantId ||
                    (input.subscriptionId && prior.subscriptionId !== input.subscriptionId)) {
                    throw new Error("Payment belongs to another subscription.");
                }
                return prior;
            }

            const subscription = input.subscriptionId
                ? await tx.billingSubscription.findFirst({
                    where: {
                        id: input.subscriptionId,
                        tenantId: payment.tenantId,
                        userId: payment.userId,
                        productId: payment.productId,
                        billingInterval: payment.billingInterval,
                        status: "ACTIVE",
                    },
                })
                : await tx.billingSubscription.create({
                    data: {
                        tenantId: payment.tenantId,
                        userId: payment.userId,
                        productId: payment.productId,
                        billingInterval: payment.billingInterval,
                    },
                });

            if(!subscription) {
                throw new Error("Subscription ownership or interval does not match.");
            }

            const latest = await tx.billingSubscriptionPeriod.findFirst({
                where: { subscriptionId: subscription.id },
                orderBy: { periodEnd: "desc" },
            });
            const first = latest && await tx.billingSubscriptionPeriod.findFirst({
                where: { subscriptionId: subscription.id },
                orderBy: { periodStart: "asc" },
            });
            const periodStart = latest && latest.periodEnd > payment.confirmedAt
                ? latest.periodEnd : payment.confirmedAt;

            return tx.billingSubscriptionPeriod.create({
                data: {
                    subscriptionId: subscription.id,
                    tenantId: payment.tenantId,
                    userId: payment.userId,
                    productId: payment.productId,
                    paymentId: payment.id,
                    periodStart,
                    periodEnd: recurringPeriodEnd(
                        periodStart, payment.billingInterval as BillingInterval,
                        first?.periodStart.getUTCDate() ?? periodStart.getUTCDate(),
                    ),
                },
            });
        });
    }
}
