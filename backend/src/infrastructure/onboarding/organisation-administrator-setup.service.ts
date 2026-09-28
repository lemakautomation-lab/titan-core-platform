import { createHash, randomBytes } from "node:crypto";
import { DatabaseService } from "../database/database.service";
import { passwordSecurity } from "../../security/bcrypt";
import { PasswordValidator } from "../../shared/validation/validators/password.validator";

export interface OrganisationAdministratorSetupEmailDelivery {
    deliver(input: Readonly<{
        recipientEmail: string;
        setupUrl: string;
        expiresAt: Date;
    }>): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const EXPIRES_MS = 30 * 60_000;
const INVALID = "Administrator setup token is invalid or expired.";

function hashToken(token: string): string {
    if (typeof token !== "string" || !TOKEN.test(token)) {
        throw new Error(INVALID);
    }
    return createHash("sha256").update(token, "utf8").digest("hex");
}

export class OrganisationAdministratorSetupService {
    constructor(
        private readonly database: DatabaseService,
        private readonly delivery: OrganisationAdministratorSetupEmailDelivery,
        private readonly frontendOrigin: string,
    ) {}

    /** A public request may send only to the verified administrator address. */
    async request(applicationId: string, administratorEmail: string): Promise<void> {
        if (typeof applicationId !== "string" || !UUID.test(applicationId) ||
            typeof administratorEmail !== "string" || administratorEmail.length > 254) {
            return;
        }
        const now = new Date();
        const rawToken = randomBytes(32).toString("base64url");
        const expiresAt = new Date(now.getTime() + EXPIRES_MS);
        const issued = await this.database.transaction(async tx => {
            const application = await tx.organisationOnboardingApplication.findUnique({
                where: { id: applicationId },
            });
            if (!application || application.status !== "PROVISIONED" ||
                application.administratorEmail !== administratorEmail.trim().toLowerCase() ||
                !application.provisionedTenantId || !application.provisionedOrganisationId ||
                !application.provisionedAdministratorId || !application.provisionedPaymentAttemptId ||
                !application.provisionedAt) {
                return null;
            }
            const [payment, tenant, organisation, administrator] = await Promise.all([
                tx.organisationOnboardingPaymentAttempt.findUnique({ where: { id: application.provisionedPaymentAttemptId } }),
                tx.tenant.findUnique({ where: { id: application.provisionedTenantId } }),
                tx.organisation.findUnique({ where: { id: application.provisionedOrganisationId } }),
                tx.user.findUnique({ where: { id: application.provisionedAdministratorId } }),
            ]);
            if (!payment || payment.applicationId !== application.id || payment.status !== "CONFIRMED" ||
                !payment.confirmedAt || !payment.providerTransactionReference ||
                payment.amountMinor !== application.amountMinor || payment.currency !== application.currency ||
                payment.billingInterval !== application.billingInterval ||
                tenant?.status !== "INACTIVE" || organisation?.status !== "INACTIVE" ||
                organisation.tenantId !== tenant.id || administrator?.status !== "INACTIVE" ||
                administrator.tenantId !== tenant.id || administrator.organisationId !== organisation.id ||
                administrator.email !== application.administratorEmail) {
                return null;
            }
            // Updating the application row serialises concurrent token issues and completion.
            await tx.organisationOnboardingApplication.updateMany({
                where: { id: application.id, status: "PROVISIONED" },
                data: { status: "PROVISIONED" },
            });
            await tx.organisationAdministratorSetupToken.updateMany({
                where: { applicationId, consumedAt: null, revokedAt: null },
                data: { revokedAt: now },
            });
            const token = await tx.organisationAdministratorSetupToken.create({
                data: { applicationId, tokenHash: hashToken(rawToken), expiresAt },
            });
            return { tokenId: token.id, recipientEmail: application.administratorEmail };
        });
        if (!issued) return;
        const url = new URL("/setup-organisation-administrator", this.frontendOrigin);
        url.searchParams.set("token", rawToken);
        try {
            await this.delivery.deliver({
                recipientEmail: issued.recipientEmail,
                setupUrl: url.toString(),
                expiresAt,
            });
        } catch {
            await this.database.prisma.organisationAdministratorSetupToken.updateMany({
                where: { id: issued.tokenId, consumedAt: null },
                data: { revokedAt: new Date() },
            });
            throw new Error("Administrator setup email could not be delivered.");
        }
    }

