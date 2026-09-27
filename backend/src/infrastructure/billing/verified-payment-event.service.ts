import { DatabaseService } from "../database/database.service";
import { BillingSubscriptionService } from "./billing-subscription.service";
import { PaidPeriodEntitlementService } from "./paid-period-entitlement.service";
import { ConfirmedPaymentInvoiceService } from "./confirmed-payment-invoice.service";

export type VerifiedPaymentOutcome = "CONFIRMED" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface VerifiedPaymentEvent {
    tenantId: string;
    paymentId: string;
    providerReference: string;
    amountMinor: number;
    currency: string;
    outcome: VerifiedPaymentOutcome;
    subscriptionId?: string;
}

/** Implementations must authenticate the exact raw payload before parsing it. */
export interface PaymentEventVerifier {
    verify(rawPayload: Uint8Array, signature: string): Promise<VerifiedPaymentEvent>;
}

/** Internal entry point only; never expose a client-supplied payment status route. */
export class VerifiedPaymentEventService {
    constructor(
        private readonly database: DatabaseService,
        private readonly verifier: PaymentEventVerifier,
        private readonly subscriptions: BillingSubscriptionService,
        private readonly entitlements: PaidPeriodEntitlementService,
        private readonly invoices: ConfirmedPaymentInvoiceService,
    ) {}

    async process(rawPayload: Uint8Array, signature: string) {
        if(!rawPayload.length || !signature?.trim()) {
            throw new Error("Signed provider payload is required.");
        }
        const event = await this.verifier.verify(rawPayload, signature);
        if(!event.tenantId?.trim() || !event.paymentId?.trim() ||
            !event.providerReference?.trim() || !Number.isSafeInteger(event.amountMinor) ||
            event.amountMinor <= 0 || !/^[A-Z]{3}$/.test(event.currency) ||
            !["CONFIRMED", "FAILED", "CANCELLED", "REFUNDED"].includes(event.outcome)) {
            throw new Error("Verified payment event is invalid.");
        }
        const payment = await this.database.prisma.payment.findFirst({
            where: {id: event.paymentId, tenantId: event.tenantId},
        });
        if(!payment || payment.amountMinor !== event.amountMinor ||
            payment.currency !== event.currency) {
            throw new Error("Verified payment does not match its immutable snapshot.");
        }

        if(event.outcome === "CONFIRMED") {
            if(payment.status === "PENDING") {
                const changed = await this.database.prisma.payment.updateMany({
                    where: {id: payment.id, tenantId: payment.tenantId, status: "PENDING"},
                    data: {
                        status: "CONFIRMED",
                        providerReference: event.providerReference,
                        confirmedAt: new Date(),
                    },
                });
                if(changed.count !== 1) throw new Error("Payment state changed during confirmation.");
            } else if(payment.status !== "CONFIRMED" ||
                payment.providerReference !== event.providerReference) {
                throw new Error("Payment is not confirmable with this provider reference.");
            }

            // Each step is idempotent so reconciliation can resume partial delivery.
            const period = await this.subscriptions.linkConfirmedPayment({
                tenantId: event.tenantId,
                paymentId: event.paymentId,
                subscriptionId: event.subscriptionId,
            });
            await this.entitlements.issue(event.tenantId, event.paymentId);
            await this.invoices.issueForConfirmedPayment(event.tenantId, event.paymentId);
            return {status: "CONFIRMED" as const, subscriptionId: period.subscriptionId};
        }

        const from = event.outcome === "REFUNDED" ? "CONFIRMED" : "PENDING";
        if(payment.status === event.outcome) {
            return {status: event.outcome};
        }
        const changed = await this.database.prisma.payment.updateMany({
            where: {id: payment.id, tenantId: payment.tenantId, status: from},
            data: {status: event.outcome},
        });
        if(changed.count !== 1) throw new Error("Payment state changed or transition is invalid.");
        // Access evaluation checks the source payment; a refund immediately denies access.
        return {status: event.outcome};
    }
}
