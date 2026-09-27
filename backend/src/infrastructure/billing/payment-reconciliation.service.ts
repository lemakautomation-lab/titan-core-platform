import { DatabaseService } from "../database/database.service";

/** Read-only tenant-scoped review of partially fulfilled payments. */
export class PaymentReconciliationService {
    constructor(private readonly database: DatabaseService) {}

    async inspect(tenantId: string, limit: number = 100) {
        if(!tenantId?.trim() || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new Error("Valid tenant and limit (1-100) are required.");
        }
        const payments = await this.database.prisma.payment.findMany({
            where: {tenantId, status: {in: ["CONFIRMED", "REFUNDED"]}},
            include: {subscriptionPeriod: true, entitlement: true, invoice: true},
            orderBy: {createdAt: "desc"},
            take: limit,
        });
        return payments.map(payment => {
            const issues: string[] = [];
            if(payment.status === "CONFIRMED") {
                if((payment.billingInterval === "MONTHLY" ||
                    payment.billingInterval === "ANNUALLY") && !payment.subscriptionPeriod) {
                    issues.push("SUBSCRIPTION_PERIOD_MISSING");
                }
                if(!payment.entitlement) issues.push("ENTITLEMENT_MISSING");
                if(!payment.invoice) issues.push("INVOICE_MISSING");
            }
            if(payment.status === "REFUNDED" && payment.entitlement?.status === "ACTIVE") {
                issues.push("REFUNDED_ENTITLEMENT_STILL_MARKED_ACTIVE");
            }
            return {paymentId: payment.id, status: payment.status, issues};
        }).filter(item => item.issues.length > 0);
    }
}