    async complete(rawToken: string, newPassword: string): Promise<{ status: "ACTIVE" }> {
        if (typeof newPassword !== "string") throw new Error("Password is required.");
        const validation = new PasswordValidator().validate({ password: newPassword });
        if (!validation.isValid) throw new Error(validation.errors[0].message);
        const tokenHash = hashToken(rawToken);
        const passwordHash = await passwordSecurity.hash(newPassword);
        return this.database.transaction(async tx => {
            const token = await tx.organisationAdministratorSetupToken.findUnique({
                where: { tokenHash }, include: { application: true },
            });
            const now = new Date();
            if (!token || token.consumedAt || token.revokedAt || token.expiresAt <= now ||
                token.application.status !== "PROVISIONED") throw new Error(INVALID);
            const application = token.application;
            if (!application.provisionedTenantId || !application.provisionedOrganisationId ||
                !application.provisionedAdministratorId || !application.provisionedPaymentAttemptId ||
                !application.provisionedAt) throw new Error(INVALID);
            const [payment, tenant, organisation, administrator] = await Promise.all([
                tx.organisationOnboardingPaymentAttempt.findUnique({ where: { id: application.provisionedPaymentAttemptId } }),
                tx.tenant.findUnique({ where: { id: application.provisionedTenantId } }),
                tx.organisation.findUnique({ where: { id: application.provisionedOrganisationId } }),
                tx.user.findUnique({ where: { id: application.provisionedAdministratorId }, include: { userRoles: { include: { role: { include: { permissions: true } } } } } }),
            ]);
            if (!payment || payment.applicationId !== application.id || payment.status !== "CONFIRMED" ||
                !payment.confirmedAt || !payment.providerTransactionReference ||
                payment.amountMinor !== application.amountMinor || payment.currency !== application.currency ||
                payment.billingInterval !== application.billingInterval ||
                tenant?.status !== "INACTIVE" || organisation?.status !== "INACTIVE" ||
                organisation.tenantId !== tenant.id || administrator?.status !== "INACTIVE" ||
                administrator.tenantId !== tenant.id || administrator.organisationId !== organisation.id ||
                administrator.email !== application.administratorEmail ||
                !administrator.userRoles.some(link => link.role.tenantId === tenant.id &&
                    link.role.name === "Organisation Administrator" &&
                    link.role.permissions.length > 0)) throw new Error(INVALID);
            const claimed = await tx.organisationAdministratorSetupToken.updateMany({
                where: { id: token.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
                data: { consumedAt: now },
            });
            if (claimed.count !== 1) throw new Error(INVALID);
            const user = await tx.user.updateMany({
                where: { id: administrator.id, tenantId: tenant.id, organisationId: organisation.id, status: "INACTIVE" },
                data: { passwordHash, status: "ACTIVE" },
            });
            if (user.count !== 1) throw new Error(INVALID);
            const org = await tx.organisation.updateMany({
                where: { id: organisation.id, tenantId: tenant.id, status: "INACTIVE" },
                data: { status: "ACTIVE" },
            });
            if (org.count !== 1) throw new Error(INVALID);
            const activated = await tx.tenant.updateMany({
                where: { id: tenant.id, status: "INACTIVE" },
                data: { status: "ACTIVE" },
            });
            if (activated.count !== 1) throw new Error(INVALID);
            await tx.organisationAdministratorSetupToken.updateMany({
                where: { applicationId: application.id, id: { not: token.id }, consumedAt: null, revokedAt: null },
                data: { revokedAt: now },
            });
            return { status: "ACTIVE" as const };
        });
    }
}
