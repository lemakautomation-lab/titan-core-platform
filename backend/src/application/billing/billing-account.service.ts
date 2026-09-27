import { DatabaseService } from "../../infrastructure/database/database.service";

/** Call only with a tenant and user ID from the authenticated server context. */
export class BillingAccountService {
    constructor(private readonly database: DatabaseService) {}

    async ensureForAuthenticatedUser(tenantId: string, userId: string) {
        return this.database.transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id_tenantId: { id: userId, tenantId } },
                select: { status: true },
            });

            if (user?.status !== "ACTIVE") return null;

            return tx.billingAccount.upsert({
                where: { userId_tenantId: { userId, tenantId } },
                create: { tenantId, userId },
                update: {},
                select: { id: true, tenantId: true, userId: true, createdAt: true },
            });
        });
    }
}
